import {
  ActivityType,
  Prisma,
  PrismaClient,
  Role,
  UserTier,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

/**
 * Contraseñas de los usuarios de ejemplo.
 * En cualquier entorno real, define las variables de entorno SEED_*_PASSWORD.
 * Los valores por defecto son SÓLO para desarrollo local.
 * Los coaches/atletas de demo comparten la contraseña de su rol.
 */
const passwords = {
  superadmin: process.env.SEED_SUPERADMIN_PASSWORD ?? 'superadmin123',
  admin: process.env.SEED_ADMIN_PASSWORD ?? 'admin12345',
  athlete: process.env.SEED_ATHLETE_PASSWORD ?? 'athlete123',
  coach: process.env.SEED_COACH_PASSWORD ?? 'coach12345',
};

type SeedUser = {
  key: keyof typeof passwords;
  email: string;
  name: string;
  role: Role;
  tier: UserTier;
  bio?: string;
};

const users: SeedUser[] = [
  {
    key: 'superadmin',
    email: 'superadmin@velora.com',
    name: 'Super Admin',
    role: Role.SUPERADMIN,
    tier: UserTier.FREE,
  },
  {
    key: 'admin',
    email: 'admin@velora.com',
    name: 'Ada Admin',
    role: Role.ADMIN,
    tier: UserTier.FREE,
  },
  {
    key: 'athlete',
    email: 'athlete@velora.com',
    name: 'Álex Atleta',
    role: Role.CLIENTE,
    tier: UserTier.FREE,
  },
  {
    key: 'coach',
    email: 'coach@velora.com',
    name: 'Carla Coach',
    role: Role.COACH,
    tier: UserTier.PRO_COACHING,
    bio: 'Entrenadora de fondo. 10 años preparando corredores de 10K a maratón.',
  },
  // --- Datos de demo para poblar marketplace / atletas / earnings ---
  {
    key: 'coach',
    email: 'coach2@velora.com',
    name: 'María Maratón',
    role: Role.COACH,
    tier: UserTier.PRO_COACHING,
    bio: 'Especialista en maratón y ultra. Enfoque en nutrición y ritmo.',
  },
  {
    key: 'coach',
    email: 'coach3@velora.com',
    name: 'Carlos Track',
    role: Role.COACH,
    tier: UserTier.PREMIUM,
    bio: 'Velocidad y pista. Series, técnica de carrera y fuerza.',
  },
  {
    key: 'athlete',
    email: 'athlete2@velora.com',
    name: 'Bea Runner',
    role: Role.CLIENTE,
    tier: UserTier.PREMIUM,
    bio: 'Preparando mi primer medio maratón.',
  },
  {
    key: 'athlete',
    email: 'athlete3@velora.com',
    name: 'Chris Trail',
    role: Role.CLIENTE,
    tier: UserTier.PRO_COACHING,
    bio: 'Trail runner buscando bajar de 4h en maratón de montaña.',
  },
];

/** coachEmail -> atletas asignados (por email). */
const rosters: Record<string, string[]> = {
  'coach@velora.com': ['athlete@velora.com', 'athlete2@velora.com'],
  'coach2@velora.com': ['athlete3@velora.com'],
};

/** Actividades de ejemplo por atleta (email). `duration` en segundos. */
const activitiesByAthlete: Record<
  string,
  { title: string; activityType: ActivityType; distance: number; duration: number; description?: string }[]
> = {
  'athlete@velora.com': [
    { title: 'Rodaje suave', activityType: ActivityType.run, distance: 8.2, duration: 2760 },
    { title: 'Series 6x800', activityType: ActivityType.run, distance: 10.5, duration: 3300, description: 'Pista, recuperación 200m trote' },
  ],
  'athlete2@velora.com': [
    { title: 'Tirada larga', activityType: ActivityType.run, distance: 18.0, duration: 6600 },
    { title: 'Bici de recuperación', activityType: ActivityType.bike, distance: 32.0, duration: 4200 },
  ],
  'athlete3@velora.com': [
    { title: 'Subida a cerro', activityType: ActivityType.run, distance: 14.3, duration: 5400, description: '+900m desnivel' },
    { title: 'Natación técnica', activityType: ActivityType.swim, distance: 2.0, duration: 2700 },
  ],
};

/** Planes de entrenamiento por coach (email). */
const plansByCoach: Record<
  string,
  { name: string; weekStart: Date; description?: string; exercises: Prisma.InputJsonValue }[]
> = {
  'coach@velora.com': [
    {
      name: 'Semana 1 - Base aeróbica',
      weekStart: new Date('2026-09-07T00:00:00.000Z'),
      description: 'Volumen bajo, foco en técnica y cadencia.',
      exercises: [
        { day: 'monday', type: 'easy', distanceKm: 8 },
        { day: 'wednesday', type: 'intervals', sets: '6x800m' },
        { day: 'friday', type: 'easy', distanceKm: 6 },
        { day: 'sunday', type: 'long', distanceKm: 16 },
      ],
    },
    {
      name: 'Semana 2 - Umbral',
      weekStart: new Date('2026-09-14T00:00:00.000Z'),
      description: 'Introducción de trabajo a ritmo de umbral.',
      exercises: [
        { day: 'tuesday', type: 'tempo', distanceKm: 10, notes: '5km a umbral' },
        { day: 'thursday', type: 'easy', distanceKm: 7 },
        { day: 'sunday', type: 'long', distanceKm: 18 },
      ],
    },
  ],
  'coach2@velora.com': [
    {
      name: 'Bloque maratón - Semana pico',
      weekStart: new Date('2026-09-07T00:00:00.000Z'),
      description: 'Semana de mayor carga del bloque.',
      exercises: [
        { day: 'monday', type: 'easy', distanceKm: 12 },
        { day: 'wednesday', type: 'marathon-pace', distanceKm: 16 },
        { day: 'saturday', type: 'long', distanceKm: 32 },
      ],
    },
  ],
};

/**
 * Suscripciones de pago de demo (atleta -> plan) para que `/coach/earnings`
 * devuelva datos reales. Cada una genera 2 transacciones SUCCESS.
 */
const paidSubscriptions: {
  athleteEmail: string;
  tier: UserTier;
  amount: number;
}[] = [
  { athleteEmail: 'athlete2@velora.com', tier: UserTier.PREMIUM, amount: 9.99 },
  { athleteEmail: 'athlete3@velora.com', tier: UserTier.PRO_COACHING, amount: 19.99 },
];

async function seedUsers(): Promise<Map<string, string>> {
  const idByEmail = new Map<string, string>();

  for (const u of users) {
    const passwordHash = await bcrypt.hash(passwords[u.key], SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email: u.email },
      create: {
        email: u.email,
        name: u.name,
        passwordHash,
        role: u.role,
        tier: u.tier,
        bio: u.bio,
      },
      update: {
        name: u.name,
        passwordHash,
        role: u.role,
        tier: u.tier,
        bio: u.bio,
      },
    });
    idByEmail.set(u.email, user.id);

    // El usuario COACH necesita además su perfil de coach.
    if (u.role === Role.COACH) {
      await prisma.coach.upsert({
        where: { id: user.id },
        create: { id: user.id, bio: u.bio ?? 'Coach de ejemplo (seed).' },
        update: { bio: u.bio ?? 'Coach de ejemplo (seed).' },
      });
    }

    console.log(`✔ ${u.role.padEnd(10)} ${u.email}`);
  }

  return idByEmail;
}

