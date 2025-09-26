
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Menu from "./components/Menu";
import FloatingTimer from "./components/FloatingTimer";
import { TimerProvider } from "./contexts/TimerContext";
import { useTimer } from "./contexts/TimerContext";
import Index from "./pages/Index";
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
import { SecureAdminLogin } from "./components/Admin/SecureLogin";
import AdminDashboard from "./pages/Admin/Dashboard";
import ListarConcursos from "./pages/Admin/ListarConcursos";
import ListarUsuarios from "./pages/Admin/ListarUsuarios";
import AdminLayout from "./components/Admin/AdminLayout";
import ProtectedRoute from "./components/Admin/ProtectedRoute";
import CriarRanking from "./pages/CriarRanking";
import EstudosDashboard from "./pages/Estudos/Dashboard";
import Cronograma from "./pages/Estudos/Cronograma";
import Timer from "./pages/Estudos/Timer";
import Estatisticas from "./pages/Estudos/Estatisticas";
import CriarCiclo from "./pages/Estudos/CriarCiclo";
import EditarCiclo from "./pages/Estudos/EditarCiclo";
import SessaoEstudos from "./pages/Estudos/SessaoEstudos";
import CicloDetalhes from "./pages/Estudos/CicloDetalhes";
import Planos from "./pages/Planos";


const AppContent = () => {
  const { showFloatingTimer, hideTimer } = useTimer();
  
  return (
    <div className="min-h-screen text-foreground bg-background">
      <Toaster />
      <Sonner />
      <BrowserRouter>
                  <Routes>
                    <Route path="/project/admin/man/login" element={<SecureAdminLogin />} />
                    <Route path="/project/admin/man" element={<Navigate to="/project/admin/man/dashboard" replace />} />
                    <Route path="/project/admin/man" element={<ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="concursos" element={<ListarConcursos />} />
                      <Route path="usuarios" element={<ListarUsuarios />} />
                    </Route>
                    <Route path="/admin/login" element={<Navigate to="/project/admin/man/login" replace />} />
                    <Route path="/admin/*" element={<Navigate to="/project/admin/man" replace />} />
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
                    <Route path="/criar-ranking" element={<>
                        <Menu />
                        <CriarRanking />
                      </>} />
                     <Route path="/estudos" element={<>
                         <Menu />
                         <EstudosDashboard />
                       </>} />
                     <Route path="/estudos/cronograma" element={<>
                         <Menu />
                         <Cronograma />
                       </>} />
                    <Route path="/estudos/timer" element={<>
                        <Menu />
                        <Timer />
                      </>} />
                     <Route path="/estatisticas" element={<>
                        <Menu />
                        <Estatisticas />
                      </>} />
                     <Route path="/estudos/criar-ciclo" element={<>
                        <Menu />
                        <CriarCiclo />
                      </>} />
                     <Route path="/estudos/editar-ciclo/:id" element={<>
                        <Menu />
                        <EditarCiclo />
                      </>} />
                      <Route path="/estudos/ciclo/:id" element={<>
                        <Menu />
                        <CicloDetalhes />
                      </>} />
                       <Route path="/estudos/sessao/:id" element={<>
                         <Menu />
                         <SessaoEstudos />
                       </>} />
                    <Route path="/pre-classificacao" element={<>
                        <Menu />
                        <PreClassificacao />
                      </>} />
                    <Route path="/planos" element={<>
                        <Menu />
                        <Planos />
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
        <FloatingTimer
          isOpen={showFloatingTimer}
          onClose={hideTimer}
        />
      </BrowserRouter>
    </div>
  );
};

const App = () => {
  const queryClient = new QueryClient();
  return <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="system" storageKey="convoca-ui-theme" attribute="class" enableSystem>
          <AuthProvider>
            <TimerProvider>
              <TooltipProvider>
                <AppContent />
              </TooltipProvider>
            </TimerProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>;
};

export default App;
