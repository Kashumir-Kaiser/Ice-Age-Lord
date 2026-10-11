import { defineConfig, type ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';

function localApiProxy(): ProxyOptions {
  const apiPort = process.env.ILL_API_PORT ?? '8081';
  const localOrigins = new Map<string, string>([
    ['http://127.0.0.1:5173', 'http://localhost:5173'],
    ['http://127.0.0.1:4173', 'http://localhost:4173'],
  ]);
  return {
    target: `http://127.0.0.1:${apiPort}`,
    changeOrigin: false,
    configure(proxy) {
      proxy.on('proxyReq', (proxyRequest, request) => {
        const origin = request.headers.origin;
        if (origin && localOrigins.has(origin)) proxyRequest.setHeader('origin', localOrigins.get(origin)!);
      });
    },
  };
}

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    proxy: { '/api/v1': localApiProxy() },
  },
  preview: {
    host: '127.0.0.1',
    port: 4173,
    strictPort: true,
    proxy: { '/api/v1': localApiProxy() },
  },
});
