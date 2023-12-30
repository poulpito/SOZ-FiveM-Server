import { Once, OnEvent } from '@core/decorators/event';
import { Inject } from '@core/decorators/injectable';
import { Provider } from '@core/decorators/provider';
import { AnimationService } from '@public/client/animation/animation.service';
import { Notifier } from '@public/client/notifier';
import { PlayerService } from '@public/client/player/player.service';
import { ProgressService } from '@public/client/progress.service';
import { TargetFactory } from '@public/client/target/target.factory';
import { VehicleStateService } from '@public/client/vehicle/vehicle.state.service';
import { WeaponDrawingProvider } from '@public/client/weapon/weapon.drawing.provider';
import { Tick, TickInterval } from '@public/core/decorators/tick';
import { wait } from '@public/core/utils';
import { Animation } from '@public/shared/animation';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { Control } from '@public/shared/input';
import { deathAnim, StretcherFoldedModel, StretcherModel } from '@public/shared/job/lsmc';
import { Vector3 } from '@public/shared/polyzone/vector';

import { PolicePlayerProvider } from '../police/police.player.provider';

const ambulance = GetHashKey('ambulance2');

const defaultAnim: Animation = {
    base: {
        dictionary: 'anim@gangops@morgue@table@',
        name: 'body_search',
        blendInSpeed: 8.0,
        blendOutSpeed: 8.0,
        options: {
            repeat: true,
        },
    },
};

@Provider()
export class LSMCStretcherProvider {
    @Inject(TargetFactory)
    public targetFactory: TargetFactory;

    @Inject(AnimationService)
    public animationService: AnimationService;

    @Inject(Notifier)
    public notifier: Notifier;

    @Inject(WeaponDrawingProvider)
    public weaponDrawingProvider: WeaponDrawingProvider;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(PolicePlayerProvider)
    private policePlayerProvider: PolicePlayerProvider;

    @Inject(ProgressService)
    private progressService: ProgressService;

    @Inject(VehicleStateService)
    private vehicleStateService: VehicleStateService;

    private pushing = 0;
    private laydown = false;

