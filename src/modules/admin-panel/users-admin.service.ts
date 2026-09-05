import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Prisma, Role, UserStatus, type User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type {
  AdminCreateUserDto,
  AdminUpdateUserDto,
  BulkActionDto,
  ListUsersQueryDto,
} from './dto/admin-user.dto.js';
import type {
  ActivityItemDto,
  ActivityPointDto,
  AdminUserDto,
  AdminUserRole,
  AdminUserStatus,
} from './admin-panel.types.js';

type UserWithCounts = User & {
  _count: { followers: number; activities: number };
};

const SALT_ROUNDS = 10;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListUsersQueryDto): Promise<AdminUserDto[]> {
    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.tier) {
      where.tier = query.tier;
    }
    if (query.status === 'ACTIVE') {
      where.status = { in: [UserStatus.ACTIVE, UserStatus.WARNED] };
    } else if (query.status === 'SUSPENDED') {
      where.status = { in: [UserStatus.SUSPENDED, UserStatus.BANNED] };
    }

    const rows = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { followers: true, activities: true } } },
    });

    return rows.map((u) => this.toAdminUser(u));
  }

  async getById(id: string): Promise<AdminUserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { _count: { select: { followers: true, activities: true } } },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return this.toAdminUser(user);
  }

  async create(dto: AdminCreateUserDto): Promise<AdminUserDto> {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('El email ya está registrado');

    // Contraseña temporal: el usuario la restablece por el flujo normal.
    const tempPassword = `${Math.random().toString(36).slice(2)}A1!`;
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        tier: dto.tier,
        status:
          dto.status === 'SUSPENDED' ? UserStatus.SUSPENDED : UserStatus.ACTIVE,
      },
      include: { _count: { select: { followers: true, activities: true } } },
    });
    return this.toAdminUser(user);
  }

  async update(id: string, dto: AdminUpdateUserDto): Promise<AdminUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (dto.email && dto.email !== user.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (taken) throw new ConflictException('El email ya está registrado');
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        tier: dto.tier,
        status: dto.status,
        role: dto.role,
      },
      include: { _count: { select: { followers: true, activities: true } } },
    });
    return this.toAdminUser(updated);
  }

  async remove(id: string, callerId: string): Promise<{ success: true }> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    await this.assertNotLastAdmin(user, callerId);
    await this.prisma.user.delete({ where: { id } });
    return { success: true };
  }

  async bulk(dto: BulkActionDto, callerId: string): Promise<{ affected: number }> {
    const ids = dto.ids.filter((id) => id !== callerId);
    if (ids.length === 0) return { affected: 0 };

    if (dto.action === 'ban') {
      const res = await this.prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { status: UserStatus.BANNED },
      });
      return { affected: res.count };
    }
    if (dto.action === 'promote') {
      const res = await this.prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { tier: 'PREMIUM' },
      });
      return { affected: res.count };
    }
    // delete: nunca borra ADMIN/SUPERADMIN en lote.
    const res = await this.prisma.user.deleteMany({
      where: { id: { in: ids }, role: { in: [Role.CLIENTE, Role.COACH] } },
    });
    return { affected: res.count };
  }

  /** Altas por día (últimos 30). */
  async signupsSeries(): Promise<ActivityPointDto[]> {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const users = await this.prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const buckets = new Map<string, number>();
    for (let i = 0; i < 30; i += 1) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.set(d.toISOString().slice(0, 10), 0);
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
    }
    return [...buckets.entries()].map(([date, signups]) => ({ date, signups }));
  }

  /** Actividades recientes (para el feed del dashboard). */
  async recentActivity(limit = 12): Promise<ActivityItemDto[]> {
    const rows = await this.prisma.activity.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { user: { select: { name: true } } },
    });
    return rows.map((a) => ({
      id: a.id,
      athlete: a.user.name,
      type: a.activityType,
      at: a.createdAt.toISOString(),
    }));
  }

  private async assertNotLastAdmin(user: User, callerId: string): Promise<void> {
    if (user.id === callerId) {
      throw new ConflictException('No puedes eliminar tu propia cuenta');
    }
    if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      const admins = await this.prisma.user.count({
        where: { role: { in: [Role.ADMIN, Role.SUPERADMIN] } },
      });
      if (admins <= 1) {
        throw new ConflictException('No se puede eliminar el último admin');
      }
    }
  }

  private toAdminUser(u: UserWithCounts): AdminUserDto {
    const role: AdminUserRole =
      u.role === Role.CLIENTE
        ? 'athlete'
        : u.role === Role.COACH
          ? 'coach'
          : 'admin';
    const status: AdminUserStatus =
      u.status === UserStatus.SUSPENDED || u.status === UserStatus.BANNED
        ? 'SUSPENDED'
        : 'ACTIVE';

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role,
      tier: u.tier,
      status,
      createdAt: u.createdAt.toISOString(),
      followers: u._count.followers,
      activities: u._count.activities,
    };
  }
}
