import { getProperGroundPositionForObject } from '@public/client/object/object.utils';
import { PlayerService } from '@public/client/player/player.service';
import { ProgressService } from '@public/client/progress.service';
import { TargetFactory } from '@public/client/target/target.factory';
import { Once, OnceStep, OnEvent } from '@public/core/decorators/event';
import { Inject } from '@public/core/decorators/injectable';
import { Provider } from '@public/core/decorators/provider';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { JobType } from '@public/shared/job';
import { Vector3, Vector4 } from '@public/shared/polyzone/vector';

const jobsTarget = { [JobType.BCSO]: 0, [JobType.FBI]: 0, [JobType.SASP]: 0, [JobType.LSPD]: 0, [JobType.LSCS]: 0 };
const roadSignModel = GetHashKey('prop_sign_road_03z');

@Provider()
export class PoliceSpeedZoneProvider {
    @Inject(ProgressService)
    private progressService: ProgressService;

    @Inject(TargetFactory)
    private targetFactory: TargetFactory;

    @Inject(PlayerService)
    private playerService: PlayerService;

    private zones: { [id: string]: { speedzone: number; blip: number } } = {};

    @Once(OnceStep.Start)
    public async onStart() {
        this.targetFactory.createForModel(roadSignModel, [
            {
                label: 'Démonter',
                icon: 'c:jobs/demonter.png',
                job: jobsTarget,
                canInteract: () => {
                    return this.playerService.isOnDuty();
                },
                action: async (entity: number) => {
                    const { completed } = await this.progressService.progress(
                        'remove_object',
                        'Récupération du panneau',
                        2500,
                        {
                            dictionary: 'weapons@first_person@aim_rng@generic@projectile@thermal_charge@',
                            name: 'plant_floor',
                            options: {
                                onlyUpperBody: true,
                            },
                        },
                        {
                            useWhileDead: false,
                            canCancel: true,
                            disableMovement: true,
                            disableCarMovement: true,
                            disableMouse: false,
                            disableCombat: true,
                        }
                    );
                    if (!completed) {
                        return;
                    }

                    TriggerServerEvent(ServerEvent.POLICE_REMOVE_SPEEDZONE, ObjToNet(entity));
                },
            },
        ]);

        TriggerServerEvent(ServerEvent.POLICE_INIT_SPEEDZONE);
    }

    @OnEvent(ClientEvent.POLICE_REQUEST_ADD_SPEEDZONE)
    public async onAddSpeedZone(radius: number, speed: number) {
        const ped = PlayerPedId();
        const entityCoords = GetOffsetFromEntityInWorldCoords(ped, 0.0, 0.5, 0.0) as Vector3;
        const entityHeading = GetEntityHeading(ped) + 180.0;

        const { completed } = await this.progressService.progress(
            'spawn_object',
            'Installation du panneau en cours',
            2500,
            {
                dictionary: 'anim@narcotics@trash',
                name: 'drop_front',
                options: {
                    onlyUpperBody: true,
                },
            },
            {
                disableMovement: true,
                useWhileDead: false,
                canCancel: true,
                disableCarMovement: true,
                disableMouse: false,
                disableCombat: true,
            }
        );
        if (!completed) {
            return;
        }
        TriggerServerEvent(
            ServerEvent.POLICE_ADD_SPEEDZONE,
            getProperGroundPositionForObject(roadSignModel, entityCoords, entityHeading),
            radius,
            speed
        );
    }

    @OnEvent(ClientEvent.POLICE_SYNC_SPEEDZONE)
    public async syncSpeedZone(zones: { [id: string]: { position: Vector4; radius: number; speed: number } }) {
        Object.keys(zones).map(k => {
            if (!this.zones[k]) {
                const zone = {
                    speedzone: AddSpeedZoneForCoord(
                        zones[k].position[0],
                        zones[k].position[1],
                        zones[k].position[2],
                        zones[k].radius,
                        zones[k].speed / 3.6,
                        false
                    ),
                    blip: AddBlipForRadius(
                        zones[k].position[0],
                        zones[k].position[1],
                        zones[k].position[2],
                        zones[k].radius
                    ),
                };
                SetBlipColour(zone.blip, 1);
                SetBlipAlpha(zone.blip, 255);
                SetBlipSprite(zone.blip, 4);

                this.zones[k] = zone;
            }
        });

        Object.keys(this.zones).map(k => {
            if (!zones[k]) {
                RemoveBlip(this.zones[k].blip);
                RemoveSpeedZone(this.zones[k].speedzone);
                delete this.zones[k];
            }
        });
    }
}
