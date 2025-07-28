import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

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
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const [showFloatingTimer, setShowFloatingTimer] = useState(false);
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
                // Timer finished
                setIsRunning(false);
                setIsPaused(false);
                setShowFloatingTimer(false);
                
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

  const startTimer = (mins?: number) => {
    if (mins) {
      setInitialMinutes(mins);
      setMinutes(mins);
      setSeconds(0);
    }
    setIsRunning(true);
    setIsPaused(false);
    setShowFloatingTimer(true);
  };

  const pauseTimer = () => {
    setIsPaused(true);
  };

  const resumeTimer = () => {
    setIsPaused(false);
  };

  const stopTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setMinutes(initialMinutes);
    setSeconds(0);
    setShowFloatingTimer(false);
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