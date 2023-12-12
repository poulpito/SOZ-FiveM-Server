import { Inject } from '../../../core/decorators/injectable';
import { Provider } from '../../../core/decorators/provider';
import { Tick, TickInterval } from '../../../core/decorators/tick';
import { BankService } from '../../bank/bank.service';
import { InventoryManager } from '../../inventory/inventory.manager';
import { Monitor } from '../../monitor/monitor';
import { Store } from '../../store/store';

const PROCESSING_STORAGE = 'garbage_processing';
const PROCESSING_AMOUNT = 300;

const DEFAULT_SELL_PRICE = 60;
const SELL_PRICE: Record<string, number> = {
    sawdust: 6,
    petroleum_residue: 16,
    seeweed_acid: 70,
    torn_garbagebag: 32,
    halloween_infernus_garbage: 32,
};

@Provider()
export class GarbageProvider {
    @Inject('Store')
    private store: Store;

    @Inject(InventoryManager)
    private inventoryManager: InventoryManager;

    @Inject(BankService)
    private bankService: BankService;

    @Inject(Monitor)
    private monitor: Monitor;

    @Tick(TickInterval.EVERY_MINUTE)
    public cleanGarbage() {
        const state = this.store.getState();

        if (state.global.blackoutLevel >= 4 || state.global.blackout) {
            return;
        }

        const processingItems = this.inventoryManager.getAllItems(PROCESSING_STORAGE);

        if (processingItems.length == 0) {
            return;
        }

        let itemLeftToProcess = PROCESSING_AMOUNT;

        for (const item of processingItems) {
            const amountToProcess = Math.min(itemLeftToProcess, item.amount);

            if (this.inventoryManager.removeItemFromInventory(PROCESSING_STORAGE, item.name, amountToProcess)) {
                const sellPrice = SELL_PRICE[item.name] || DEFAULT_SELL_PRICE;
                const totalMoney = amountToProcess * sellPrice;

                this.bankService.transferBankMoney('farm_garbage', 'safe_garbage', totalMoney);

                this.monitor.publish(
                    'job_bluebird_recycling_garbage_bag',
                    {
                        item: item.name,
                    },
                    {
                        quantity: amountToProcess,
                        price: totalMoney,
                    }
                );

                itemLeftToProcess -= amountToProcess;

                if (itemLeftToProcess <= 0) {
                    break;
                }
            }
        }
    }
}
