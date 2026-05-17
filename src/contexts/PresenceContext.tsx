import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
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
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ CORRIGIDO: Removida busca periódica da tabela que causava conflito
  // Agora usamos APENAS o Presence do Supabase Realtime para uma fonte única e consistente

  // Função helper para extrair user_ids do presence state de forma consistente
  const extractUserIdsFromPresence = (state: Record<string, any>): Set<string> => {
    const userIds = new Set<string>();
    
    // O presence state do Supabase tem estrutura: { [key]: [{ user_id, online_at, ... }] }
    // A chave (key) é o user_id configurado no presence config
    // Mas também precisamos verificar dentro dos arrays para garantir que capturamos todos
    Object.keys(state).forEach((key) => {
      // Ignorar chaves vazias ou 'viewer'
      if (!key || key === 'viewer') return;
      
      // A chave já é o user_id quando configuramos presence: { key: user?.id }
      userIds.add(key);
      
      // Também verificar dentro do array de presenças (caso haja múltiplas sessões)
      const presences = state[key];
      if (Array.isArray(presences)) {
        presences.forEach((presence: any) => {
          // Se houver um campo user_id dentro do objeto, também adicionar
          if (presence?.user_id && typeof presence.user_id === 'string') {
            userIds.add(presence.user_id);
          }
        });
      }
    });
    
    // Log para debug (apenas em desenvolvimento)
    if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'false') {
      devLog.info('Presence state extraído', {
        totalKeys: Object.keys(state).length,
        userIdsCount: userIds.size,
        userIds: Array.from(userIds),
      });
    }
    
    return userIds;
  };

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

        // ✅ CORRIGIDO: Usar função helper para extrair user_ids de forma consistente
        const updateOnlineUsers = () => {
          if (!isMounted || !channel) return;
          const state = channel.presenceState();
          const userIds = extractUserIdsFromPresence(state);
          setOnlineUserIds(userIds);
        };

        channel
          .on('presence', { event: 'sync' }, () => {
            updateOnlineUsers();
            // Log para debug
            if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'false') {
              devLog.info('Presence sync event');
            }
          })
          .on('presence', { event: 'join' }, () => {
            updateOnlineUsers();
            // Log para debug
            if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'false') {
              devLog.info('Presence join event');
            }
          })
          .on('presence', { event: 'leave' }, () => {
            updateOnlineUsers();
            // Log para debug
            if (import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEBUG_LOGS !== 'false') {
              devLog.info('Presence leave event');
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED' && user?.id) {
              // Fazer track inicial
              await channel!.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
              });
              
              // Atualizar lista imediatamente após track
              updateOnlineUsers();
              
              // Configurar heartbeat para manter presence ativo (a cada 30 segundos)
              heartbeatIntervalRef.current = setInterval(async () => {
                if (!isMounted || !channel) {
                  if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                  }
                  return;
                }
                
                try {
                  await channel.track({
                    user_id: user.id,
                    online_at: new Date().toISOString(),
                  });
                  updateOnlineUsers();
                } catch (error) {
                  devLog.error('Heartbeat error:', error);
                  if (heartbeatIntervalRef.current) {
                    clearInterval(heartbeatIntervalRef.current);
                    heartbeatIntervalRef.current = null;
                  }
                }
              }, 30000); // 30 segundos
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
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      if (channel) {
        supabase.removeChannel(channel);
      }
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
