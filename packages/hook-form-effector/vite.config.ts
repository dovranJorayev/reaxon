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
      name: 'ReaxonHookFormEffector',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['effector', 'react-hook-form'],
      output: {
        globals: {
          effector: 'effector',
          'react-hook-form': 'ReactHookForm',
        },
      },
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      include: ['src'],
      exclude: ['src/**/*.test.ts'],
      outDirs: ['dist'],
      bundleTypes: true,
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
    clearMocks: false,
  },
});
