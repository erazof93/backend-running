import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apiFetch, TEST_TIMEOUT } from '../config/e2e.config.js';
import { registerUser, type TestUser } from '../helpers/auth.helper.js';
import { cleanupTrackedUsers } from '../helpers/cleanup.helper.js';
import { DEFAULT_PASSWORD, newUserPayload, uniqueEmail } from '../helpers/fixtures.js';

describe('Auth E2E', () => {
  let user: TestUser;

  beforeAll(async () => {
    user = await registerUser();
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupTrackedUsers();
  }, TEST_TIMEOUT);

  describe('POST /auth/register', () => {
    it('registra un usuario y devuelve tokens (201)', async () => {
      const res = await apiFetch<{ accessToken: string; refreshToken: string; email: string }>(
        '/auth/register',
        { method: 'POST', body: JSON.stringify(newUserPayload()) },
      );
      expect(res.status).toBe(201);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
      // limpieza puntual de este usuario extra
      await apiFetch('/auth/me', { method: 'DELETE', token: res.body.accessToken });
    });

    it('rechaza email duplicado (409)', async () => {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUserPayload({ email: user.email })),
      });
      expect(res.status).toBe(409);
    });

    it('rechaza password corto (<8) con 400', async () => {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUserPayload({ password: 'short' })),
      });
      expect(res.status).toBe(400);
    });

    it('rechaza email inválido con 400', async () => {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUserPayload({ email: 'no-es-un-email' })),
      });
      expect(res.status).toBe(400);
    });

    it('rechaza body sin campos requeridos con 400', async () => {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/login', () => {
    it('inicia sesión con credenciales válidas (200)', async () => {
      const res = await apiFetch<{ accessToken: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, password: user.password }),
      });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
    });

    it('devuelve 401 con password incorrecta', async () => {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: user.email, password: 'wrongPassword1' }),
      });
      expect(res.status).toBe(401);
    });

    it('devuelve 401 con email inexistente', async () => {
      const res = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: uniqueEmail('ghost'), password: DEFAULT_PASSWORD }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('devuelve el usuario actual con JWT válido (200)', async () => {
      const res = await apiFetch<{ email: string; id: string }>('/auth/me', {
        token: user.accessToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(user.email);
      expect(res.body.id).toBe(user.id);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('devuelve 401 sin token', async () => {
      const res = await apiFetch('/auth/me');
      expect(res.status).toBe(401);
    });

    it('devuelve 401 con token corrupto', async () => {
      const res = await apiFetch('/auth/me', { token: 'not.a.jwt' });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/refresh-token', () => {
    it('renueva los tokens con un refresh token válido (200)', async () => {
      const res = await apiFetch<{ accessToken: string; refreshToken: string }>(
        '/auth/refresh-token',
        { method: 'POST', body: JSON.stringify({ refreshToken: user.refreshToken }) },
      );
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeDefined();
      expect(res.body.refreshToken).toBeDefined();
    });

    it('devuelve 401 con refresh token inválido', async () => {
      const res = await apiFetch('/auth/refresh-token', {
        method: 'POST',
        body: JSON.stringify({ refreshToken: 'eyJ.invalid.token' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('POST /auth/logout', () => {
    it('responde { success: true } (200)', async () => {
      const res = await apiFetch<{ success: boolean }>('/auth/logout', {
        method: 'POST',
        token: user.accessToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});
