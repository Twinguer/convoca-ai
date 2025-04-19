import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster as SonnerToaster } from 'sonner';
import { Loader2 } from 'lucide-react';

// Layouts
import MainLayout from '@/layouts/MainLayout';
import AdminLayout from '@/layouts/AdminLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Pages that don't need lazy loading
import Home from '@/pages/Home';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import ForgotPassword from '@/pages/Auth/ForgotPassword';
import ResetPassword from '@/pages/Auth/ResetPassword';
import VerifyEmail from '@/pages/Auth/VerifyEmail';
import AuthCallback from '@/pages/Auth/AuthCallback';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';

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
        <ThemeProvider>
          <AuthProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Home />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="terms-of-service" element={<TermsOfService />} />
                  <Route path="pre-classificacao" element={<PreClassificacao />} />
                  <Route path="criar-ranking" element={<CriarRanking />} />
                  <Route path="concurso/:id" element={<ConcursoDetails />} />
                  <Route path="concurso/:id/resultados" element={<ConcursoResultados />} />
                </Route>

                {/* Auth routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route index element={<Login />} />
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                  <Route path="reset-password" element={<ResetPassword />} />
                  <Route path="verify" element={<VerifyEmail />} />
                  <Route path="callback" element={<AuthCallback />} />
                </Route>

                {/* Protected routes */}
                <Route path="/dashboard" element={<MainLayout requireAuth />}>
                  <Route index element={<Dashboard />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>

                {/* Admin routes */}
                <Route path="/project/admin" element={<AdminLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<AdminDashboard />} />
                  <Route path="man/users" element={<UserManagement />} />
                  <Route path="man/concursos" element={<ConcursoManagement />} />
                  <Route path="man/concursos/novo" element={<CreateRanking />} />
                  <Route path="man/concursos/editar/:id" element={<CreateRanking />} />
                </Route>

                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
            <Toaster />
            <SonnerToaster position="top-right" />
          </AuthProvider>
        </ThemeProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </Router>
  );
}

export default App;