    @Once()
    public onStart() {
        this.targetFactory.createForModel(
            [StretcherModel, StretcherFoldedModel],
            [
                {
                    canInteract: entity =>
                        !IsEntityAttached(entity) &&
                        NetworkGetEntityIsNetworked(entity) &&
                        this.getPlayerUsingStretcher(entity) == null,
                    label: 'Ramasser',
                    icon: 'c:baun/createCocktailBox.png',
                    action: async entity => {
                        const { completed } = await this.progressService.progress(
                            'stretcher_retrieve',
                            'Vous repliez le brancard...',
                            3000,
                            {
                                dictionary: 'mp_common',
                                name: 'givetake2_a',
                                blendInSpeed: 8.0,
                                blendOutSpeed: 8.0,
                                options: {
                                    enablePlayerControl: true,
                                    onlyUpperBody: true,
                                },
                            },
                            {
                                useAnimationService: true,
                            }
                        );

                        if (!completed) {
                            return;
                        }

                        TriggerServerEvent(ServerEvent.LSMC_STRETCHER_RETRIEVE, NetworkGetNetworkIdFromEntity(entity));
                    },
                },
            ]
        );
        this.targetFactory.createForModel(StretcherModel, [
            {
                label: 'Pousser',
                icon: 'c:ems/push.png',
                canInteract: entity =>
                    this.pushing == 0 && !IsEntityAttached(entity) && NetworkGetEntityIsNetworked(entity),
                action: async entity => {
                    for (let i = 0; i < 10; i++) {
                        if (NetworkHasControlOfEntity(entity)) {
                            break;
                        }
                        NetworkRequestControlOfEntity(entity);
                        await wait(i * 100);
                    }
                    if (!NetworkHasControlOfEntity(entity)) {
                        this.notifier.notify('Fail to control entity');
                        return;
                    }

                    this.pushStretcher(entity);
                },
            },
            {
                label: "S'allonger",
                icon: 'fas fa-bed',
                canInteract: entity =>
                    this.getPlayerUsingStretcher(entity) == null && NetworkGetEntityIsNetworked(entity),
                action: async entity => {
                    if (this.getPlayerUsingStretcher(entity) == null) {
                        this.onStretcher(entity);
                    }
                },
            },
            {
                label: 'Installer sur le brancard',
                icon: 'c:ems/stretcher.png',
                canInteract: entity => {
                    const state = this.playerService.getState();
                    return (
                        state.isEscorting &&
                        this.getPlayerUsingStretcher(entity) == null &&
                        NetworkGetEntityIsNetworked(entity)
                    );
                },
                action: async entity => {
                    if (this.getPlayerUsingStretcher(entity) == null) {
                        TriggerServerEvent(ServerEvent.LSMC_STRETCHER_PUT_ON, NetworkGetNetworkIdFromEntity(entity));
                    }
                },
            },
            {
                label: 'Faire descendre',
                icon: 'c:police/escorter.png',
                canInteract: entity =>
                    this.getPlayerUsingStretcher(entity) != null && NetworkGetEntityIsNetworked(entity),
                action: async entity => {
                    const serverPlayer = this.getPlayerUsingStretcher(entity);
                    TriggerServerEvent(ServerEvent.ESCORT_PLAYER, serverPlayer, false, true);
                },
            },
        ]);

        this.targetFactory.createForAllVehicle(
            [
                {
                    label: 'Installer le brancard',
                    icon: 'c:ems/stretcher.png',
                    canInteract: async entity => {
                        if (!this.pushing) {
                            return false;
                        }

                        const model = GetEntityModel(entity);
                        if (model != ambulance) {
                            return false;
                        }

                        const vehState = await this.vehicleStateService.getVehicleState(entity);
                        if (vehState.ambulanceAttachedStretcher) {
                            return false;
                        }

                        return true;
                    },
                    action: async entity => {
                        const serverPlayer = this.getPlayerUsingStretcher(this.pushing);
                        this.animationService.stop();

                        const coords = GetEntityCoords(this.pushing);

                        const id = CreateObject(
                            GetHashKey(StretcherFoldedModel),
                            coords[0],
                            coords[1],
                            coords[2],
                            true,
                            true,
                            false
                        );
                        FreezeEntityPosition(id, true);
                        SetEntityCollision(id, false, true);
                        SetEntityCompletelyDisableCollision(id, true, true);
                        SetNetworkIdCanMigrate(ObjToNet(id), true);
                        SetEntityAsMissionEntity(id, true, false);

                        AttachEntityToEntity(
                            id,
                            entity,
                            GetEntityBoneIndexByName(entity, 'forks'),
                            0.0,
                            -1.0,
                            -0.2,
                            0.0,
                            0.0,
                            90.0,
                            false,
                            false,
                            false,
                            false,
                            0,
                            true
                        );

                        TriggerServerEvent(
                            ServerEvent.LSMC_STRETCHER_ON_AMBULANCE,
                            serverPlayer,
                            ObjToNet(this.pushing),
                            VehToNet(entity),
                            ObjToNet(id)
                        );
                    },
                },
                {
                    label: 'Récupérer le brancard',
                    icon: 'c:ems/stretcher.png',
                    canInteract: async entity => {
                        if (this.pushing) {
                            return false;
                        }

                        const model = GetEntityModel(entity);
                        if (model != ambulance) {
                            return false;
                        }

                        const vehState = await this.vehicleStateService.getVehicleState(entity);
                        if (!vehState.ambulanceAttachedStretcher) {
                            return false;
                        }

                        return true;
                    },
                    action: async entity => {
                        const vehState = await this.vehicleStateService.getVehicleState(entity);
                        if (!vehState.ambulanceAttachedStretcher) {
                            return;
                        }

                        const folded = NetToObj(vehState.ambulanceAttachedStretcher);
                        const serverPlayer = this.getPlayerUsingStretcher(folded);

                        const id = this.onUseStretcher();
                        const vehNetId = VehToNet(entity);
                        const newStretcherNetId = ObjToNet(id);

                        TriggerServerEvent(
                            ServerEvent.LSMC_STRETCHER_RETRIEVE_AMBULANCE,
                            serverPlayer,
                            vehState.ambulanceAttachedStretcher,
                            vehNetId,
                            newStretcherNetId
                        );

                        this.pushStretcher(id);
                    },
                },
            ],
            3
        );
    }

    private async pushStretcher(entity: number) {
        SetEntityCollision(entity, false, true);
        SetEntityCompletelyDisableCollision(entity, true, true);
        const playerPed = PlayerPedId();
        AttachEntityToEntity(
            entity,
            playerPed,
            GetPedBoneIndex(playerPed, 17916),
            0.0,
            1.5,
            -1.0,
            0.0,
            0.0,
            90.0,
            false,
            false,
            false,
            false,
            0,
            true
        );
        this.pushing = entity;

        await this.animationService.playAnimation({
            base: {
                dictionary: 'anim@heists@box_carry@',
                name: 'idle',
                options: {
                    repeat: true,
                    onlyUpperBody: true,
                    enablePlayerControl: true,
                },
            },
        });

        DetachEntity(entity, false, false);
        SetEntityCompletelyDisableCollision(entity, false, true);
        SetEntityCollision(entity, true, true);
        PlaceObjectOnGroundProperly(entity);
        this.pushing = 0;
    }

