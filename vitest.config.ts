import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  // Resolves the path aliases declared in tsconfig.json, including the ones
  // added by `nest g library`.
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    root: './',
    include: ['**/*.spec.ts'],
    // La suite E2E (test/e2e/**/*.e2e.spec.ts) tiene su propia config y
    // requiere un servidor HTTP activo: no debe correr con los tests unitarios.
    exclude: ['**/node_modules/**', '**/dist/**', 'test/e2e/**'],
  },
});
