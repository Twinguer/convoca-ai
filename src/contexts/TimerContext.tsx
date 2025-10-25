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
  startTimer: (minutes?: number) => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  stopTimer: () => void;
  setInitialTime: (minutes: number) => void;
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
  
  // Defensive check for hooks
  if (!addStudySession) {
    console.warn('addStudySession not available in TimerProvider');
  }

  // Create user-specific localStorage keys
  const getStorageKey = (key: string) => {
    return user ? `timer-${user.id}-${key}` : `timer-guest-${key}`;
  };

  // Load timer state from localStorage on mount with validation (user-specific)
  const [minutes, setMinutes] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('minutes'));
    const parsed = saved ? parseInt(saved) : 60;
    return isNaN(parsed) ? 60 : parsed;
  });
  const [seconds, setSeconds] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('seconds'));
    const parsed = saved ? parseInt(saved) : 0;
    return isNaN(parsed) ? 0 : parsed;
  });
  const [isRunning, setIsRunning] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('isRunning'));
    return saved === 'true';
  });
  const [isPaused, setIsPaused] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('isPaused'));
    return saved === 'true';
  });
  const [initialMinutes, setInitialMinutes] = useState(() => {
    const saved = localStorage.getItem(getStorageKey('initialMinutes'));
    const parsed = saved ? parseInt(saved) : 60;
    return isNaN(parsed) ? 60 : parsed;
  });
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(() => {
    const saved = localStorage.getItem(getStorageKey('sessionStartTime'));
    if (!saved) return null;
    const date = new Date(saved);
    return isNaN(date.getTime()) ? null : date;
  });
  
  // endTime state for localStorage persistence
  const [endTime, setEndTime] = useState<number | null>(() => {
    const saved = localStorage.getItem(getStorageKey('endTime'));
    return saved ? parseInt(saved) : null;
  });
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const endTimeRef = useRef<number | null>(endTime);
  const remainingSecondsRef = useRef<number>(initialMinutes * 60);

  // Sync ref with state
  useEffect(() => {
    endTimeRef.current = endTime;
  }, [endTime]);

  const isStudying = isRunning && !isPaused;

  // Clear timer when user changes (logout/login)
  useEffect(() => {
    // Track previous user to detect logout
    const previousUserId = sessionStorage.getItem('previous_user_id');
    const currentUserId = user?.id || null;

    if (user) {
      // User logged in - load their timer state
      const savedMinutes = localStorage.getItem(getStorageKey('minutes'));
      const savedSeconds = localStorage.getItem(getStorageKey('seconds'));
      const savedIsRunning = localStorage.getItem(getStorageKey('isRunning'));
      const savedIsPaused = localStorage.getItem(getStorageKey('isPaused'));
      const savedInitialMinutes = localStorage.getItem(getStorageKey('initialMinutes'));
      const savedSessionStartTime = localStorage.getItem(getStorageKey('sessionStartTime'));

      if (savedMinutes) setMinutes(parseInt(savedMinutes));
      if (savedSeconds) setSeconds(parseInt(savedSeconds));
      if (savedIsRunning) setIsRunning(savedIsRunning === 'true');
      if (savedIsPaused) setIsPaused(savedIsPaused === 'true');
      if (savedInitialMinutes) setInitialMinutes(parseInt(savedInitialMinutes));
      if (savedSessionStartTime) {
        const date = new Date(savedSessionStartTime);
        if (!isNaN(date.getTime())) setSessionStartTime(date);
      }
      
      // Update session storage with current user
      sessionStorage.setItem('previous_user_id', currentUserId);
    } else if (previousUserId && !currentUserId) {
      // User logged out - stop timer and update database
      if (isRunning || isPaused) {
        // Clear interval if running
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        
        // Update database to mark user as not studying
        const updateStatus = async () => {
          try {
            await supabase
              .from('users_profiles')
              .update({
                is_studying: false,
                study_started_at: null
              })
              .eq('id', previousUserId);
          } catch (error) {
            console.error('Error updating studying status on logout:', error);
          }
        };
        updateStatus();
      }
      
      // Clear all timer state
      setIsRunning(false);
      setIsPaused(false);
      setMinutes(60);
      setSeconds(0);
      setInitialMinutes(60);
      setSessionStartTime(null);
      setEndTime(null);
      
      // Clear session storage
      sessionStorage.removeItem('previous_user_id');
    }
  }, [user, isRunning, isPaused]);

  // Save timer state to localStorage whenever it changes (user-specific)
  useEffect(() => {
    if (!isNaN(minutes) && minutes >= 0) {
      localStorage.setItem(getStorageKey('minutes'), minutes.toString());
    }
  }, [minutes, user]);

  useEffect(() => {
    if (!isNaN(seconds) && seconds >= 0) {
      localStorage.setItem(getStorageKey('seconds'), seconds.toString());
    }
  }, [seconds, user]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('isRunning'), isRunning.toString());
  }, [isRunning, user]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('isPaused'), isPaused.toString());
  }, [isPaused, user]);

  useEffect(() => {
    localStorage.setItem(getStorageKey('initialMinutes'), initialMinutes.toString());
  }, [initialMinutes, user]);

  useEffect(() => {
    if (sessionStartTime) {
      localStorage.setItem(getStorageKey('sessionStartTime'), sessionStartTime.toISOString());
    } else {
      localStorage.removeItem(getStorageKey('sessionStartTime'));
    }
  }, [sessionStartTime, user]);

  // Save endTime to localStorage when it changes
  useEffect(() => {
    if (endTime) {
      localStorage.setItem(getStorageKey('endTime'), endTime.toString());
    } else {
      localStorage.removeItem(getStorageKey('endTime'));
    }
  }, [endTime, user]);


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
        
        // Validate values before setting
        if (!isNaN(nextMinutes) && !isNaN(nextSeconds)) {
          setMinutes(nextMinutes);
          setSeconds(nextSeconds);
        }

        if (remaining <= 0) {
          // Stop ticking
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }

          // Register study session
          if (sessionStartTime && addStudySession) {
            const sessionDuration = Math.floor((Date.now() - sessionStartTime.getTime()) / (1000 * 60));
            if (sessionDuration >= 20) {
              addStudySession(sessionDuration);
            }
          }

          // Reset state
          setIsRunning(false);
          setIsPaused(false);
          setSessionStartTime(null);
          setEndTime(null);

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
      intervalRef.current = setInterval(tick, 5000); // Reduzido de 1s para 5s
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
    if (!user?.id) return;
    
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
    const newEndTime = Date.now() + startMins * 60 * 1000;
    setEndTime(newEndTime);
    remainingSecondsRef.current = startMins * 60;

    setIsRunning(true);
    setIsPaused(false);
    setSessionStartTime(new Date());
  };

  const pauseTimer = () => {
    // Capture remaining time when pausing
    remainingSecondsRef.current = minutes * 60 + seconds;
    setEndTime(null);
    setIsPaused(true);
  };

  const resumeTimer = () => {
    // Restore end time from remaining seconds
    const remaining = remainingSecondsRef.current ?? minutes * 60 + seconds;
    const newEndTime = Date.now() + remaining * 1000;
    setEndTime(newEndTime);
    setIsPaused(false);
  };

  const stopTimer = () => {
    // Calcular duração da sessão
    if (sessionStartTime && addStudySession) {
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
    setEndTime(null);

    setIsRunning(false);
    setIsPaused(false);
    setMinutes(initialMinutes);
    setSeconds(0);
    setSessionStartTime(null);

    // Clear localStorage when timer is stopped (user-specific)
    localStorage.removeItem(getStorageKey('minutes'));
    localStorage.removeItem(getStorageKey('seconds'));
    localStorage.removeItem(getStorageKey('isRunning'));
    localStorage.removeItem(getStorageKey('isPaused'));
    localStorage.removeItem(getStorageKey('sessionStartTime'));
    localStorage.removeItem(getStorageKey('endTime'));
  };

  const setInitialTime = (mins: number) => {
    setInitialMinutes(mins);
    if (!isRunning) {
      setMinutes(mins);
      setSeconds(0);
    }
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
        startTimer,
        pauseTimer,
        resumeTimer,
        stopTimer,
        setInitialTime,
      }}
    >
      {children}
    </TimerContext.Provider>
  );
};