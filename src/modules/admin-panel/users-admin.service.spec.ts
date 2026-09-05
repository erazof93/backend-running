import { Test, type TestingModule } from '@nestjs/testing';
import { AdminUsersService } from './users-admin.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

describe('AdminUsersService', () => {
  let service: AdminUsersService;
  let prisma: {
    user: {
      findMany: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };

  const row = (over: Record<string, unknown> = {}) => ({
    id: 'u1',
    name: 'Ana',
    email: 'ana@x.com',
    role: 'CLIENTE',
    tier: 'FREE',
    status: 'ACTIVE',
    createdAt: new Date('2026-09-01'),
    _count: { followers: 3, activities: 7 },
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: vi.fn(),
        updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        deleteMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(AdminUsersService);
  });

  it('list: mapea rol/estado del backend al shape de admin-velora', async () => {
    prisma.user.findMany.mockResolvedValue([
      row({ role: 'COACH' }),
      row({ id: 'u2', role: 'ADMIN', status: 'BANNED' }),
    ]);

    const users = await service.list({});

    expect(users[0].role).toBe('coach');
    expect(users[0].status).toBe('ACTIVE');
    expect(users[0].followers).toBe(3);
    expect(users[0].activities).toBe(7);
    expect(users[1].role).toBe('admin');
    expect(users[1].status).toBe('SUSPENDED');
  });

  it('bulk ban: excluye al propio admin y marca BANNED', async () => {
    const res = await service.bulk(
      { ids: ['u1', 'admin-1', 'u2'], action: 'ban' },
      'admin-1',
    );

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['u1', 'u2'] } },
      data: { status: 'BANNED' },
    });
    expect(res.affected).toBe(2);
  });

  it('bulk sin ids distintos al llamador: no toca la BD', async () => {
    const res = await service.bulk(
      { ids: ['admin-1'], action: 'delete' },
      'admin-1',
    );
    expect(res.affected).toBe(0);
    expect(prisma.user.deleteMany).not.toHaveBeenCalled();
  });

  it('signupsSeries: 30 puntos y cuenta las altas por día', async () => {
    const today = new Date();
    prisma.user.findMany.mockResolvedValue([
      { createdAt: today },
      { createdAt: today },
    ]);

    const series = await service.signupsSeries();

    expect(series).toHaveLength(30);
    const todayKey = today.toISOString().slice(0, 10);
    expect(series.find((p) => p.date === todayKey)?.signups).toBe(2);
  });
});
