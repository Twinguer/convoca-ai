
import React from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ListChecks, LogOut, ArrowLeft, Users, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    try {
      // Log admin logout
      await supabase.rpc('log_admin_operation', {
        operation_type: 'admin_logout',
        operation_details: {
          logout_time: new Date().toISOString()
        }
      });

      await supabase.auth.signOut();
      toast.success('Logout realizado com sucesso');
      navigate('/project/admin/man/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erro ao fazer logout');
    }
  };
  
  const handleVisitSite = () => {
    // Open the main site in a new tab (remove insecure admin flag)
    window.open('/', '_blank');
  };
  
  const handleCreateRanking = () => {
    // Navigate to ranking creation (remove insecure admin flag)
    navigate('/criar-ranking');
  };
  
  return <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-foreground">Nomeia Aí Admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCreateRanking} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Criar Ranking
            </Button>
            <Button variant="outline" onClick={handleVisitSite} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Visualizar Site
            </Button>
            <Button variant="ghost" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border hidden md:block">
          <nav className="p-4 space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/project/admin/man/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/project/admin/man/concursos" className="flex items-center gap-2">
                <ListChecks className="h-4 w-4" />
                Listar Rankings
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/project/admin/man/usuarios" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Listar Usuários
              </Link>
            </Button>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>;
};

export default AdminLayout;
