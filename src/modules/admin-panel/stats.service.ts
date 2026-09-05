import { Injectable } from '@nestjs/common';
import { Role, UserTier } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TIER_PRICES, round2 } from '../../common/pricing.js';
import type { DashboardStatsDto } from './admin-panel.types.js';

@Injectable()
export class StatsService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard(): Promise<DashboardStatsDto> {
    const [totalUsers, totalCoaches, premiumUsers, activeSubs] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { role: Role.COACH } }),
        this.prisma.user.count({
          where: { tier: { in: [UserTier.PREMIUM, UserTier.PRO_COACHING] } },
        }),
        this.prisma.subscription.groupBy({
          by: ['tier'],
          where: { status: 'ACTIVE' },
          _count: { _all: true },
        }),
      ]);

    const mrr = round2(
      activeSubs.reduce(
        (sum, row) => sum + TIER_PRICES[row.tier] * row._count._all,
        0,
      ),
    );

    return { totalUsers, totalCoaches, premiumUsers, mrr };
  }
}
