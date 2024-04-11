import { On, Once } from '@public/core/decorators/event';
import axios from 'axios';
import { addSeconds } from 'date-fns';

import { Command } from '../../core/decorators/command';
import { Exportable } from '../../core/decorators/exports';
import { Inject } from '../../core/decorators/injectable';
import { Provider } from '../../core/decorators/provider';
import { Tick, TickInterval } from '../../core/decorators/tick';
import { Logger } from '../../core/logger';
import { wait } from '../../core/utils';
import { ClientEvent } from '../../shared/event';
import { Feature, isFeatureEnabled } from '../../shared/features';
import { PollutionLevel } from '../../shared/pollution';
import { getRandomInt, getRandomKeyWeighted } from '../../shared/random';
import { Forecast, ForecastWithTemperature, TemperatureRange, Time, Weather } from '../../shared/weather';
import { Monitor } from '../monitor/monitor';
import { Pollution } from '../pollution';
import { Store } from '../store/store';
import { Halloween, Polluted, SpringAutumn, Winter } from './forecast';
import { DaySpringTemperature, ForecastAdderTemperatures, NightSpringTemperature } from './temperature';

const MAX_FORECASTS = 5;
const UPDATE_TIME_INTERVAL = 5;

@Provider()
export class WeatherProvider {
    @Inject(Pollution)
    private pollution: Pollution;

    @Inject('Store')
    private store: Store;

    @Inject(Logger)
    private logger: Logger;

    @Inject(Monitor)
    private monitor: Monitor;

    private shouldUpdateWeather = true;
    private pollutionManagerReady = false;

    // See forecast.ts for the list of available forecasts
    private forecast: Forecast = isFeatureEnabled(Feature.Halloween) ? Halloween : SpringAutumn;
    // See temperature.ts for the list of available temperature ranges,
    // please ensure that the day and night temperature ranges are using the same season
    private dayTemperatureRange: TemperatureRange = DaySpringTemperature;
    private nightTemperatureRange: TemperatureRange = NightSpringTemperature;

    private defaultWeather: Weather = isFeatureEnabled(Feature.Halloween) ? 'CLOUDS' : 'OVERCAST';

    private currentForecast: ForecastWithTemperature = {
        weather: this.defaultWeather,
        temperature: this.getTemperature(this.defaultWeather, this.currentTime()),
        duration: 1000 * 10,
    };

    private incomingForecasts: ForecastWithTemperature[] = [this.currentForecast];

    private stormDeadline = 0; // timestamp
    private timeDelta = 0;
    private timeAdminDelta = 0;

    @Once()
    public async init() {
        if (this.forecast == Winter) {
            this.store.dispatch.global.update({ snow: true });
        }

        try {
            const res = await axios.get('http://worldtimeapi.org/api/timezone/America/Los_Angeles');
            const offset = res.data.utc_offset as string;
            const offsetDate = offset.split(':');
            this.timeDelta = parseInt(offsetDate[0]) * 3600 + parseInt(offsetDate[1]) * 60;
        } catch (e) {
            this.logger.error(e);
        }
    }

    private currentTime(): Time {
        const localDate = addSeconds(Date.now(), this.timeDelta);
        const localDateCorrected = addSeconds(localDate, this.timeAdminDelta);

        return {
            hour: localDateCorrected.getHours(),
            minute: localDateCorrected.getMinutes(),
            second: localDateCorrected.getSeconds(),
        };
    }

    @Tick(TickInterval.EVERY_SECOND * UPDATE_TIME_INTERVAL, 'weather:time:advance', true)
    async advanceTime() {
        const time = this.currentTime();

        if (isFeatureEnabled(Feature.Halloween)) {
            if (time.hour >= 2 || time.hour < 1) {
                time.hour = 1;
            }
        }

        TriggerClientEvent(ClientEvent.STATE_UPDATE_TIME, -1, time);
    }

