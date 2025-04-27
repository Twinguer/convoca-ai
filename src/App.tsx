
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Menu from "./components/Menu";
import Index from "./pages/Index";
import Editais from "./pages/Editais";
import PreClassificacao from "./pages/PreClassificacao";
import Resultado from "./pages/Resultado";
import ConcursoDetails from "./pages/ConcursoDetails";
import ResultadosPage from "./pages/ResultadosPage";
import NotFound from "./pages/NotFound";
import ConcursoParticipation from "./pages/ConcursoParticipation";
import Auth from "./pages/Auth/Auth";
import UserProfile from "./pages/UserProfile";
import PublicUserProfile from "./pages/PublicUserProfile";
import { AuthProvider } from "./hooks/useAuth";
import UserFollowers from "./pages/UserFollowers";
import Comunidade from "./pages/Comunidade";
import CriarRanking from "./pages/CriarRanking";

const App = () => {
  const queryClient = new QueryClient();
  return <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="convoca-ui-theme">
          <AuthProvider>
            <TooltipProvider>
              <div className="min-h-screen text-foreground bg-zinc-50">
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/perfil" element={<>
                        <Menu />
                        <UserProfile />
                      </>} />
                    <Route path="/usuario/:id" element={<>
                        <Menu />
                        <PublicUserProfile />
                      </>} />
                    <Route path="/seguidores" element={<>
                        <Menu />
                        <UserFollowers />
                      </>} />
                    <Route path="/" element={<>
                        <Menu />
                        <Index />
                      </>} />
                    <Route path="/comunidade" element={<>
                        <Menu />
                        <Comunidade />
                      </>} />
                    <Route path="/editais" element={<>
                        <Menu />
                        <Editais />
                      </>} />
                    <Route path="/pre-classificacao" element={<>
                        <Menu />
                        <PreClassificacao />
                      </>} />
                    <Route path="/criar-ranking" element={<>
                        <Menu />
                        <CriarRanking />
                      </>} />
                    <Route path="/resultado" element={<>
                        <Menu />
                        <Resultado />
                      </>} />
                    <Route path="/concurso/:id" element={<>
                        <Menu />
                        <ConcursoDetails />
                      </>} />
                    <Route path="/concurso/:id/resultados" element={<>
                        <Menu />
                        <ResultadosPage />
                      </>} />
                    <Route path="/concurso/:id/participar" element={<>
                        <Menu />
                        <ConcursoParticipation />
                      </>} />
                    <Route path="*" element={<>
                        <Menu />
                        <NotFound />
                      </>} />
                  </Routes>
                </BrowserRouter>
              </div>
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>;
};

export default App;
