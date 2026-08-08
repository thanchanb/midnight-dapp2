import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      '@managed': path.resolve(__dirname, './managed'),
    },
  },
});
