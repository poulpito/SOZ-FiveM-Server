import { ItemService } from '@public/server/item/item.service';

import { OnEvent } from '../../../core/decorators/event';
import { Inject } from '../../../core/decorators/injectable';
import { Provider } from '../../../core/decorators/provider';
import { ServerEvent } from '../../../shared/event';
import { InventoryManager } from '../../inventory/inventory.manager';
import { Monitor } from '../../monitor/monitor';
import { Notifier } from '../../notifier';
import { ProgressService } from '../../player/progress.service';

@Provider()
export class BaunCraftProvider {
    @Inject(InventoryManager)
    private inventoryManager: InventoryManager;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(ItemService)
    private itemService: ItemService;

    @Inject(ProgressService)
    private progressService: ProgressService;

    @Inject(Monitor)
    private monitor: Monitor;

    @OnEvent(ServerEvent.BAUN_ICE_CUBE)
    public onIceCube(source: number, count: number) {
        if (!count) {
            this.notifier.notify(source, 'Une erreur est survenue lors du choix de la quantité.', 'error');
            return;
        }

        const iceCount = count * 6;

        if (
            !this.inventoryManager.canSwapItems(
                source,
                [{ name: 'ice_cube', amount: iceCount, metadata: null }],
                [{ name: 'water_bottle', amount: count, metadata: null }]
            )
        ) {
            this.notifier.notify(source, 'Vos poches sont pleines.', 'error');
            return;
        }

        const dstItem = this.itemService.getItem('ice_cube');
        const secItem = this.itemService.getItem('water_bottle');

        if (!this.inventoryManager.removeNotExpiredItem(source, 'water_bottle', count)) {
            this.notifier.notify(source, `Vous n'avez pas assez de ${secItem.label}.`, 'error');
            return;
        }
        this.inventoryManager.addItemToInventory(source, 'ice_cube', iceCount);

        this.notifier.notify(
            source,
            `Vous avez fait ~g~${iceCount}~s~ ${dstItem.label} avec ~g~${count}~s~ ${secItem.label}.`
        );
    }
}
