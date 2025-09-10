import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer/src')
    }
  },
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'src/renderer/index.html'),
    },
    outDir: 'dist',
    emptyOutDir: true,
  }
});
