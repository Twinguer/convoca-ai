import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
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
        manualChunks: (id) => {
          // Separar React e React-DOM em chunk próprio para garantir disponibilidade
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/")) {
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
      "@radix-ui/react-dialog",
      "@radix-ui/react-slot",
      "@radix-ui/react-toast",
      "lucide-react",
      "sonner",
    ],
  },
}));
