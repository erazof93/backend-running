import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { apiFetch, TEST_TIMEOUT } from '../config/e2e.config.js';
import { registerUser, type TestUser } from '../helpers/auth.helper.js';
import { cleanupTrackedUsers } from '../helpers/cleanup.helper.js';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

describe('Users E2E', () => {
  let alice: TestUser;
  let bob: TestUser;

  beforeAll(async () => {
    alice = await registerUser({ name: 'Alice E2E' });
    bob = await registerUser({ name: 'Bob E2E' });
  }, TEST_TIMEOUT);

  afterAll(async () => {
    await cleanupTrackedUsers();
  }, TEST_TIMEOUT);

  describe('GET /users/:id', () => {
    it('devuelve el perfil público con contadores (200)', async () => {
      const res = await apiFetch<Record<string, unknown>>(`/users/${alice.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(alice.id);
      expect(res.body.followerCount).toBe(0);
      expect(res.body.followingCount).toBe(0);
      expect(res.body).not.toHaveProperty('passwordHash');
    });

    it('devuelve 404 si el usuario no existe', async () => {
      const res = await apiFetch(`/users/${NIL_UUID}`);
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /users/:id', () => {
    it('el propietario actualiza su perfil (200)', async () => {
      const res = await apiFetch<Record<string, unknown>>(`/users/${alice.id}`, {
        method: 'PUT',
        token: alice.accessToken,
        body: JSON.stringify({ bio: 'Corro trail', profilePicture: 'https://cdn.example.com/a.png' }),
      });
      expect(res.status).toBe(200);
      expect(res.body.bio).toBe('Corro trail');
      expect(res.body.profilePicture).toBe('https://cdn.example.com/a.png');
    });

    it('devuelve 403 al intentar editar otro perfil', async () => {
      const res = await apiFetch(`/users/${alice.id}`, {
        method: 'PUT',
        token: bob.accessToken,
        body: JSON.stringify({ bio: 'hack' }),
      });
      expect(res.status).toBe(403);
    });

    it('devuelve 401 sin token', async () => {
      const res = await apiFetch(`/users/${alice.id}`, {
        method: 'PUT',
        body: JSON.stringify({ bio: 'x' }),
      });
      expect(res.status).toBe(401);
    });

    it('devuelve 400 con profilePicture no-URL', async () => {
      const res = await apiFetch(`/users/${alice.id}`, {
        method: 'PUT',
        token: alice.accessToken,
        body: JSON.stringify({ profilePicture: 'no-es-url' }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe('POST / DELETE /users/:id/follow', () => {
    it('Bob sigue a Alice (200) y aparece en followers/following', async () => {
      const follow = await apiFetch(`/users/${alice.id}/follow`, {
        method: 'POST',
        token: bob.accessToken,
      });
      expect(follow.status).toBe(200);

      const followers = await apiFetch<Array<{ id: string }>>(`/users/${alice.id}/followers`);
      expect(followers.status).toBe(200);
      expect(followers.body.map((u) => u.id)).toContain(bob.id);

      const following = await apiFetch<Array<{ id: string }>>(`/users/${bob.id}/following`);
      expect(following.body.map((u) => u.id)).toContain(alice.id);

      const alicePerfil = await apiFetch<{ followerCount: number }>(`/users/${alice.id}`);
      expect(alicePerfil.body.followerCount).toBeGreaterThanOrEqual(1);
    });

    it('seguir de nuevo es idempotente (200, sin duplicar)', async () => {
      const again = await apiFetch(`/users/${alice.id}/follow`, {
        method: 'POST',
        token: bob.accessToken,
      });
      expect(again.status).toBe(200);

      const followers = await apiFetch<Array<{ id: string }>>(`/users/${alice.id}/followers`);
      const bobCount = followers.body.filter((u) => u.id === bob.id).length;
      expect(bobCount).toBe(1);
    });

    it('no se puede seguir a uno mismo (400)', async () => {
      const res = await apiFetch(`/users/${bob.id}/follow`, {
        method: 'POST',
        token: bob.accessToken,
      });
      expect(res.status).toBe(400);
    });

    it('unfollow (200) y desaparece de followers', async () => {
      const res = await apiFetch(`/users/${alice.id}/follow`, {
        method: 'DELETE',
        token: bob.accessToken,
      });
      expect(res.status).toBe(200);

      const followers = await apiFetch<Array<{ id: string }>>(`/users/${alice.id}/followers`);
      expect(followers.body.map((u) => u.id)).not.toContain(bob.id);
    });

    it('unfollow repetido sigue devolviendo 200 (idempotente)', async () => {
      const res = await apiFetch(`/users/${alice.id}/follow`, {
        method: 'DELETE',
        token: bob.accessToken,
      });
      expect(res.status).toBe(200);
    });

    it('follow sin token devuelve 401', async () => {
      const res = await apiFetch(`/users/${alice.id}/follow`, { method: 'POST' });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /users/:id/activities', () => {
    it('devuelve un array (placeholder) para un usuario existente', async () => {
      const res = await apiFetch<unknown[]>(`/users/${alice.id}/activities`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});
