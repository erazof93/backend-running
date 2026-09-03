/**
 * Configuración compartida para la suite E2E.
 *
 * La suite habla con la API por HTTP (fetch) contra `BASE_URL`, así que sirve
 * igual para local, staging (Railway) o producción sin recompilar.
 *
 *   BASE_URL=http://localhost:3000            pnpm test:e2e
 *   BASE_URL=https://<staging>.up.railway.app pnpm test:e2e:staging
 */

export const BASE_URL = (
  process.env.BASE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const API_PREFIX = process.env.API_PREFIX || '/api/v1';

export const API_URL = `${BASE_URL}${API_PREFIX}`;

/** Timeout por test (los cold-starts de Railway pueden tardar). */
export const TEST_TIMEOUT = 30_000;

/** Umbral de "performance básico" para un GET simple. */
export const PERF_BUDGET_MS = Number(process.env.PERF_BUDGET_MS ?? 2_000);

export const DEFAULT_HEADERS: Record<string, string> = {
  'Content-Type': 'application/json',
  Accept: 'application/json',
};

/** Dominio reservado para los emails de prueba (lo usa el cleanup). */
export const E2E_EMAIL_DOMAIN = 'e2e.test';

export const IS_LOCAL = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|$|\/)/.test(
  BASE_URL,
);

export interface ApiResponse<T = unknown> {
  status: number;
  ok: boolean;
  body: T;
}

/**
 * Wrapper fino sobre fetch: resuelve la URL contra `API_URL`, mete headers por
 * defecto, adjunta el Bearer token si se pasa y parsea el body (JSON o texto).
 */
export async function apiFetch<T = unknown>(
  path: string,
  init: RequestInit & { token?: string } = {},
): Promise<ApiResponse<T>> {
  const { token, headers, ...rest } = init;
  const res = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      ...DEFAULT_HEADERS,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers as Record<string, string> | undefined),
    },
  });

  const raw = await res.text();
  let body: unknown = raw;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      /* deja el texto crudo */
    }
  }

  return { status: res.status, ok: res.ok, body: body as T };
}

export function jsonBody(data: unknown): string {
  return JSON.stringify(data);
}
