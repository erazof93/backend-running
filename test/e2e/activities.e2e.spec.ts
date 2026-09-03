import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apiFetch, TEST_TIMEOUT } from '../config/e2e.config.js';
import { registerUser, type TestUser } from '../helpers/auth.helper.js';
import { cleanupTrackedUsers } from '../helpers/cleanup.helper.js';
import {
  newActivityPayload,
  newGpsPointPayload,
} from '../helpers/fixtures.js';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

describe('Activities E2E', () => {
  let owner: TestUser;
  let stranger: TestUser;

  beforeAll(async () => {
    owner = await registerUser({ name: 'Activity Owner' });
    stranger = await registerUser({ name: 'Stranger' });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupTrackedUsers();
  }, TEST_TIMEOUT);

  async function createActivity(overrides = {}) {
    const res = await apiFetch<{ id: string }>('/activities', {
      method: 'POST',
      token: owner.accessToken,
      body: JSON.stringify(newActivityPayload(overrides)),
    });
    expect(res.status).toBe(201);
    return res.body;
  }

  describe('POST /activities', () => {
    it('crea una actividad con el userId del JWT (201)', async () => {
      const res = await apiFetch<Record<string, unknown>>('/activities', {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(newActivityPayload({ distance: 12.34 })),
      });
      expect(res.status).toBe(201);
      expect(res.body.userId).toBe(owner.id);
      expect(res.body.distance).toBe(12.34);
      expect(typeof res.body.distance).toBe('number');
    });

    it('devuelve 401 sin token', async () => {
      const res = await apiFetch('/activities', {
        method: 'POST',
        body: JSON.stringify(newActivityPayload()),
      });
      expect(res.status).toBe(401);
    });

    it('devuelve 400 con activityType inválido', async () => {
      const res = await apiFetch('/activities', {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(newActivityPayload({ activityType: 'fly' })),
      });
      expect(res.status).toBe(400);
    });

    it('devuelve 400 con distancia negativa', async () => {
      const res = await apiFetch('/activities', {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(newActivityPayload({ distance: -5 })),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /activities/:id', () => {
    it('devuelve la actividad con gpsPoints (200)', async () => {
      const activity = await createActivity();
      const res = await apiFetch<Record<string, unknown>>(`/activities/${activity.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(activity.id);
      expect(res.body.gpsPoints).toEqual([]);
    });

    it('devuelve 404 si no existe', async () => {
      const res = await apiFetch(`/activities/${NIL_UUID}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /activities/:id', () => {
    it('el propietario actualiza (200)', async () => {
      const activity = await createActivity();
      const res = await apiFetch<Record<string, unknown>>(`/activities/${activity.id}`, {
        method: 'PUT',
        token: owner.accessToken,
        body: JSON.stringify({ title: 'E2E título editado', distance: 9 }),
      });
      expect(res.status).toBe(200);
      expect(res.body.title).toBe('E2E título editado');
      expect(res.body.distance).toBe(9);
    });

    it('devuelve 403 si no es el propietario', async () => {
      const activity = await createActivity();
      const res = await apiFetch(`/activities/${activity.id}`, {
        method: 'PUT',
        token: stranger.accessToken,
        body: JSON.stringify({ title: 'hack' }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('GPS points', () => {
    it('agrega puntos y los devuelve ordenados por timestamp (order autoasignado)', async () => {
      const activity = await createActivity();
      const base = Date.now();

      const p1 = await apiFetch(`/activities/${activity.id}/gps-points`, {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(
          newGpsPointPayload({ timestamp: new Date(base + 2000).toISOString() }),
        ),
      });
      expect(p1.status).toBe(201);
      await apiFetch(`/activities/${activity.id}/gps-points`, {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(
          newGpsPointPayload({ altitude: undefined, timestamp: new Date(base).toISOString() }),
        ),
      });
      await apiFetch(`/activities/${activity.id}/gps-points`, {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(
          newGpsPointPayload({ timestamp: new Date(base + 1000).toISOString() }),
        ),
      });

      const list = await apiFetch<Array<{ order: number; timestamp: string; altitude: number | null }>>(
        `/activities/${activity.id}/gps-points`,
      );
      expect(list.status).toBe(200);
      expect(list.body).toHaveLength(3);
      const times = list.body.map((p) => new Date(p.timestamp).getTime());
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(list.body.map((p) => p.order)).toEqual([1, 2, 0]);
      expect(list.body[0].altitude).toBeNull();
    });

    it('devuelve 403 al agregar GPS a una actividad ajena', async () => {
      const activity = await createActivity();
      const res = await apiFetch(`/activities/${activity.id}/gps-points`, {
        method: 'POST',
        token: stranger.accessToken,
        body: JSON.stringify(newGpsPointPayload()),
      });
      expect(res.status).toBe(403);
    });

    it('devuelve 400 con latitud fuera de rango', async () => {
      const activity = await createActivity();
      const res = await apiFetch(`/activities/${activity.id}/gps-points`, {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(newGpsPointPayload({ latitude: 200 })),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /activities/:id', () => {
    it('devuelve 403 si no es el propietario', async () => {
      const activity = await createActivity();
      const res = await apiFetch(`/activities/${activity.id}`, {
        method: 'DELETE',
        token: stranger.accessToken,
      });
      expect(res.status).toBe(403);
    });

    it('el propietario borra y los GPS points caen en cascada', async () => {
      const activity = await createActivity();
      await apiFetch(`/activities/${activity.id}/gps-points`, {
        method: 'POST',
        token: owner.accessToken,
        body: JSON.stringify(newGpsPointPayload()),
      });

      const del = await apiFetch<{ success: boolean }>(`/activities/${activity.id}`, {
        method: 'DELETE',
        token: owner.accessToken,
      });
      expect(del.status).toBe(200);
      expect(del.body.success).toBe(true);

      expect((await apiFetch(`/activities/${activity.id}`)).status).toBe(404);
      expect((await apiFetch(`/activities/${activity.id}/gps-points`)).status).toBe(404);
    });
  });

  describe('GET /activities/user/:userId', () => {
    it('lista las actividades del usuario (sin gpsPoints)', async () => {
      const solo = await registerUser({ name: 'Solo Runner' });
      await apiFetch('/activities', {
        method: 'POST',
        token: solo.accessToken,
        body: JSON.stringify(newActivityPayload()),
      });
      await apiFetch('/activities', {
        method: 'POST',
        token: solo.accessToken,
        body: JSON.stringify(newActivityPayload({ title: 'Segunda' })),
      });

      const res = await apiFetch<Array<{ gpsPoints?: unknown }>>(`/activities/user/${solo.id}`);
      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body[0].gpsPoints).toBeUndefined();
    });
  });
});
