
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Menu from "./components/Menu";
import Index from "./pages/Index";
import Editais from "./pages/Editais";
import PreClassificacao from "./pages/PreClassificacao";
import Resultado from "./pages/Resultado";
import Nomeacoes from "./pages/Nomeacoes";
import ConcursoDetails from "./pages/ConcursoDetails";
import ResultadosPage from "./pages/ResultadosPage";
import NotFound from "./pages/NotFound";
import ConcursosPage from "./pages/ConcursosPage";
import CebraspeConcursos from "./pages/CebraspeConcursos";
import FCCConcursos from "./pages/FCCConcursos";
import FGVConcursos from "./pages/FGVConcursos";
import VunespConcursos from "./pages/VunespConcursos";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Menu />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/editais" element={<Editais />} />
            <Route path="/concursos" element={<ConcursosPage />} />
            <Route path="/concursos/cebraspe" element={<CebraspeConcursos />} />
            <Route path="/concursos/fcc" element={<FCCConcursos />} />
            <Route path="/concursos/fgv" element={<FGVConcursos />} />
            <Route path="/concursos/vunesp" element={<VunespConcursos />} />
            <Route path="/pre-classificacao" element={<PreClassificacao />} />
            <Route path="/resultado" element={<Resultado />} />
            <Route path="/nomeacoes" element={<Nomeacoes />} />
            <Route path="/concurso/:id" element={<ConcursoDetails />} />
            <Route path="/concurso/:id/resultados" element={<ResultadosPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
