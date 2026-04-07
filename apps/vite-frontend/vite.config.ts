import path from 'node:path';
import {defineConfig, loadEnv, type PluginOption} from 'vite';
import react from '@vitejs/plugin-react';
import {visualizer} from 'rollup-plugin-visualizer';

function normalizeBackendOrigin(backendUrl: string): string {
  return backendUrl.replace(/\/api\/v1\/?$/u, '').replace(/\/$/u, '');
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '../../', '');
  const backendOrigin = normalizeBackendOrigin(env.VITE_BACKEND_URL || 'http://localhost:4000');
  const isAnalyze = env.ANALYZE === 'true';

  const plugins: PluginOption[] = [react()];

  if (isAnalyze) {
    plugins.push(
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }) as PluginOption,
    );
  }

  return {
    plugins,
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
      cssCodeSplit: true,
      reportCompressedSize: false,
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
            'vendor-i18n': ['i18next', 'i18next-http-backend', 'react-i18next'],
            'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
            'vendor-ui': ['sonner', 'lucide-react', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          },
        },
      },
    },
  };
});
