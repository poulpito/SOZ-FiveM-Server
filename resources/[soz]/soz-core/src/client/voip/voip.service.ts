import { NuiDispatch } from '@public/client/nui/nui.dispatch';
import { VoiceRadioProvider } from '@public/client/voip/voice/voice.radio.provider';
import { Inject, Injectable } from '@public/core/decorators/injectable';
import { ServerEvent } from '@public/shared/event';
import { VoiceMode } from '@public/shared/hud';
import { RadioChannelType, RadioType } from '@public/shared/voip';

const WHISPER_RANGE = 1.0;
const NORMAL_RANGE = 2.0;
const SHOUT_RANGE = 4.0;
const MEGAPHONE_RANGE = 38.0;
const MICROPHONE_RANGE = 38.0;

@Injectable()
export class VoipService {
    @Inject(NuiDispatch)
    private readonly nuiDispatch: NuiDispatch;

    @Inject(VoiceRadioProvider)
    private readonly voiceRadioProvider: VoiceRadioProvider;

    private channels = new Map<number, number>();

    private voiceMode: VoiceMode = VoiceMode.Normal;

    private overrideInputRange: number | null = null;

    private isMuted = false;

    public getVoiceClickVolume(radioType: RadioType, channelType: RadioChannelType) {
        return this.voiceRadioProvider.getVoiceClickVolume(radioType, channelType);
    }

    public setVoiceClickVolume(radioType: RadioType, channelType: RadioChannelType, value: number) {
        SetResourceKvp(`radio_volume_${radioType}_${channelType}`, value.toString());
    }

    public setVoiceMode(mode: VoiceMode) {
        this.voiceMode = mode;
        this.nuiDispatch.dispatch('hud', 'UpdateVoiceMode', this.voiceMode);
        this.updateRange();
    }

    public getVoiceMode() {
        return this.voiceMode;
    }

    public getOverrideInputRange() {
        return this.overrideInputRange;
    }

    public mutePlayer(value: boolean) {
        this.isMuted = value;
        TriggerServerEvent(ServerEvent.VOIP_MUTE, value);

        if (this.isMuted) {
            this.nuiDispatch.dispatch('hud', 'UpdateVoiceMode', VoiceMode.Mute);
        } else {
            this.nuiDispatch.dispatch('hud', 'UpdateVoiceMode', this.voiceMode);
        }
    }

    public isPlayerMuted() {
        return this.isMuted;
    }

    public setPlayerMegaphoneInUse(value: boolean, range: number = MEGAPHONE_RANGE) {
        TriggerServerEvent(ServerEvent.VOIP_SET_MEGAPHONE, value);

        this.overrideInputRange = value ? range : null;

        if (value) {
            this.nuiDispatch.dispatch('hud', 'UpdateVoiceMode', VoiceMode.Megaphone);
        } else {
            this.nuiDispatch.dispatch('hud', 'UpdateVoiceMode', this.voiceMode);
        }

        this.updateRange();
    }

    public setPlayerMicrophoneInUse(value: boolean) {
        this.overrideInputRange = value ? MICROPHONE_RANGE : null;

        if (value) {
            this.nuiDispatch.dispatch('hud', 'UpdateVoiceMode', VoiceMode.Microphone);
        } else {
            this.nuiDispatch.dispatch('hud', 'UpdateVoiceMode', this.voiceMode);
        }

        this.updateRange();
    }

    public disconnectRadio(frequency: number) {
        if (!this.channels.has(frequency)) {
            return;
        }

        this.channels.set(frequency, this.channels.get(frequency) - 1);

        if (this.channels.get(frequency) <= 0) {
            this.channels.delete(frequency);
            this.voiceRadioProvider.stopTransmitting(frequency);

            TriggerServerEvent(ServerEvent.VOIP_RADIO_LEAVE_CHANNEL, frequency);
        }
    }

    public connectRadio(frequency: number) {
        if (!this.channels.has(frequency)) {
            this.channels.set(frequency, 0);
            TriggerServerEvent(ServerEvent.VOIP_RADIO_JOIN_CHANNEL, frequency);
        }

        this.channels.set(frequency, this.channels.get(frequency) + 1);
    }

    public updateRange() {
        if (this.voiceMode === VoiceMode.Normal) {
            MumbleSetTalkerProximity(NORMAL_RANGE);
        } else if (this.voiceMode === VoiceMode.Whisper) {
            MumbleSetTalkerProximity(WHISPER_RANGE);
        } else if (this.voiceMode === VoiceMode.Shouting) {
            MumbleSetTalkerProximity(SHOUT_RANGE);
        }

        if (this.voiceMode === VoiceMode.Megaphone) {
            MumbleSetTalkerProximity(NORMAL_RANGE);
            MumbleSetAudioInputDistance(MEGAPHONE_RANGE);
        } else if (this.voiceMode === VoiceMode.Microphone) {
            MumbleSetTalkerProximity(NORMAL_RANGE);
            MumbleSetAudioInputDistance(MICROPHONE_RANGE);
        }

        if (this.overrideInputRange !== null) {
            MumbleSetAudioInputDistance(this.overrideInputRange);
        }
    }
}
