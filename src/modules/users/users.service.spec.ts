import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { UserProfileEntity } from './entities/user.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    follow: {
      findMany: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
    };
  };

  const userRow = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'user-1',
    email: 'runner@example.com',
    name: 'Ana Corredora',
    passwordHash: 'hash',
    bio: null,
    profilePicture: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      user: { findUnique: vi.fn(), update: vi.fn() },
      follow: {
        findMany: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        upsert: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  describe('getUserById', () => {
    it('devuelve el perfil con contadores y sin passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow());
      prisma.follow.count
        .mockResolvedValueOnce(5) // followers
        .mockResolvedValueOnce(3); // following

      const result = await service.getUserById('user-1');

      expect(result).toBeInstanceOf(UserProfileEntity);
      expect(result.followerCount).toBe(5);
      expect(result.followingCount).toBe(3);
      expect(result as unknown as Record<string, unknown>).not.toHaveProperty(
        'passwordHash',
      );
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserById('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateUser', () => {
    it('actualiza los campos del perfil y devuelve el usuario', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(userRow());
      prisma.user.update.mockResolvedValue(
        userRow({ name: 'Ana R.', bio: 'Corro trail' }),
      );

      const result = await service.updateUser('user-1', {
        name: 'Ana R.',
        bio: 'Corro trail',
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          email: undefined,
          name: 'Ana R.',
          bio: 'Corro trail',
          profilePicture: undefined,
        },
      });
      expect(result.name).toBe('Ana R.');
      expect(result.bio).toBe('Corro trail');
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUser('ghost', { name: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('lanza ConflictException si otro usuario ya tiene ese email', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(userRow()) // usuario objetivo
        .mockResolvedValueOnce(userRow({ id: 'other', email: 'taken@example.com' }));

      await expect(
        service.updateUser('user-1', { email: 'taken@example.com' }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('permite cambiar a un email libre y persiste el cambio', async () => {
      prisma.user.findUnique
        .mockResolvedValueOnce(userRow()) // usuario objetivo
        .mockResolvedValueOnce(null); // email libre
      prisma.user.update.mockResolvedValue(
        userRow({ email: 'nuevo@example.com' }),
      );

      const result = await service.updateUser('user-1', {
        email: 'nuevo@example.com',
      });

      expect(prisma.user.findUnique).toHaveBeenNthCalledWith(2, {
        where: { email: 'nuevo@example.com' },
      });
      expect(prisma.user.update).toHaveBeenCalled();
      expect(result.email).toBe('nuevo@example.com');
    });

    it('no comprueba unicidad si el email no cambia', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(userRow());
      prisma.user.update.mockResolvedValue(userRow());

      await service.updateUser('user-1', { email: 'runner@example.com' });

      // solo la búsqueda inicial del usuario, sin segunda consulta por email
      expect(prisma.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prisma.user.update).toHaveBeenCalled();
    });
  });

  describe('getUserActivities', () => {
    it('devuelve una lista vacía para un usuario existente', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow());

      await expect(service.getUserActivities('user-1')).resolves.toEqual([]);
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getUserActivities('ghost'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getFollowers / getFollowing', () => {
    it('getFollowers mapea las relaciones a perfiles', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow());
      prisma.follow.findMany.mockResolvedValue([
        { follower: userRow({ id: 'f1', email: 'f1@x.com', name: 'Seguidor 1' }) },
        { follower: userRow({ id: 'f2', email: 'f2@x.com', name: 'Seguidor 2' }) },
      ]);

      const result = await service.getFollowers('user-1');

      expect(prisma.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followingId: 'user-1' } }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(UserProfileEntity);
      expect(result.map((u) => u.id)).toEqual(['f1', 'f2']);
    });

    it('getFollowing mapea las relaciones a perfiles', async () => {
      prisma.user.findUnique.mockResolvedValue(userRow());
      prisma.follow.findMany.mockResolvedValue([
        { following: userRow({ id: 'g1', email: 'g1@x.com', name: 'Seguido 1' }) },
      ]);

      const result = await service.getFollowing('user-1');

      expect(prisma.follow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { followerId: 'user-1' } }),
      );
      expect(result.map((u) => u.id)).toEqual(['g1']);
    });

    it('getFollowers lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getFollowers('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('followUser', () => {
    it('crea la relación (upsert) y devuelve el perfil objetivo', async () => {
      prisma.user.findUnique.mockResolvedValue(
        userRow({ id: 'target', email: 't@x.com', name: 'Target' }),
      );

      const result = await service.followUser('user-1', 'target');

      expect(prisma.follow.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            followerId_followingId: {
              followerId: 'user-1',
              followingId: 'target',
            },
          },
          create: { followerId: 'user-1', followingId: 'target' },
        }),
      );
      expect(result.id).toBe('target');
    });

    it('es idempotente: seguir dos veces no lanza error', async () => {
      prisma.user.findUnique.mockResolvedValue(
        userRow({ id: 'target', email: 't@x.com' }),
      );

      await service.followUser('user-1', 'target');
      await expect(
        service.followUser('user-1', 'target'),
      ).resolves.toBeInstanceOf(UserProfileEntity);
    });

    it('lanza BadRequestException al intentar seguirse a sí mismo', async () => {
      await expect(
        service.followUser('user-1', 'user-1'),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.follow.upsert).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si el usuario objetivo no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.followUser('user-1', 'ghost'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('unfollowUser', () => {
    it('elimina la relación y devuelve el perfil objetivo', async () => {
      prisma.user.findUnique.mockResolvedValue(
        userRow({ id: 'target', email: 't@x.com', name: 'Target' }),
      );

      const result = await service.unfollowUser('user-1', 'target');

      expect(prisma.follow.deleteMany).toHaveBeenCalledWith({
        where: { followerId: 'user-1', followingId: 'target' },
      });
      expect(result.id).toBe('target');
    });

    it('lanza NotFoundException si el usuario objetivo no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.unfollowUser('user-1', 'ghost'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
