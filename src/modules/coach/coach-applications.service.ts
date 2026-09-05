import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CoachApplicationStatus,
  Role,
  type CoachApplication,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type {
  ReviewCoachApplicationDto,
  SubmitCoachApplicationDto,
} from './dto/coach-application.dto.js';

export interface MyCoachApplication {
  id: string;
  status: CoachApplicationStatus;
  reviewNote: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface CoachApplicationView extends MyCoachApplication {
  userId: string;
  name: string;
  email: string;
  phone: string;
  experience: string;
  bio: string | null;
}

@Injectable()
export class CoachApplicationsService {
  constructor(private readonly prisma: PrismaService) {}

  async submit(
    userId: string,
    dto: SubmitCoachApplicationDto,
  ): Promise<MyCoachApplication> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    if (user.role === Role.COACH || user.role === Role.ADMIN || user.role === Role.SUPERADMIN) {
      throw new ConflictException('Tu cuenta no puede solicitar ser coach');
    }

    const existing = await this.prisma.coachApplication.findUnique({
      where: { userId },
    });
    if (existing?.status === CoachApplicationStatus.pending) {
      throw new ConflictException('Ya tienes una solicitud pendiente');
    }
    if (existing?.status === CoachApplicationStatus.approved) {
      throw new ConflictException('Tu solicitud ya fue aprobada');
    }

    const row = await this.prisma.coachApplication.upsert({
      where: { userId },
      create: {
        userId,
        phone: dto.phone,
        experience: dto.experience,
        bio: dto.bio,
      },
      update: {
        phone: dto.phone,
        experience: dto.experience,
        bio: dto.bio,
        status: CoachApplicationStatus.pending,
        reviewNote: null,
        reviewedById: null,
        reviewedAt: null,
      },
    });
    return this.toMine(row);
  }

  async mine(userId: string): Promise<MyCoachApplication | null> {
    const row = await this.prisma.coachApplication.findUnique({
      where: { userId },
    });
    return row ? this.toMine(row) : null;
  }

  async list(status?: CoachApplicationStatus): Promise<CoachApplicationView[]> {
    const rows = await this.prisma.coachApplication.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });
    return rows.map((r) => ({
      ...this.toMine(r),
      userId: r.userId,
      name: r.user.name,
      email: r.user.email,
      phone: r.phone,
      experience: r.experience,
      bio: r.bio,
    }));
  }

  async approve(
    id: string,
    adminId: string,
    dto: ReviewCoachApplicationDto,
  ): Promise<CoachApplicationView> {
    const app = await this.getPendingOr409(id);

    await this.prisma.$transaction([
      this.prisma.coach.upsert({
        where: { id: app.userId },
        create: { id: app.userId, bio: app.bio },
        update: app.bio ? { bio: app.bio } : {},
      }),
      this.prisma.user.update({
        where: { id: app.userId },
        data: { role: Role.COACH, tier: dto.tier ?? undefined },
      }),
      this.prisma.coachApplication.update({
        where: { id },
        data: {
          status: CoachApplicationStatus.approved,
          reviewNote: dto.note,
          reviewedById: adminId,
          reviewedAt: new Date(),
        },
      }),
    ]);

    return this.viewById(id);
  }

  async reject(
    id: string,
    adminId: string,
    dto: ReviewCoachApplicationDto,
  ): Promise<CoachApplicationView> {
    await this.getPendingOr409(id);
    await this.prisma.coachApplication.update({
      where: { id },
      data: {
        status: CoachApplicationStatus.rejected,
        reviewNote: dto.note,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
    });
    return this.viewById(id);
  }

  private async getPendingOr409(id: string): Promise<CoachApplication> {
    const app = await this.prisma.coachApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Solicitud no encontrada');
    if (app.status !== CoachApplicationStatus.pending) {
      throw new ConflictException('La solicitud ya fue revisada');
    }
    return app;
  }

  private async viewById(id: string): Promise<CoachApplicationView> {
    const row = await this.prisma.coachApplication.findUniqueOrThrow({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });
    return {
      ...this.toMine(row),
      userId: row.userId,
      name: row.user.name,
      email: row.user.email,
      phone: row.phone,
      experience: row.experience,
      bio: row.bio,
    };
  }

  private toMine(row: CoachApplication): MyCoachApplication {
    return {
      id: row.id,
      status: row.status,
      reviewNote: row.reviewNote,
      createdAt: row.createdAt.toISOString(),
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    };
  }
}
