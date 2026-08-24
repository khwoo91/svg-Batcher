import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        svgToPng: resolve(__dirname, 'svg-to-png.html'),
        wavToMp3: resolve(__dirname, 'wav-to-mp3.html'),
        batchRename: resolve(__dirname, 'batch-rename.html'),
      },
    },
  },
});