    @Tick(TickInterval.EVERY_SECOND, 'weather:next-weather')
    async updateWeather() {
        if (!this.shouldUpdateWeather) {
            return;
        }
        if (!this.pollutionManagerReady) {
            return;
        }

        const weather = this.incomingForecasts.shift();
        this.currentForecast = weather;
        this.store.dispatch.global.update({ weather: weather.weather });
        this.monitor.publish('weather_update', {}, { weather: weather });
        this.prepareForecasts(weather.weather);

        TriggerClientEvent(ClientEvent.PHONE_APP_WEATHER_UPDATE_FORECASTS, -1);

        const duration = weather.duration || (Math.random() * 5 + 10) * 60 * 1000;
        await wait(duration);
    }

    @Exportable('setWeatherUpdate')
    setWeatherUpdate(update: boolean): void {
        this.shouldUpdateWeather = update;
    }

    @Command('weather', { role: 'admin' })
    setWeatherCommand(source: number, weather = ''): void {
        const weatherString = weather.toUpperCase() as Weather;

        if (!this.forecast[weatherString]) {
            this.logger.error('bad weather ' + weatherString);

            return;
        }

        this.setWeather(weatherString);
    }

    @Command('snow', { role: 'admin' })
    setSnowCommand(source: number, needSnow?: string): void {
        this.store.dispatch.global.update({ snow: needSnow === 'on' || needSnow === 'true' });
    }

    public setStormDeadline(value: number): void {
        this.stormDeadline = value;
        TriggerClientEvent(ClientEvent.PHONE_APP_WEATHER_UPDATE_STORM_ALERT, -1);
    }

    public setWeather(weather: Weather): void {
        // If you set the weather, you want to recalculate the following forecasts
        const defaultWeather = isFeatureEnabled(Feature.Halloween) ? 'NEUTRAL' : 'OVERCAST';
        this.store.dispatch.global.update({ weather: weather || defaultWeather });
        this.prepareForecasts(this.store.getState().global.weather, true);

        TriggerClientEvent(ClientEvent.PHONE_APP_WEATHER_UPDATE_FORECASTS, -1);

        this.monitor.publish('weather_update', {}, { weather: weather || defaultWeather });
    }

    @Command('block_weather', { role: 'admin' })
    blockWeatherCommand(source: number, status?: string): void {
        this.shouldUpdateWeather = status !== 'on' && status !== 'true';
    }

    @Command('time', { role: 'admin' })
    setTime(source: number, hourString?: string, minuteString?: string): void {
        const hour = hourString ? parseInt(hourString, 10) : null;
        const minute = minuteString ? parseInt(minuteString, 10) : 0;

        if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
            return;
        }

        this.timeAdminDelta = 0;
        if (hour != null) {
            const current = this.currentTime();
            this.timeAdminDelta = (hour - current.hour) * 3_600 + (minute - current.minute) * 60;
        }

