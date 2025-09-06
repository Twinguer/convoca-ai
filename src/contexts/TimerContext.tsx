import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';

interface TimerContextType {
  minutes: number;
  seconds: number;
  isRunning: boolean;
  isPaused: boolean;
  initialMinutes: number;
  isStudying: boolean;
  showFloatingTimer: boolean;
  startTimer: (minutes?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  setInitialTime: (minutes: number) => void;
  showTimer: () => void;
  hideTimer: () => void;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

export const useTimer = () => {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
};

interface TimerProviderProps {
  children: ReactNode;
}

export const TimerProvider: React.FC<TimerProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const { addStudySession } = useStudyStatistics();
  const [minutes, setMinutes] = useState(60);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(60);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(null);
  const remainingSecondsRef = useRef<number>(initialMinutes * 60);

  const isStudying = isRunning && !isPaused;

  // Only show floating timer if explicitly requested
  useEffect(() => {
    if (!isRunning) {
      setShowFloatingTimer(false);
    }
  }, [isRunning]);

  // Timer countdown logic using absolute end time (robust across tab switches)
  useEffect(() => {
    if (isRunning && !isPaused) {
      // Initialize end time if not set (e.g., after resume or refresh)
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + (minutes * 60 + seconds) * 1000;
      }

      const tick = () => {
        if (!endTimeRef.current) return;
        const remaining = Math.max(0, Math.round((endTimeRef.current - Date.now()) / 1000));
        const nextMinutes = Math.floor(remaining / 60);
        const nextSeconds = remaining % 60;
        setMinutes(nextMinutes);
        setSeconds(nextSeconds);

        if (remaining <= 0) {
          // Stop ticking
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Register study session
          if (sessionStartTime) {
            const sessionDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / (1000 * 60));
            if (sessionDuration >= 20) {
              addStudySession(sessionDuration);
            }
          }

          // Reset state
          setIsRunning(false);
          setIsPaused(false);
          setShowFloatingTimer(false);
          setSessionStartTime(null);
          endTimeRef.current = null;

          // Notification
          if (Notification.permission === 'granted') {
            new Notification('Timer Finalizado!', {
              body: 'Sua sessão de estudo foi concluída.',
              icon: '/favicon.ico'
            });
          } else {
            alert('Tempo esgotado! Sessão de estudo finalizada.');
          }

          setMinutes(initialMinutes);
          setSeconds(0);
        }
      };

      // Run an initial tick immediately
      tick();
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, isPaused, initialMinutes]);

  // Request notification permission when timer starts
  useEffect(() => {
    if (isRunning && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isRunning]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update database when studying status changes
  const updateStudyingStatus = async (studying: boolean) => {
    if (!user) return;
    
    try {
      await supabase
        .from('users_profiles')
        .update({
          is_studying: studying,
          study_started_at: studying ? new Date().toISOString() : null
        })
        .eq('id', user.id);
    } catch (error) {
      console.error('Error updating studying status:', error);
    }
  };

  // Effect to update database when studying status changes
  useEffect(() => {
    updateStudyingStatus(isStudying);
  }, [isStudying, user?.id]);

  const startTimer = (mins?: number) => {
    const startMins = mins ?? initialMinutes;
    if (mins) {
      setInitialMinutes(mins);
    }
    // Reset time state
    setMinutes(startMins);
    setSeconds(0);

    // Configure end time based on absolute clock
    endTimeRef.current = Date.now() + startMins * 60 * 1000;
    remainingSecondsRef.current = startMins * 60;

    setIsRunning(true);
    setIsPaused(false);
    // Don't automatically show floating timer
    setShowFloatingTimer(false);
    setSessionStartTime(new Date());
  };

  const pauseTimer = () => {
    // Capture remaining time when pausing
    remainingSecondsRef.current = minutes * 60 + seconds;
    endTimeRef.current = null;
    setIsPaused(true);
  };

  const resumeTimer = () => {
    // Restore end time from remaining seconds
    const remaining = remainingSecondsRef.current ?? minutes * 60 + seconds;
    endTimeRef.current = Date.now() + remaining * 1000;
    setIsPaused(false);
  };

  const stopTimer = () => {
    // Calcular duração da sessão
    if (sessionStartTime) {
      const sessionDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / (1000 * 60));
      if (sessionDuration >= 20) {
        addStudySession(sessionDuration);
      }
    }

    // Clear ticking
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    endTimeRef.current = null;

    setIsRunning(false);
    setIsPaused(false);
    setMinutes(initialMinutes);
    setSeconds(0);
    setShowFloatingTimer(false);
    setSessionStartTime(null);
  };

  const setInitialTime = (mins: number) => {
    setInitialMinutes(mins);
    if (!isRunning) {
      setMinutes(mins);
      setSeconds(0);
    }
  };

  const showTimer = () => {
    setShowFloatingTimer(true);
  };

  const hideTimer = () => {
    setShowFloatingTimer(false);
  };

  return (
    <TimerContext.Provider
      value={{
        minutes,
        seconds,
        isRunning,
        isPaused,
        initialMinutes,
        isStudying,
        showFloatingTimer,
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        setInitialTime,
        showTimer,
        hideTimer,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};