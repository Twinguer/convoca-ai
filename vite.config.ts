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
    react()
  ],
  resolve: {
    alias: { 
      "@": path.resolve(__dirname, "./src"),
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
          // ✅ CRÍTICO: Isolar apenas React e React-DOM core e suas dependências internas
          // Usar Set para verificação mais eficiente
          const reactCorePackages = new Set([
            "react",
            "react-dom",
            "scheduler",
            "object-assign",
            "loose-envify"
          ]);
          
          // Normalizar o caminho para extrair o nome do pacote
          const normalizedId = id.replace(/\\/g, "/");
          const pkgMatch = normalizedId.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
          const pkgName = pkgMatch?.[1];
          
          // Se for um pacote core do React, colocar em react-vendor
          if (pkgName && reactCorePackages.has(pkgName)) {
            return "react-vendor";
          }
          
          // Separar outras dependências vendor
          // IMPORTANTE: Bibliotecas que dependem de React devem ir para vendor,
          // mas React core deve estar isolado em react-vendor
          if (id.includes("node_modules")) {
            // Garantir que React core nunca vá para vendor
            if (id.includes("/react/") && !id.includes("/react-dom/") && 
                !id.includes("/react-router") && !id.includes("/react-hook-form") &&
                !id.includes("/react-query") && !id.includes("/@tanstack/react-query")) {
              // Verificar se é realmente React core (não uma biblioteca que usa React)
              if (pkgName === "react" || pkgName === "react-dom" || 
                  pkgName === "scheduler" || pkgName === "object-assign" || 
                  pkgName === "loose-envify") {
                return "react-vendor";
              }
            }
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
