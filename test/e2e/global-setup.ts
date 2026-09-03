import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnvTest } from '../config/load-env.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, '..', '..');

loadEnvTest();

const REQUIRE_REMOTE = process.env.E2E_REQUIRE_REMOTE === '1';

const { BASE_URL, IS_LOCAL } = await import('../config/e2e.config.js');

const HEALTH_URL = `${BASE_URL}/health`;

interface Probe {
  up: boolean;
  reason: string;
}

/**
 * Comprueba que en `BASE_URL` responde NUESTRA app y no otra cosa (típico:
 * la página "Application not found" del edge de Railway cuando la URL apunta
 * a un proyecto que no existe / no está desplegado).
 */
async function probeServer(): Promise<Probe> {
  let res: Response;
  try {
    res = await fetch(HEALTH_URL, { method: 'GET' });
  } catch (err) {
    return { up: false, reason: `sin conexión a ${HEALTH_URL} (${(err as Error).message})` };
  }

  if (res.headers.get('x-railway-fallback') === 'true') {
    return {
      up: false,
      reason:
        `${BASE_URL} devuelve el fallback del edge de Railway ("Application not found"): ` +
        `no hay ningún servicio desplegado en esa URL`,
    };
  }

  let body: { status?: string; db?: string; hint?: string } = {};
  try {
    body = (await res.json()) as typeof body;
  } catch {
    return { up: false, reason: `GET /health (${res.status}) no devolvió JSON válido` };
  }

  if (res.status !== 200 || body.status !== 'ok') {
    const extra = [body.db && `db=${body.db}`, body.hint].filter(Boolean).join(' — ');
    return {
      up: false,
      reason: `GET /health -> ${res.status} status="${body.status}"${extra ? ` (${extra})` : ''}`,
    };
  }

  return { up: true, reason: 'ok' };
}

async function isServerUp(): Promise<boolean> {
  return (await probeServer()).up;
}

/**
 * Comprobación real de que la API funciona end-to-end (no sólo `/health`):
 * registra un usuario desechable y lo borra. Si falla, aborta la suite con el
 * error EXACTO en vez de dejar 90 tests "skipped" por un `beforeAll` que revienta.
 */
async function smokeCheck(): Promise<void> {
  const base = `${BASE_URL}${process.env.API_PREFIX || '/api/v1'}`;
  const email = `e2e-smoke-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@e2e.test`;
  const headers = { 'Content-Type': 'application/json' };

  const reg = await fetch(`${base}/auth/register`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password: 'password123', name: 'E2E Smoke' }),
  });
  const text = await reg.text();

  if (reg.status !== 201) {
    let hint = '';
    if (reg.status === 500) {
      hint =
        '\n      500 en /auth/register con /health OK suele ser MIGRACIONES NO APLICADAS ' +
        'en la BD de staging.\n' +
        '      Arréglalo en el deploy: `prisma migrate deploy` contra DATABASE_URL ' +
        '(conexión DIRECTA, puerto 5432, no el pooler 6543).';
    }
    throw new Error(
      `[e2e] smoke check falló: POST ${base}/auth/register -> ${reg.status} ${text}${hint}`,
    );
  }

  try {
    const { accessToken } = JSON.parse(text) as { accessToken?: string };
    if (accessToken) {
      await fetch(`${base}/auth/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  } catch {
    /* el borrado del usuario smoke es best-effort */
  }
}

async function waitForServer(timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isServerUp()) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

function killProcessTree(pid: number): void {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
      stdio: 'ignore',
    });
  } else {
    try {
      process.kill(-pid, 'SIGTERM');
    } catch {
      try {
        process.kill(pid, 'SIGTERM');
      } catch {
        /* ya murió */
      }
    }
  }
}

export default async function setup(): Promise<() => Promise<void>> {
  if (REQUIRE_REMOTE && IS_LOCAL) {
    throw new Error(
      `[e2e] \`test:e2e:staging\` necesita una URL remota real.\n` +
        `      BASE_URL actual = ${BASE_URL} (es local).\n` +
        `      Edita .env.test y pon: BASE_URL=https://<tu-app>.up.railway.app\n` +
        `      (o exporta BASE_URL en el entorno antes de correr el comando).`,
    );
  }

  const probe = await probeServer();
  if (probe.up) {
    // eslint-disable-next-line no-console
    console.log(`[e2e] servidor OK en ${BASE_URL} (GET /health -> 200)`);
    await smokeCheck();
    // eslint-disable-next-line no-console
    console.log('[e2e] smoke check OK (register + delete)');
    return async () => {};
  }

  if (!IS_LOCAL) {
    throw new Error(
      `[e2e] el target de staging/prod no está listo.\n` +
        `      BASE_URL = ${BASE_URL}\n` +
        `      motivo   = ${probe.reason}\n` +
        `      Revisa que la app esté desplegada y que BASE_URL apunte a la URL real ` +
        `(edita el script "test:e2e:staging" en package.json o define BASE_URL en el entorno).`,
    );
  }
  // eslint-disable-next-line no-console
  console.log(`[e2e] servidor local no responde (${probe.reason}); arrancándolo…`);

  // --- Arranque local automático ---------------------------------------------
  const mainJs = resolve(PROJECT_ROOT, 'dist', 'main.js');
  if (!existsSync(mainJs)) {
    // eslint-disable-next-line no-console
    console.log('[e2e] dist/main.js no existe, compilando…');
    const build = spawnSync('pnpm', ['build'], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      shell: true,
    });
    if (build.status !== 0) {
      throw new Error('[e2e] `pnpm build` falló, no se puede arrancar el servidor');
    }
  }

  // Best-effort: levantar Postgres si hay docker-compose.
  spawnSync('docker', ['compose', 'up', '-d', 'postgres'], {
    cwd: PROJECT_ROOT,
    stdio: 'ignore',
  });

  // eslint-disable-next-line no-console
  console.log('[e2e] arrancando servidor local (node dist/main.js)…');
  const child: ChildProcess = spawn(process.execPath, [mainJs], {
    cwd: PROJECT_ROOT,
    stdio: 'ignore',
    detached: process.platform !== 'win32',
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV ?? 'test' },
  });

  const up = await waitForServer(45_000);
  if (!up) {
    if (child.pid) killProcessTree(child.pid);
    throw new Error('[e2e] el servidor local no respondió tras 45s');
  }
  try {
    await smokeCheck();
  } catch (err) {
    if (child.pid) killProcessTree(child.pid);
    throw err;
  }
  // eslint-disable-next-line no-console
  console.log(`[e2e] servidor listo en ${BASE_URL} (pid ${child.pid}); smoke check OK`);

  return async () => {
    if (child.pid) {
      // eslint-disable-next-line no-console
      console.log('[e2e] deteniendo servidor local…');
      killProcessTree(child.pid);
    }
  };
}
