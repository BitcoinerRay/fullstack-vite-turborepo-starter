import path from 'node:path';
import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';

function normalizeBackendOrigin(backendUrl: string): string {
  return backendUrl.replace(/\/api\/v1\/?$/u, '').replace(/\/$/u, '');
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '../../', '');
  const backendOrigin = normalizeBackendOrigin(env.VITE_BACKEND_URL || 'http://localhost:4000');

  return {
    plugins: [react()],
    envDir: '../../',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      host: true,
      strictPort: true,
      proxy: {
        '/api/v1': {
          target: backendOrigin,
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-radix': [
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-label',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-slot',
            ],
            'vendor-query': ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
