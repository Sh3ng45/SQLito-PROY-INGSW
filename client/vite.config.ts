import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@controllers': '/src/controllers',
      '@models': '/src/models',
    },
  },
  plugins: [react()],
});
