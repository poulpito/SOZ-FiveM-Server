import { Provider } from '@core/decorators/provider';
import { Inject } from '@public/core/decorators/injectable';
import { Tick, TickInterval } from '@public/core/decorators/tick';

import { Store } from '../store/store';
import { On, OnEvent } from '@public/core/decorators/event';
import { ClientEvent } from '@public/shared/event/client';
import { PlayerData } from '@public/shared/player';
import { Outfit } from '@public/shared/cloth';
import { PlayerService } from './player.service';

@Provider()
export class PlayerSnowProvider {
    @Inject('Store')
    public store: Store;

    @Inject(PlayerService)
    public playerService: PlayerService;

    private lastSlipDate = 0;
    private coldProtected = false;

    @Tick(TickInterval.EVERY_MINUTE)
    public onSlipCheck() {
        if (!this.store.getState().global.snow) {
            return;
        }

        if (Date.now() < this.lastSlipDate + 30 * 60_0000) {
            return;
        }

        const ped = PlayerPedId();
        if (!IsPedWalking(ped) && !IsPedRunning(ped)) {
            return;
        }

        if (Math.random() < 0.2) {
            SetPedToRagdoll(PlayerPedId(), 1000, 1000, 0, false, false, false);
            this.lastSlipDate = Date.now();
        }
    }

    @On('soz-character:Client:Cloth;Applied')
    async onClothUpdate(outfit: Outfit): Promise<void> {
        const emitRpc(, outfit.Components);
    }
}
