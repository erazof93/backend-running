import { apiFetch } from '../config/e2e.config.js';

export interface CleanupTarget {
  id: string;
  email: string;
  token: string;
}

const tracked = new Map<string, CleanupTarget>();

/** Registra un usuario de prueba para borrarlo al final del archivo de tests. */
export function trackForCleanup(target: CleanupTarget): void {
  tracked.set(target.id, target);
}

export function untrack(id: string): void {
  tracked.delete(id);
}

/**
 * Borra por API (`DELETE /auth/me`) todos los usuarios registrados. El borrado
 * es en cascada, así que se lleva actividades, follows, kudos, comentarios,
 * coach, planes y feedback. Funciona igual contra local y contra staging.
 * Devuelve cuántos se borraron y cuántos fallaron.
 */
export async function cleanupTrackedUsers(): Promise<{
  deleted: number;
  failed: number;
}> {
  let deleted = 0;
  let failed = 0;

  for (const target of tracked.values()) {
    try {
      const res = await apiFetch('/auth/me', {
        method: 'DELETE',
        token: target.token,
      });
      if (res.status === 200 || res.status === 401 || res.status === 404) {
        deleted += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }

  tracked.clear();
  return { deleted, failed };
}

export function trackedCount(): number {
  return tracked.size;
}
