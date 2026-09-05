import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import { Role, UserTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { AuthEntity, UserEntity } from './entities/auth.entity.js';
import type { JwtPayload } from './strategies/jwt.strategy.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthEntity> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.prisma.user.create({
      data: { email: dto.email, name: dto.name, passwordHash, role: Role.CLIENTE },
    });

    return this.buildAuthResponse(user.id, user.email, user.name, user.role, user.tier);
  }

  async login(dto: LoginDto): Promise<AuthEntity> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordOk = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordOk) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.buildAuthResponse(user.id, user.email, user.name, user.role, user.tier);
  }

  async getMe(userId: string): Promise<UserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return new UserEntity({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
    });
  }

  logout(): { success: true } {
    // Los JWT son stateless: el cliente descarta los tokens.
    // Se deja el endpoint para un futuro blacklist / revocación.
    return { success: true };
  }

  async deleteAccount(userId: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    // Todas las relaciones (actividades, follows, kudos, comentarios, coach…)
    // tienen onDelete: Cascade, así que se borran con el usuario.
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  async refreshToken(token: string): Promise<AuthEntity> {
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.refreshSecret(),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    return this.buildAuthResponse(user.id, user.email, user.name, user.role, user.tier);
  }

  private async buildAuthResponse(
    id: string,
    email: string,
    name: string,
    role: Role,
    tier: UserTier,
  ): Promise<AuthEntity> {
    const payload: JwtPayload = { sub: id, email };

    const refreshOptions = {
      secret: this.refreshSecret(),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d',
    } as JwtSignOptions;

    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(payload, refreshOptions);

    return new AuthEntity({ id, email, name, role, tier, accessToken, refreshToken });
  }

  private refreshSecret(): string {
    return (
      this.config.get<string>('JWT_REFRESH_SECRET') ??
      'dev_refresh_secret_key_change_in_production_now'
    );
  }
}
