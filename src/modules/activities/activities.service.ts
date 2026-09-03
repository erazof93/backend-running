import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Activity, GpsPoint } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import type { CreateActivityDto } from './dto/create-activity.dto.js';
import type { UpdateActivityDto } from './dto/update-activity.dto.js';
import type { CreateGpsPointDto } from './dto/create-gps-point.dto.js';
import { ActivityEntity } from './entities/activity.entity.js';
import { GpsPointEntity } from './entities/gps-point.entity.js';

type ActivityWithPoints = Activity & { gpsPoints?: GpsPoint[] };

@Injectable()
export class ActivitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createActivity(
    userId: string,
    dto: CreateActivityDto,
  ): Promise<ActivityEntity> {
    const activity = await this.prisma.activity.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        activityType: dto.activityType,
        distance: dto.distance,
        duration: dto.duration,
        notes: dto.notes,
      },
    });
    return this.toActivityEntity(activity);
  }

  async getActivity(id: string): Promise<ActivityEntity> {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: { gpsPoints: { orderBy: { order: 'asc' } } },
    });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return this.toActivityEntity(activity);
  }

  async updateActivity(
    id: string,
    userId: string,
    dto: UpdateActivityDto,
  ): Promise<ActivityEntity> {
    await this.findOwnedActivityOr403(id, userId);

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        activityType: dto.activityType,
        distance: dto.distance,
        duration: dto.duration,
        notes: dto.notes,
      },
    });
    return this.toActivityEntity(updated);
  }

  async deleteActivity(
    id: string,
    userId: string,
  ): Promise<{ success: true }> {
    await this.findOwnedActivityOr403(id, userId);
    await this.prisma.activity.delete({ where: { id } });
    return { success: true };
  }

  async addGpsPoint(
    activityId: string,
    userId: string,
    dto: CreateGpsPointDto,
  ): Promise<GpsPointEntity> {
    await this.findOwnedActivityOr403(activityId, userId);

    const order = await this.prisma.gpsPoint.count({ where: { activityId } });
    const point = await this.prisma.gpsPoint.create({
      data: {
        activityId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        altitude: dto.altitude,
        timestamp: dto.timestamp,
        order,
      },
    });
    return this.toGpsPointEntity(point);
  }

  async getGpsPoints(activityId: string): Promise<GpsPointEntity[]> {
    await this.findActivityOr404(activityId);
    const points = await this.prisma.gpsPoint.findMany({
      where: { activityId },
      orderBy: { timestamp: 'asc' },
    });
    return points.map((p) => this.toGpsPointEntity(p));
  }

  async getUserActivities(userId: string): Promise<ActivityEntity[]> {
    const activities = await this.prisma.activity.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return activities.map((a) => this.toActivityEntity(a));
  }

  private async findActivityOr404(id: string): Promise<Activity> {
    const activity = await this.prisma.activity.findUnique({ where: { id } });
    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }
    return activity;
  }

  private async findOwnedActivityOr403(
    id: string,
    userId: string,
  ): Promise<Activity> {
    const activity = await this.findActivityOr404(id);
    if (activity.userId !== userId) {
      throw new ForbiddenException('No eres el propietario de esta actividad');
    }
    return activity;
  }

  private toActivityEntity(activity: ActivityWithPoints): ActivityEntity {
    return new ActivityEntity({
      id: activity.id,
      userId: activity.userId,
      title: activity.title,
      description: activity.description,
      activityType: activity.activityType,
      distance: Number(activity.distance),
      duration: activity.duration,
      notes: activity.notes,
      createdAt: activity.createdAt,
      updatedAt: activity.updatedAt,
      gpsPoints: activity.gpsPoints?.map((p) => this.toGpsPointEntity(p)),
    });
  }

  private toGpsPointEntity(point: GpsPoint): GpsPointEntity {
    return new GpsPointEntity({
      id: point.id,
      latitude: Number(point.latitude),
      longitude: Number(point.longitude),
      altitude: point.altitude === null ? null : Number(point.altitude),
      timestamp: point.timestamp,
      order: point.order,
    });
  }
}
