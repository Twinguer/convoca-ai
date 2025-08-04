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
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const isStudying = isRunning && !isPaused;

  // Timer countdown logic
  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => {
          if (prevSeconds === 0) {
            setMinutes(prevMinutes => {
              if (prevMinutes === 0) {
                // Timer finished - registrar sessão
                if (sessionStartTime) {
                  const sessionDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60));
                  if (sessionDuration >= 20) {
                    addStudySession(sessionDuration);
                  }
                }
                
                setIsRunning(false);
                setIsPaused(false);
                setShowFloatingTimer(false);
                setSessionStartTime(null);
                
                // Notification
                if (Notification.permission === 'granted') {
                  new Notification('Timer Finalizado!', {
                    body: 'Sua sessão de estudo foi concluída.',
                    icon: '/favicon.ico'
                  });
                } else {
                  alert('Tempo esgotado! Sessão de estudo finalizada.');
                }
                return initialMinutes; // Reset to initial time
              }
              return prevMinutes - 1;
            });
            return 59;
          }
          return prevSeconds - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
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
    if (mins) {
      setInitialMinutes(mins);
      setMinutes(mins);
      setSeconds(0);
    }
    setIsRunning(true);
    setIsPaused(false);
    // Don't auto-show floating timer - let pages control this
    setSessionStartTime(new Date());
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const stopTimer = () => {
    // Calcular duração da sessão
    if (sessionStartTime) {
      const sessionDuration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / (1000 * 60));
      if (sessionDuration >= 20) {
        addStudySession(sessionDuration);
      }
    }
    
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