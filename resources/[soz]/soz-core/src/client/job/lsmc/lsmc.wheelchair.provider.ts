import { Once, OnEvent } from '@core/decorators/event';
import { Inject } from '@core/decorators/injectable';
import { Provider } from '@core/decorators/provider';
import { AnimationService } from '@public/client/animation/animation.service';
import { DrawService } from '@public/client/draw.service';
import { Notifier } from '@public/client/notifier';
import { PlayerService } from '@public/client/player/player.service';
import { ProgressService } from '@public/client/progress.service';
import { TargetFactory } from '@public/client/target/target.factory';
import { WeaponDrawingProvider } from '@public/client/weapon/weapon.drawing.provider';
import { Tick, TickInterval } from '@public/core/decorators/tick';
import { wait } from '@public/core/utils';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { Control } from '@public/shared/input';
import { WheelChairModel } from '@public/shared/job/lsmc';
import { Vector3 } from '@public/shared/polyzone/vector';

const CHANGE_SPEED_KEY = 21;
const NORMAL_SPEED = 0.01;
const FAST_SPEED = 0.03;

@Provider()
export class LSMCWheelChairProvider {
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

    @Inject(ProgressService)
    private progressService: ProgressService;

    @Inject(DrawService)
    private drawService: DrawService;

    private pushing = false;
    private wheelchair = 0;

    @Once()
    public onStart() {
        this.targetFactory.createForModel(WheelChairModel, [
            {
                canInteract: entity =>
                    !IsEntityAttached(entity) &&
                    NetworkGetEntityIsNetworked(entity) &&
                    this.getPlayerUsingWheelChair(entity) == null,
                label: 'Ramasser',
                icon: 'c:baun/createCocktailBox.png',
                action: async entity => {
                    const { completed } = await this.progressService.progress(
                        'wheelchair_retrieve',
                        'Vous repliez la chaisse roulante...',
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

                    TriggerServerEvent(ServerEvent.LSMC_WHEELCHAIR_RETRIEVE, NetworkGetNetworkIdFromEntity(entity));
                },
            },
            {
                label: 'Pousser',
                icon: 'c:ems/push.png',
                canInteract: entity =>
                    !this.pushing && !IsEntityAttached(entity) && NetworkGetEntityIsNetworked(entity),
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

                    SetEntityCollision(entity, false, true);
                    SetEntityCompletelyDisableCollision(entity, true, true);
                    const playerPed = PlayerPedId();
                    AttachEntityToEntity(
                        entity,
                        playerPed,
                        GetPedBoneIndex(playerPed, 17916),
                        0.0,
                        0.7,
                        -0.5,
                        0.0,
                        0.0,
                        180.0,
                        false,
                        false,
                        false,
                        false,
                        0,
                        true
                    );
                    this.pushing = true;

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

                    this.pushing = false;

                    for (let i = 0; i < 10; i++) {
                        if (NetworkHasControlOfEntity(entity)) {
                            break;
                        }
                        NetworkRequestControlOfEntity(entity);
                        await wait(i * 100);
                    }

                    DetachEntity(entity, false, false);
                    SetEntityCompletelyDisableCollision(entity, false, true);
                    SetEntityCollision(entity, true, true);
                    PlaceObjectOnGroundProperly(entity);
                },
            },
            {
                label: "S'asseoir",
                icon: 'c:ems/wheelchair.png',
                canInteract: entity =>
                    this.getPlayerUsingWheelChair(entity) == null && NetworkGetEntityIsNetworked(entity),
                action: async entity => {
                    if (this.getPlayerUsingWheelChair(entity) == null) {
                        this.onWheelChairUse(entity);
                    }
                },
            },
        ]);
    }

    private getPlayerUsingWheelChair(entity: number) {
        const playerPedId = PlayerPedId();
        const coords = GetEntityCoords(playerPedId) as Vector3;
        const playersInrange = this.playerService.getPlayersAround(coords, 4.0, true, player => {
            const ped = GetPlayerPed(player);
            return IsEntityAttached(ped) && GetEntityAttachedTo(ped) == entity;
        });

        return playersInrange.length > 0 ? playersInrange[0] : null;
    }

