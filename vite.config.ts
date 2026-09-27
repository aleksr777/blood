import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    exclude: ['@sqlite.org/sqlite-wasm'],
  },
  //base: '/template-react-base', // для gh-pages
});
