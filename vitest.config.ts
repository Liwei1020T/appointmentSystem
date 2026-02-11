import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: [
      'node_modules',
      'dist',
      '.next',
      '.worktrees',
      '**/.next/**',
      '**/.worktrees/**',
      '**/standalone/**',
      '**/._*',
    ], // Ignore build/worktree artifacts and macOS AppleDouble files.
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '.worktrees/',
        '.next/',
        '**/.worktrees/**',
        '**/.next/**',
        '**/standalone/**',
        'prisma/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/**',
        '**/._*',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
