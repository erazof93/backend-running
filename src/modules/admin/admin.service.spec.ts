import { Test, type TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AdminService } from './admin.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AdminUserEntity } from './entities/admin-user.entity.js';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };

  const adminRow = (over: Record<string, unknown> = {}) => ({
    id: 'admin-1',
    email: 'admin@velora.com',
    name: 'Ada Admin',
    passwordHash: 'hashed',
    role: 'ADMIN',
    tier: 'FREE',
    createdAt: new Date('2026-09-04'),
    updatedAt: new Date('2026-09-04'),
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(AdminService);
  });

  describe('createAdmin', () => {
    const dto = {
      email: 'admin@velora.com',
      name: 'Ada Admin',
      password: 'superSecret123',
    };

    it('crea un usuario con rol ADMIN y hash de contraseña', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(
        ({ data }: { data: Record<string, unknown> }) =>
          Promise.resolve(adminRow(data)),
      );

      const result = await service.createAdmin(dto);

      expect(result).toBeInstanceOf(AdminUserEntity);
      expect(result.role).toBe('ADMIN');

      const passedData = prisma.user.create.mock.calls[0][0].data as {
        role: string;
        passwordHash: string;
      };
      expect(passedData.role).toBe('ADMIN');
      expect(passedData.passwordHash).not.toBe(dto.password);
      await expect(
        bcrypt.compare(dto.password, passedData.passwordHash),
      ).resolves.toBe(true);
    });

    it('no expone el passwordHash', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(adminRow());

      const result = await service.createAdmin(dto);

      expect(result as unknown as Record<string, unknown>).not.toHaveProperty(
        'passwordHash',
      );
    });

    it('lanza BadRequest si el email ya existe', async () => {
      prisma.user.findUnique.mockResolvedValue(adminRow());

      await expect(service.createAdmin(dto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('revokeAdmin', () => {
    it('degrada un ADMIN a CLIENTE', async () => {
      prisma.user.findUnique.mockResolvedValue(adminRow({ role: 'ADMIN' }));
      prisma.user.update.mockResolvedValue(adminRow({ role: 'CLIENTE' }));

      const result = await service.revokeAdmin('admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'admin-1' },
        data: { role: 'CLIENTE' },
      });
      expect(result.role).toBe('CLIENTE');
    });

    it('lanza NotFound si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.revokeAdmin('nope')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('lanza BadRequest si el usuario no es ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue(adminRow({ role: 'SUPERADMIN' }));

      await expect(service.revokeAdmin('root-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
