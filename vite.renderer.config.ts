import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config
export default defineConfig({
  resolve: {
    alias: {
      'monaco-editor': resolve(__dirname, 'node_modules/monaco-editor')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split monaco editor into a separate chunk
          'monaco-editor': ['monaco-editor']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['monaco-editor']
  },
  define: {
    'process.env.MONACO_EDITOR_NO_WORKER': 'true'
  }
});
