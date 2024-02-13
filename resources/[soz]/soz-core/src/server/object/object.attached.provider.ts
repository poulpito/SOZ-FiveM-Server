import { On, OnEvent } from '@core/decorators/event';
import { Provider } from '@core/decorators/provider';
import { ServerEvent } from '@public/shared/event';

@Provider()
export class ObjectAttachedProvider {
    private objects = new Map<number, Map<number, number>>();

    @OnEvent(ServerEvent.OBJECT_ATTACHED_REGISTER)
    public async onObjectAttachedRegister(source: number, netId: number) {
        let playerObjects = this.objects.get(source);
        if (!playerObjects) {
            playerObjects = new Map<number, number>();
            this.objects.set(source, playerObjects);
        }

        if (GetPlayerRoutingBucket(source.toString()) != 0) {
            return;
        }

        playerObjects.set(netId, GetEntityModel(NetworkGetEntityFromNetworkId(netId)));
    }

    @OnEvent(ServerEvent.OBJECT_ATTACHED_UNREGISTER)
    public async onObjectAttachedUnregister(source: number, netId: number) {
        const playerObjects = this.objects.get(source);
        if (!playerObjects) {
            return;
        }

        playerObjects.delete(netId);
    }

    @On('playerDropped')
    public onDropped(source: number) {
        const playerObjects = this.objects.get(source);
        if (!playerObjects) {
            return;
        }

        for (const netId of playerObjects.keys()) {
            const entityId = NetworkGetEntityFromNetworkId(netId);
            if (entityId) {
                if (playerObjects.get(netId) == GetEntityModel(entityId) && GetEntityType(entityId) == 3) {
                    DeleteEntity(entityId);
                }
            }
        }
        this.objects.delete(source);
    }
}
