import { Once } from '@core/decorators/event';
import { Inject } from '@core/decorators/injectable';
import { Provider } from '@core/decorators/provider';
import { InventoryManager } from '@public/client/inventory/inventory.manager';
import { Monitor } from '@public/client/monitor/monitor';
import { NuiMenu } from '@public/client/nui/nui.menu';
import { PlayerService } from '@public/client/player/player.service';
import { ProgressService } from '@public/client/progress.service';
import { TargetFactory } from '@public/client/target/target.factory';
import { emitRpc, emitRpcCache } from '@public/core/rpc';
import { ServerEvent } from '@public/shared/event';
import { JobType } from '@public/shared/job';
import { PlasterLocation } from '@public/shared/job/lsmc';
import { MenuType } from '@public/shared/nui/menu';
import { PlayerLicenceType } from '@public/shared/player';
import { BoxZone } from '@public/shared/polyzone/box.zone';
import { Vector3 } from '@public/shared/polyzone/vector';
import { RpcServerEvent } from '@public/shared/rpc';

import { PlayerListStateService } from '../../player/player.list.state.service';
import { PoliceLicenceProvider } from '../police/police.licence.provider';
import { LSMCDeathProvider } from './lsmc.death.provider';

const hopital = BoxZone.fromZone({
    center: [346.73, -1413.53, 32.26] as Vector3,
    length: 84.4,
    width: 92.6,
    heading: 320,
    debugPoly: false,
    minZ: 28.46,
    maxZ: 39.86,
});

@Provider()
export class LSMCInteractionProvider {
    @Inject(TargetFactory)
    private targetFactory: TargetFactory;

    @Inject(PlayerService)
    public playerService: PlayerService;

    @Inject(ProgressService)
    public progressService: ProgressService;

    @Inject(LSMCDeathProvider)
    public LSMCDeathProvider: LSMCDeathProvider;

    @Inject(InventoryManager)
    private inventoryManager: InventoryManager;

    @Inject(PoliceLicenceProvider)
    private policeLicenceProvider: PoliceLicenceProvider;

    @Inject(Monitor)
    public monitor: Monitor;

    @Inject(PlayerListStateService)
    private playerListStateService: PlayerListStateService;

    @Inject(NuiMenu)
    private nuiMenu: NuiMenu;

