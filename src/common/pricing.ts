import { UserTier } from '@prisma/client';

/**
 * Precio mensual (USD) por tier. Coincide con los importes que usa el mock de
 * Stripe/Google Play y con `prisma/seed.ts`. Sirve para calcular MRR/analítica.
 */
export const TIER_PRICES: Record<UserTier, number> = {
  [UserTier.FREE]: 0,
  [UserTier.PREMIUM]: 9.99,
  [UserTier.PRO_COACHING]: 19.99,
};

/** Redondeo a 2 decimales para importes monetarios. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
