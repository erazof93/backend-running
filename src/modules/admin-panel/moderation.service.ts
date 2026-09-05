import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ModerationResolution,
  ReportSeverity,
  ReportStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { ModerationActionDto } from './dto/moderation-action.dto.js';
import type {
  FlaggedCommentDto,
  ModerationHistoryEntryDto,
  ModerationStatsDto,
  ReportedUserDto,
  ReportedUserStatus,
  Severity,
} from './admin-panel.types.js';

const SEVERITY_RANK: Record<ReportSeverity, number> = {
  LOW: 0,
  MEDIUM: 1,
  HIGH: 2,
};

@Injectable()
export class ModerationService {
  constructor(private readonly prisma: PrismaService) {}

  async getFlagged(): Promise<FlaggedCommentDto[]> {
    const reports = await this.prisma.report.findMany({
      where: { status: ReportStatus.pending },
      orderBy: { createdAt: 'desc' },
      include: {
        reporter: { select: { name: true } },
        comment: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    const byComment = new Map<
      string,
      { flagsCount: number; top: (typeof reports)[number] }
    >();
    for (const r of reports) {
      const entry = byComment.get(r.commentId);
      if (!entry) {
        byComment.set(r.commentId, { flagsCount: 1, top: r });
      } else {
        entry.flagsCount += 1;
        if (SEVERITY_RANK[r.severity] > SEVERITY_RANK[entry.top.severity]) {
          entry.top = r;
        }
      }
    }

    return [...byComment.values()].map(({ flagsCount, top }) => ({
      id: top.comment.id,
      author: top.comment.user.name,
      authorId: top.comment.user.id,
      text: top.comment.text,
      createdAt: top.comment.createdAt.toISOString(),
      severity: top.severity as Severity,
      flagsCount,
      reportedBy: top.reporter.name,
      reportReason: top.reason,
      reportedAt: top.createdAt.toISOString(),
    }));
  }

  async getReportedUsers(limit = 10): Promise<ReportedUserDto[]> {
    const reports = await this.prisma.report.findMany({
      include: {
        comment: {
          include: { user: { select: { id: true, name: true, status: true } } },
        },
      },
    });

    const map = new Map<string, ReportedUserDto>();
    for (const r of reports) {
      const u = r.comment.user;
      const existing = map.get(u.id);
      if (existing) {
        existing.reportsCount += 1;
      } else {
        map.set(u.id, {
          id: u.id,
          name: u.name,
          reportsCount: 1,
          status: this.toReportedStatus(u.status),
        });
      }
    }

    return [...map.values()]
      .sort((a, b) => b.reportsCount - a.reportsCount)
      .slice(0, limit);
  }

  async getHistory(limit = 15): Promise<ModerationHistoryEntryDto[]> {
    const logs = await this.prisma.moderationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { admin: { select: { name: true } } },
    });
    return logs.map((l) => ({
      id: l.id,
      at: l.createdAt.toISOString(),
      action: l.action,
      admin: l.admin.name,
      target: l.targetLabel,
      reason: l.reason,
    }));
  }

  async getStats(): Promise<ModerationStatsDto> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [pendingReports, logs, reportedToday, totalReports] = await Promise.all(
      [
        this.prisma.report.groupBy({
          by: ['commentId'],
          where: { status: ReportStatus.pending },
        }),
        this.prisma.moderationLog.groupBy({
          by: ['action'],
          _count: { _all: true },
        }),
        this.prisma.report.count({ where: { createdAt: { gte: startOfDay } } }),
        this.prisma.report.count(),
      ],
    );

    const countFor = (a: ModerationResolution) =>
      logs.find((l) => l.action === a)?._count._all ?? 0;

    const approved = countFor(ModerationResolution.approve);
    const rejected =
      countFor(ModerationResolution.reject) + countFor(ModerationResolution.delete);
    const banned = countFor(ModerationResolution.ban);
    const resolved = approved + rejected + banned;
    const pending = pendingReports.length;

    return {
      reported: totalReports,
      approved,
      rejected,
      banned,
      reportedToday,
      resolved,
      pending,
    };
  }

  async action(
    dto: ModerationActionDto,
    adminId: string,
  ): Promise<{ affected: number }> {
    if (dto.bulk) {
      const flagged = await this.prisma.report.groupBy({
        by: ['commentId'],
        where: { status: ReportStatus.pending },
      });
      let affected = 0;
      for (const row of flagged) {
        await this.applyToComment(
          row.commentId,
          dto.action,
          dto.reason ?? 'Acción en lote',
          adminId,
        );
        affected += 1;
      }
      return { affected };
    }

    if (!dto.commentId) {
      throw new NotFoundException('Falta commentId');
    }
    await this.applyToComment(
      dto.commentId,
      dto.action,
      dto.reason ?? 'Acción de moderación',
      adminId,
    );
    return { affected: 1 };
  }

  private async applyToComment(
    commentId: string,
    action: ModerationActionDto['action'],
    reason: string,
    adminId: string,
  ): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { user: { select: { id: true, name: true } } },
    });
    if (!comment) throw new NotFoundException('Comentario no encontrado');

    const resolution = action as ModerationResolution;

    if (action === 'delete') {
      await this.prisma.comment.delete({ where: { id: commentId } });
    } else {
      await this.prisma.report.updateMany({
        where: { commentId, status: ReportStatus.pending },
        data: {
          status: ReportStatus.resolved,
          resolution,
          resolvedAt: new Date(),
        },
      });
      if (action === 'ban') {
        await this.prisma.user.update({
          where: { id: comment.user.id },
          data: { status: UserStatus.BANNED },
        });
      }
    }

    await this.prisma.moderationLog.create({
      data: {
        action: resolution,
        adminId,
        targetLabel:
          action === 'ban' ? comment.user.name : `Comentario #${commentId.slice(0, 8)}`,
        reason,
      },
    });
  }

  private toReportedStatus(status: UserStatus): ReportedUserStatus {
    if (status === UserStatus.BANNED) return 'BANNED';
    if (status === UserStatus.WARNED || status === UserStatus.SUSPENDED)
      return 'WARNED';
    return 'ACTIVE';
  }
}
