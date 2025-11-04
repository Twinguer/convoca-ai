import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
        const { data, error } = await supabase
          .from('users_profiles')
          .select('id')
          .eq('is_online', true);
        
        if (error) {
          console.error('Error fetching online users:', error);
          return;
        }
        
        const userIds = data?.map(user => user.id) || [];
        setOnlineUserIds(new Set(userIds));
      } catch (error) {
        console.error('Error in fetchOnlineUsers:', error);
      }
    };

    // Buscar imediatamente
    fetchOnlineUsers();

    // Configurar intervalo para buscar a cada 10 segundos
    const interval = setInterval(fetchOnlineUsers, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let isMounted = true;

    const setup = async () => {
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
