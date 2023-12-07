import { Inject } from '@core/decorators/injectable';
import { Provider } from '@core/decorators/provider';
import { Once, OnceStep, OnGameEvent } from '@public/core/decorators/event';
import { Tick } from '@public/core/decorators/tick';
import { GameEvent, ServerEvent } from '@public/shared/event';
import { DamageData } from '@public/shared/job/lsmc';
import { ExtraWeaponName, WeaponName } from '@public/shared/weapons/weapon';

import { PlayerService } from '../../player/player.service';

@Provider()
export class LSMCDamageProvider {
    @Inject(PlayerService)
    private playerService: PlayerService;

    private lastHealth = GetEntityHealth(PlayerPedId());
    private lastWeaponHash = 0;
    private lastAttacker = 0;

    @Once(OnceStep.PlayerLoaded)
    onInit(player) {
        if (player) this.lastHealth = player.metadata.health;
    }

    @OnGameEvent(GameEvent.CEventNetworkEntityDamage)
    getlastinjury(
        victim: number,
        attacker: number,
        unkInt1: number,
        unkBool1: number,
        unkBool2: number,
        isFatal: boolean,
        weaponHash: number
    ) {
        const playerPed = PlayerPedId();
        if (playerPed != victim) {
            return;
        }

        this.lastWeaponHash = weaponHash;
        this.lastAttacker = attacker;
    }

    @Tick(100)
    private weaponInjuriesLoop() {
        const playerPed = PlayerPedId();
        const health = GetEntityHealth(playerPed);
        const damageQty = this.lastHealth - health;

        this.lastHealth = health;
        if (damageQty <= 0) {
            return;
        }

        const playerData = this.playerService.getPlayer();
        const [damaged, damagedBone] = GetPedLastDamageBone(playerPed);
        if (!damaged) {
            return;
        }
        const attackerId = GetPlayerServerId(this.lastAttacker);

        this.lastHealth = health;

        let weapon = '';
        let damageType = 0;
        let bone = damagedBone;

        // Weapon Name Management
        for (const weaponId of Object.keys(WeaponName)) {
            if (GetHashKey(WeaponName[weaponId]) == this.lastWeaponHash) {
                weapon = WeaponName[weaponId];
                break;
            }
        }
        if (!weapon) {
            for (const weaponId of Object.keys(ExtraWeaponName)) {
                if (GetHashKey(ExtraWeaponName[weaponId]) == this.lastWeaponHash) {
                    weapon = ExtraWeaponName[weaponId];
                    break;
                }
            }
        }
        if (!weapon) {
            weapon = this.lastWeaponHash.toString();
        }

        damageType = GetWeaponDamageType(this.lastWeaponHash);

        // Damage Type Management

        if (weapon == ExtraWeaponName.FALL) {
            damageType = 8;
        }

        if (weapon == ExtraWeaponName.RAMMED_BY_CAR || weapon == ExtraWeaponName.RUN_OVER_BY_CAR) {
            damageType = 905;
        }

        if (playerData.metadata.thirst <= 0) {
            damageType = 901;
        }

        if (playerData.metadata.hunger <= 0) {
            damageType = 904;
        }

        if (weapon == ExtraWeaponName.WEAPON_DROWNING) {
            damageType = 906;
            bone = 24818; // Torse
        }

        if (weapon == ExtraWeaponName.ROTORS) {
            damageType = 907;
        }

        const data: DamageData = {
            victimId: playerData.citizenid,
            attackerId: attackerId,
            bone: bone,
            damageQty: Math.min(damageQty, 100),
            damageType: damageType,
            isFatal: health < 100 ? true : false,
            weapon: weapon,
        };

        TriggerServerEvent(ServerEvent.LSMC_DAMAGE_ADD, data);
    }
}
