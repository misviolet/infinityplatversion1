import { defineConfig } from 'vite';
import angular from '@analogjs/vite-plugin-angular';

export default defineConfig({
  plugins: [angular()],
  optimizeDeps: {
    exclude: ['@supabase/supabase-js', 'lucide'],
  },
  server: {
    host: true,
    strictPort: true,
    port: 5173,
    hmr: {
      clientPort: 5173,
    },
  },
});
