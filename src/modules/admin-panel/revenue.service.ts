import { Injectable } from '@nestjs/common';
import { UserTier } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { TIER_PRICES, round2 } from '../../common/pricing.js';
import type {
  ChurnPointDto,
  RevenueBundleDto,
  RevenueCoachDto,
  TierShareDto,
  TieredRevenuePointDto,
} from './admin-panel.types.js';

const MONTHS_ES = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
];

@Injectable()
export class RevenueService {
  constructor(private readonly prisma: PrismaService) {}

  async bundle(): Promise<RevenueBundleDto> {
    const activeSubs = await this.prisma.subscription.findMany({
      where: { status: 'ACTIVE' },
      select: { tier: true },
    });

    const byTier: Record<UserTier, number> = {
      FREE: 0,
      PREMIUM: 0,
      PRO_COACHING: 0,
    };
    for (const s of activeSubs) byTier[s.tier] += 1;

    const premiumCount = byTier.PREMIUM;
    const proCount = byTier.PRO_COACHING;
    const total = round2(
      premiumCount * TIER_PRICES.PREMIUM + proCount * TIER_PRICES.PRO_COACHING,
    );
    const activeSubscriptions = premiumCount + proCount;

    const tiered = await this.tieredSeries(6);
    const growthPct = this.growthFromSeries(tiered);
    const churnRate = await this.churnRatePct();

    const shares: TierShareDto[] = (
      Object.keys(byTier) as UserTier[]
    ).map((tier) => ({
      tier,
      count: byTier[tier],
      pct: activeSubs.length
        ? round2((byTier[tier] / activeSubs.length) * 100)
        : 0,
    }));

    return {
      summary: {
        mrr: total,
        growthPct,
        activeSubscriptions,
        byTier,
      },
      tiered,
      shares,
      breakdown: {
        premiumCount,
        proCount,
        premiumPrice: TIER_PRICES.PREMIUM,
        proPrice: TIER_PRICES.PRO_COACHING,
        total,
        churnRate,
        projection3m: round2(total * Math.pow(1 + growthPct / 100, 3)),
      },
    };
  }

  async topCoaches(limit = 10): Promise<RevenueCoachDto[]> {
    const coaches = await this.prisma.coach.findMany({
      include: {
        user: { select: { name: true } },
        athletes: {
          select: {
            athlete: {
              select: { subscription: { select: { tier: true, status: true } } },
            },
          },
        },
        feedback: { select: { rating: true } },
      },
    });

    const rows = coaches.map((c) => {
      const mrr = round2(
        c.athletes.reduce((sum, link) => {
          const sub = link.athlete.subscription;
          if (sub && sub.status === 'ACTIVE') return sum + TIER_PRICES[sub.tier];
          return sum;
        }, 0),
      );
      const ratings = c.feedback
        .map((f) => f.rating)
        .filter((r): r is number => typeof r === 'number');
      const rating = ratings.length
        ? round2(ratings.reduce((a, b) => a + b, 0) / ratings.length)
        : 0;
      return {
        id: c.id,
        name: c.user.name,
        mrr,
        athletes: c.athletes.length,
        rating,
      };
    });

    return rows
      .sort((a, b) => b.mrr - a.mrr || b.athletes - a.athletes)
      .slice(0, limit)
      .map((r, i) => ({ ...r, rank: i + 1 }));
  }

  async churn(days = 30): Promise<ChurnPointDto[]> {
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const [canceled, activeNow] = await Promise.all([
      this.prisma.subscription.findMany({
        where: { canceledAt: { gte: since } },
        select: { canceledAt: true },
      }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);

    const buckets = new Map<string, number>();
    for (let i = 0; i < days; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const s of canceled) {
      if (!s.canceledAt) continue;
      const key = s.canceledAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }

    const denom = activeNow || 1;
    return [...buckets.entries()].map(([day, count]) => ({
      day,
      rate: round2((count / denom) * 100),
    }));
  }

  /** Ingresos (Transaction SUCCESS) por mes y tier, últimos `n` meses. */
  private async tieredSeries(n: number): Promise<TieredRevenuePointDto[]> {
    const start = new Date();
    start.setMonth(start.getMonth() - (n - 1), 1);
    start.setHours(0, 0, 0, 0);

    const txs = await this.prisma.transaction.findMany({
      where: { status: 'SUCCESS', createdAt: { gte: start } },
      select: {
        amount: true,
        createdAt: true,
        subscription: { select: { tier: true } },
      },
    });

    const points: TieredRevenuePointDto[] = [];
    for (let i = 0; i < n; i += 1) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i);
      points.push({ month: MONTHS_ES[d.getMonth()], free: 0, premium: 0, pro: 0 });
    }

    for (const tx of txs) {
      const idx =
        (tx.createdAt.getFullYear() - start.getFullYear()) * 12 +
        (tx.createdAt.getMonth() - start.getMonth());
      const point = points[idx];
      if (!point) continue;
      if (tx.subscription.tier === UserTier.PRO_COACHING) point.pro += tx.amount;
      else if (tx.subscription.tier === UserTier.PREMIUM)
        point.premium += tx.amount;
    }
    for (const p of points) {
      p.premium = round2(p.premium);
      p.pro = round2(p.pro);
    }
    return points;
  }

  private growthFromSeries(series: TieredRevenuePointDto[]): number {
    if (series.length < 2) return 0;
    const val = (p: TieredRevenuePointDto) => p.premium + p.pro;
    const last = val(series[series.length - 1]);
    const prev = val(series[series.length - 2]);
    if (prev === 0) return last > 0 ? 100 : 0;
    return round2(((last - prev) / prev) * 100);
  }

  private async churnRatePct(): Promise<number> {
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const [canceled, active] = await Promise.all([
      this.prisma.subscription.count({ where: { canceledAt: { gte: since } } }),
      this.prisma.subscription.count({ where: { status: 'ACTIVE' } }),
    ]);
    const denom = active + canceled;
    return denom ? round2((canceled / denom) * 100) : 0;
  }
}
