
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
import Nomeacoes from "./pages/Nomeacoes";
import ConcursoDetails from "./pages/ConcursoDetails";
import ResultadosPage from "./pages/ResultadosPage";
import NotFound from "./pages/NotFound";
import ConcursosPage from "./pages/ConcursosPage";
import CebraspeConcursos from "./pages/CebraspeConcursos";
import FCCConcursos from "./pages/FCCConcursos";
import FGVConcursos from "./pages/FGVConcursos";
import VunespConcursos from "./pages/VunespConcursos";
import ConcursoParticipation from "./pages/ConcursoParticipation";
import Auth from "./pages/Auth/Auth";
import { AuthProvider } from "./hooks/useAuth";

// Admin pages
import AdminLogin from "./pages/Admin/Login";
import AdminLayout from "./components/Admin/AdminLayout";
import AdminDashboard from "./pages/Admin/Dashboard";
import NovoConcurso from "./pages/Admin/NovoConcurso";
import ListarConcursos from "./pages/Admin/ListarConcursos";
import ProtectedRoute from "./components/Admin/ProtectedRoute";

// Create a client
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="concursos" element={<ListarConcursos />} />
                <Route path="concursos/novo" element={<NovoConcurso />} />
                <Route path="concursos/editar/:id" element={<NovoConcurso />} />
              </Route>
              
              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Public Routes */}
              <Route path="/" element={
                <>
                  <Menu />
                  <Index />
                </>
              } />
              <Route path="/editais" element={
                <>
                  <Menu />
                  <Editais />
                </>
              } />
              <Route path="/concursos" element={
                <>
                  <Menu />
                  <ConcursosPage />
                </>
              } />
              <Route path="/concursos/cebraspe" element={
                <>
                  <Menu />
                  <CebraspeConcursos />
                </>
              } />
              <Route path="/concursos/fcc" element={
                <>
                  <Menu />
                  <FCCConcursos />
                </>
              } />
              <Route path="/concursos/fgv" element={
                <>
                  <Menu />
                  <FGVConcursos />
                </>
              } />
              <Route path="/concursos/vunesp" element={
                <>
                  <Menu />
                  <VunespConcursos />
                </>
              } />
              <Route path="/pre-classificacao" element={
                <>
                  <Menu />
                  <PreClassificacao />
                </>
              } />
              <Route path="/resultado" element={
                <>
                  <Menu />
                  <Resultado />
                </>
              } />
              <Route path="/nomeacoes" element={
                <>
                  <Menu />
                  <Nomeacoes />
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
  );
};

export default App;
