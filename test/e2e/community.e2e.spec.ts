import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apiFetch, TEST_TIMEOUT } from '../config/e2e.config.js';
import { registerUser, type TestUser } from '../helpers/auth.helper.js';
import { cleanupTrackedUsers } from '../helpers/cleanup.helper.js';
import { newActivityPayload, newCommentPayload } from '../helpers/fixtures.js';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

describe('Community E2E', () => {
  let viewer: TestUser; // sigue a "author"
  let author: TestUser;
  let outsider: TestUser; // no seguido por viewer
  let activityId: string;

  beforeAll(async () => {
    viewer = await registerUser({ name: 'Viewer E2E' });
    author = await registerUser({ name: 'Author E2E' });
    outsider = await registerUser({ name: 'Outsider E2E' });

    await apiFetch(`/users/${author.id}/follow`, { method: 'POST', token: viewer.accessToken });

    const act = await apiFetch<{ id: string }>('/activities', {
      method: 'POST',
      token: author.accessToken,
      body: JSON.stringify(newActivityPayload({ title: 'E2E Feed activity' })),
    });
    activityId = act.body.id;

    await apiFetch('/activities', {
      method: 'POST',
      token: outsider.accessToken,
      body: JSON.stringify(newActivityPayload({ title: 'No debería verse' })),
    });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupTrackedUsers();
  }, TEST_TIMEOUT);

  describe('GET /community/feed', () => {
    it('devuelve 401 sin token', async () => {
      expect((await apiFetch('/community/feed')).status).toBe(401);
    });

    it('solo trae actividades de usuarios seguidos', async () => {
      const res = await apiFetch<Array<{ id: string; userId: string; user: { name: string } }>>(
        '/community/feed',
        { token: viewer.accessToken },
      );
      expect(res.status).toBe(200);
      const ids = res.body.map((a) => a.id);
      expect(ids).toContain(activityId);
      expect(res.body.every((a) => a.userId !== outsider.id)).toBe(true);
      const mine = res.body.find((a) => a.id === activityId)!;
      expect(mine.user.name).toBe('Author E2E');
      expect(mine).toHaveProperty('kudosCount');
      expect(mine).toHaveProperty('commentsCount');
    });

    it('feed vacío para un usuario que no sigue a nadie', async () => {
      const loner = await registerUser({ name: 'Loner' });
      const res = await apiFetch<unknown[]>('/community/feed', { token: loner.accessToken });
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe('kudos', () => {
    it('POST /activities/:id/kudos da like (200) e idempotente', async () => {
      const first = await apiFetch(`/activities/${activityId}/kudos`, {
        method: 'POST',
        token: viewer.accessToken,
      });
      expect(first.status).toBe(200);
      const again = await apiFetch(`/activities/${activityId}/kudos`, {
        method: 'POST',
        token: viewer.accessToken,
      });
      expect(again.status).toBe(200);

      const list = await apiFetch<Array<{ userId: string }>>(`/activities/${activityId}/kudos`);
      expect(list.status).toBe(200);
      expect(list.body.filter((k) => k.userId === viewer.id)).toHaveLength(1);
    });

    it('POST kudos sin token devuelve 401', async () => {
      expect((await apiFetch(`/activities/${activityId}/kudos`, { method: 'POST' })).status).toBe(401);
    });

    it('POST kudos en actividad inexistente devuelve 404', async () => {
      const res = await apiFetch(`/activities/${NIL_UUID}/kudos`, {
        method: 'POST',
        token: viewer.accessToken,
      });
      expect(res.status).toBe(404);
    });

    it('DELETE /activities/:id/kudos quita el like', async () => {
      await apiFetch(`/activities/${activityId}/kudos`, { method: 'POST', token: outsider.accessToken });
      const del = await apiFetch(`/activities/${activityId}/kudos`, {
        method: 'DELETE',
        token: outsider.accessToken,
      });
      expect(del.status).toBe(200);
      const list = await apiFetch<Array<{ userId: string }>>(`/activities/${activityId}/kudos`);
      expect(list.body.map((k) => k.userId)).not.toContain(outsider.id);
    });
  });

  describe('comentarios', () => {
    it('POST /activities/:id/comments crea comentario (201)', async () => {
      const res = await apiFetch<Record<string, unknown>>(`/activities/${activityId}/comments`, {
        method: 'POST',
        token: viewer.accessToken,
        body: JSON.stringify(newCommentPayload({ text: 'Comentario E2E' })),
      });
      expect(res.status).toBe(201);
      expect(res.body.text).toBe('Comentario E2E');
      expect(res.body.userId).toBe(viewer.id);
    });

    it('POST comentario vacío devuelve 400', async () => {
      const res = await apiFetch(`/activities/${activityId}/comments`, {
        method: 'POST',
        token: viewer.accessToken,
        body: JSON.stringify({ text: '' }),
      });
      expect(res.status).toBe(400);
    });

    it('GET /activities/:id/comments lista en orden ascendente con autor', async () => {
      const res = await apiFetch<Array<{ text: string; createdAt: string; user?: { name: string } }>>(
        `/activities/${activityId}/comments`,
      );
      expect(res.status).toBe(200);
      const times = res.body.map((c) => new Date(c.createdAt).getTime());
      expect(times).toEqual([...times].sort((a, b) => a - b));
      expect(res.body[0].user?.name).toBeDefined();
    });

    it('DELETE /comments/:id: 403 si no es el autor, 200 si lo es', async () => {
      const created = await apiFetch<{ id: string }>(`/activities/${activityId}/comments`, {
        method: 'POST',
        token: viewer.accessToken,
        body: JSON.stringify(newCommentPayload()),
      });
      const commentId = created.body.id;

      const forbidden = await apiFetch(`/comments/${commentId}`, {
        method: 'DELETE',
        token: author.accessToken,
      });
      expect(forbidden.status).toBe(403);

      const ok = await apiFetch(`/comments/${commentId}`, {
        method: 'DELETE',
        token: viewer.accessToken,
      });
      expect(ok.status).toBe(200);

      const notFound = await apiFetch(`/comments/${commentId}`, {
        method: 'DELETE',
        token: viewer.accessToken,
      });
      expect(notFound.status).toBe(404);
    });
  });

  describe('GET /community/ranking', () => {
    it('es público, devuelve como máximo 10 y trae posición/nombre/distancia', async () => {
      const res = await apiFetch<
        Array<{ position: number; userId: string; name: string; totalDistance: number }>
      >('/community/ranking');
      expect(res.status).toBe(200);
      expect(res.body.length).toBeLessThanOrEqual(10);
      if (res.body.length > 0) {
        expect(res.body[0].position).toBe(1);
        res.body.forEach((row, i) => {
          expect(row.position).toBe(i + 1);
          expect(typeof row.totalDistance).toBe('number');
          expect(typeof row.name).toBe('string');
        });
        // ordenado desc por distancia
        const dists = res.body.map((r) => r.totalDistance);
        expect(dists).toEqual([...dists].sort((a, b) => b - a));
      }
    });
  });
});
