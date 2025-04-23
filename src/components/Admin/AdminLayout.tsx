
import React, { useEffect } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, Plus, ListChecks, LogOut, ArrowLeft, Users } from 'lucide-react';

const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if the user is authenticated
    const isAuthenticated = localStorage.getItem('adminAuth') === 'true';
    if (!isAuthenticated) {
      navigate('/project/admin/man/login');
    }
  }, [navigate]);
  
  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    navigate('/project/admin/man/login');
  };
  
  const handleVisitSite = () => {
    // Open the main site in a new tab with admin view flag
    window.open('/?admin=true', '_blank');
  };
  
  return <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-gray-800">Convoca AI Admin</h1>
          </div>
          <div className="flex items-center gap-2">
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
        <aside className="w-64 bg-white border-r hidden md:block">
          <nav className="p-4 space-y-2">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/project/admin/man/dashboard" className="flex items-center gap-2">
                <Home className="h-4 w-4" />
                Dashboard
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link to="/project/admin/man/concursos/novo" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Novo Ranking
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
