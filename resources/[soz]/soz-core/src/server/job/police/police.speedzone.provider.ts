import { OnEvent } from '@public/core/decorators/event';
import { Inject } from '@public/core/decorators/injectable';
import { Provider } from '@public/core/decorators/provider';
import { InventoryManager } from '@public/server/inventory/inventory.manager';
import { PlayerService } from '@public/server/player/player.service';
import { ClientEvent, ServerEvent } from '@public/shared/event';
import { JobType } from '@public/shared/job';
import { Vector4 } from '@public/shared/polyzone/vector';

const allowedJobInteraction = [JobType.BCSO, JobType.FBI, JobType.SASP, JobType.LSPD, JobType.LSCS];
const roadSignModel = GetHashKey('prop_sign_road_06f');
const speedzoneItemName = 'speed_speed_sign';
const LANE_RADIUS = 5.0;

@Provider()
export class PoliceSpeedZoneProvider {
    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(InventoryManager)
    private inventoryManager: InventoryManager;

    private zones: { [id: string]: { position: Vector4; radius: number; speed: number } } = {};

    @OnEvent(ServerEvent.POLICE_PLACE_SPEEDZONE)
    public async onPlaceSpeedZone(source: number, lanes: number, speed: number) {
        const player = this.playerService.getPlayer(source);
        if (!player) {
            return;
        }
        if (!allowedJobInteraction.includes(player.job.id)) {
            return;
        }

        if (this.inventoryManager.getItemCount(player.source, speedzoneItemName) >= 1) {
            this.inventoryManager.removeItemFromInventory(player.source, speedzoneItemName, 1);
            TriggerClientEvent(ClientEvent.POLICE_REQUEST_ADD_SPEEDZONE, player.source, LANE_RADIUS * lanes, speed);
        } else {
            TriggerClientEvent(
                ClientEvent.NOTIFICATION_DRAW,
                player.source,
                'Vous ne possédez pas cet objet.',
                'error'
            );
        }
    }

    @OnEvent(ServerEvent.POLICE_ADD_SPEEDZONE)
    public async addSpeedZone(source: number, position: Vector4, radius: number, speed: number) {
        const roadSign = CreateObjectNoOffset(roadSignModel, position[0], position[1], position[2], true, true, false);
        SetEntityHeading(roadSign, position[3]);
        FreezeEntityPosition(roadSign, true);

        this.zones[NetworkGetNetworkIdFromEntity(roadSign)] = { position, radius, speed };
        TriggerClientEvent(ClientEvent.POLICE_SYNC_SPEEDZONE, -1, this.zones);
    }

    @OnEvent(ServerEvent.POLICE_REMOVE_SPEEDZONE)
    public async removeSpeedZone(source: number, id: number) {
        if (this.zones[id]) {
            DeleteEntity(NetworkGetEntityFromNetworkId(id));
            delete this.zones[id];
            TriggerClientEvent(ClientEvent.POLICE_SYNC_SPEEDZONE, -1, this.zones);
        }
    }

    @OnEvent(ServerEvent.POLICE_INIT_SPEEDZONE)
    public async loadSpeedZone(source: number) {
        TriggerClientEvent(ClientEvent.POLICE_SYNC_SPEEDZONE, source, this.zones);
    }
}