    private getPlayerUsingStretcher(entity: number) {
        const playerPedId = PlayerPedId();
        const coords = GetEntityCoords(playerPedId) as Vector3;
        const playersInrange = this.playerService.getPlayersAround(coords, 4.0, true, player => {
            const ped = GetPlayerPed(player);
            return IsEntityAttached(ped) && GetEntityAttachedTo(ped) == entity;
        });

        return playersInrange.length > 0 ? playersInrange[0] : null;
    }

    @OnEvent(ClientEvent.LSMC_STRETCHER_USE)
    public onUseStretcher() {
        const playerPed = PlayerPedId();
        const coords = GetOffsetFromEntityInWorldCoords(playerPed, 0.0, 1.5, 0.0);
        const id = CreateObject(GetHashKey(StretcherModel), coords[0], coords[1], coords[2], true, true, false);
        SetEntityHeading(id, GetEntityHeading(playerPed) + 90.0);
        PlaceObjectOnGroundProperly(id);
        FreezeEntityPosition(id, true);
        SetNetworkIdCanMigrate(ObjToNet(id), true);
        SetEntityAsMissionEntity(id, true, false);

        return id;
    }

    @OnEvent(ClientEvent.LSMC_STRETCHER_PUT_ON)
    public async onPutOnStretcher(netId: number) {
        await this.policePlayerProvider.removeEscorted();

        for (let i = 0; i < 10; i++) {
            if (NetworkDoesNetworkIdExist(netId)) {
                break;
            }
            await wait(i * 100);
        }
        const entity = NetworkGetEntityFromNetworkId(netId);

        this.onStretcher(entity);
    }

    private async onStretcher(entity: number) {
        const playerPed = PlayerPedId();
        const player = this.playerService.getPlayer();
        this.weaponDrawingProvider.undrawWeapons();
        SetEntityCompletelyDisableCollision(playerPed, true, false);

        const zoffset = GetEntityModel(entity) == GetHashKey(StretcherModel) ? 2.1 : 1.5;
        AttachEntityToEntity(
            playerPed,
            entity,
            0,
            0.2,
            0.0,
            zoffset,
            0.0,
            0.0,
            90.0,
            false,
            false,
            false,
            false,
            0,
            true
        );
        this.laydown = true;

        await this.animationService.playAnimation(player.metadata.isdead ? deathAnim : defaultAnim);

        if (IsEntityAttached(playerPed) && GetEntityAttachedTo(playerPed) == entity) {
            DetachEntity(playerPed, false, false);
        }

        SetEntityCompletelyDisableCollision(playerPed, false, true);
        SetEntityCollision(playerPed, true, true);
        this.laydown = false;
        this.weaponDrawingProvider.drawWeapons();
        ClearPedTasks(playerPed);
    }

    @Tick(TickInterval.EVERY_FRAME)
    async onStretcherFrame(): Promise<void> {
        if (!this.pushing && !this.laydown) {
            return;
        }

        DisableControlAction(0, Control.Sprint, true); // disable sprint
        DisableControlAction(0, Control.Jump, true); // disable jump
        DisableControlAction(0, Control.Attack, true); // Attack
        DisableControlAction(0, Control.Aim, true); // Aim
        DisableControlAction(2, Control.Duck, true); // Disable going stealth
        DisableControlAction(0, Control.SelectWeapon, true); // Select Weapon
        DisableControlAction(0, Control.Cover, true); // Cover
        DisableControlAction(0, Control.Reload, true); // Reload
        DisableControlAction(0, Control.Detonate, true); // Disable weapon
        DisableControlAction(0, Control.VehicleAccelerate, true); // disable vehicle accelerate
        DisableControlAction(0, Control.VehicleBrake, true); // disable vehicle brake
        DisableControlAction(0, Control.VehicleFlyThrottleUp, true); // disable vehicle throttle up
        DisableControlAction(0, Control.VehicleFlyThrottleDown, true); // disable vehicle throttle down
        DisableControlAction(0, Control.MeleeAttackLight, true); // Disable melee
        DisableControlAction(0, Control.MeleeAttackHeavy, true); // Disable melee
        DisableControlAction(0, Control.MeleeAttackAlternate, true); // Disable melee
        DisableControlAction(0, Control.MeleeBlock, true); // Disable melee
        DisableControlAction(0, Control.Attack2, true); // Attack 2
        DisableControlAction(0, Control.MeleeAttack1, true); // Melee Attack 1
        DisableControlAction(0, Control.MeleeAttack2, true); // Disable melee
        DisableControlAction(0, Control.Enter, true); // Disable vehicule entry
    }
}
