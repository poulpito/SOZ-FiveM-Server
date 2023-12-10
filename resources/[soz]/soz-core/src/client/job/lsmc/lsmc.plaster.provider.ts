import { Once, OnceStep, OnEvent, OnNuiEvent } from '@core/decorators/event';
import { Inject } from '@core/decorators/injectable';
import { Provider } from '@core/decorators/provider';
import { NuiMenu } from '@public/client/nui/nui.menu';
import { PlayerService } from '@public/client/player/player.service';
import { ProgressService } from '@public/client/progress.service';
import { ResourceLoader } from '@public/client/repository/resource.loader';
import { Command } from '@public/core/decorators/command';
import { emitRpc } from '@public/core/rpc';
import { ClientEvent, NuiEvent, ServerEvent } from '@public/shared/event';
import { PlasterConfigs, PlasterLocation } from '@public/shared/job/lsmc';
import { MenuType } from '@public/shared/nui/menu';
import { PlayerData } from '@public/shared/player';
import { RpcServerEvent } from '@public/shared/rpc';

@Provider()
export class LSMCPlasterProvider {
    @Inject(PlayerService)
    public playerService: PlayerService;

    @Inject(ResourceLoader)
    public resourceLoader: ResourceLoader;

    @Inject(ProgressService)
    public progressService: ProgressService;

    @Inject(NuiMenu)
    private nuiMenu: NuiMenu;

    private plasters = new Map<PlasterLocation, number>();

    @Once(OnceStep.PlayerLoaded)
    public async playerPlasterLoaded(player: PlayerData) {
        for (const newplaster of player.metadata.plaster) {
            await this.addPlaster(newplaster, player.skin.Model.Hash);
        }
    }

    @OnEvent(ClientEvent.PLAYER_UPDATE)
    public async onPlasterPlayerUpdate(player: PlayerData) {
        for (const plaster of player.metadata.plaster) {
            if (!this.plasters.has(plaster)) {
                await this.addPlaster(plaster, player.skin.Model.Hash);
            }
        }

        for (const plaster of this.plasters.keys()) {
            const loc = plaster as PlasterLocation;
            if (!player.metadata.plaster.includes(loc)) {
                this.removePlaster(loc);
            }
        }
    }

    @OnNuiEvent(NuiEvent.LsmcPlaster)
    public async onPlaster({ location, playerServerId }: { location: PlasterLocation; playerServerId: number }) {
        const { completed } = await this.progressService.progress(
            'plaster',
            'Platre',
            5000,
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

        TriggerServerEvent(ServerEvent.LSMC_PLASTER, playerServerId, location);
        this.nuiMenu.closeMenu();
    }

    private async addPlaster(newplaster: PlasterLocation, model: number) {
        const plasterConfig = PlasterConfigs[newplaster];
        if (!(await this.resourceLoader.loadModel(plasterConfig.prop[model]))) {
            return;
        }

        const playerPed = PlayerPedId();
        const coords = GetEntityCoords(playerPed);
        const mainprop = CreateObject(plasterConfig.prop[model], coords[0], coords[1], coords[2], true, true, false);
        const netId = ObjToNet(mainprop);
        TriggerServerEvent(ServerEvent.OBJECT_ATTACHED_REGISTER, netId);
        AttachEntityToEntity(
            mainprop,
            playerPed,
            GetPedBoneIndex(playerPed, plasterConfig.bone),
            plasterConfig.position[0],
            plasterConfig.position[1],
            plasterConfig.position[2],
            plasterConfig.rotation[0],
            plasterConfig.rotation[1],
            plasterConfig.rotation[2],
            true,
            true,
            false,
            true,
            0,
            true
        );
        this.plasters.set(newplaster, mainprop);

        this.resourceLoader.unloadModel(plasterConfig.prop[model]);
    }

    private async removePlaster(plaster: PlasterLocation) {
        const object = this.plasters.get(plaster);
        TriggerServerEvent(ServerEvent.OBJECT_ATTACHED_UNREGISTER, ObjToNet(object));
        DeleteEntity(object);
        this.plasters.delete(plaster);
    }

    @Command('plaster')
    public async onPLaster() {
        const [isAllowed] = await emitRpc<[boolean, string]>(RpcServerEvent.ADMIN_IS_ALLOWED);
        if (!isAllowed) {
            return;
        }

        const playerServerId = GetPlayerServerId(PlayerId());
        const data = await emitRpc<PlasterLocation[]>(RpcServerEvent.LSMC_PLAYER_PLASTER, playerServerId);

        this.nuiMenu.openMenu<MenuType.LsmcPlaster>(MenuType.LsmcPlaster, {
            locations: data,
            playerServerId: playerServerId,
        });
    }
}
