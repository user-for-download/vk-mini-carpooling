import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Required so the dev server accepts connections proxied through VK Tunnel.
    host: true,
    allowedHosts: ['vk.binetc.fun'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
