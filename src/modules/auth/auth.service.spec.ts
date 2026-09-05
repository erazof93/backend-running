import { Test, type TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { AuthEntity, UserEntity } from './entities/auth.entity.js';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let jwt: {
    signAsync: ReturnType<typeof vi.fn>;
    verifyAsync: ReturnType<typeof vi.fn>;
  };

  const knownPassword = 'superSecret123';
  let knownHash: string;

  const dbUser = () => ({
    id: 'user-1',
    email: 'runner@example.com',
    name: 'Ana Corredora',
    passwordHash: knownHash,
    role: 'CLIENTE',
    tier: 'FREE',
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  beforeAll(async () => {
    knownHash = await bcrypt.hash(knownPassword, 10);
  });

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
      },
    };
    jwt = {
      signAsync: vi
        .fn()
        .mockImplementation((_payload: unknown, opts?: { secret?: string }) =>
          Promise.resolve(opts?.secret ? 'refresh-token-value' : 'access-token-value'),
        ),
      verifyAsync: vi.fn(),
    };

    const configValues: Record<string, string> = {
      JWT_SECRET: 'test_access_secret',
      JWT_REFRESH_SECRET: 'test_refresh_secret',
      JWT_EXPIRES_IN: '24h',
      JWT_REFRESH_EXPIRES_IN: '7d',
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        {
          provide: ConfigService,
          useValue: { get: vi.fn((key: string) => configValues[key]) },
        },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('registra un usuario nuevo y devuelve tokens', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }: { data: Record<string, string> }) =>
        Promise.resolve({ ...dbUser(), ...data }),
      );

      const result = await service.register({
        email: 'runner@example.com',
        password: knownPassword,
        name: 'Ana Corredora',
      });

      expect(result).toBeInstanceOf(AuthEntity);
      expect(result.email).toBe('runner@example.com');
      expect(result.name).toBe('Ana Corredora');
      expect(result.accessToken).toBe('access-token-value');
      expect(result.refreshToken).toBe('refresh-token-value');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
    });

    it('hashea la contraseña antes de persistirla', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(dbUser());

      await service.register({
        email: 'runner@example.com',
        password: knownPassword,
        name: 'Ana Corredora',
      });

      const passedData = prisma.user.create.mock.calls[0][0].data as {
        passwordHash: string;
      };
      expect(passedData.passwordHash).not.toBe(knownPassword);
      await expect(
        bcrypt.compare(knownPassword, passedData.passwordHash),
      ).resolves.toBe(true);
    });

    it('lanza ConflictException si el email ya existe', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser());

      await expect(
        service.register({
          email: 'runner@example.com',
          password: knownPassword,
          name: 'Ana Corredora',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('no expone el passwordHash en la respuesta', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(dbUser());

      const result = await service.register({
        email: 'runner@example.com',
        password: knownPassword,
        name: 'Ana Corredora',
      });

      expect(result as unknown as Record<string, unknown>).not.toHaveProperty(
        'passwordHash',
      );
    });
  });

  describe('login', () => {
    it('devuelve tokens con credenciales válidas', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser());

      const result = await service.login({
        email: 'runner@example.com',
        password: knownPassword,
      });

      expect(result).toBeInstanceOf(AuthEntity);
      expect(result.id).toBe('user-1');
      expect(result.tier).toBe('FREE');
      expect(result.accessToken).toBe('access-token-value');
      expect(result.refreshToken).toBe('refresh-token-value');
    });

    it('lanza UnauthorizedException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nope@example.com', password: knownPassword }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza UnauthorizedException si la contraseña es incorrecta', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser());

      await expect(
        service.login({ email: 'runner@example.com', password: 'wrongPassword1' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('usa el mismo mensaje para usuario inexistente y password inválida', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      const noUser = await service
        .login({ email: 'nope@example.com', password: knownPassword })
        .catch((e: Error) => e.message);

      prisma.user.findUnique.mockResolvedValueOnce(dbUser());
      const badPass = await service
        .login({ email: 'runner@example.com', password: 'wrongPassword1' })
        .catch((e: Error) => e.message);

      expect(noUser).toBe(badPass);
    });
  });

  describe('getMe', () => {
    it('devuelve el usuario actual como UserEntity', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser());

      const result = await service.getMe('user-1');

      expect(result).toBeInstanceOf(UserEntity);
      expect(result).toEqual({
        id: 'user-1',
        email: 'runner@example.com',
        name: 'Ana Corredora',
        role: 'CLIENTE',
        tier: 'FREE',
      });
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getMe('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('logout', () => {
    it('devuelve { success: true }', () => {
      expect(service.logout()).toEqual({ success: true });
    });
  });

  describe('deleteAccount', () => {
    it('borra el usuario y devuelve { success: true }', async () => {
      prisma.user.findUnique.mockResolvedValue(dbUser());

      await expect(service.deleteAccount('user-1')).resolves.toEqual({
        success: true,
      });
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
    });

    it('lanza NotFoundException si el usuario no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.deleteAccount('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });

  describe('configuración por defecto', () => {
    it('usa secretos/expiración por defecto cuando faltan las variables de entorno', async () => {
      const moduleRef: TestingModule = await Test.createTestingModule({
        providers: [
          AuthService,
          { provide: PrismaService, useValue: prisma },
          { provide: JwtService, useValue: jwt },
          { provide: ConfigService, useValue: { get: vi.fn(() => undefined) } },
        ],
      }).compile();
      const svc = moduleRef.get(AuthService);

      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue(dbUser());

      const result = await svc.register({
        email: 'runner@example.com',
        password: knownPassword,
        name: 'Ana Corredora',
      });

      expect(result.accessToken).toBe('access-token-value');
      expect(result.refreshToken).toBe('refresh-token-value');
      const refreshOpts = jwt.signAsync.mock.calls.find((c) => c[1])?.[1] as {
        secret: string;
        expiresIn: string;
      };
      expect(refreshOpts.secret).toBe(
        'dev_refresh_secret_key_change_in_production_now',
      );
      expect(refreshOpts.expiresIn).toBe('7d');
    });
  });

  describe('refreshToken', () => {
    it('emite tokens nuevos con un refresh token válido', async () => {
      jwt.verifyAsync.mockResolvedValue({
        sub: 'user-1',
        email: 'runner@example.com',
      });
      prisma.user.findUnique.mockResolvedValue(dbUser());

      const result = await service.refreshToken('valid.refresh.token');

      expect(result).toBeInstanceOf(AuthEntity);
      expect(result.accessToken).toBe('access-token-value');
      expect(jwt.verifyAsync).toHaveBeenCalledWith('valid.refresh.token', {
        secret: 'test_refresh_secret',
      });
    });

    it('lanza UnauthorizedException si el token no verifica', async () => {
      jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await expect(
        service.refreshToken('bad.token'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('lanza UnauthorizedException si el usuario del token ya no existe', async () => {
      jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', email: 'x@y.z' });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.refreshToken('valid.but.orphan'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
