import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/cnn-api': {
        target: 'https://production.dataviz.cnn.io',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/cnn-api/, ''),
        headers: {
            'Referer': 'https://edition.cnn.com/',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      },
    },
  },
});
