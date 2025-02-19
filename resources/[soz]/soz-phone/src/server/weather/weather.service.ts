import { WeatherForecast } from '../../../typings/app/weather';
import { PromiseEventResp, PromiseRequest } from '../lib/PromiseNetEvents/promise.types';
import { weatherLogger } from './weather.utils';

class _WeatherService {
    async handleFetchForecasts(reqObj: PromiseRequest<void>, resp: PromiseEventResp<WeatherForecast[]>) {
        try {
            const forecasts = exports['soz-core'].getWeatherForecasts();
            resp({ status: 'ok', data: forecasts });
        } catch (e) {
            weatherLogger.error(`Error in handleFetchForecasts, ${e.toString()}`);
            resp({ status: 'error', errorMsg: e.toString() });
        }
    }

    async handleFetchStormAlert(reqObj: PromiseRequest<void>, resp: PromiseEventResp<number>) {
        try {
            const alert = exports['soz-core'].getStormAlert() as number;
            resp({ status: 'ok', data: alert });
        } catch (e) {
            weatherLogger.error(`Error in handleFetchStormAlert, ${e.toString()}`);
            resp({ status: 'error', errorMsg: e.toString() });
        }
    }
}

const WeatherService = new _WeatherService();
export default WeatherService;
