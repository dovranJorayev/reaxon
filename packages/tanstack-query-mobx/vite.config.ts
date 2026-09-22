import { copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dts from 'vite-plugin-dts';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    // Same floor as tsconfig.base.json; Node 18+ and evergreen browsers.
    target: 'es2020',
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReaxonTanstackQueryMobx',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['mobx', '@tanstack/query-core', 'mobx-utils'],
      output: {
        globals: {
          mobx: 'mobx',
          '@tanstack/query-core': 'TanstackQueryCore',
          'mobx-utils': 'mobxUtils',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts', 'src/tools.ts'],
      outDirs: ['dist'],
      bundleTypes: true,
      // The bundled declaration file has no runtime imports, so the same text
      // is valid for CommonJS consumers under `exports.require.types`.
      afterBuild: () =>
        copyFile(
          resolve(__dirname, 'dist/index.d.ts'),
          resolve(__dirname, 'dist/index.d.cts')
        ),
    }),
  ],
  test: {
    environment: 'node',
    globals: true,
    // Vitest 5 defaults clearMocks to true, which wipes call history of sibling
    // tests still running inside describe.concurrent blocks.
    clearMocks: false,
  },
});
