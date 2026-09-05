import { Test, type TestingModule } from '@nestjs/testing';
import { StatsService } from './stats.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

describe('StatsService', () => {
  let service: StatsService;
  let prisma: {
    user: { count: ReturnType<typeof vi.fn> };
    subscription: { groupBy: ReturnType<typeof vi.fn> };
  };

  beforeEach(async () => {
    prisma = {
      user: { count: vi.fn() },
      subscription: { groupBy: vi.fn() },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [StatsService, { provide: PrismaService, useValue: prisma }],
    }).compile();
    service = moduleRef.get(StatsService);
  });

  it('calcula MRR desde las suscripciones activas por tier', async () => {
    prisma.user.count
      .mockResolvedValueOnce(120) // totalUsers
      .mockResolvedValueOnce(14) // totalCoaches
      .mockResolvedValueOnce(30); // premiumUsers
    prisma.subscription.groupBy.mockResolvedValue([
      { tier: 'PREMIUM', _count: { _all: 10 } },
      { tier: 'PRO_COACHING', _count: { _all: 5 } },
    ]);

    const stats = await service.dashboard();

    expect(stats.totalUsers).toBe(120);
    expect(stats.totalCoaches).toBe(14);
    expect(stats.premiumUsers).toBe(30);
    // 10 * 9.99 + 5 * 19.99 = 99.9 + 99.95 = 199.85
    expect(stats.mrr).toBe(199.85);
  });
});