        TriggerClientEvent(ClientEvent.STATE_UPDATE_TIME, -1, this.currentTime());
    }

    @Command('blackout', { role: 'admin' })
    setBlackout(source: number, status?: string): void {
        this.store.dispatch.global.update({ blackout: status === 'on' || status === 'true' });
    }

    @Command('blackout_level', { role: 'admin' })
    setBlackoutLevel(source: number, level?: string): void {
        if (!level || level === 'default') {
            this.store.dispatch.global.update({
                blackoutLevel: 0,
                blackoutOverride: false,
            });
        } else {
            this.store.dispatch.global.update({
                blackoutLevel: parseInt(level, 10) || 0,
                blackoutOverride: true,
            });
        }
    }

    @Exportable('getWeatherForecasts')
    getWeatherForecasts(): ForecastWithTemperature[] {
        return [this.currentForecast, ...this.incomingForecasts];
    }

    @Exportable('getStormAlert')
    getStormAlert(): number {
        return this.stormDeadline;
    }

    private prepareForecasts(initialWeather: Weather, cleanOldForecasts = false) {
        if (cleanOldForecasts) {
            this.incomingForecasts = [];
        }

        while (this.incomingForecasts.length < MAX_FORECASTS) {
            const futureTime = this.incomingForecasts.reduce((acc, forecast) => {
                const incrementSeconds = forecast.duration / 1000;
                acc.second += incrementSeconds;
                if (acc.second >= 60) {
                    const incrementMinutes = Math.floor(acc.second / 60);

                    acc.minute += incrementMinutes;
                    acc.second %= 60;

                    if (acc.minute >= 60) {
                        const incrementHours = Math.floor(acc.minute / 60);

                        acc.hour += incrementHours;
                        acc.minute %= 60;

                        if (acc.hour >= 24) {
                            acc.hour %= 24;
                        }
                    }
                }
                return acc;
            }, this.currentTime());

            const randomDuration = (Math.random() * 5 + 10) * 60 * 1000;
            if (this.shouldUpdateWeather) {
                const forecast = this.incomingForecasts.slice(-1);
                const nextWeather = this.getNextWeather(forecast.length ? forecast[0].weather : initialWeather);
                const futureTime = this.currentTime();

                this.incomingForecasts.push({
                    weather: nextWeather,
                    temperature: this.getTemperature(nextWeather, futureTime),
                    duration: randomDuration,
                });
            } else {
                // As the app will show the next MAX_FORECASTS forecasts,
                // we need to fill the array with the same forecast
                this.incomingForecasts.push({
                    weather: initialWeather,
                    temperature: this.getTemperature(initialWeather, futureTime),
                    duration: randomDuration,
                });
            }
        }
    }

    private getNextWeather(currentWeather: Weather): Weather {
        let currentForecast = this.forecast;
        const pollutionLevel: PollutionLevel = this.pollution.getPollutionLevel();

        if (pollutionLevel === PollutionLevel.High) {
            currentForecast = Polluted;
        } else if (pollutionLevel === PollutionLevel.Low) {
            const multipliers: { [key in Weather]?: number } = { EXTRASUNNY: 1.0, SMOG: 0.5, FOGGY: 0.5, CLOUDS: 0.5 };
            const any = 1;

            for (const weather of Object.keys(currentForecast)) {
                for (const nextWeather of Object.keys(currentForecast[weather])) {
                    const multiplier = multipliers[nextWeather] || any;

                    currentForecast[weather][nextWeather] = Math.round(
                        multiplier * currentForecast[weather][nextWeather]
                    );
                }
            }
        }

        let transitions = currentForecast[currentWeather];

        if (!transitions) {
            this.logger.error('no transitions for, bad weather ' + currentWeather);

            transitions = {};
        }
        return getRandomKeyWeighted<Weather>(transitions, currentWeather) as Weather;
    }

    private getTemperature(weather: Weather, time: Time): number {
        const { hour } = time;
        const { min: baseMin, max: baseMax } =
            hour < 6 || hour > 20 ? this.nightTemperatureRange : this.dayTemperatureRange;
        const { min, max } = ForecastAdderTemperatures[weather];

        return getRandomInt(baseMin + min, baseMax + max);
    }

    @On('soz-upw:server:onPollutionManagerReady', true)
    public onPollutionManagerReady() {
        this.pollutionManagerReady = true;
    }

    @Command('rain', { role: 'admin' })
    setRain(source: number, rain: number): void {
        this.store.dispatch.global.update({ rain: rain });
    }

    @Command('halloween', { role: 'admin' })
    setTimecycleMod(source: number, value: string): void {
        if (value) {
            if (value == 'full') {
                value = 'HalloweenFullRed';
            } else if (value == 'light') {
                value = 'HalloweenLightRed';
            } else if (value == 'clear') {
                value = 'HalloweenClearRed';
            } else if (value == 'off') {
                value = '';
            } else {
                this.logger.error('Invalid value ' + value + ', expect full or light or clear or off');
            }
        }
        this.store.dispatch.global.update({ halloween: value });
    }
}
