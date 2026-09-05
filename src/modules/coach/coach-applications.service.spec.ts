import { Test, type TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CoachApplicationsService } from './coach-applications.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';

describe('CoachApplicationsService', () => {
  let service: CoachApplicationsService;
  let prisma: {
    user: { findUnique: ReturnType<typeof vi.fn>; update: ReturnType<typeof vi.fn> };
    coach: { upsert: ReturnType<typeof vi.fn> };
    coachApplication: {
      findUnique: ReturnType<typeof vi.fn>;
      findUniqueOrThrow: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
  };

  const appRow = (over: Record<string, unknown> = {}) => ({
    id: 'app-1',
    userId: 'u1',
    phone: '+34 600',
    experience: 'mucha',
    bio: 'bio',
    status: 'pending',
    reviewNote: null,
    reviewedById: null,
    createdAt: new Date('2026-09-01'),
    reviewedAt: null,
    user: { name: 'Ana', email: 'ana@x.com' },
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      coach: { upsert: vi.fn() },
      coachApplication: {
        findUnique: vi.fn(),
        findUniqueOrThrow: vi.fn(),
        findMany: vi.fn(),
        upsert: vi.fn(),
        update: vi.fn(),
      },
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CoachApplicationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = moduleRef.get(CoachApplicationsService);
  });

  describe('submit', () => {
    it('rechaza si el usuario ya es COACH', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'COACH' });
      await expect(
        service.submit('u1', { phone: 'x', experience: 'y' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rechaza si ya hay una solicitud pendiente', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'CLIENTE' });
      prisma.coachApplication.findUnique.mockResolvedValue(appRow());
      await expect(
        service.submit('u1', { phone: 'x', experience: 'yyyyyyyyyy' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('reabre una solicitud rechazada (upsert a pending)', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1', role: 'CLIENTE' });
      prisma.coachApplication.findUnique.mockResolvedValue(
        appRow({ status: 'rejected' }),
      );
      prisma.coachApplication.upsert.mockResolvedValue(appRow({ status: 'pending' }));

      const res = await service.submit('u1', {
        phone: '+34 700',
        experience: 'nueva experiencia larga',
      });

      expect(res.status).toBe('pending');
      expect(prisma.coachApplication.upsert).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('crea el coach, promueve el rol y marca approved', async () => {
      prisma.coachApplication.findUnique.mockResolvedValue(appRow());
      prisma.coachApplication.findUniqueOrThrow.mockResolvedValue(
        appRow({ status: 'approved', reviewedById: 'admin-1' }),
      );

      const res = await service.approve('app-1', 'admin-1', {});

      expect(prisma.coach.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'u1' } }),
      );
      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ role: 'COACH' }) }),
      );
      expect(res.status).toBe('approved');
    });

    it('rechaza aprobar una solicitud ya revisada', async () => {
      prisma.coachApplication.findUnique.mockResolvedValue(
        appRow({ status: 'approved' }),
      );
      await expect(
        service.approve('app-1', 'admin-1', {}),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('404 si la solicitud no existe', async () => {
      prisma.coachApplication.findUnique.mockResolvedValue(null);
      await expect(
        service.reject('nope', 'admin-1', {}),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
