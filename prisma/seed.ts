import {
  ActivityType,
  ModerationResolution,
  Prisma,
  PrismaClient,
  ReportSeverity,
  Role,
  UserStatus,
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

/**
 * Datos para el panel de moderación de `admin-velora`: comentarios con reportes
 * pendientes, usuarios reportados y un historial de acciones.
 */
async function seedModeration(idByEmail: Map<string, string>): Promise<void> {
  const adminId = idByEmail.get('admin@velora.com');
  if (!adminId) return;

  // Idempotencia: los comentarios/reportes cuelgan de actividades que
  // `seedActivities` recrea (cascade). El historial se limpia aquí.
  await prisma.moderationLog.deleteMany({});

  // Un par de cuentas con aviso previo, para la lista de "usuarios reportados".
  const warnedId = idByEmail.get('athlete3@velora.com');
  if (warnedId) {
    await prisma.user.update({
      where: { id: warnedId },
      data: { status: UserStatus.WARNED },
    });
  }

  const commentPlan: {
    activityOwner: string;
    authorEmail: string;
    text: string;
    reports: { byEmail: string; reason: string; severity: ReportSeverity }[];
  }[] = [
    {
      activityOwner: 'athlete@velora.com',
      authorEmail: 'athlete3@velora.com',
      text: 'Este plan es una estafa, el coach no responde y encima cobra de más.',
      reports: [
        { byEmail: 'athlete2@velora.com', reason: 'Difamación / lenguaje ofensivo', severity: ReportSeverity.MEDIUM },
        { byEmail: 'coach@velora.com', reason: 'Acusación falsa', severity: ReportSeverity.MEDIUM },
      ],
    },
    {
      activityOwner: 'athlete2@velora.com',
      authorEmail: 'athlete3@velora.com',
      text: 'jajaja así no vas a correr una maratón en tu vida, deja de intentarlo',
      reports: [
        { byEmail: 'athlete2@velora.com', reason: 'Acoso a otro usuario', severity: ReportSeverity.HIGH },
        { byEmail: 'athlete@velora.com', reason: 'Acoso', severity: ReportSeverity.HIGH },
        { byEmail: 'coach2@velora.com', reason: 'Insultos', severity: ReportSeverity.MEDIUM },
      ],
    },
    {
      activityOwner: 'athlete@velora.com',
      authorEmail: 'athlete2@velora.com',
      text: 'Vendo suplementos baratos, escribidme por privado si quieres el link',
      reports: [
        { byEmail: 'athlete@velora.com', reason: 'Spam / promoción no autorizada', severity: ReportSeverity.LOW },
      ],
    },
  ];

  let comments = 0;
  let reports = 0;
  for (const c of commentPlan) {
    const authorId = idByEmail.get(c.authorEmail);
    const ownerId = idByEmail.get(c.activityOwner);
    if (!authorId || !ownerId) continue;

    const activity = await prisma.activity.findFirst({
      where: { userId: ownerId },
      orderBy: { createdAt: 'asc' },
    });
    if (!activity) continue;

    const comment = await prisma.comment.create({
      data: { activityId: activity.id, userId: authorId, text: c.text },
    });
    comments += 1;

    for (const r of c.reports) {
      const reporterId = idByEmail.get(r.byEmail);
      if (!reporterId) continue;
      await prisma.report.create({
        data: {
          commentId: comment.id,
          reporterId,
          reason: r.reason,
          severity: r.severity,
        },
      });
      reports += 1;
    }
  }

  // Historial de acciones ya tomadas.
  await prisma.moderationLog.createMany({
    data: [
      {
        action: ModerationResolution.approve,
        adminId,
        targetLabel: 'Comentario #a1b2c3d4',
        reason: 'Sin infracción real',
        createdAt: new Date(Date.now() - 45 * 60_000),
      },
      {
        action: ModerationResolution.delete,
        adminId,
        targetLabel: 'Comentario #e5f6a7b8',
        reason: 'Spam con enlaces',
        createdAt: new Date(Date.now() - 3 * 3_600_000),
      },
      {
        action: ModerationResolution.ban,
        adminId,
        targetLabel: 'Kevin Lara',
        reason: 'Acoso reiterado',
        createdAt: new Date(Date.now() - 26 * 3_600_000),
      },
    ],
  });

  console.log(`✔ moderation  ${comments} comentarios, ${reports} reportes, 3 logs`);
}

/** Solicitudes de coach pendientes para el panel de admin. */
async function seedCoachApplications(
  idByEmail: Map<string, string>,
): Promise<void> {
  await prisma.coachApplication.deleteMany({});

  const apps: {
    email: string;
    phone: string;
    experience: string;
    bio: string;
  }[] = [
    {
      email: 'athlete@velora.com',
      phone: '+34 600 111 222',
      experience:
        '6 años corriendo en club, 2 como monitor de iniciación. Nivel I de la federación.',
      bio: 'Iniciación y 10K. Paciente y muy metódico con los planes.',
    },
    {
      email: 'athlete2@velora.com',
      phone: '+34 611 333 444',
      experience:
        'Preparadora física titulada, 4 años dando planes de fuerza para runners.',
      bio: 'Fuerza y prevención de lesiones para corredores de fondo.',
    },
  ];

  let n = 0;
  for (const a of apps) {
    const userId = idByEmail.get(a.email);
    if (!userId) continue;
    await prisma.coachApplication.create({
      data: {
        userId,
        phone: a.phone,
        experience: a.experience,
        bio: a.bio,
      },
    });
    n += 1;
  }
  console.log(`✔ coach apps  ${n} solicitudes pendientes`);
}

async function main(): Promise<void> {
  const idByEmail = await seedUsers();
  await seedRosters(idByEmail);
  await seedActivities(idByEmail);
  await seedPlans(idByEmail);
  await seedSubscriptions(idByEmail);
  await seedModeration(idByEmail);
  await seedCoachApplications(idByEmail);
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
