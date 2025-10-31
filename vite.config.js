import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './src/manifest.json';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    crx({ manifest })
  ],
  build: {
    rollupOptions: {
      input: {
        popup: 'index.html'
      }
    }
  }
});
