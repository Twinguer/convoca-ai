import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Timer as TimerIcon, Play, Pause, Square, Minimize2, Maximize2 } from 'lucide-react';

interface FloatingTimerProps {
  isOpen: boolean;
  onClose: () => void;
  initialMinutes?: number;
}

const FloatingTimer: React.FC<FloatingTimerProps> = ({ 
  isOpen, 
  onClose, 
  initialMinutes = 25 
}) => {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Reset timer when initial minutes change
  useEffect(() => {
    if (!isRunning) {
      setMinutes(initialMinutes);
      setSeconds(0);
    }
  }, [initialMinutes, isRunning]);

  // Cleanup interval on component unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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

  const handleStart = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setMinutes(initialMinutes);
    setSeconds(0);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = initialMinutes * 60;
    const remainingSeconds = minutes * 60 + seconds;
    return (totalSeconds - remainingSeconds) / totalSeconds * 100;
  };

  const getTimerStatus = () => {
    if (!isRunning) return 'Parado';
    if (isPaused) return 'Pausado';
    return 'Em execução';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${isMinimized ? 'max-w-xs' : 'max-w-md'} transition-all duration-300`}>
        <DialogHeader className="flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="flex items-center gap-2">
            <TimerIcon className="h-5 w-5" />
            Timer de Estudo
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Time Display */}
          <div className={`text-center ${isMinimized ? 'space-y-2' : 'space-y-4'}`}>
            <div className={`font-bold ${isMinimized ? 'text-3xl' : 'text-5xl'}`}>
              {formatTime(minutes, seconds)}
            </div>

            {!isMinimized && (
              <>
                {/* Progress Bar */}
                {isRunning && (
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                )}

                {/* Status */}
                <p className="text-sm text-muted-foreground">
                  Status: {getTimerStatus()}
                </p>
              </>
            )}
          </div>

          {/* Control Buttons */}
          <div className={`flex justify-center gap-2 ${isMinimized ? 'flex-wrap' : ''}`}>
            {!isRunning ? (
              <Button onClick={handleStart} size={isMinimized ? "sm" : "default"}>
                <Play className="h-4 w-4 mr-1" />
                {!isMinimized && "Iniciar"}
              </Button>
            ) : (
              <>
                {!isPaused ? (
                  <Button variant="outline" onClick={handlePause} size={isMinimized ? "sm" : "default"}>
                    <Pause className="h-4 w-4 mr-1" />
                    {!isMinimized && "Pausar"}
                  </Button>
                ) : (
                  <Button onClick={handleResume} size={isMinimized ? "sm" : "default"}>
                    <Play className="h-4 w-4 mr-1" />
                    {!isMinimized && "Continuar"}
                  </Button>
                )}
                <Button variant="outline" onClick={handleStop} size={isMinimized ? "sm" : "default"}>
                  <Square className="h-4 w-4 mr-1" />
                  {!isMinimized && "Parar"}
                </Button>
              </>
            )}
          </div>

          {/* Session Info (only when not minimized) */}
          {!isMinimized && (
            <div className="text-center text-xs text-muted-foreground">
              <p>Sessão de {initialMinutes} minutos</p>
              {isRunning && (
                <p className="mt-1">
                  Você pode minimizar esta janela e continuar estudando
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FloatingTimer;