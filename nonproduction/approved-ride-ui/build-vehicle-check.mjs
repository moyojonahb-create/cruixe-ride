import { build } from 'vite';
// Production output, with expensive diagnostic artifacts disabled for this QA run.
await build({ build: { sourcemap: false, reportCompressedSize: false } });
