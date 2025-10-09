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
import ConfirmacaoSucesso from "./pages/Auth/ConfirmacaoSucesso";
import UserProfile from "./pages/UserProfile";
import PublicUserProfile from "./pages/PublicUserProfile";
import Notifications from "./pages/Notifications";
import { AuthProvider } from "./hooks/useAuth";
import UserFollowers from "./pages/UserFollowers";
import { SecureAdminLogin } from "./components/Admin/SecureLogin";
import AdminDashboard from "./pages/Admin/Dashboard";
import ListarConcursos from "./pages/Admin/ListarConcursos";
import ListarUsuarios from "./pages/Admin/ListarUsuarios";
import VouchersManager from "./pages/Admin/VouchersManager";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminProtectedRoute from "./components/Admin/ProtectedRoute";
import { ProtectedRoute } from "./components/Security/ProtectedRoute";
import { SecureConcursoRoute } from "./components/Security/SecureConcursoRoute";
import { SecureUserRoute } from "./components/Security/SecureUserRoute";
import CriarRanking from "./pages/CriarRanking";
import EstudosDashboard from "./modules/study/pages/StudyDashboard";
import Cronograma from "./pages/Estudos/Cronograma";
import Timer from "./pages/Estudos/Timer";
import StatisticsPage from "./modules/statistics/pages/StatisticsPage";
import CriarCiclo from "./pages/Estudos/CriarCiclo";
import EditarCiclo from "./pages/Estudos/EditarCiclo";
import SessaoEstudos from "./pages/Estudos/SessaoEstudos";
import CicloDetalhes from "./pages/Estudos/CicloDetalhes";
import Planos from "./pages/Planos";
import CommunityPage from "./modules/community/pages/CommunityPage";
import RankingsPage from "./modules/rankings/pages/RankingsPage";
import FAQ from "./pages/FAQ";
import TermosDeUso from "./pages/TermosDeUso";
import PoliticaDePrivacidade from "./pages/PoliticaDePrivacidade";
const AppContent = () => {
  const {
    showFloatingTimer,
    hideTimer
  } = useTimer();
  return <>
      <div className="min-h-screen h-full w-full text-foreground bg-page-background">
      <Toaster />
      <Sonner />
      
      <BrowserRouter>
                  <Routes>
                    <Route path="/project/admin/man/login" element={<SecureAdminLogin />} />
                    <Route path="/project/admin/man" element={<Navigate to="/project/admin/man/dashboard" replace />} />
                    <Route path="/project/admin/man" element={<AdminProtectedRoute>
                        <AdminLayout />
                      </AdminProtectedRoute>}>
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="concursos" element={<ListarConcursos />} />
                      <Route path="usuarios" element={<ListarUsuarios />} />
                      <Route path="vouchers" element={<VouchersManager />} />
                    </Route>
                    <Route path="/admin/login" element={<Navigate to="/project/admin/man/login" replace />} />
                    <Route path="/admin/*" element={<Navigate to="/project/admin/man" replace />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/confirmacao-sucesso" element={<ConfirmacaoSucesso />} />
                    <Route path="/perfil" element={<>
                        <Menu />
                        <UserProfile />
                      </>} />
                     <Route path="/usuario/profile/:token" element={<>
                        <Menu />
                        <SecureUserRoute action="profile">
                          <PublicUserProfile />
                        </SecureUserRoute>
                      </>} />
                     <Route path="/usuario/followers/:token" element={<>
                        <Menu />
                        <SecureUserRoute action="followers">
                          <UserFollowers />
                        </SecureUserRoute>
                      </>} />
                     <Route path="/usuario/following/:token" element={<>
                        <Menu />
                        <SecureUserRoute action="following">
                          <UserFollowers />
                        </SecureUserRoute>
                      </>} />
                    {/* Rotas legadas - redirecionar para versão segura */}
                    <Route path="/usuario/:id" element={<Navigate to="/comunidade" replace />} />
                    <Route path="/usuario/:id/seguidores" element={<Navigate to="/comunidade" replace />} />
                    <Route path="/usuario/:id/seguindo" element={<Navigate to="/comunidade" replace />} />
                     <Route path="/seguidores" element={<>
                         <Menu />
                         <UserFollowers />
                       </>} />
                     <Route path="/notificacoes" element={<>
                         <Menu />
                         <ProtectedRoute>
                           <Notifications />
                         </ProtectedRoute>
                       </>} />
                    <Route path="/" element={<>
                        <Menu />
                        <Index />
                      </>} />
                     <Route path="/comunidade" element={<>
                          <Menu />
                          <CommunityPage />
                        </>} />
                    <Route path="/faq" element={<>
                        <Menu />
                        <FAQ />
                      </>} />
                    <Route path="/termos-de-uso" element={<>
                        <Menu />
                        <TermosDeUso />
                      </>} />
                    <Route path="/politica-de-privacidade" element={<>
                        <Menu />
                        <PoliticaDePrivacidade />
                      </>} />
                    <Route path="/criar-ranking" element={<>
                        <Menu />
                        <CriarRanking />
                      </>} />
                     <Route path="/estudos" element={<>
                         <Menu />
                         <ProtectedRoute>
                           <EstudosDashboard />
                         </ProtectedRoute>
                       </>} />
                     <Route path="/estudos/cronograma" element={<>
                         <Menu />
                         <ProtectedRoute>
                           <Cronograma />
                         </ProtectedRoute>
                       </>} />
                    <Route path="/estudos/timer" element={<>
                        <Menu />
                        <ProtectedRoute>
                          <Timer />
                        </ProtectedRoute>
                      </>} />
                     <Route path="/estatisticas" element={<>
                         <Menu />
                         <ProtectedRoute>
                           <StatisticsPage />
                         </ProtectedRoute>
                       </>} />
                     <Route path="/estudos/criar-ciclo" element={<>
                        <Menu />
                        <ProtectedRoute>
                          <CriarCiclo />
                        </ProtectedRoute>
                      </>} />
                     <Route path="/estudos/editar-ciclo/:id" element={<>
                        <Menu />
                        <ProtectedRoute>
                          <EditarCiclo />
                        </ProtectedRoute>
                      </>} />
                      <Route path="/estudos/ciclo/:id" element={<>
                        <Menu />
                        <ProtectedRoute>
                          <CicloDetalhes />
                        </ProtectedRoute>
                      </>} />
                       <Route path="/estudos/sessao/:id" element={<>
                         <Menu />
                         <ProtectedRoute>
                           <SessaoEstudos />
                         </ProtectedRoute>
                       </>} />
                     <Route path="/pre-classificacao" element={<>
                          <Menu />
                          <RankingsPage />
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
                    <Route path="/concurso/resultados/:token" element={<> 
                        <Menu />
                        <SecureConcursoRoute action="resultados">
                          <ResultadosPage />
                        </SecureConcursoRoute>
                      </>} />
                    <Route path="/concurso/participar/:token" element={<> 
                        <Menu />
                        <SecureConcursoRoute action="participar">
                          <ConcursoParticipation />
                        </SecureConcursoRoute>
                      </>} />
                    {/* Rotas legadas - redirecionar para versão segura */}
                    <Route path="/concurso/:id/resultados" element={<Navigate to="/pre-classificacao" replace />} />
                    <Route path="/concurso/:id/participar" element={<Navigate to="/pre-classificacao" replace />} />
                    <Route path="*" element={<>
                        <Menu />
                        <NotFound />
                      </>} />
                  </Routes>
        <FloatingTimer isOpen={showFloatingTimer} onClose={hideTimer} />
      </BrowserRouter>
      </div>
    </>;
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