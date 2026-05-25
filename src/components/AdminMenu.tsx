import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useSecureAdminUrls } from '@/services/adminUrlObfuscation';
import { adminResourcePath } from '@/config/adminRoutes';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, FileText, Users, Gift } from 'lucide-react';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

const AdminMenu = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { generateSecureUrl } = useSecureAdminUrls();
  const [secureUrls, setSecureUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateUrls = async () => {
      if (!user?.id) return;
      
      try {
        const urls = await Promise.all([
          generateSecureUrl(user.id, 'dashboard'),
          generateSecureUrl(user.id, 'concursos'),
          generateSecureUrl(user.id, 'usuarios'),
          generateSecureUrl(user.id, 'vouchers')
        ]);

        setSecureUrls({
          dashboard: urls[0],
          concursos: urls[1],
          usuarios: urls[2],
          vouchers: urls[3]
        });
      } catch (error) {
        devLog.error('Erro ao gerar URLs seguras:', error);
        // Fallback para URLs não ofuscadas
        setSecureUrls({
          dashboard: adminResourcePath('dashboard'),
          concursos: adminResourcePath('concursos'),
          usuarios: adminResourcePath('usuarios'),
          vouchers: adminResourcePath('vouchers'),
        });
      } finally {
        setLoading(false);
      }
    };

    generateUrls();
  }, [user?.id, generateSecureUrl]);

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" disabled>
          <LayoutDashboard className="h-4 w-4 mr-2" />
          Carregando...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigate(secureUrls.dashboard)}
        className="flex items-center"
      >
        <LayoutDashboard className="h-4 w-4 mr-2" />
        Dashboard
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigate(secureUrls.concursos)}
        className="flex items-center"
      >
        <FileText className="h-4 w-4 mr-2" />
        Concursos
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigate(secureUrls.usuarios)}
        className="flex items-center"
      >
        <Users className="h-4 w-4 mr-2" />
        Usuários
      </Button>
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => navigate(secureUrls.vouchers)}
        className="flex items-center"
      >
        <Gift className="h-4 w-4 mr-2" />
        Vouchers
      </Button>
    </div>
  );
};

export default AdminMenu;