    @OnEvent(ClientEvent.LSMC_WHEELCHAIR_USE)
    public onUseWheelChair() {
        const playerPed = PlayerPedId();
        const coords = GetOffsetFromEntityInWorldCoords(playerPed, 0.0, 1.5, 0.0);
        const id = CreateObject(GetHashKey(WheelChairModel), coords[0], coords[1], coords[2], true, true, false);
        SetEntityHeading(id, GetEntityHeading(playerPed) + 180.0);
        PlaceObjectOnGroundProperly(id);
        SetNetworkIdCanMigrate(ObjToNet(id), true);
        SetEntityAsMissionEntity(id, true, false);
    }

    private async onWheelChairUse(entity: number) {
        const playerPed = PlayerPedId();
        this.weaponDrawingProvider.undrawWeapons();
        SetEntityCompletelyDisableCollision(playerPed, true, false);
        AttachEntityToEntity(
            playerPed,
            entity,
            0,
            0.0,
            0.0,
            0.35,
            0.0,
            0.0,
            180.0,
            false,
            false,
            false,
            false,
            0,
            true
        );
        this.wheelchair = entity;

        await this.animationService.playAnimation({
            base: {
                dictionary: 'missfinale_c2leadinoutfin_c_int',
                name: '_leadin_loop2_lester',
                blendInSpeed: 8.0,
                blendOutSpeed: 8.0,
                options: {
                    repeat: true,
                },
            },
        });

        if (IsEntityAttached(playerPed) && GetEntityAttachedTo(playerPed) == entity) {
            DetachEntity(playerPed, false, false);
        }

        SetEntityCompletelyDisableCollision(entity, false, true);
        SetEntityCollision(entity, true, true);
        this.wheelchair = 0;
        this.weaponDrawingProvider.drawWeapons();
        ClearPedTasks(playerPed);
        FreezeEntityPosition(playerPed, false);
        FreezeEntityPosition(entity, false);
    }

    private IsControlAlwaysPressed(inputGroup: number, control: Control) {
        return IsControlPressed(inputGroup, control) || IsDisabledControlPressed(inputGroup, control);
    }

    @Tick(TickInterval.EVERY_FRAME)
    async onSWheelChairFrame(): Promise<void> {
        if (!this.pushing && this.wheelchair == 0) {
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

        if (this.wheelchair != 0 && this.getPlayerUsingWheelChair(this.wheelchair) == null) {
            DisableControlAction(0, Control.MoveUpDown, true);
            DisableControlAction(0, Control.MoveLeftRight, true);

            const speed = this.IsControlAlwaysPressed(1, CHANGE_SPEED_KEY) ? FAST_SPEED : NORMAL_SPEED;
            const rotate = GetDisabledControlNormal(0, Control.MoveLeftRight);
            let move = GetDisabledControlNormal(0, Control.MoveUpDown);

            const controlEntity = this.wheelchair;
            if (move != 0.0 || rotate != 0.0) {
                if (!NetworkHasControlOfEntity(this.wheelchair)) {
                    NetworkRequestControlOfEntity(this.wheelchair);
                } else {
                    const playerPed = PlayerPedId();
                    const baserotation = GetEntityRotation(controlEntity, 0);
                    const basePosition = GetEntityCoords(controlEntity);

                    if (move != 0.0) {
                        if (move > 0.0) {
                            move = move / 2.5;
                        }
                        const coords = GetOffsetFromEntityInWorldCoords(controlEntity, 0.0, move * speed, 0.0);
                        PlaceObjectOnGroundProperly_2(controlEntity);
                        SetEntityVelocity(
                            controlEntity,
                            (coords[0] - basePosition[0]) * 100,
                            (coords[1] - basePosition[1]) * 100,
                            (coords[2] - basePosition[2]) * 100
                        );
                    }
                    const rotation = GetEntityRotation(controlEntity, 0);
                    const targeHeading = baserotation[2] - rotate * speed * 20;
                    SetEntityRotation(controlEntity, rotation[0], rotation[1], targeHeading, 0, false);

                    SetTaskMoveNetworkSignalFloat(controlEntity, 'Heading', targeHeading);
                    SetTaskMoveNetworkSignalFloat(playerPed, 'Heading', targeHeading);
                }
            }
        }
    }
}
