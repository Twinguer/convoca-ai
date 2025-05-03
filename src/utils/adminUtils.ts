
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

// Função para verificar se o usuário atual é administrador
export const checkIsAdmin = async (userId: string | undefined): Promise<boolean> => {
  if (!userId) return false;
  
  try {
    // Verificar no perfil do usuário ou em uma tabela específica de administradores
    // Esta é uma implementação simplificada - você pode adaptar conforme necessário
    const { data, error } = await supabase
      .from('users_profiles')
      .select('is_admin')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Erro ao verificar permissões de administrador:', error);
      return false;
    }
    
    return !!data?.is_admin;
  } catch (error) {
    console.error('Erro ao verificar status de administrador:', error);
    return false;
  }
};

// Hook para verificação de administrador
export const useIsAdmin = (): { isAdmin: boolean, isLoading: boolean } => {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  
  React.useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setIsLoading(false);
        return;
      }
      
      try {
        const admin = await checkIsAdmin(user.id);
        setIsAdmin(admin);
      } catch (error) {
        console.error('Erro ao verificar status de administrador:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAdmin();
  }, [user]);
  
  return { isAdmin, isLoading };
};

// Adicionar React à função acima
import React from 'react';
