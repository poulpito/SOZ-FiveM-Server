import { OnEvent } from '../../../core/decorators/event';
import { Inject } from '../../../core/decorators/injectable';
import { Provider } from '../../../core/decorators/provider';
import { TaxLabel, TaxType } from '../../../shared/bank';
import { ServerEvent } from '../../../shared/event/server';
import { JobPermission, JobType } from '../../../shared/job';
import { PrismaService } from '../../database/prisma.service';
import { JobService } from '../../job.service';
import { Notifier } from '../../notifier';
import { PlayerService } from '../../player/player.service';
import { TaxRepository } from '../../repository/tax.repository';

@Provider()
export class GouvProvider {
    @Inject(TaxRepository)
    private taxRepository: TaxRepository;

    @Inject(JobService)
    private jobService: JobService;

    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(Notifier)
    private notifier: Notifier;

    @Inject(PrismaService)
    private prismaService: PrismaService;

    @OnEvent(ServerEvent.GOUV_UPDATE_TAX)
    public async updateTax(source: number, taxType: TaxType, value: number) {
        const player = this.playerService.getPlayer(source);

        if (!player) {
            return;
        }

        if (!(await this.jobService.hasPermission(player, JobType.Gouv, JobPermission.GouvUpdateTax))) {
            return;
        }

        await this.prismaService.tax.upsert({
            where: { id: taxType },
            update: { value },
            create: { id: taxType, value },
        });

        await this.taxRepository.set(taxType, { id: taxType, value });

        const label = TaxLabel[taxType];

        this.notifier.notify(source, `Vous avez mis à jour la taxe ~g~"${label}"~s~ à ~g~${value}~s~`);
    }
}
