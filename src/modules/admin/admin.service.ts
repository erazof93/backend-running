import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { CreateAdminDto } from './dto/create-admin.dto.js';
import { AdminUserEntity } from './entities/admin-user.entity.js';

const SALT_ROUNDS = 10;

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /** SUPERADMIN crea un usuario con rol ADMIN. */
  async createAdmin(dto: CreateAdminDto): Promise<AdminUserEntity> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new BadRequestException('El email ya está registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const admin = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        passwordHash,
        role: Role.ADMIN,
      },
    });

    return this.toEntity(admin);
  }

  /** SUPERADMIN degrada un ADMIN a CLIENTE. No afecta a otros SUPERADMIN. */
  async revokeAdmin(adminId: string): Promise<AdminUserEntity> {
    const user = await this.prisma.user.findUnique({ where: { id: adminId } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (user.role !== Role.ADMIN) {
      throw new BadRequestException('El usuario no tiene rol ADMIN');
    }

    const updated = await this.prisma.user.update({
      where: { id: adminId },
      data: { role: Role.CLIENTE },
    });

    return this.toEntity(updated);
  }

  private toEntity(user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    tier: AdminUserEntity['tier'];
    createdAt: Date;
  }): AdminUserEntity {
    return new AdminUserEntity({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      tier: user.tier,
      createdAt: user.createdAt,
    });
  }
}
