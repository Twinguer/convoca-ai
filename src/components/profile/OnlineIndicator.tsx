import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface OnlineIndicatorProps {
  userId: string;
  className?: string;
}

export const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({ 
  userId, 
  className = "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white"
}) => {
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Create a channel for presence tracking
    const channel = supabase.channel('online_users', {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    // Track user's online status
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const userIsOnline = Object.keys(state).includes(userId);
        setIsOnline(userIsOnline);
      })
      .on('presence', { event: 'join' }, ({ key }) => {
        if (key === userId) {
          setIsOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        if (key === userId) {
          setIsOnline(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track current user's presence if it's their own status
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.id === userId) {
            await channel.track({
              user_id: userId,
              online_at: new Date().toISOString(),
            });
          }
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  if (!isOnline) return null;

  return (
    <div 
      className={`${className} bg-green-500`}
      title="Online"
    />
  );
};