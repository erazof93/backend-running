import { apiFetch } from '../config/e2e.config.js';
import { newUserPayload, DEFAULT_PASSWORD } from './fixtures.js';
import { trackForCleanup } from './cleanup.helper.js';

export interface AuthPayload {
  id: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

export interface TestUser extends AuthPayload {
  password: string;
}

/**
 * Registra un usuario nuevo vía `POST /auth/register`, lo deja marcado para
 * cleanup y devuelve sus datos + tokens.
 */
export async function registerUser(
  overrides: Record<string, unknown> = {},
): Promise<TestUser> {
  const payload = newUserPayload(overrides);
  const res = await apiFetch<AuthPayload>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (res.status !== 201) {
    throw new Error(
      `registerUser esperaba 201, recibió ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }

  const user: TestUser = {
    ...res.body,
    password: (payload.password as string) ?? DEFAULT_PASSWORD,
  };
  trackForCleanup({ id: user.id, email: user.email, token: user.accessToken });
  return user;
}

export async function loginUser(
  email: string,
  password: string,
): Promise<AuthPayload> {
  const res = await apiFetch<AuthPayload>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (res.status !== 200) {
    throw new Error(
      `loginUser esperaba 200, recibió ${res.status}: ${JSON.stringify(res.body)}`,
    );
  }
  return res.body;
}

export async function getMe(token: string) {
  return apiFetch('/auth/me', { token });
}

/** Borra la cuenta autenticada (`DELETE /auth/me`). */
export async function deleteAccount(token: string) {
  return apiFetch('/auth/me', { method: 'DELETE', token });
}

export function authHeader(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` };
}
