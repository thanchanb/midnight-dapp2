import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import path from 'path';

export default defineConfig({
  base: './',
  root: './',
  plugins: [
    wasm(),
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'esnext',
  },
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
  },
  define: {
    'global': 'globalThis',
  },
  resolve: {
    alias: {
      '@managed': path.resolve(import.meta.dirname || '.', './managed'),
      buffer: 'buffer',
      events: 'events',
      assert: 'assert',
      util: 'util',
    },
  },
});
