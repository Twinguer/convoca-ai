
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { Toaster as SonnerToaster } from 'sonner';
import { Loader2 } from 'lucide-react';
import { ThemeProvider } from '@/components/theme-provider';

// Lazy loaded pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Profile = lazy(() => import('@/pages/Profile'));
const Settings = lazy(() => import('@/pages/Settings'));
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard'));
const UserManagement = lazy(() => import('@/pages/Admin/UserManagement'));
const ConcursoManagement = lazy(() => import('@/pages/Admin/ConcursoManagement'));
const CreateRanking = lazy(() => import('@/pages/Admin/CreateRanking'));
const ConcursoDetails = lazy(() => import('@/pages/ConcursoDetails'));
const ConcursoResultados = lazy(() => import('@/pages/ConcursoResultados'));
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
                <Route index element={<div>Home Content</div>} />
                <Route path="privacy-policy" element={<div>Privacy Policy</div>} />
                <Route path="terms-of-service" element={<div>Terms of Service</div>} />
                <Route path="pre-classificacao" element={<PreClassificacao />} />
                <Route path="criar-ranking" element={<CriarRanking />} />
                <Route path="concurso/:id" element={<ConcursoDetails />} />
                <Route path="concurso/:id/resultados" element={<ConcursoResultados />} />
              </Route>

              {/* Admin routes */}
              <Route path="/project/admin" element={<div>Admin Layout</div>}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="man/users" element={<UserManagement />} />
                <Route path="man/concursos" element={<ConcursoManagement />} />
                <Route path="man/concursos/novo" element={<CreateRanking />} />
                <Route path="man/concursos/editar/:id" element={<CreateRanking />} />
              </Route>

              {/* 404 route */}
              <Route path="*" element={<div>Not Found</div>} />
            </Routes>
          </Suspense>
          <Toaster />
          <SonnerToaster position="top-right" />
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Router>
  );
}

export default App;
