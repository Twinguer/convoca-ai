import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { readFileSync, writeFileSync } from "fs";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    {
      name: 'ensure-react-vendor-first',
      writeBundle(options, bundle) {
        // Modificar o HTML após o build para garantir ordem correta
        const htmlPath = path.resolve(options.dir || 'dist', 'index.html');
        try {
          let html = readFileSync(htmlPath, 'utf-8');
          
          // Encontrar o react-vendor e o script principal
          const reactVendorMatch = html.match(/<link[^>]*react-vendor[^>]*href=["']([^"']+)["'][^>]*>/);
          const scriptTag = html.match(/<script[^>]*type=["']module["'][^>]*src=["']([^"']*index[^"']*)["'][^>]*>/);
          
          if (reactVendorMatch && scriptTag) {
            const reactVendorPath = reactVendorMatch[1];
            
            // Remover o modulepreload do react-vendor
            html = html.replace(/<link[^>]*react-vendor[^>]*>/g, '');
            
            // Inserir script tag ANTES do script principal
            html = html.replace(
              scriptTag[0],
              `<script type="module" crossorigin src="${reactVendorPath}"></script>\n    ${scriptTag[0]}`
            );
            
            // Escrever o HTML modificado
            writeFileSync(htmlPath, html, 'utf-8');
          }
        } catch (error) {
          console.warn('Failed to modify index.html:', error);
        }
      }
    }
  ],
  resolve: {
    alias: { 
      "@": path.resolve(__dirname, "./src"),
      // ✅ CRÍTICO: Garantir que React seja sempre um singleton
      // Isso força todos os imports de React a apontarem para o mesmo módulo
      "react": path.resolve(__dirname, "./node_modules/react"),
      "react-dom": path.resolve(__dirname, "./node_modules/react-dom"),
    },
    dedupe: ["react", "react-dom"], // Garantir que não haja duplicatas
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
