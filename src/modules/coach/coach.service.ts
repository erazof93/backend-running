import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type {
  Coach,
  CoachAthlete,
  Feedback,
  TrainingPlan,
  User,
} from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { BecomeCoachDto } from './dto/become-coach.dto.js';
import type { CreatePlanDto } from './dto/create-plan.dto.js';
import type { UpdatePlanDto } from './dto/update-plan.dto.js';
import type { CreateFeedbackDto } from './dto/create-feedback.dto.js';
import {
  AthleteProfileEntity,
  CoachAthleteEntity,
  CoachEntity,
} from './entities/coach.entity.js';
import { FeedbackEntity, PlanEntity } from './entities/plan.entity.js';

@Injectable()
export class CoachService {
  constructor(private readonly prisma: PrismaService) {}

  async becomeCoach(userId: string, dto: BecomeCoachDto): Promise<CoachEntity> {
    const coach = await this.prisma.coach.upsert({
      where: { id: userId },
      create: { id: userId, bio: dto.bio },
      update: { bio: dto.bio },
    });
    return this.toCoachEntity(coach);
  }

  async assignAthlete(
    coachId: string,
    athleteId: string,
    notes?: string,
  ): Promise<CoachAthleteEntity> {
    await this.assertCoach(coachId);
    if (coachId === athleteId) {
      throw new BadRequestException('No puedes asignarte a ti mismo como atleta');
    }
    const athlete = await this.prisma.user.findUnique({
      where: { id: athleteId },
    });
    if (!athlete) {
      throw new NotFoundException('Atleta no encontrado');
    }

    const link = await this.prisma.coachAthlete.upsert({
      where: { coachId_athleteId: { coachId, athleteId } },
      create: { coachId, athleteId, notes },
      update: { status: 'active', notes },
      include: { athlete: true },
    });
    return this.toCoachAthleteEntity(link);
  }

  async removeAthlete(
    coachId: string,
    athleteId: string,
  ): Promise<{ success: true }> {
    await this.assertCoach(coachId);
    await this.prisma.coachAthlete.deleteMany({ where: { coachId, athleteId } });
    return { success: true };
  }

  async getMyAthletes(coachId: string): Promise<CoachAthleteEntity[]> {
    await this.assertCoach(coachId);
    const links = await this.prisma.coachAthlete.findMany({
      where: { coachId },
      include: { athlete: true },
      orderBy: { assignedAt: 'desc' },
    });
    return links.map((l) => this.toCoachAthleteEntity(l));
  }

  async getAthleteProfile(
    coachId: string,
    athleteId: string,
  ): Promise<AthleteProfileEntity> {
    await this.assertCoach(coachId);
    const link = await this.prisma.coachAthlete.findUnique({
      where: { coachId_athleteId: { coachId, athleteId } },
    });
    if (!link) {
      throw new ForbiddenException('Este atleta no está asignado a ti');
    }

    const athlete = await this.prisma.user.findUnique({
      where: { id: athleteId },
    });
    if (!athlete) {
      throw new NotFoundException('Atleta no encontrado');
    }

    const [activityCount, followerCount, totals] = await Promise.all([
      this.prisma.activity.count({ where: { userId: athleteId } }),
      this.prisma.follow.count({ where: { followingId: athleteId } }),
      this.prisma.activity.aggregate({
        where: { userId: athleteId },
        _sum: { distance: true, duration: true },
      }),
    ]);

    return new AthleteProfileEntity({
      id: athlete.id,
      name: athlete.name,
      email: athlete.email,
      bio: athlete.bio,
      activityCount,
      followerCount,
      totalDistance: Number(totals._sum.distance ?? 0),
      totalDuration: totals._sum.duration ?? 0,
      status: link.status,
    });
  }

