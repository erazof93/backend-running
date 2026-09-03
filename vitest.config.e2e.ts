import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const API_PREFIX = process.env.API_PREFIX || '/api/v1';
const PERF_BUDGET_MS = process.env.PERF_BUDGET_MS || '2000';
const IS_LOCAL = /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|$|\/)/.test(BASE_URL);
// Contra staging/prod (BD remota) reintenta 1 vez ante fallos transitorios.
const RETRY = Number(process.env.E2E_RETRY ?? (IS_LOCAL ? 0 : 1));

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['test/e2e/**/*.e2e.spec.ts'],
    globalSetup: ['test/e2e/global-setup.ts'],
    // Se inyecta explícitamente en los workers (no dependemos de la herencia
    // de process.env al forkear).
    env: { BASE_URL, API_PREFIX, PERF_BUDGET_MS },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    retry: RETRY,
    // Cada archivo corre en su propio worker (rápido); dentro de cada archivo
    // los tests son secuenciales. Las aserciones se filtran siempre por los
    // datos que el propio test crea, así que el paralelismo entre archivos es
    // seguro sobre la BD compartida.
    fileParallelism: true,
    pool: 'forks',
  },
});
