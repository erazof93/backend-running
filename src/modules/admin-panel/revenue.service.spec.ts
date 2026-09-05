import { Test, type TestingModule } from '@nestjs/testing';
import { RevenueService } from './revenue.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

describe('RevenueService', () => {
  let service: RevenueService;
  let prisma: {
    subscription: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
    };
    transaction: { findMany: ReturnType<typeof vi.fn> };
    coach: { findMany: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      subscription: { findMany: vi.fn(), count: vi.fn().mockResolvedValue(0) },
      transaction: { findMany: vi.fn().mockResolvedValue([]) },
      coach: { findMany: vi.fn().mockResolvedValue([]) },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [RevenueService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(RevenueService);
  });

  it('bundle: cuenta subs activas por tier y calcula el MRR del breakdown', async () => {
    prisma.subscription.findMany.mockResolvedValue([
      { tier: 'PREMIUM' },
      { tier: 'PREMIUM' },
      { tier: 'PRO_COACHING' },
      { tier: 'FREE' },
    ]);

    const bundle = await service.bundle();

    expect(bundle.summary.byTier).toEqual({
      FREE: 1,
      PREMIUM: 2,
      PRO_COACHING: 1,
    });
    expect(bundle.breakdown.premiumCount).toBe(2);
    expect(bundle.breakdown.proCount).toBe(1);
    // 2 * 9.99 + 1 * 19.99 = 39.97
    expect(bundle.breakdown.total).toBe(39.97);
    expect(bundle.summary.activeSubscriptions).toBe(3);
    expect(bundle.shares.find((s) => s.tier === 'PREMIUM')?.count).toBe(2);
  });

  it('topCoaches: ordena por MRR y asigna rank', async () => {
    prisma.coach.findMany.mockResolvedValue([
      {
        id: 'c-low',
        user: { name: 'Low' },
        feedback: [{ rating: 4 }, { rating: 5 }],
        athletes: [
          { athlete: { subscription: { tier: 'PREMIUM', status: 'ACTIVE' } } },
        ],
      },
      {
        id: 'c-high',
        user: { name: 'High' },
        feedback: [],
        athletes: [
          { athlete: { subscription: { tier: 'PRO_COACHING', status: 'ACTIVE' } } },
          { athlete: { subscription: { tier: 'PRO_COACHING', status: 'ACTIVE' } } },
        ],
      },
    ]);

    const rows = await service.topCoaches();

    expect(rows[0].id).toBe('c-high');
    expect(rows[0].rank).toBe(1);
    expect(rows[0].mrr).toBe(39.98);
    expect(rows[1].id).toBe('c-low');
    expect(rows[1].rating).toBe(4.5);
  });
});