  async createPlan(coachId: string, dto: CreatePlanDto): Promise<PlanEntity> {
    await this.assertCoach(coachId);
    const plan = await this.prisma.trainingPlan.create({
      data: {
        coachId,
        name: dto.name,
        weekStart: dto.weekStart,
        description: dto.description,
        exercises: dto.exercises as Prisma.InputJsonValue,
      },
    });
    return this.toPlanEntity(plan);
  }

  async updatePlan(
    planId: string,
    coachId: string,
    dto: UpdatePlanDto,
  ): Promise<PlanEntity> {
    await this.findOwnedPlanOr403(planId, coachId);
    const updated = await this.prisma.trainingPlan.update({
      where: { id: planId },
      data: {
        name: dto.name,
        weekStart: dto.weekStart,
        description: dto.description,
        exercises: dto.exercises as Prisma.InputJsonValue | undefined,
      },
    });
    return this.toPlanEntity(updated);
  }

  async deletePlan(
    planId: string,
    coachId: string,
  ): Promise<{ success: true }> {
    await this.findOwnedPlanOr403(planId, coachId);
    await this.prisma.trainingPlan.delete({ where: { id: planId } });
    return { success: true };
  }

  async getPlan(planId: string): Promise<PlanEntity> {
    const plan = await this.prisma.trainingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    return this.toPlanEntity(plan);
  }

  async giveFeedback(
    coachId: string,
    athleteId: string,
    dto: CreateFeedbackDto,
  ): Promise<FeedbackEntity> {
    await this.assertCoach(coachId);

    const link = await this.prisma.coachAthlete.findUnique({
      where: { coachId_athleteId: { coachId, athleteId } },
    });
    if (!link) {
      throw new ForbiddenException('Este atleta no está asignado a ti');
    }

    const activity = await this.prisma.activity.findUnique({
      where: { id: dto.activityId },
    });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    if (activity.userId !== athleteId) {
      throw new BadRequestException(
        'La actividad no pertenece a este atleta',
      );
    }

    const feedback = await this.prisma.feedback.create({
      data: {
        activityId: dto.activityId,
        coachId,
        text: dto.text,
        rating: dto.rating,
      },
    });
    return this.toFeedbackEntity(feedback);
  }

  private async assertCoach(coachId: string): Promise<Coach> {
    const coach = await this.prisma.coach.findUnique({ where: { id: coachId } });
    if (!coach) {
      throw new ForbiddenException('No estás registrado como coach');
    }
    return coach;
  }

  private async findOwnedPlanOr403(
    planId: string,
    coachId: string,
  ): Promise<TrainingPlan> {
    const plan = await this.prisma.trainingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) {
      throw new NotFoundException('Plan no encontrado');
    }
    if (plan.coachId !== coachId) {
      throw new ForbiddenException('No eres el propietario de este plan');
    }
    return plan;
  }

  private toCoachEntity(coach: Coach): CoachEntity {
    return new CoachEntity({
      id: coach.id,
      bio: coach.bio,
      createdAt: coach.createdAt,
      updatedAt: coach.updatedAt,
    });
  }

  private toCoachAthleteEntity(
    link: CoachAthlete & { athlete: User },
  ): CoachAthleteEntity {
    return new CoachAthleteEntity({
      id: link.id,
      athleteId: link.athleteId,
      name: link.athlete.name,
      email: link.athlete.email,
      status: link.status,
      notes: link.notes,
      assignedAt: link.assignedAt,
    });
  }

  private toPlanEntity(plan: TrainingPlan): PlanEntity {
    return new PlanEntity({
      id: plan.id,
      coachId: plan.coachId,
      name: plan.name,
      weekStart: plan.weekStart,
      description: plan.description,
      exercises: plan.exercises,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    });
  }

  private toFeedbackEntity(feedback: Feedback): FeedbackEntity {
    return new FeedbackEntity({
      id: feedback.id,
      activityId: feedback.activityId,
      coachId: feedback.coachId,
      text: feedback.text,
      rating: feedback.rating,
      createdAt: feedback.createdAt,
    });
  }
}
