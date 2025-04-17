import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import AdminLogin from "./pages/Admin/Login";
import AdminDashboard from "./pages/Admin/Dashboard";
import ListarConcursos from "./pages/Admin/ListarConcursos";
import NovoConcurso from "./pages/Admin/NovoConcurso";
import GabaritoEditor from "./pages/Admin/GabaritoEditor";
import AdminLayout from "./components/Admin/AdminLayout";
import ProtectedRoute from "./components/Admin/ProtectedRoute";
import CriarRanking from "./pages/CriarRanking";

const App = () => {
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/project/admin/man/login" element={<AdminLogin />} />
                <Route path="/project/admin/man" element={<Navigate to="/project/admin/man/dashboard" replace />} />
                <Route path="/project/admin/man" element={
                  <ProtectedRoute>
                    <AdminLayout />
                  </ProtectedRoute>
                }>
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="concursos" element={<ListarConcursos />} />
                  <Route path="concursos/novo" element={<NovoConcurso />} />
                  <Route path="concursos/editar/:id" element={<NovoConcurso />} />
                  <Route path="concursos/gabarito/:id" element={<GabaritoEditor />} />
                </Route>
                <Route path="/admin/login" element={<Navigate to="/project/admin/man/login" replace />} />
                <Route path="/admin/*" element={<Navigate to="/project/admin/man" replace />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/perfil" element={
                  <>
                    <Menu />
                    <UserProfile />
                  </>
                } />
                <Route path="/usuario/:id" element={
                  <>
                    <Menu />
                    <PublicUserProfile />
                  </>
                } />
                <Route path="/seguidores" element={
                  <>
                    <Menu />
                    <UserFollowers />
                  </>
                } />
                <Route path="/" element={
                  <>
                    <Menu />
                    <Index />
                  </>
                } />
                <Route path="/comunidade" element={
                  <>
                    <Menu />
                    <Comunidade />
                  </>
                } />
                <Route path="/editais" element={
                  <>
                    <Menu />
                    <Editais />
                  </>
                } />
                <Route path="/pre-classificacao" element={
                  <>
                    <Menu />
                    <PreClassificacao />
                  </>
                } />
                <Route path="/criar-ranking" element={
                  <>
                    <Menu />
                    <CriarRanking />
                  </>
                } />
                <Route path="/resultado" element={
                  <>
                    <Menu />
                    <Resultado />
                  </>
                } />
                <Route path="/concurso/:id" element={
                  <>
                    <Menu />
                    <ConcursoDetails />
                  </>
                } />
                <Route path="/concurso/:id/resultados" element={
                  <>
                    <Menu />
                    <ResultadosPage />
                  </>
                } />
                <Route path="/concurso/:id/participar" element={
                  <>
                    <Menu />
                    <ConcursoParticipation />
                  </>
                } />
                <Route path="*" element={
                  <>
                    <Menu />
                    <NotFound />
                  </>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
