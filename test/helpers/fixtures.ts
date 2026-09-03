import { E2E_EMAIL_DOMAIN } from '../config/e2e.config.js';

let seq = 0;

/** Email único e identificable como dato de prueba. */
export function uniqueEmail(prefix = 'user'): string {
  seq += 1;
  return `e2e-${prefix}-${Date.now()}-${seq}-${Math.random()
    .toString(36)
    .slice(2, 8)}@${E2E_EMAIL_DOMAIN}`;
}

export const DEFAULT_PASSWORD = 'password123';

export function newUserPayload(overrides: Record<string, unknown> = {}) {
  return {
    email: uniqueEmail(),
    password: DEFAULT_PASSWORD,
    name: 'E2E Runner',
    ...overrides,
  };
}

export function newActivityPayload(overrides: Record<string, unknown> = {}) {
  return {
    title: 'E2E Fondo dominical',
    description: 'Actividad creada por la suite E2E',
    activityType: 'run',
    distance: 10.5,
    duration: 3600,
    notes: 'sin novedad',
    ...overrides,
  };
}

export function newGpsPointPayload(overrides: Record<string, unknown> = {}) {
  return {
    latitude: -33.4489,
    longitude: -70.6693,
    altitude: 570.2,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

export function newPlanPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'E2E Semana 1',
    weekStart: new Date().toISOString(),
    description: 'Plan generado por la suite E2E',
    exercises: [
      { day: 'monday', type: 'easy', distanceKm: 8 },
      { day: 'sunday', type: 'long', distanceKm: 18 },
    ],
    ...overrides,
  };
}

export function newCommentPayload(overrides: Record<string, unknown> = {}) {
  return { text: 'Gran ritmo, sigue así 💪', ...overrides };
}