    @Once()
    public onStart() {
        this.targetFactory.createForAllPlayer([
            {
                label: 'Rehabiliter',
                color: JobType.LSMC,
                icon: 'c:ems/Rehabiliter.png',
                job: JobType.LSMC,
                blackoutGlobal: true,
                blackoutJob: 'lsmc',
                canInteract: async entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }

                    if (!hopital.isPointInside(GetEntityCoords(PlayerPedId()) as Vector3)) {
                        return false;
                    }

                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    return await emitRpc<boolean>(RpcServerEvent.LSMC_CAN_REMOVE_ITT, target);
                },
                action: entity => {
                    TriggerServerEvent(
                        ServerEvent.LSMC_TOOGLE_ITT,
                        GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity))
                    );
                },
            },
            {
                label: 'Deshabiliter',
                color: JobType.LSMC,
                icon: 'c:ems/Deshabiliter.png',
                job: JobType.LSMC,
                blackoutGlobal: true,
                blackoutJob: 'lsmc',
                canInteract: async entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }

                    if (!hopital.isPointInside(GetEntityCoords(PlayerPedId()) as Vector3)) {
                        return false;
                    }

                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    return await emitRpc<boolean>(RpcServerEvent.LSMC_CAN_SET_ITT, target);
                },
                action: entity => {
                    TriggerServerEvent(
                        ServerEvent.LSMC_TOOGLE_ITT,
                        GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity))
                    );
                },
            },
            {
                label: 'Déshabiller',
                color: JobType.LSMC,
                icon: 'c:ems/desabhiller.png',
                job: JobType.LSMC,
                canInteract: entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }

                    if (!hopital.isPointInside(GetEntityCoords(PlayerPedId()) as Vector3)) {
                        return false;
                    }

                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    return !this.playerListStateService.isWearingPatientOutfit(target);
                },
                action: entity => {
                    TriggerServerEvent(
                        ServerEvent.LSMC_SET_PATIENT_OUTFIT,
                        GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity)),
                        true
                    );
                },
            },
            {
                label: 'Rhabiller',
                color: JobType.LSMC,
                icon: 'c:ems/rhabiller.png',
                job: JobType.LSMC,
                canInteract: entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }

                    if (!hopital.isPointInside(GetEntityCoords(PlayerPedId()) as Vector3)) {
                        return false;
                    }

                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    return this.playerListStateService.isWearingPatientOutfit(target);
                },
                action: entity => {
                    TriggerServerEvent(
                        ServerEvent.LSMC_SET_PATIENT_OUTFIT,
                        GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity)),
                        false
                    );
                },
            },
            {
                label: 'Soigner',
                color: JobType.LSMC,
                icon: 'c:ems/heal.png',
                job: JobType.LSMC,
                canInteract: entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }

                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    return !this.playerListStateService.isDead(target);
                },
                action: async entity => {
                    const { completed } = await this.progressService.progress(
                        'Soigner',
                        'Appliquer un bandage..',
                        10000,
                        {
                            task: 'CODE_HUMAN_MEDIC_TEND_TO_DEAD',
                        },
                        {
                            disableMovement: true,
                            disableCarMovement: true,
                            disableMouse: false,
                            disableCombat: true,
                        }
                    );

                    if (!completed) {
                        return;
                    }

                    const beforeHealth = GetEntityHealth(entity);
                    const serverId = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));
                    TriggerServerEvent(ServerEvent.LSMC_HEAL, serverId);

                    this.monitor.publish(
                        'job_lsmc_heal',
                        {},
                        {
                            amount: 25,
                            before_health: beforeHealth,
                            after_health: beforeHealth + 25,
                            target_source: serverId,
                            position: GetEntityCoords(entity),
                        },
                        true
                    );
                },
                item: 'firstaid',
            },
            {
                label: 'Réanimer',
                color: JobType.LSMC,
                icon: 'c:ems/revive.png',
                job: JobType.LSMC,
                canInteract: entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }

                    if (!this.inventoryManager.hasEnoughItem('bloodbag', 1, true)) {
                        return false;
                    }

                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    return this.playerListStateService.isDead(target);
                },
                action: entity => {
                    this.LSMCDeathProvider.reviveTarget(entity, true);
                },
            },
            {
                label: 'Utiliser Défibrilateur',
                color: JobType.LSMC,
                icon: 'c:ems/revive.png',
                canInteract: entity => {
                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    return this.playerListStateService.isDead(target);
                },
                action: entity => {
                    this.LSMCDeathProvider.reviveTarget(entity, false);
                },
                item: 'defibrillator',
            },
            {
                label: 'Prise de sang',
                color: JobType.LSMC,
                icon: 'c:ems/take_blood.png',
                job: JobType.LSMC,
                canInteract: entity => {
                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));

                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }

                    return !this.playerListStateService.isDead(target);
                },
                action: async entity => {
                    const { completed } = await this.progressService.progress(
                        'Take_Blood',
                        'Vous faites une prise de sang...',
                        10000,
                        {
                            task: 'CODE_HUMAN_MEDIC_TEND_TO_DEAD',
                        },
                        {
                            disableMovement: true,
                            disableCarMovement: true,
                            disableMouse: false,
                            disableCombat: true,
                        }
                    );

                    if (!completed) {
                        return;
                    }

                    TriggerServerEvent(
                        ServerEvent.LSMC_GIVE_BLOOD,
                        GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity))
                    );
                    this.monitor.publish(
                        'job_lsmc_bloodbag',
                        {},
                        {
                            target_source: GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity)),
                            position: GetEntityCoords(entity),
                        },
                        true
                    );
                },
                item: 'empty_bloodbag',
            },
            {
                label: 'Donner le diplôme de secourisme',
                color: JobType.LSMC,
                job: JobType.LSMC,
                icon: 'c:ems/rescuer.png',
                canInteract: async entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }
                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));
                    return !(await emitRpcCache(RpcServerEvent.POLICE_LICENSE_HAS_RECUER, target));
                },
                action: async entity => {
                    const completed = await this.policeLicenceProvider.playLicenceAnimation(
                        'Enregistrement du diplôme...'
                    );
                    if (!completed) {
                        return;
                    }

                    TriggerServerEvent(
                        ServerEvent.POLICE_GIVE_LICENCE,
                        GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity)),
                        PlayerLicenceType.Rescuer
                    );
                },
            },
            {
                label: 'Retirer le diplôme de secourisme',
                color: JobType.LSMC,
                job: JobType.LSMC,
                icon: 'c:ems/notrescuer.png',
                canInteract: async entity => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }
                    const target = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));
                    return await emitRpcCache(RpcServerEvent.POLICE_LICENSE_HAS_RECUER, target);
                },
                action: async entity => {
                    const completed = await this.policeLicenceProvider.playLicenceAnimation(
                        'Suppression du diplôme...'
                    );
                    if (!completed) {
                        return;
                    }

                    TriggerServerEvent(
                        ServerEvent.POLICE_REMOVE_LICENCE,
                        GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity)),
                        PlayerLicenceType.Rescuer
                    );
                },
            },
            {
                label: 'Plâtre',
                color: JobType.LSMC,
                job: JobType.LSMC,
                icon: 'c:ems/platre.png',
                canInteract: () => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }
                    return true;
                },
                action: async entity => {
                    const playerServerId = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));
                    const data = await emitRpc<PlasterLocation[]>(RpcServerEvent.LSMC_PLAYER_PLASTER, playerServerId);

                    this.nuiMenu.openMenu<MenuType.LsmcPlaster>(MenuType.LsmcPlaster, {
                        locations: data,
                        playerServerId: playerServerId,
                    });
                },
            },
            {
                label: 'Naloxone',
                color: JobType.LSMC,
                job: JobType.LSMC,
                icon: 'c:ems/naloxone.png',
                canInteract: () => {
                    if (!this.playerService.isOnDuty()) {
                        return false;
                    }
                    return true;
                },
                action: async entity => {
                    const playerServerId = GetPlayerServerId(NetworkGetPlayerIndexFromPed(entity));
                    TriggerServerEvent(ServerEvent.LSMC_NALOXONE, playerServerId);
                },
                item: 'naloxone',
            },
        ]);
    }
}
