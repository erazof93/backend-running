import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { CommunityService } from './community.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  CommentEntity,
  FeedActivityEntity,
  KudoEntity,
  KudoUserEntity,
  RankingUserEntity,
} from './entities/community.entity.js';

describe('CommunityService', () => {
  let service: CommunityService;
  let prisma: {
    follow: {
      findMany: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
    };
    activity: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      groupBy: ReturnType<typeof vi.fn>;
    };
    kudo: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    comment: {
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
    };
    user: { findMany: ReturnType<typeof vi.fn> };
  };

  const activityRow = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'act-1',
    userId: 'friend-1',
    title: 'Fondo',
    description: null,
    activityType: ActivityType.run,
    distance: 10.5,
    duration: 3600,
    notes: null,
    createdAt: new Date('2026-02-02'),
    updatedAt: new Date('2026-02-02'),
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      follow: { findMany: vi.fn(), groupBy: vi.fn().mockResolvedValue([]) },
      activity: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        groupBy: vi.fn(),
      },
      kudo: {
        upsert: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn(),
      },
      comment: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
      },
      user: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(CommunityService);
  });

  describe('getFeed', () => {
    it('devuelve [] si el usuario no sigue a nadie', async () => {
      prisma.follow.findMany.mockResolvedValue([]);

      await expect(service.getFeed('user-1')).resolves.toEqual([]);
      expect(prisma.activity.findMany).not.toHaveBeenCalled();
    });

    it('devuelve las actividades de los seguidos con contadores', async () => {
      prisma.follow.findMany.mockResolvedValue([
        { followingId: 'friend-1' },
        { followingId: 'friend-2' },
      ]);
      prisma.activity.findMany.mockResolvedValue([
        {
          ...activityRow(),
          user: { name: 'Amiga 1', profilePicture: null },
          _count: { kudos: 5, comments: 2 },
        },
      ]);

      const result = await service.getFeed('user-1');

      expect(prisma.activity.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: { in: ['friend-1', 'friend-2'] } },
          orderBy: { createdAt: 'desc' },
        }),
      );
      expect(result[0]).toBeInstanceOf(FeedActivityEntity);
      expect(result[0].kudosCount).toBe(5);
      expect(result[0].commentsCount).toBe(2);
      expect(result[0].distance).toBe(10.5);
      expect(result[0].user.name).toBe('Amiga 1');
    });
  });

  describe('giveKudo', () => {
    it('hace upsert del kudo y devuelve KudoEntity', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.kudo.upsert.mockResolvedValue({
        id: 'kudo-1',
        userId: 'user-1',
        activityId: 'act-1',
        createdAt: new Date('2026-02-03'),
      });

      const result = await service.giveKudo('act-1', 'user-1');

      expect(prisma.kudo.upsert).toHaveBeenCalledWith({
        where: { userId_activityId: { userId: 'user-1', activityId: 'act-1' } },
        create: { userId: 'user-1', activityId: 'act-1' },
        update: {},
      });
      expect(result).toBeInstanceOf(KudoEntity);
    });

    it('lanza NotFoundException si la actividad no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.giveKudo('ghost', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.kudo.upsert).not.toHaveBeenCalled();
    });

    it('es idempotente: dar kudo dos veces no lanza error', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.kudo.upsert.mockResolvedValue({
        id: 'kudo-1',
        userId: 'user-1',
        activityId: 'act-1',
        createdAt: new Date(),
      });

      await service.giveKudo('act-1', 'user-1');
      await expect(service.giveKudo('act-1', 'user-1')).resolves.toBeInstanceOf(
        KudoEntity,
      );
    });
  });

  describe('removeKudo', () => {
    it('elimina el kudo y devuelve { success: true }', async () => {
      await expect(service.removeKudo('act-1', 'user-1')).resolves.toEqual({
        success: true,
      });
      expect(prisma.kudo.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', activityId: 'act-1' },
      });
    });
  });

  describe('getKudos', () => {
    it('lista los usuarios que dieron kudo', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.kudo.findMany.mockResolvedValue([
        {
          userId: 'u1',
          createdAt: new Date('2026-02-03'),
          user: { id: 'u1', name: 'Beto', profilePicture: null },
        },
      ]);

      const result = await service.getKudos('act-1');

      expect(result[0]).toBeInstanceOf(KudoUserEntity);
      expect(result[0].name).toBe('Beto');
      expect(result[0].userId).toBe('u1');
    });

    it('lanza NotFoundException si la actividad no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.getKudos('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('createComment / getComments', () => {
    it('crea un comentario y devuelve CommentEntity', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.comment.create.mockResolvedValue({
        id: 'c-1',
        userId: 'user-1',
        activityId: 'act-1',
        text: '¡Grande!',
        createdAt: new Date('2026-02-03'),
        updatedAt: new Date('2026-02-03'),
      });

      const result = await service.createComment('act-1', 'user-1', {
        text: '¡Grande!',
      });

      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: { activityId: 'act-1', userId: 'user-1', text: '¡Grande!' },
      });
      expect(result).toBeInstanceOf(CommentEntity);
      expect(result.text).toBe('¡Grande!');
    });

    it('createComment lanza NotFoundException si la actividad no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.createComment('ghost', 'user-1', { text: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('getComments devuelve los comentarios en orden ascendente con autor', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.comment.findMany.mockResolvedValue([
        {
          id: 'c-1',
          userId: 'u1',
          activityId: 'act-1',
          text: 'primero',
          createdAt: new Date('2026-02-01'),
          updatedAt: new Date('2026-02-01'),
          user: { name: 'Ana', profilePicture: null },
        },
      ]);

      const result = await service.getComments('act-1');

      expect(prisma.comment.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { activityId: 'act-1' },
          orderBy: { createdAt: 'asc' },
        }),
      );
      expect(result[0].user?.name).toBe('Ana');
    });
  });

  describe('deleteComment', () => {
    it('el autor borra su comentario', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'user-1',
      });

      await expect(
        service.deleteComment('c-1', 'user-1'),
      ).resolves.toEqual({ success: true });
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 'c-1' },
      });
    });

    it('lanza NotFoundException si el comentario no existe', async () => {
      prisma.comment.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteComment('ghost', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza ForbiddenException si no es el autor', async () => {
      prisma.comment.findUnique.mockResolvedValue({
        id: 'c-1',
        userId: 'otro',
      });

      await expect(
        service.deleteComment('c-1', 'user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.comment.delete).not.toHaveBeenCalled();
    });
  });

  describe('getWeeklyRanking', () => {
    it('devuelve [] si no hay actividades en la semana', async () => {
      prisma.activity.groupBy.mockResolvedValue([]);

      await expect(service.getWeeklyRanking()).resolves.toEqual([]);
    });

    it('construye el ranking con posición, nombre y seguidores', async () => {
      prisma.activity.groupBy.mockResolvedValue([
        { userId: 'u1', _sum: { distance: 62.4 }, _count: { _all: 5 } },
        { userId: 'u2', _sum: { distance: 30 }, _count: { _all: 3 } },
      ]);
      prisma.user.findMany.mockResolvedValue([
        { id: 'u1', name: 'Ana' },
        { id: 'u2', name: 'Beto' },
      ]);
      prisma.follow.groupBy.mockResolvedValue([
        { followingId: 'u1', _count: { _all: 128 } },
      ]);

      const result = await service.getWeeklyRanking();

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(RankingUserEntity);
      expect(result[0]).toMatchObject({
        position: 1,
        userId: 'u1',
        name: 'Ana',
        totalDistance: 62.4,
        activityCount: 5,
        followerCount: 128,
      });
      expect(result[1]).toMatchObject({
        position: 2,
        name: 'Beto',
        followerCount: 0,
      });
    });

    it('usa "Desconocido" y 0 km cuando faltan datos del usuario', async () => {
      prisma.activity.groupBy.mockResolvedValue([
        { userId: 'huérfano', _sum: { distance: null }, _count: { _all: 1 } },
      ]);
      prisma.user.findMany.mockResolvedValue([]); // usuario no encontrado
      prisma.follow.groupBy.mockResolvedValue([]);

      const result = await service.getWeeklyRanking();

      expect(result[0]).toMatchObject({
        position: 1,
        name: 'Desconocido',
        totalDistance: 0,
        followerCount: 0,
      });
    });

    it('filtra por la última semana (createdAt >= hace 7 días)', async () => {
      prisma.activity.groupBy.mockResolvedValue([]);

      await service.getWeeklyRanking();

      const arg = prisma.activity.groupBy.mock.calls[0][0];
      expect(arg.where.createdAt.gte).toBeInstanceOf(Date);
      const diff = Date.now() - (arg.where.createdAt.gte as Date).getTime();
      expect(diff).toBeGreaterThanOrEqual(7 * 24 * 60 * 60 * 1000 - 5000);
      expect(diff).toBeLessThanOrEqual(7 * 24 * 60 * 60 * 1000 + 5000);
    });
  });
});
