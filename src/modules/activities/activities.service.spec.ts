import { Test, type TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { ActivitiesService } from './activities.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import { ActivityEntity } from './entities/activity.entity.js';
import { GpsPointEntity } from './entities/gps-point.entity.js';

describe('ActivitiesService', () => {
  let service: ActivitiesService;
  let prisma: {
    activity: {
      create: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
    gpsPoint: {
      count: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  const activityRow = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'act-1',
    userId: 'user-1',
    title: 'Fondo dominical',
    description: 'Ritmo cómodo',
    activityType: ActivityType.run,
    distance: 10.5,
    duration: 3600,
    notes: null,
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-02'),
    ...over,
  });

  const gpsRow = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'gps-1',
    activityId: 'act-1',
    latitude: -33.4489,
    longitude: -70.6693,
    altitude: 570.2,
    timestamp: new Date('2026-02-01T10:00:00Z'),
    order: 0,
    createdAt: new Date('2026-02-01T10:00:01Z'),
    ...over,
  });

  const createDto = {
    title: 'Fondo dominical',
    description: 'Ritmo cómodo',
    activityType: ActivityType.run,
    distance: 10.5,
    duration: 3600,
  };

  const gpsDto = {
    latitude: -33.4489,
    longitude: -70.6693,
    altitude: 570.2,
    timestamp: new Date('2026-02-01T10:00:00Z'),
  };

  beforeEach(async () => {
    prisma = {
      activity: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
        findMany: vi.fn(),
      },
      gpsPoint: {
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn(),
        findMany: vi.fn(),
      },
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        ActivitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = moduleRef.get(ActivitiesService);
  });

  describe('createActivity', () => {
    it('crea la actividad con el userId del JWT y devuelve ActivityEntity', async () => {
      prisma.activity.create.mockResolvedValue(activityRow());

      const result = await service.createActivity('user-1', createDto);

      expect(prisma.activity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'user-1',
          title: 'Fondo dominical',
          activityType: ActivityType.run,
          distance: 10.5,
          duration: 3600,
        }),
      });
      expect(result).toBeInstanceOf(ActivityEntity);
      expect(result.distance).toBe(10.5);
      expect(typeof result.distance).toBe('number');
    });
  });

  describe('getActivity', () => {
    it('devuelve la actividad con los gpsPoints ordenados', async () => {
      prisma.activity.findUnique.mockResolvedValue({
        ...activityRow(),
        gpsPoints: [gpsRow({ id: 'g0', order: 0 }), gpsRow({ id: 'g1', order: 1 })],
      });

      const result = await service.getActivity('act-1');

      expect(prisma.activity.findUnique).toHaveBeenCalledWith({
        where: { id: 'act-1' },
        include: { gpsPoints: { orderBy: { order: 'asc' } } },
      });
      expect(result.gpsPoints).toHaveLength(2);
      expect(result.gpsPoints?.[0]).toBeInstanceOf(GpsPointEntity);
    });

    it('lanza NotFoundException si no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.getActivity('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('updateActivity', () => {
    it('permite al propietario actualizar y devuelve la entidad', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.activity.update.mockResolvedValue(
        activityRow({ title: 'Fondo con series', distance: 12 }),
      );

      const result = await service.updateActivity('act-1', 'user-1', {
        title: 'Fondo con series',
        distance: 12,
      });

      expect(prisma.activity.update).toHaveBeenCalledWith({
        where: { id: 'act-1' },
        data: expect.objectContaining({ title: 'Fondo con series', distance: 12 }),
      });
      expect(result.title).toBe('Fondo con series');
      expect(result.distance).toBe(12);
    });

    it('lanza NotFoundException si la actividad no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.updateActivity('ghost', 'user-1', { title: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.activity.update).not.toHaveBeenCalled();
    });

    it('lanza ForbiddenException si no es el propietario', async () => {
      prisma.activity.findUnique.mockResolvedValue(
        activityRow({ userId: 'otro' }),
      );

      await expect(
        service.updateActivity('act-1', 'user-1', { title: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.activity.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteActivity', () => {
    it('permite al propietario borrar y devuelve { success: true }', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());

      await expect(
        service.deleteActivity('act-1', 'user-1'),
      ).resolves.toEqual({ success: true });
      expect(prisma.activity.delete).toHaveBeenCalledWith({
        where: { id: 'act-1' },
      });
    });

    it('lanza ForbiddenException si no es el propietario', async () => {
      prisma.activity.findUnique.mockResolvedValue(
        activityRow({ userId: 'otro' }),
      );

      await expect(
        service.deleteActivity('act-1', 'user-1'),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.activity.delete).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si la actividad no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteActivity('ghost', 'user-1'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('addGpsPoint', () => {
    it('asigna order según los puntos existentes y crea el punto', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.gpsPoint.count.mockResolvedValue(3);
      prisma.gpsPoint.create.mockResolvedValue(gpsRow({ order: 3 }));

      const result = await service.addGpsPoint('act-1', 'user-1', gpsDto);

      expect(prisma.gpsPoint.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          activityId: 'act-1',
          latitude: -33.4489,
          longitude: -70.6693,
          altitude: 570.2,
          order: 3,
        }),
      });
      expect(result).toBeInstanceOf(GpsPointEntity);
      expect(result.order).toBe(3);
    });

    it('crea el primer punto con order 0', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.gpsPoint.count.mockResolvedValue(0);
      prisma.gpsPoint.create.mockResolvedValue(gpsRow({ order: 0, altitude: null }));

      const result = await service.addGpsPoint('act-1', 'user-1', {
        ...gpsDto,
        altitude: undefined,
      });

      expect(result.order).toBe(0);
      expect(result.altitude).toBeNull();
    });

    it('lanza ForbiddenException si la actividad es de otro usuario', async () => {
      prisma.activity.findUnique.mockResolvedValue(
        activityRow({ userId: 'otro' }),
      );

      await expect(
        service.addGpsPoint('act-1', 'user-1', gpsDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.gpsPoint.create).not.toHaveBeenCalled();
    });

    it('lanza NotFoundException si la actividad no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.addGpsPoint('ghost', 'user-1', gpsDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getGpsPoints', () => {
    it('devuelve los puntos ordenados por timestamp', async () => {
      prisma.activity.findUnique.mockResolvedValue(activityRow());
      prisma.gpsPoint.findMany.mockResolvedValue([
        gpsRow({ id: 'g0', order: 0 }),
        gpsRow({ id: 'g1', order: 1 }),
      ]);

      const result = await service.getGpsPoints('act-1');

      expect(prisma.gpsPoint.findMany).toHaveBeenCalledWith({
        where: { activityId: 'act-1' },
        orderBy: { timestamp: 'asc' },
      });
      expect(result).toHaveLength(2);
      expect(result.every((p) => p instanceof GpsPointEntity)).toBe(true);
    });

    it('lanza NotFoundException si la actividad no existe', async () => {
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(service.getGpsPoints('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('getUserActivities', () => {
    it('devuelve todas las actividades del usuario sin gpsPoints', async () => {
      prisma.activity.findMany.mockResolvedValue([
        activityRow({ id: 'a1' }),
        activityRow({ id: 'a2' }),
      ]);

      const result = await service.getUserActivities('user-1');

      expect(prisma.activity.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
      expect(result.map((a) => a.id)).toEqual(['a1', 'a2']);
      expect(result[0].gpsPoints).toBeUndefined();
    });

    it('devuelve lista vacía si el usuario no tiene actividades', async () => {
      prisma.activity.findMany.mockResolvedValue([]);

      await expect(service.getUserActivities('user-1')).resolves.toEqual([]);
    });
  });
});
