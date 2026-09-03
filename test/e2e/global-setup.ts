import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(HERE, '..', '..');

// Carga .env.test (si existe) ANTES de leer la config, sin dependencias.
const envTest = resolve(PROJECT_ROOT, '.env.test');
if (existsSync(envTest)) {
  for (const line of readFileSync(envTest, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}

const { API_URL, BASE_URL, IS_LOCAL } = await import('../config/e2e.config.js');

async function isServerUp(): Promise<boolean> {
  try {
    const res = await fetch(API_URL, { method: 'GET' });
    return res.status > 0;
  } catch {
    return false;
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
  if (await isServerUp()) {
    // eslint-disable-next-line no-console
    console.log(`[e2e] usando servidor ya activo en ${BASE_URL}`);
    return async () => {};
  }

  if (!IS_LOCAL) {
    throw new Error(
      `[e2e] no hay respuesta de ${API_URL}. Para staging/prod el servidor ` +
        `debe estar desplegado y accesible antes de correr la suite.`,
    );
  }

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
  // eslint-disable-next-line no-console
  console.log(`[e2e] servidor listo en ${BASE_URL} (pid ${child.pid})`);

  return async () => {
    if (child.pid) {
      // eslint-disable-next-line no-console
      console.log('[e2e] deteniendo servidor local…');
      killProcessTree(child.pid);
    }
  };
}
