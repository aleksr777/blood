import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const legacyMigrationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    headers: legacyMigrationHeaders,
  },
  preview: {
    headers: legacyMigrationHeaders,
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  //base: '/template-react-base', // для gh-pages
});
