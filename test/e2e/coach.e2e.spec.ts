import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apiFetch, TEST_TIMEOUT } from '../config/e2e.config.js';
import { registerUser, type TestUser } from '../helpers/auth.helper.js';
import { cleanupTrackedUsers } from '../helpers/cleanup.helper.js';
import { newActivityPayload, newPlanPayload } from '../helpers/fixtures.js';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

describe('Coach E2E', () => {
  let coach: TestUser;
  let otherCoach: TestUser;
  let athlete: TestUser;

  beforeAll(async () => {
    coach = await registerUser({ name: 'Coach E2E' });
    otherCoach = await registerUser({ name: 'Other Coach' });
    athlete = await registerUser({ name: 'Athlete E2E' });
    await apiFetch('/coach', { method: 'POST', token: coach.accessToken, body: JSON.stringify({ bio: 'Nivel II' }) });
    await apiFetch('/coach', { method: 'POST', token: otherCoach.accessToken, body: JSON.stringify({}) });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupTrackedUsers();
  }, TEST_TIMEOUT);

  describe('POST /coach', () => {
    it('es upsert idempotente: segunda llamada sigue devolviendo 200', async () => {
      const res = await apiFetch<{ id: string; bio: string }>('/coach', {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({ bio: 'Nivel III actualizado' }),
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(coach.id);
      expect(res.body.bio).toBe('Nivel III actualizado');
    });

    it('devuelve 401 sin token', async () => {
      const res = await apiFetch('/coach', { method: 'POST', body: JSON.stringify({}) });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /coach/athletes', () => {
    it('devuelve 403 si el usuario no es coach', async () => {
      const res = await apiFetch('/coach/athletes', { token: athlete.accessToken });
      expect(res.status).toBe(403);
    });

    it('lista los atletas asignados tras asignarlos', async () => {
      const assign = await apiFetch(`/coach/athletes/${athlete.id}`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({ notes: 'viene de lesión' }),
      });
      expect(assign.status).toBe(200);

      const res = await apiFetch<Array<{ athleteId: string; status: string }>>('/coach/athletes', {
        token: coach.accessToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.map((a) => a.athleteId)).toContain(athlete.id);
    });

    it('asignar es idempotente (200, sin duplicar)', async () => {
      await apiFetch(`/coach/athletes/${athlete.id}`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({}),
      });
      const res = await apiFetch<Array<{ athleteId: string }>>('/coach/athletes', {
        token: coach.accessToken,
      });
      expect(res.body.filter((a) => a.athleteId === athlete.id)).toHaveLength(1);
    });

    it('no se puede asignar a uno mismo (400)', async () => {
      const res = await apiFetch(`/coach/athletes/${coach.id}`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({}),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /coach/athletes/:id', () => {
    it('devuelve el perfil con stats agregadas del atleta asignado', async () => {
      await apiFetch(`/coach/athletes/${athlete.id}`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({}),
      });
      await apiFetch('/activities', {
        method: 'POST',
        token: athlete.accessToken,
        body: JSON.stringify(newActivityPayload({ distance: 7 })),
      });

      const res = await apiFetch<Record<string, number | string>>(`/coach/athletes/${athlete.id}`, {
        token: coach.accessToken,
      });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(athlete.id);
      expect(Number(res.body.activityCount)).toBeGreaterThanOrEqual(1);
      expect(Number(res.body.totalDistance)).toBeGreaterThanOrEqual(7);
    });

    it('devuelve 403 para un atleta no asignado', async () => {
      const res = await apiFetch(`/coach/athletes/${athlete.id}`, {
        token: otherCoach.accessToken,
      });
      expect(res.status).toBe(403);
    });
  });

  describe('planes', () => {
    it('POST /coach/plans crea un plan (201) con exercises JSON', async () => {
      const res = await apiFetch<Record<string, unknown>>('/coach/plans', {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify(newPlanPayload()),
      });
      expect(res.status).toBe(201);
      expect(res.body.coachId).toBe(coach.id);
      expect(Array.isArray(res.body.exercises)).toBe(true);
    });

    it('POST /coach/plans devuelve 403 si no eres coach', async () => {
      const res = await apiFetch('/coach/plans', {
        method: 'POST',
        token: athlete.accessToken,
        body: JSON.stringify(newPlanPayload()),
      });
      expect(res.status).toBe(403);
    });

    it('GET /coach/plans/:id es público; PUT/DELETE sólo del propietario', async () => {
      const created = await apiFetch<{ id: string }>('/coach/plans', {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify(newPlanPayload()),
      });
      const planId = created.body.id;

      expect((await apiFetch(`/coach/plans/${planId}`)).status).toBe(200);

      const forbidden = await apiFetch(`/coach/plans/${planId}`, {
        method: 'PUT',
        token: otherCoach.accessToken,
        body: JSON.stringify({ name: 'hack' }),
      });
      expect(forbidden.status).toBe(403);

      const updated = await apiFetch<Record<string, unknown>>(`/coach/plans/${planId}`, {
        method: 'PUT',
        token: coach.accessToken,
        body: JSON.stringify({ name: 'E2E Semana 1 (ajustada)' }),
      });
      expect(updated.status).toBe(200);
      expect(updated.body.name).toBe('E2E Semana 1 (ajustada)');

      const del = await apiFetch(`/coach/plans/${planId}`, {
        method: 'DELETE',
        token: coach.accessToken,
      });
      expect(del.status).toBe(200);
      expect((await apiFetch(`/coach/plans/${planId}`)).status).toBe(404);
    });

    it('GET /coach/plans/:id devuelve 404 si no existe', async () => {
      expect((await apiFetch(`/coach/plans/${NIL_UUID}`)).status).toBe(404);
    });
  });

  describe('POST /coach/athletes/:id/feedback', () => {
    it('crea feedback sobre una actividad del atleta asignado (201)', async () => {
      await apiFetch(`/coach/athletes/${athlete.id}`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({}),
      });
      const act = await apiFetch<{ id: string }>('/activities', {
        method: 'POST',
        token: athlete.accessToken,
        body: JSON.stringify(newActivityPayload()),
      });

      const res = await apiFetch<Record<string, unknown>>(`/coach/athletes/${athlete.id}/feedback`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({ activityId: act.body.id, text: 'Buen control del ritmo', rating: 4 }),
      });
      expect(res.status).toBe(201);
      expect(res.body.rating).toBe(4);
      expect(res.body.coachId).toBe(coach.id);
    });

    it('devuelve 400 si la actividad no es del atleta', async () => {
      const foreign = await apiFetch<{ id: string }>('/activities', {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify(newActivityPayload()),
      });
      const res = await apiFetch(`/coach/athletes/${athlete.id}/feedback`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({ activityId: foreign.body.id, text: 'mal', rating: 2 }),
      });
      expect(res.status).toBe(400);
    });

    it('devuelve 400 con rating fuera de rango', async () => {
      const act = await apiFetch<{ id: string }>('/activities', {
        method: 'POST',
        token: athlete.accessToken,
        body: JSON.stringify(newActivityPayload()),
      });
      const res = await apiFetch(`/coach/athletes/${athlete.id}/feedback`, {
        method: 'POST',
        token: coach.accessToken,
        body: JSON.stringify({ activityId: act.body.id, text: 'x', rating: 9 }),
      });
      expect(res.status).toBe(400);
    });
  });
});
