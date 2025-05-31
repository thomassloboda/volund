import { defineConfig } from 'vite';
import { builtinModules } from 'module';

// https://vitejs.dev/config
export default defineConfig({
  build: {
    rollupOptions: {
      external: [
        ...builtinModules,
        'better-sqlite3'
      ],
      output: {
        format: 'cjs'
      }
    }
  },
  plugins: [
    {
      name: 'configure-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
          res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
          next();
        });
      }
    }
  ],
  optimizeDeps: {
    exclude: ['better-sqlite3']
  }
});
