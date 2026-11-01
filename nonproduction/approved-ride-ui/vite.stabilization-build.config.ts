import { defineConfig } from 'vite';
import path from 'node:path';
import original from './vite.config';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindConfig from './tailwind.config';

// Run from qa-stabilization/empty-env so the original loadEnv call sees no
// application credentials. Preserve production bundling; exclude upload plugins.
export default defineConfig((env) => {
  const config = typeof original === 'function' ? original(env) : original;
  return {
    ...config,
    root: __dirname,
    envDir: path.resolve(__dirname, 'qa-stabilization/empty-env'),
    envPrefix: 'STABILIZATION_PUBLIC_',
    cacheDir: path.resolve(__dirname, 'qa-stabilization/build-cache'),
    css: {
      ...config.css,
      postcss: { plugins: [tailwindcss({ ...tailwindConfig, content: tailwindConfig.content.map((entry) => path.resolve(__dirname, entry)) }), autoprefixer()] },
    },
    plugins: (config.plugins ?? []).flat(Infinity).filter((plugin: any) => plugin && !/sentry/i.test(plugin.name ?? '')),
    build: { ...config.build, outDir: path.resolve(__dirname, 'qa-stabilization/build-dist'), emptyOutDir: false },
  };
});
