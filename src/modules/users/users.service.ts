import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, UserStatus, type Prisma, type User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { UserProfileEntity } from './entities/user.entity.js';

type ProfilePatch = {
  name?: string;
  email?: string;
  bio?: string;
  profilePicture?: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserById(id: string): Promise<UserProfileEntity> {
    const user = await this.findUserOr404(id);
    return this.toProfileEntity(user);
  }

  async updateUser(id: string, dto: ProfilePatch): Promise<UserProfileEntity> {
    const user = await this.findUserOr404(id);

    if (dto.email && dto.email !== user.email) {
      const taken = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (taken) {
        throw new ConflictException('El email ya está registrado');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        email: dto.email,
        name: dto.name,
        bio: dto.bio,
        profilePicture: dto.profilePicture,
      },
    });

    return this.toProfileEntity(updated);
  }

  /**
   * Actualización parcial de bajo nivel (p. ej. sincronizar `tier` desde el
   * módulo de suscripciones). No aplica reglas de negocio de perfil.
   */
  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async getUserActivities(id: string): Promise<unknown[]> {
    await this.findUserOr404(id);
    // TODO: enlazar con el módulo Activities cuando exista el modelo Activity.
    return [];
  }

  async getFollowers(id: string): Promise<UserProfileEntity[]> {
    await this.findUserOr404(id);
    const rows = await this.prisma.follow.findMany({
      where: { followingId: id },
      include: { follower: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.toProfileEntity(r.follower)));
  }

  async getFollowing(id: string): Promise<UserProfileEntity[]> {
    await this.findUserOr404(id);
    const rows = await this.prisma.follow.findMany({
      where: { followerId: id },
      include: { following: true },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(rows.map((r) => this.toProfileEntity(r.following)));
  }

  async followUser(userId: string, targetId: string): Promise<UserProfileEntity> {
    if (userId === targetId) {
      throw new BadRequestException('No puedes seguirte a ti mismo');
    }
    const target = await this.findUserOr404(targetId);

    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: userId, followingId: targetId },
      },
      create: { followerId: userId, followingId: targetId },
      update: {},
    });

    return this.toProfileEntity(target);
  }

  async unfollowUser(
    userId: string,
    targetId: string,
  ): Promise<UserProfileEntity> {
    const target = await this.findUserOr404(targetId);

    await this.prisma.follow.deleteMany({
      where: { followerId: userId, followingId: targetId },
    });

    return this.toProfileEntity(target);
  }

  private async findUserOr404(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return user;
  }

  private async toProfileEntity(user: User): Promise<UserProfileEntity> {
    const [followerCount, followingCount, activities] = await Promise.all([
      this.prisma.follow.count({ where: { followingId: user.id } }),
      this.prisma.follow.count({ where: { followerId: user.id } }),
      this.prisma.activity.count({ where: { userId: user.id } }),
    ]);

    const role =
      user.role === Role.CLIENTE
        ? 'athlete'
        : user.role === Role.COACH
          ? 'coach'
          : 'admin';
    const status =
      user.status === UserStatus.SUSPENDED || user.status === UserStatus.BANNED
        ? 'SUSPENDED'
        : 'ACTIVE';

    return new UserProfileEntity({
      id: user.id,
      email: user.email,
      name: user.name,
      bio: user.bio,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      followerCount,
      followingCount,
      role,
      tier: user.tier,
      status,
      followers: followerCount,
      activities,
    });
  }
}
