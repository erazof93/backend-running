import { Test, type TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CoachService } from './coach.service.js';
import { PrismaService } from '../../common/prisma/prisma.service.js';
import {
  AthleteProfileEntity,
  CoachAthleteEntity,
  CoachEntity,
} from './entities/coach.entity.js';
import { FeedbackEntity, PlanEntity } from './entities/plan.entity.js';

describe('CoachService', () => {
  let service: CoachService;
  let prisma: {
    coach: {
      upsert: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    coachAthlete: {
      upsert: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
    $transaction: ReturnType<typeof vi.fn>;
    activity: {
      count: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    follow: { count: ReturnType<typeof vi.fn> };
    trainingPlan: {
      create: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
    };
    feedback: { create: ReturnType<typeof vi.fn> };
  };

  const COACH = 'coach-1';
  const ATHLETE = 'athlete-1';

  const coachRow = () => ({
    id: COACH,
    bio: 'Nivel II',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-02'),
  });

  const athleteUser = () => ({
    id: ATHLETE,
    email: 'ana@example.com',
    name: 'Ana Corredora',
    passwordHash: 'h',
    bio: 'Maratonista',
    profilePicture: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  });

  const linkRow = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'link-1',
    coachId: COACH,
    athleteId: ATHLETE,
    assignedAt: new Date('2026-02-01'),
    status: 'active',
    notes: null,
    athlete: athleteUser(),
    ...over,
  });

  const planRow = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'plan-1',
    coachId: COACH,
    name: 'Semana 1',
    weekStart: new Date('2026-09-07'),
    description: null,
    exercises: [{ day: 'monday', type: 'easy' }],
    createdAt: new Date('2026-02-01'),
    updatedAt: new Date('2026-02-01'),
    ...over,
  });

  beforeEach(async () => {
    prisma = {
      coach: {
        upsert: vi.fn().mockResolvedValue(coachRow()),
        findUnique: vi.fn().mockResolvedValue(coachRow()),
      },
      coachAthlete: {
        upsert: vi.fn(),
        deleteMany: vi.fn().mockResolvedValue({ count: 1 }),
        findMany: vi.fn(),
        findUnique: vi.fn(),
      },
      user: {
        findUnique: vi.fn(),
        update: vi.fn().mockResolvedValue({ id: COACH, role: 'COACH' }),
      },
      activity: {
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({
          _sum: { distance: null, duration: null },
        }),
        findUnique: vi.fn(),
      },
      follow: { count: vi.fn().mockResolvedValue(0) },
      trainingPlan: {
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn().mockResolvedValue({}),
        findUnique: vi.fn(),
      },
      feedback: { create: vi.fn() },
      $transaction: vi.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [CoachService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(CoachService);
  });

  describe('becomeCoach', () => {
    it('crea/actualiza el registro de coach vía upsert', async () => {
      const result = await service.becomeCoach(COACH, { bio: 'Nivel II' });

      expect(prisma.coach.upsert).toHaveBeenCalledWith({
        where: { id: COACH },
        create: { id: COACH, bio: 'Nivel II' },
        update: { bio: 'Nivel II' },
      });
      expect(result).toBeInstanceOf(CoachEntity);
      expect(result.id).toBe(COACH);
    });
  });

  describe('assignAthlete', () => {
    it('vincula un atleta y devuelve datos del usuario', async () => {
      prisma.user.findUnique.mockResolvedValue(athleteUser());
      prisma.coachAthlete.upsert.mockResolvedValue(linkRow());

      const result = await service.assignAthlete(COACH, ATHLETE, 'nota');

      expect(prisma.coachAthlete.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { coachId_athleteId: { coachId: COACH, athleteId: ATHLETE } },
          create: { coachId: COACH, athleteId: ATHLETE, notes: 'nota' },
        }),
      );
      expect(result).toBeInstanceOf(CoachAthleteEntity);
      expect(result.name).toBe('Ana Corredora');
      expect(result.email).toBe('ana@example.com');
    });

    it('lanza ForbiddenException si quien llama no es coach', async () => {
      prisma.coach.findUnique.mockResolvedValue(null);

      await expect(
        service.assignAthlete(COACH, ATHLETE),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza NotFoundException si el atleta no existe', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.assignAthlete(COACH, ATHLETE),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequestException si el coach se asigna a sí mismo', async () => {
      await expect(
        service.assignAthlete(COACH, COACH),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('removeAthlete', () => {
    it('desvincula al atleta y devuelve { success: true }', async () => {
      await expect(service.removeAthlete(COACH, ATHLETE)).resolves.toEqual({
        success: true,
      });
      expect(prisma.coachAthlete.deleteMany).toHaveBeenCalledWith({
        where: { coachId: COACH, athleteId: ATHLETE },
      });
    });

    it('lanza ForbiddenException si no es coach', async () => {
      prisma.coach.findUnique.mockResolvedValue(null);

      await expect(
        service.removeAthlete(COACH, ATHLETE),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('getMyAthletes', () => {
    it('devuelve la lista de atletas del coach', async () => {
      prisma.coachAthlete.findMany.mockResolvedValue([
        linkRow({ id: 'l1' }),
        linkRow({ id: 'l2', athlete: { ...athleteUser(), id: 'a2', name: 'Beto' } }),
      ]);

      const result = await service.getMyAthletes(COACH);

      expect(prisma.coachAthlete.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { coachId: COACH } }),
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(CoachAthleteEntity);
      expect(result[1].name).toBe('Beto');
    });

    it('lanza ForbiddenException si no es coach', async () => {
      prisma.coach.findUnique.mockResolvedValue(null);

      await expect(service.getMyAthletes(COACH)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });
  });

  describe('getAthleteProfile', () => {
    it('agrega stats del atleta (actividades, seguidores, totales)', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(linkRow());
      prisma.user.findUnique.mockResolvedValue(athleteUser());
      prisma.activity.count.mockResolvedValue(42);
      prisma.follow.count.mockResolvedValue(128);
      prisma.activity.aggregate.mockResolvedValue({
        _sum: { distance: 512.4, duration: 183600 },
      });

      const result = await service.getAthleteProfile(COACH, ATHLETE);

      expect(result).toBeInstanceOf(AthleteProfileEntity);
      expect(result.activityCount).toBe(42);
      expect(result.followerCount).toBe(128);
      expect(result.totalDistance).toBe(512.4);
      expect(result.totalDuration).toBe(183600);
      expect(result.status).toBe('active');
    });

    it('usa 0 en los totales cuando el atleta no tiene actividades', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(linkRow());
      prisma.user.findUnique.mockResolvedValue(athleteUser());

      const result = await service.getAthleteProfile(COACH, ATHLETE);

      expect(result.totalDistance).toBe(0);
      expect(result.totalDuration).toBe(0);
    });

    it('lanza ForbiddenException si el atleta no está asignado al coach', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(null);

      await expect(
        service.getAthleteProfile(COACH, ATHLETE),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza NotFoundException si el usuario del atleta ya no existe', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(linkRow());
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.getAthleteProfile(COACH, ATHLETE),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('createPlan', () => {
    it('crea el plan con el coachId y conserva exercises', async () => {
      const exercises = [{ day: 'monday', type: 'easy', distanceKm: 8 }];
      prisma.trainingPlan.create.mockResolvedValue(planRow({ exercises }));

      const result = await service.createPlan(COACH, {
        name: 'Semana 1',
        weekStart: new Date('2026-09-07'),
        exercises,
      });

      expect(prisma.trainingPlan.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ coachId: COACH, name: 'Semana 1', exercises }),
      });
      expect(result).toBeInstanceOf(PlanEntity);
      expect(result.exercises).toEqual(exercises);
    });

    it('lanza ForbiddenException si no es coach', async () => {
      prisma.coach.findUnique.mockResolvedValue(null);

      await expect(
        service.createPlan(COACH, {
          name: 'x',
          weekStart: new Date(),
          exercises: [],
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.trainingPlan.create).not.toHaveBeenCalled();
    });
  });

  describe('updatePlan / deletePlan / getPlan', () => {
    it('updatePlan: el propietario actualiza', async () => {
      prisma.trainingPlan.findUnique.mockResolvedValue(planRow());
      prisma.trainingPlan.update.mockResolvedValue(planRow({ name: 'Semana 1 v2' }));

      const result = await service.updatePlan('plan-1', COACH, {
        name: 'Semana 1 v2',
      });

      expect(result.name).toBe('Semana 1 v2');
    });

    it('updatePlan: 403 si no es el propietario', async () => {
      prisma.trainingPlan.findUnique.mockResolvedValue(
        planRow({ coachId: 'otro-coach' }),
      );

      await expect(
        service.updatePlan('plan-1', COACH, { name: 'x' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.trainingPlan.update).not.toHaveBeenCalled();
    });

    it('updatePlan: 404 si el plan no existe', async () => {
      prisma.trainingPlan.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePlan('ghost', COACH, { name: 'x' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('deletePlan: el propietario borra y devuelve { success: true }', async () => {
      prisma.trainingPlan.findUnique.mockResolvedValue(planRow());

      await expect(service.deletePlan('plan-1', COACH)).resolves.toEqual({
        success: true,
      });
      expect(prisma.trainingPlan.delete).toHaveBeenCalledWith({
        where: { id: 'plan-1' },
      });
    });

    it('deletePlan: 403 si no es el propietario', async () => {
      prisma.trainingPlan.findUnique.mockResolvedValue(
        planRow({ coachId: 'otro-coach' }),
      );

      await expect(
        service.deletePlan('plan-1', COACH),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('getPlan: 404 si el plan no existe', async () => {
      prisma.trainingPlan.findUnique.mockResolvedValue(null);

      await expect(service.getPlan('ghost')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('getPlan: devuelve el plan detallado (es público, sin check de coach)', async () => {
      prisma.trainingPlan.findUnique.mockResolvedValue(planRow());

      const result = await service.getPlan('plan-1');

      expect(result).toBeInstanceOf(PlanEntity);
      expect(result.id).toBe('plan-1');
      expect(prisma.coach.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('giveFeedback', () => {
    const feedbackDto = {
      activityId: 'act-1',
      text: 'Buen ritmo',
      rating: 4,
    };

    it('crea feedback para una actividad del atleta asignado', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(linkRow());
      prisma.activity.findUnique.mockResolvedValue({
        id: 'act-1',
        userId: ATHLETE,
      });
      prisma.feedback.create.mockResolvedValue({
        id: 'fb-1',
        activityId: 'act-1',
        coachId: COACH,
        text: 'Buen ritmo',
        rating: 4,
        createdAt: new Date('2026-02-02'),
      });

      const result = await service.giveFeedback(COACH, ATHLETE, feedbackDto);

      expect(prisma.feedback.create).toHaveBeenCalledWith({
        data: {
          activityId: 'act-1',
          coachId: COACH,
          text: 'Buen ritmo',
          rating: 4,
        },
      });
      expect(result).toBeInstanceOf(FeedbackEntity);
      expect(result.rating).toBe(4);
    });

    it('lanza ForbiddenException si el atleta no está asignado', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(null);

      await expect(
        service.giveFeedback(COACH, ATHLETE, feedbackDto),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('lanza NotFoundException si la actividad no existe', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(linkRow());
      prisma.activity.findUnique.mockResolvedValue(null);

      await expect(
        service.giveFeedback(COACH, ATHLETE, feedbackDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza BadRequestException si la actividad no es del atleta', async () => {
      prisma.coachAthlete.findUnique.mockResolvedValue(linkRow());
      prisma.activity.findUnique.mockResolvedValue({
        id: 'act-1',
        userId: 'otro-usuario',
      });

      await expect(
        service.giveFeedback(COACH, ATHLETE, feedbackDto),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.feedback.create).not.toHaveBeenCalled();
    });
  });
});
