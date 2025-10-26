import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      external: ['ioredis'],
      output: {
        manualChunks: (id) => {
          // Vendor chunks - bibliotecas principais
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'form-vendor';
            }
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            if (id.includes('clsx') || id.includes('tailwind-merge') || id.includes('lucide-react')) {
              return 'utils-vendor';
            }
            return 'vendor';
          }
          
          // Feature chunks - funcionalidades específicas
          if (id.includes('/src/components/Admin/') || id.includes('/src/pages/Admin/')) {
            return 'admin-chunk';
          }
          if (id.includes('/src/components/profile/') || id.includes('/src/pages/UserProfile') || id.includes('/src/pages/PublicUserProfile')) {
            return 'profile-chunk';
          }
          if (id.includes('/src/components/rankings/') || id.includes('/src/modules/rankings/') || id.includes('/src/services/rankingService')) {
            return 'ranking-chunk';
          }
          if (id.includes('/src/components/resultados/') || id.includes('/src/hooks/useResultadosData') || id.includes('/src/hooks/useAnswerSheet')) {
            return 'resultados-chunk';
          }
        }
      }
    },
    chunkSizeWarningLimit: 1000, // Aumentar limite para 1MB
    target: 'esnext',
    minify: 'esbuild' // Usar esbuild em vez de terser
  },
  optimizeDeps: {
    include: ['react-window'],
  },
}));
