
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster as SonnerToaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';
import NotFound from '@/pages/NotFound';
import Index from '@/pages/Index';

// Lazy loaded pages
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const ConcursoDetails = lazy(() => import('@/pages/ConcursoDetails'));
const PreClassificacao = lazy(() => import('@/pages/PreClassificacao'));
const CriarRanking = lazy(() => import('@/pages/CriarRanking'));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

// Loading component for Suspense
const Loading = () => (
  <div className="flex items-center justify-center h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light">
          <Suspense fallback={<Loading />}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<div>Home Page</div>}>
                <Route index element={<Index />} />
                <Route path="privacy-policy" element={<div>Privacy Policy</div>} />
                <Route path="terms-of-service" element={<div>Terms of Service</div>} />
                <Route path="pre-classificacao" element={<PreClassificacao />} />
                <Route path="criar-ranking" element={<CriarRanking />} />
                <Route path="concurso/:id" element={<ConcursoDetails />} />
                <Route path="concurso/:id/resultados" element={<div>Concurso Resultados</div>} />
              </Route>

              {/* Admin routes */}
              <Route path="/project/admin" element={<div>Admin Layout</div>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="man/users" element={<div>User Management</div>} />
                <Route path="man/concursos" element={<div>Concurso Management</div>} />
                <Route path="man/concursos/novo" element={<CriarRanking />} />
                <Route path="man/concursos/editar/:id" element={<CriarRanking />} />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <Toaster />
          <SonnerToaster position="top-right" />
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
