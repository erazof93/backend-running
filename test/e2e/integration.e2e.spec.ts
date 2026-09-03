import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  apiFetch,
  API_URL,
  PERF_BUDGET_MS,
  TEST_TIMEOUT,
} from '../config/e2e.config.js';
import { loginUser, registerUser, type TestUser } from '../helpers/auth.helper.js';
import { cleanupTrackedUsers, trackedCount } from '../helpers/cleanup.helper.js';
import {
  newActivityPayload,
  newCommentPayload,
  newGpsPointPayload,
  newPlanPayload,
  newUserPayload,
} from '../helpers/fixtures.js';

describe('Integration E2E — flujos completos entre módulos', () => {
  afterAll(async () => {
    await cleanupTrackedUsers();
  }, TEST_TIMEOUT);

  describe('Flujo social: signup → login → activity → follow → feed → kudo → comment', () => {
    let alice: TestUser;
    let bob: TestUser;
    let activityId: string;

    it('1) Alice se registra y luego hace login (los tokens funcionan)', async () => {
      const payload = newUserPayload({ name: 'Alice Flujo' });
      const reg = await apiFetch<{ id: string; accessToken: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      expect(reg.status).toBe(201);

      const login = await loginUser(payload.email as string, payload.password as string);
      expect(login.accessToken).toBeDefined();

      const me = await apiFetch<{ email: string }>('/auth/me', { token: login.accessToken });
      expect(me.status).toBe(200);
      expect(me.body.email).toBe(payload.email);

      alice = { ...payload, ...reg.body, ...login } as unknown as TestUser;
      // re-track con el token fresco del login
      const { trackForCleanup } = await import('../helpers/cleanup.helper.js');
      trackForCleanup({ id: reg.body.id, email: payload.email as string, token: login.accessToken });
    });

    it('2) Alice crea una actividad con ruta GPS', async () => {
      const act = await apiFetch<{ id: string }>('/activities', {
        method: 'POST',
        token: alice.accessToken,
        body: JSON.stringify(newActivityPayload({ title: 'Flujo — fondo', distance: 15 })),
      });
      expect(act.status).toBe(201);
      activityId = act.body.id;

      const gps = await apiFetch(`/activities/${activityId}/gps-points`, {
        method: 'POST',
        token: alice.accessToken,
        body: JSON.stringify(newGpsPointPayload()),
      });
      expect(gps.status).toBe(201);

      const detail = await apiFetch<{ gpsPoints: unknown[] }>(`/activities/${activityId}`);
      expect(detail.body.gpsPoints).toHaveLength(1);
    });

    it('3) Bob se registra y sigue a Alice', async () => {
      bob = await registerUser({ name: 'Bob Flujo' });
      const follow = await apiFetch(`/users/${alice.id}/follow`, {
        method: 'POST',
        token: bob.accessToken,
      });
      expect(follow.status).toBe(200);

      const aliceProfile = await apiFetch<{ followerCount: number }>(`/users/${alice.id}`);
      expect(aliceProfile.body.followerCount).toBeGreaterThanOrEqual(1);
    });

    it('4) Bob ve la actividad de Alice en su feed', async () => {
      const feed = await apiFetch<Array<{ id: string; userId: string }>>('/community/feed', {
        token: bob.accessToken,
      });
      expect(feed.status).toBe(200);
      expect(feed.body.map((a) => a.id)).toContain(activityId);
    });

    it('5) Bob da kudo y comenta; los contadores del feed suben', async () => {
      expect(
        (await apiFetch(`/activities/${activityId}/kudos`, { method: 'POST', token: bob.accessToken }))
          .status,
      ).toBe(200);
      expect(
        (
          await apiFetch(`/activities/${activityId}/comments`, {
            method: 'POST',
            token: bob.accessToken,
            body: JSON.stringify(newCommentPayload({ text: '¡Máquina!' })),
          })
        ).status,
      ).toBe(201);

      const feed = await apiFetch<Array<{ id: string; kudosCount: number; commentsCount: number }>>(
        '/community/feed',
        { token: bob.accessToken },
      );
      const row = feed.body.find((a) => a.id === activityId)!;
      expect(row.kudosCount).toBeGreaterThanOrEqual(1);
      expect(row.commentsCount).toBeGreaterThanOrEqual(1);
    });

    it('6) Bob deja de seguir a Alice y la actividad sale de su feed', async () => {
      await apiFetch(`/users/${alice.id}/follow`, { method: 'DELETE', token: bob.accessToken });
      const feed = await apiFetch<Array<{ id: string }>>('/community/feed', {
        token: bob.accessToken,
      });
      expect(feed.body.map((a) => a.id)).not.toContain(activityId);
    });

    it('7) al borrar la cuenta de Alice se limpian sus actividades (cascada)', async () => {
      const del = await apiFetch('/auth/me', { method: 'DELETE', token: alice.accessToken });
      expect(del.status).toBe(200);
      expect((await apiFetch(`/activities/${activityId}`)).status).toBe(404);
      expect((await apiFetch(`/users/${alice.id}`)).status).toBe(404);
    });
  });

  describe('Flujo coach: usuario → coach → asigna atleta → plan → feedback', () => {
    let coach: TestUser;
    let athlete: TestUser;

    beforeAll(async () => {
      coach = await registerUser({ name: 'Coach Flujo' });
      athlete = await registerUser({ name: 'Atleta Flujo' });
    }, TEST_TIMEOUT);

    it('1) el usuario se convierte en coach (POST /coach)', async () => {
      const res = await apiFetch<{ id: string }>('/coach', {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({ bio: 'Coach de flujo' }),
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(coach.id);
    });

    it('2) asigna al atleta y aparece en su roster', async () => {
      const assign = await apiFetch(`/coach/athletes/${athlete.id}`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({ notes: 'plan de 12 semanas' }),
      });
      expect(assign.status).toBe(200);

      const roster = await apiFetch<Array<{ athleteId: string }>>('/coach/athletes', {
        token: coach.accessToken,
      });
      expect(roster.body.map((a) => a.athleteId)).toContain(athlete.id);
    });

    it('3) crea un plan de entrenamiento', async () => {
      const res = await apiFetch<{ id: string; coachId: string }>('/coach/plans', {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify(newPlanPayload()),
      });
      expect(res.status).toBe(201);
      expect(res.body.coachId).toBe(coach.id);
    });

    it('4) el atleta registra una actividad y el coach le da feedback', async () => {
      const act = await apiFetch<{ id: string }>('/activities', {
        method: 'POST',
        token: athlete.accessToken,
        body: JSON.stringify(newActivityPayload({ title: 'Sesión con el coach' })),
      });
      const fb = await apiFetch<{ rating: number; coachId: string }>(
        `/coach/athletes/${athlete.id}/feedback`,
        {
          method: 'POST',
          token: coach.accessToken,
          body: JSON.stringify({ activityId: act.body.id, text: 'Muy sólido', rating: 5 }),
        },
      );
      expect(fb.status).toBe(201);
      expect(fb.body.rating).toBe(5);
      expect(fb.body.coachId).toBe(coach.id);
    });

    it('5) el perfil del atleta refleja la actividad en las stats del coach', async () => {
      const profile = await apiFetch<{ activityCount: number }>(`/coach/athletes/${athlete.id}`, {
        token: coach.accessToken,
      });
      expect(Number(profile.body.activityCount)).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Validaciones cruzadas de error', () => {
    let user: TestUser;

    beforeAll(async () => {
      user = await registerUser({ name: 'Validador' });
    }, TEST_TIMEOUT);

    it('email duplicado → 409', async () => {
      const res = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify(newUserPayload({ email: user.email })),
      });
      expect(res.status).toBe(409);
    });

    it('coordenadas GPS inválidas → 400', async () => {
      const act = await apiFetch<{ id: string }>('/activities', {
        method: 'POST',
        token: user.accessToken,
        body: JSON.stringify(newActivityPayload()),
      });
      const bad = await apiFetch(`/activities/${act.body.id}/gps-points`, {
        method: 'POST',
        token: user.accessToken,
        body: JSON.stringify(newGpsPointPayload({ longitude: 999 })),
      });
      expect(bad.status).toBe(400);
    });

    it('recurso de otro usuario → 403 (editar actividad ajena)', async () => {
      const other = await registerUser({ name: 'Ajeno' });
      const act = await apiFetch<{ id: string }>('/activities', {
        method: 'POST',
        token: user.accessToken,
        body: JSON.stringify(newActivityPayload()),
      });
      const res = await apiFetch(`/activities/${act.body.id}`, {
        method: 'PUT',
        token: other.accessToken,
        body: JSON.stringify({ title: 'intruso' }),
      });
      expect(res.status).toBe(403);
    });

    it('acción protegida sin token → 401', async () => {
      const res = await apiFetch('/activities', {
        method: 'POST',
        body: JSON.stringify(newActivityPayload()),
      });
      expect(res.status).toBe(401);
    });

    it('recurso inexistente → 404', async () => {
      const res = await apiFetch('/activities/00000000-0000-0000-0000-000000000000');
      expect(res.status).toBe(404);
    });

    it('no-coach accediendo a panel de coach → 403', async () => {
      const res = await apiFetch('/coach/athletes', { token: user.accessToken });
      expect(res.status).toBe(403);
    });
  });

  describe('Performance básico', () => {
    it(`GET /community/ranking responde en < ${PERF_BUDGET_MS}ms`, async () => {
      const start = performance.now();
      const res = await apiFetch('/community/ranking');
      const elapsed = performance.now() - start;
      expect(res.status).toBe(200);
      expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
    });

    it(`raíz de la API (${API_URL}) responde en < ${PERF_BUDGET_MS}ms`, async () => {
      const start = performance.now();
      const res = await fetch(API_URL);
      const elapsed = performance.now() - start;
      expect(res.status).toBe(200);
      expect(elapsed).toBeLessThan(PERF_BUDGET_MS);
    });

    it('10 GET concurrentes a /community/ranking sin errores', async () => {
      const results = await Promise.all(
        Array.from({ length: 10 }, () => apiFetch('/community/ranking')),
      );
      expect(results.every((r) => r.status === 200)).toBe(true);
    });
  });

  it('el registro de cleanup tiene usuarios pendientes de borrar', () => {
    expect(trackedCount()).toBeGreaterThan(0);
  });
});
