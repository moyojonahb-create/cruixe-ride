import { defineConfig } from 'vite';
import base from '../vite.stabilization-build.config';
// Preserve production bundler settings; this is not a deployable release.
export default defineConfig(env => {
 const config = typeof base === 'function' ? base(env) : base;
 const isolated = { VITE_SUPABASE_URL:'http://127.0.0.1:9', VITE_SUPABASE_PUBLISHABLE_KEY:'isolated-ci-unusable-key', VITE_SUPABASE_ANON_KEY:'isolated-ci-unusable-key', VITE_GO_BACKEND_URL:'http://127.0.0.1:9', VITE_API_BASE_URL:'http://127.0.0.1:9', VITE_BACKEND_URL:'http://127.0.0.1:9', VITE_WS_URL:'ws://127.0.0.1:9', VITE_MAPBOX_ACCESS_TOKEN:'', VITE_MAPBOX_TOKEN:'', VITE_MAPBOX_PUBLIC_TOKEN:'' };
 return { ...config, define:{...config.define,...Object.fromEntries(Object.entries(isolated).map(([key,value])=>['import.meta.env.'+key,JSON.stringify(value)]))}, cacheDir:'/tmp/cruixe-build-cache', server:{...config.server,proxy:{}}, build:{...config.build,outDir:'/evidence/build-verification-only',emptyOutDir:false} };
});
