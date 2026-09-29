import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'server-only': path.resolve(__dirname, 'tests/unit/server-only-stub.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/unit/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/stores/**'],
      exclude: [
        'src/lib/supabase/**',
        'src/lib/gsap.ts',
        'src/lib/sound.ts',
        'src/lib/tmdb/fixtures.ts',
      ],
      thresholds: { statements: 80, lines: 80, functions: 80, branches: 70 },
    },
  },
});