async function seedRosters(idByEmail: Map<string, string>): Promise<void> {
  for (const [coachEmail, athleteEmails] of Object.entries(rosters)) {
    const coachId = idByEmail.get(coachEmail);
    if (!coachId) continue;

    for (const athleteEmail of athleteEmails) {
      const athleteId = idByEmail.get(athleteEmail);
      if (!athleteId) continue;

      await prisma.coachAthlete.upsert({
        where: { coachId_athleteId: { coachId, athleteId } },
        create: { coachId, athleteId, notes: 'Asignado en el seed.' },
        update: {},
      });
      console.log(`✔ roster     ${coachEmail} ← ${athleteEmail}`);
    }
  }
}

async function seedActivities(idByEmail: Map<string, string>): Promise<void> {
  for (const [athleteEmail, list] of Object.entries(activitiesByAthlete)) {
    const userId = idByEmail.get(athleteEmail);
    if (!userId) continue;

    // Idempotencia: no hay clave natural, así que reseteamos las de este atleta.
    await prisma.activity.deleteMany({ where: { userId } });
    await prisma.activity.createMany({
      data: list.map((a) => ({
        userId,
        title: a.title,
        description: a.description,
        activityType: a.activityType,
        distance: new Prisma.Decimal(a.distance),
        duration: a.duration,
      })),
    });
    console.log(`✔ activities  ${athleteEmail} (${list.length})`);
  }
}

async function seedPlans(idByEmail: Map<string, string>): Promise<void> {
  for (const [coachEmail, list] of Object.entries(plansByCoach)) {
    const coachId = idByEmail.get(coachEmail);
    if (!coachId) continue;

    await prisma.trainingPlan.deleteMany({ where: { coachId } });
    for (const p of list) {
      await prisma.trainingPlan.create({
        data: {
          coachId,
          name: p.name,
          weekStart: p.weekStart,
          description: p.description,
          exercises: p.exercises,
        },
      });
    }
    console.log(`✔ plans      ${coachEmail} (${list.length})`);
  }
}

async function seedSubscriptions(idByEmail: Map<string, string>): Promise<void> {
  for (const s of paidSubscriptions) {
    const userId = idByEmail.get(s.athleteEmail);
    if (!userId) continue;

    const subscription = await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        tier: s.tier,
        status: 'ACTIVE',
        platform: 'stripe',
        stripeCustomerId: `cus_seed_${userId.slice(0, 8)}`,
        stripeSubscriptionId: `sub_seed_${userId.slice(0, 8)}`,
      },
      update: { tier: s.tier, status: 'ACTIVE', platform: 'stripe' },
    });

    // Dos meses de cobros exitosos.
    await prisma.transaction.deleteMany({
      where: { subscriptionId: subscription.id },
    });
    const now = new Date();
    for (let monthsAgo = 2; monthsAgo >= 1; monthsAgo -= 1) {
      const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1);
      await prisma.transaction.create({
        data: {
          subscriptionId: subscription.id,
          amount: s.amount,
          currency: 'USD',
          status: 'SUCCESS',
          description: `Stripe subscription - ${s.tier}`,
          billingPeriodStart: start,
          billingPeriodEnd: end,
          createdAt: start,
        },
      });
    }
    console.log(`✔ billing    ${s.athleteEmail} (${s.tier}, 2x $${s.amount})`);
  }
}

async function main(): Promise<void> {
  const idByEmail = await seedUsers();
  await seedRosters(idByEmail);
  await seedActivities(idByEmail);
  await seedPlans(idByEmail);
  await seedSubscriptions(idByEmail);
}

main()
  .then(async () => {
    console.log('\n✅ Seed completado.');
    await prisma.$disconnect();
  })
  .catch(async (error: unknown) => {
    console.error('❌ Seed falló:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
