import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'src/renderer', // Set the root to your renderer folder
  plugins: [react()],
  resolve: {
    alias: {
      '@renderer': path.resolve(__dirname, 'src/renderer/src') // Keep existing alias if needed
    }
  },
  build: {
    outDir: 'dist/renderer', // Output to dist/renderer relative to project root
    emptyOutDir: true,
  }
});
