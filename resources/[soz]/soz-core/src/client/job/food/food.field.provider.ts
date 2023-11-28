import { DrugSkill } from '@private/shared/drugs';

import { Once, OnceStep } from '../../../core/decorators/event';
import { Inject } from '../../../core/decorators/injectable';
import { Provider } from '../../../core/decorators/provider';
import { JobPermission, JobType } from '../../../shared/job';
import { FoodFields, FoodFieldType } from '../../../shared/job/food';
import { PolygonZone } from '../../../shared/polyzone/polygon.zone';
import { PlayerService } from '../../player/player.service';
import { TargetFactory } from '../../target/target.factory';
import { JobService } from '../job.service';

@Provider()
export class FoodFieldProvider {
    @Inject(TargetFactory)
    private targetFactory: TargetFactory;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(JobService)
    private jobService: JobService;

    @Once(OnceStep.PlayerLoaded)
    public setupFoodFields() {
        for (const type of Object.keys(FoodFields)) {
            const field = FoodFields[type as FoodFieldType];

            for (const index in field.zones) {
                const zone = field.zones[index];
                const minZ = zone.reduce((acc, zone) => Math.min(acc, zone[2]), 9999);
                const maxZ = zone.reduce((acc, zone) => Math.max(acc, zone[2]), -9999);
                const polygone = new PolygonZone<any>(zone, { minZ, maxZ });
                const id = `food-field-${type}-${index}`;

                this.targetFactory.createForPolygoneZone(id, polygone, [
                    {
                        label: 'Récolter',
                        color: 'food',
                        icon: 'c:food/collecter.png',
                        blackoutGlobal: true,
                        blackoutJob: JobType.Food,
                        canInteract: entity => {
                            const player = this.playerService.getPlayer();

                            if (!player) {
                                return false;
                            }

                            if (!this.jobService.hasPermission(JobType.Food, JobPermission.FoodHarvest)) {
                                return false;
                            }

                            if (IsEntityAVehicle(entity)) {
                                return false;
                            }

                            if (IsEntityAPed(entity)) {
                                return false;
                            }

                            return player.job.onduty;
                        },
                    },
                    {
                        label: 'Récolter de la Zeed',
                        color: 'crimi',
                        icon: 'c:food/zeed.png',
                        blackoutGlobal: true,
                        blackoutJob: JobType.Food,
                        canInteract: entity => {
                            if (IsEntityAVehicle(entity)) {
                                return false;
                            }

                            if (IsEntityAPed(entity)) {
                                return false;
                            }

                            return this.playerService.hasDrugSkill(DrugSkill.Botaniste);
                        },
                    },
                ]);
            }
        }
    }

    public collectIngredients(type: FoodFieldType) {
        const player = this.playerService.getPlayer();

        if (!player) {
            return;
        }

        if (IsPedInAnyVehicle(PlayerPedId(), false)) {
            return;
        }

        // Get field health
    }
}
