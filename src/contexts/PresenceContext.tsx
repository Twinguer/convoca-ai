import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

interface PresenceContextValue {
  onlineUserIds: Set<string>;
  isOnline: (userId?: string | null) => boolean;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUserIds: new Set<string>(),
  isOnline: () => false,
});

export const PresenceProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());

  // Buscar usuários online do banco de dados periodicamente
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        // Verificar se o cliente Supabase está configurado corretamente
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        if (!supabaseUrl || supabaseUrl.includes('xuovcuefnullpmpktrzd')) {
          // Não tentar buscar se a URL estiver inválida
          devLog.warn('Supabase não configurado corretamente. Pulando busca de usuários online.');
          return;
        }

        const { data, error } = await supabase
          .from('users_profiles')
          .select('id')
          .eq('is_online', true);
        
        if (error) {
          // Não logar erros de rede como ERR_NAME_NOT_RESOLVED (URL inválida)
          if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
            devLog.warn('Erro de conexão ao buscar usuários online. Verifique a configuração do Supabase.');
            return;
          }
          devLog.error('Error fetching online users:', error);
          return;
        }
        
        const userIds = data?.map(user => user.id) || [];
        setOnlineUserIds(new Set(userIds));
      } catch (error: any) {
        // Não logar erros de rede como ERR_NAME_NOT_RESOLVED
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          devLog.warn('Erro de conexão ao buscar usuários online. Verifique a configuração do Supabase.');
          return;
        }
        devLog.error('Error in fetchOnlineUsers:', error);
      }
    };

    // Buscar imediatamente
    fetchOnlineUsers();

    // Configurar intervalo para buscar a cada 10 segundos
    const interval = setInterval(fetchOnlineUsers, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Verificar se o cliente Supabase está configurado corretamente
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl || supabaseUrl.includes('xuovcuefnullpmpktrzd')) {
      // Não configurar WebSocket se a URL estiver inválida
      devLog.warn('Supabase não configurado corretamente. Pulando configuração de WebSocket.');
      return;
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        channel = supabase.channel('online_users', {
          config: {
            presence: { key: user?.id || 'viewer' },
          },
        });

        channel
          .on('presence', { event: 'sync' }, () => {
            if (!isMounted) return;
            const state = channel!.presenceState();
            setOnlineUserIds(new Set(Object.keys(state)));
          })
          .on('presence', { event: 'join' }, () => {
            if (!isMounted) return;
            const state = channel!.presenceState();
            setOnlineUserIds(new Set(Object.keys(state)));
          })
          .on('presence', { event: 'leave' }, () => {
            if (!isMounted) return;
            const state = channel!.presenceState();
            setOnlineUserIds(new Set(Object.keys(state)));
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && user?.id) {
              await channel!.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              });
            }
          });
      } catch (error: any) {
        // Não logar erros de conexão WebSocket se a URL estiver inválida
        if (error?.message?.includes('Failed to fetch') || error?.message?.includes('ERR_NAME_NOT_RESOLVED')) {
          devLog.warn('Erro de conexão WebSocket. Verifique a configuração do Supabase.');
          return;
        }
        devLog.error('Error setting up presence channel:', error);
      }
    };

    setup();

    return () => {
      isMounted = false;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const value = useMemo<PresenceContextValue>(() => ({
    onlineUserIds,
    isOnline: (userId?: string | null) => !!userId && onlineUserIds.has(userId),
  }), [onlineUserIds]);

  return (
    <PresenceContext.Provider value={value}>
      {children}
    </PresenceContext.Provider>
  );
};

export const usePresence = () => useContext(PresenceContext);
