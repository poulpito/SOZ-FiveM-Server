import { CraftService } from '@public/client/craft/craft.service';
import { InventoryManager } from '@public/client/inventory/inventory.manager';
import { InputService } from '@public/client/nui/input.service';
import { ProgressService } from '@public/client/progress.service';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { JobType } from '@public/shared/job';
import { Err, Ok } from '@public/shared/result';

import { Once, OnceStep, OnEvent } from '../../../core/decorators/event';
import { Inject } from '../../../core/decorators/injectable';
import { Provider } from '../../../core/decorators/provider';
import { baunCraftZones } from '../../../shared/job/baun';

@Provider()
export class BaunCraftProvider {
    @Inject(CraftService)
    private craftService: CraftService;

    @Inject(InputService)
    private inputService: InputService;

    @Inject(InventoryManager)
    private inventoryManager: InventoryManager;

    @Inject(ProgressService)
    private progressService: ProgressService;

    @Once(OnceStep.PlayerLoaded)
    public setupBaunCraftZone() {
        this.craftService.createBtargetZoneCraft(baunCraftZones, 'c:/baun/craft.png', 'Confectionner', JobType.Baun);
    }

    @OnEvent(ClientEvent.BAUN_ICE_CUBE, false)
    public async onIceCube() {
        const max = this.inventoryManager.getItemCount('water_bottle', true);

        const valStr = await this.inputService.askInput(
            {
                title: 'Quantité de bouteilles à transformer',
                defaultValue: max.toString(),
                maxCharacters: 5,
            },
            value => {
                if (!value) {
                    return Ok(true);
                }
                if (isNaN(Number(value)) || Math.round(Number(value)) != Number(value)) {
                    return Err('La quantité doit être un nombre entier.');
                }
                if (Number(value) < 1 || Number(value) > max) {
                    return Err(`La quantité doit être comprise entre 1 et ${max}.`);
                }
                return Ok(true);
            }
        );

        if (!valStr) {
            return;
        }

        const { completed } = await this.progressService.progress(
            'baun_ice',
            `Création de glacons`,
            2000,
            {
                dictionary: 'mp_fm_intro_cut',
                name: 'fixing_a_ped',
                options: {
                    repeat: true,
                },
            },
            {
                useAnimationService: true,
            }
        );

        if (!completed) {
            return;
        }

        TriggerServerEvent(ServerEvent.BAUN_ICE_CUBE, Number(valStr));
    }
}
