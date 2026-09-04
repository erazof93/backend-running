import { PrismaClient, Role, UserTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

/**
 * Contraseñas de los usuarios de ejemplo.
 * En cualquier entorno real, define las variables de entorno SEED_*_PASSWORD.
 * Los valores por defecto son SÓLO para desarrollo local.
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
  },
];

async function main(): Promise<void> {
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
      },
      update: {
        name: u.name,
        passwordHash,
        role: u.role,
        tier: u.tier,
      },
    });

    // El usuario COACH necesita además su perfil de coach.
    if (u.role === Role.COACH) {
      await prisma.coach.upsert({
        where: { id: user.id },
        create: { id: user.id, bio: 'Coach de ejemplo (seed).' },
        update: {},
      });
    }

    console.log(`✔ ${u.role.padEnd(10)} ${u.email}`);
  }
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
