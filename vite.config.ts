import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync } from "fs";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'ensure-react-vendor-first',
      generateBundle(options, bundle) {
        // Garantir que react-vendor seja o primeiro chunk a ser carregado
        const reactVendorChunk = Object.keys(bundle).find(key => 
          key.includes('react-vendor')
        );
        if (reactVendorChunk) {
          // Marcar como prioritário
          const chunk = bundle[reactVendorChunk];
          if (chunk.type === 'chunk') {
            chunk.isEntry = false; // Não é entry, mas será preloadado primeiro
          }
        }
      },
      transformIndexHtml(html) {
        // Garantir que react-vendor seja preloadado ANTES de vendor e outros chunks
        const reactVendorPreload = html.match(/<link[^>]*react-vendor[^>]*>/);
        const vendorPreload = html.match(/<link[^>]*vendor[^>]*>/);
        const scriptTag = html.match(/<script[^>]*type="module"[^>]*src="[^"]*index[^"]*"[^>]*>/);
        
        if (reactVendorPreload && vendorPreload && scriptTag) {
          // Remover todos os preloads existentes
          html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '');
          
          // Reinserir na ordem correta: react-vendor PRIMEIRO, depois vendor, depois outros
          const allPreloads = html.match(/<link[^>]*rel="modulepreload"[^>]*>/g) || [];
          const otherPreloads = allPreloads.filter(p => 
            !p.includes('react-vendor') && !p.includes('vendor')
          ).join('\n    ');
          
          // Inserir na ordem: react-vendor, vendor, outros chunks, script
          html = html.replace(
            scriptTag[0],
            `${reactVendorPreload[0]}\n    ${vendorPreload[0]}${otherPreloads ? '\n    ' + otherPreloads : ''}\n    ${scriptTag[0]}`
          );
        }
        
        return html;
      }
    }
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    chunkSizeWarningLimit: 2000, // Aumentar para evitar warnings
    rollupOptions: {
      external: ["ioredis"],
      output: {
        // Garantir ordem de carregamento: react-vendor deve vir antes de tudo
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'react-vendor') {
            return 'assets/react-vendor-[hash].js';
          }
          return 'assets/[name]-[hash].js';
        },
        manualChunks: (id) => {
          // ✅ CRÍTICO: Separar React e React-DOM PRIMEIRO
          // Deve ser verificado ANTES de qualquer outro node_modules
          // Lista de exceções (bibliotecas que contêm "react" no nome mas não são React core)
          const reactExceptions = [
            "react-router",
            "react-hook-form",
            "react-window",
            "react-day-picker",
            "react-resizable-panels",
            "react-query",
            "@tanstack/react-query",
            "react-beautiful-dnd",
            "react-select",
            "react-virtualized"
          ];
          
          // Verificar se é React core (não está na lista de exceções)
          const isReactCore = id.includes("node_modules/react") && 
                             !reactExceptions.some(exception => id.includes(exception));
          
          // Verificar se é React-DOM
          const isReactDOM = id.includes("node_modules/react-dom");
          
          if (isReactCore || isReactDOM) {
            return "react-vendor";
          }
          
          // Separar outras dependências vendor
          if (id.includes("node_modules")) {
            return "vendor";
          }

          // Chunks por feature
          if (id.includes("/src/components/Admin/") || id.includes("/src/pages/Admin/"))
            return "admin-chunk";
          if (
            id.includes("/src/components/profile/") ||
            id.includes("/src/pages/UserProfile") ||
            id.includes("/src/pages/PublicUserProfile")
          )
            return "profile-chunk";
          if (
            id.includes("/src/components/rankings/") ||
            id.includes("/src/modules/rankings/") ||
            id.includes("/src/services/rankingService")
          )
            return "ranking-chunk";
          if (
            id.includes("/src/components/resultados/") ||
            id.includes("/src/hooks/useResultadosData") ||
            id.includes("/src/hooks/useAnswerSheet")
          )
          return "resultados-chunk";
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "@radix-ui/react-dialog",
      "@radix-ui/react-slot",
      "@radix-ui/react-toast",
      "lucide-react",
      "sonner",
    ],
  },
}));
