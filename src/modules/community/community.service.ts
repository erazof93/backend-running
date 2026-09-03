import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Activity, Comment, Kudo, User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { CreateCommentDto } from './dto/create-comment.dto.js';
import {
  CommentEntity,
  FeedActivityEntity,
  KudoEntity,
  KudoUserEntity,
  RankingUserEntity,
} from './entities/community.entity.js';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type FeedRow = Activity & {
  user: Pick<User, 'name' | 'profilePicture'>;
  _count: { kudos: number; comments: number };
};

type CommentRow = Comment & {
  user?: Pick<User, 'name' | 'profilePicture'>;
};

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

  async getFeed(userId: string): Promise<FeedActivityEntity[]> {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    if (followingIds.length === 0) {
      return [];
    }

    const activities = await this.prisma.activity.findMany({
      where: { userId: { in: followingIds } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        user: { select: { name: true, profilePicture: true } },
        _count: { select: { kudos: true, comments: true } },
      },
    });

    return activities.map((a) => this.toFeedEntity(a as FeedRow));
  }

  async giveKudo(activityId: string, userId: string): Promise<KudoEntity> {
    await this.findActivityOr404(activityId);
    const kudo = await this.prisma.kudo.upsert({
      where: { userId_activityId: { userId, activityId } },
      create: { userId, activityId },
      update: {},
    });
    return this.toKudoEntity(kudo);
  }

  async removeKudo(
    activityId: string,
    userId: string,
  ): Promise<{ success: true }> {
    await this.prisma.kudo.deleteMany({ where: { userId, activityId } });
    return { success: true };
  }

  async getKudos(activityId: string): Promise<KudoUserEntity[]> {
    await this.findActivityOr404(activityId);
    const kudos = await this.prisma.kudo.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, profilePicture: true } } },
    });
    return kudos.map(
      (k) =>
        new KudoUserEntity({
          userId: k.userId,
          name: k.user.name,
          profilePicture: k.user.profilePicture,
          createdAt: k.createdAt,
        }),
    );
  }

  async createComment(
    activityId: string,
    userId: string,
    dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    await this.findActivityOr404(activityId);
    const comment = await this.prisma.comment.create({
      data: { activityId, userId, text: dto.text },
    });
    return this.toCommentEntity(comment);
  }

  async getComments(activityId: string): Promise<CommentEntity[]> {
    await this.findActivityOr404(activityId);
    const comments = await this.prisma.comment.findMany({
      where: { activityId },
      orderBy: { createdAt: 'asc' },
      include: { user: { select: { name: true, profilePicture: true } } },
    });
    return comments.map((c) => this.toCommentEntity(c as CommentRow));
  }

  async deleteComment(
    commentId: string,
    userId: string,
  ): Promise<{ success: true }> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comentario no encontrado');
    }
    if (comment.userId !== userId) {
      throw new ForbiddenException('Solo puedes borrar tus propios comentarios');
    }
    await this.prisma.comment.delete({ where: { id: commentId } });
    return { success: true };
  }

  async getWeeklyRanking(): Promise<RankingUserEntity[]> {
    const since = new Date(Date.now() - WEEK_MS);

    const grouped = await this.prisma.activity.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: since } },
      _sum: { distance: true },
      _count: { _all: true },
      orderBy: { _sum: { distance: 'desc' } },
      take: 10,
    });
    if (grouped.length === 0) {
      return [];
    }

    const userIds = grouped.map((g) => g.userId);
    const [users, followerGroups] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, name: true },
      }),
      this.prisma.follow.groupBy({
        by: ['followingId'],
        where: { followingId: { in: userIds } },
        _count: { _all: true },
      }),
    ]);

    const nameById = new Map(users.map((u) => [u.id, u.name]));
    const followersById = new Map(
      followerGroups.map((f) => [f.followingId, f._count._all]),
    );

    return grouped.map(
      (g, index) =>
        new RankingUserEntity({
          position: index + 1,
          userId: g.userId,
          name: nameById.get(g.userId) ?? 'Desconocido',
          totalDistance: Number(g._sum.distance ?? 0),
          activityCount: g._count._all,
          followerCount: followersById.get(g.userId) ?? 0,
        }),
    );
  }

  private async findActivityOr404(id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return activity;
  }

  private toFeedEntity(a: FeedRow): FeedActivityEntity {
    return new FeedActivityEntity({
      id: a.id,
      userId: a.userId,
      title: a.title,
      distance: Number(a.distance),
      duration: a.duration,
      activityType: a.activityType,
      createdAt: a.createdAt,
      user: {
        name: a.user.name,
        profilePicture: a.user.profilePicture,
      },
      kudosCount: a._count.kudos,
      commentsCount: a._count.comments,
    });
  }

  private toKudoEntity(kudo: Kudo): KudoEntity {
    return new KudoEntity({
      id: kudo.id,
      userId: kudo.userId,
      activityId: kudo.activityId,
      createdAt: kudo.createdAt,
    });
  }

  private toCommentEntity(comment: CommentRow): CommentEntity {
    return new CommentEntity({
      id: comment.id,
      userId: comment.userId,
      activityId: comment.activityId,
      text: comment.text,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      user: comment.user
        ? {
            name: comment.user.name,
            profilePicture: comment.user.profilePicture,
          }
        : undefined,
    });
  }
}
