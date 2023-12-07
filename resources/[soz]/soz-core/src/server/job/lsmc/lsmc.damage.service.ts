import { Inject, Injectable } from '@public/core/decorators/injectable';
import { PrismaService } from '@public/server/database/prisma.service';
import { PlayerService } from '@public/server/player/player.service';

@Injectable()
export class DamageService {
    @Inject(PlayerService)
    private playerService: PlayerService;

    @Inject(PrismaService)
    private prismaService: PrismaService;
}
