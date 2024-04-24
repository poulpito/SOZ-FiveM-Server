import { OnEvent } from '../../core/decorators/event';
import { Provider } from '../../core/decorators/provider';
import { ServerEvent } from '../../shared/event';

@Provider()
export class VehicleOffroadProvider {
    @OnEvent(ServerEvent.VEHICLE_CREATE_STATE)
    public async setState(source: string, playerVeh: number, state: string, value: any): Promise<void> {
        const vehicle = NetworkGetEntityFromNetworkId(playerVeh);
        Entity(vehicle).state.set(state, value, true);
    }
}
