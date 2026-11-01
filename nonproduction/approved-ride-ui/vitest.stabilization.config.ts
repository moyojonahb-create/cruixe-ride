import { mergeConfig } from 'vitest/config';
import path from 'node:path';
import base from './vitest.config';

// Isolated verification: never load the application's environment/credentials.
export default mergeConfig(base, {
  envDir: path.resolve(__dirname, 'qa-stabilization/empty-env'),
  envPrefix: 'STABILIZATION_PUBLIC_',
  cacheDir: path.resolve(__dirname, 'qa-stabilization/vitest-cache'),
  test: {
    setupFiles: ['./qa-stabilization/network-guard.ts'],
    maxWorkers: 1,
    minWorkers: 1,
  },
});
