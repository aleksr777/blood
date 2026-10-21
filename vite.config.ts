import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

const legacyMigrationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/blood/',
  build: {
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
  },
  server: {
    headers: legacyMigrationHeaders,
  },
  preview: {
    headers: legacyMigrationHeaders,
  },
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
});
