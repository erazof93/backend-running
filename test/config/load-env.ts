import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Carga `.env.test` en `process.env` (sin pisar variables ya presentes) sin
 * depender de `dotenv`. Se llama tanto desde `vitest.config.e2e.ts` (para que
 * `test.env` inyecte los valores a los workers) como desde el global-setup.
 */
export function loadEnvTest(): void {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const file = resolve(root, '.env.test');
  if (!existsSync(file)) return;

  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
