import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer as TimerIcon, Play, Pause, Square, Plus, Minus } from 'lucide-react';
const Timer = () => {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [initialMinutes, setInitialMinutes] = useState(25);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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
                // You could add notification sound here
                alert('Tempo esgotado! Sessão de estudo finalizada.');
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
  const addTime = () => {
    if (initialMinutes < 360) {
      // 6 hours limit
      const newTime = initialMinutes + 5;
      setInitialMinutes(newTime);
      if (!isRunning) {
        setMinutes(newTime);
        setSeconds(0);
      }
    }
  };
  const removeTime = () => {
    if (initialMinutes > 5) {
      // Minimum 5 minutes
      const newTime = initialMinutes - 5;
      setInitialMinutes(newTime);
      if (!isRunning) {
        setMinutes(newTime);
        setSeconds(0);
      }
    }
  };
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  const getProgressPercentage = () => {
    const totalSeconds = initialMinutes * 60;
    const remainingSeconds = minutes * 60 + seconds;
    return (totalSeconds - remainingSeconds) / totalSeconds * 100;
  };
  return <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Timer de Estudo</h1>
          <p className="text-muted-foreground">Mantenha o foco com sessões cronometradas</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 justify-center">
              <TimerIcon className="h-5 w-5" />
              Cronômetro Pomodoro
            </CardTitle>
            <CardDescription className="text-center">
              Técnica de produtividade com intervalos de foco e descanso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              {/* Time Display */}
              <div className="text-6xl font-bold mb-4">
                {formatTime(minutes, seconds)}
              </div>

              {/* Progress Bar */}
              {isRunning && <div className="w-full bg-secondary rounded-full h-2 mb-6">
                  <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{
                width: `${getProgressPercentage()}%`
              }}></div>
                </div>}

              {/* Time Controls */}
              {!isRunning && <div className="flex justify-center items-center gap-4 mb-6">
                  <Button variant="outline" size="sm" onClick={removeTime} disabled={initialMinutes <= 5}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm text-muted-foreground min-w-[80px]">
                    {initialMinutes} min
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={addTime} disabled={initialMinutes >= 360}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>}

              {/* Control Buttons */}
              <div className="flex justify-center gap-4 mb-8">
                {!isRunning ? <Button size="lg" onClick={handleStart}>
                    <Play className="h-5 w-5 mr-2" />
                    Iniciar
                  </Button> : <>
                    {!isPaused ? <Button size="lg" variant="outline" onClick={handlePause}>
                        <Pause className="h-5 w-5 mr-2" />
                        Pausar
                      </Button> : <Button size="lg" onClick={handleResume}>
                        <Play className="h-5 w-5 mr-2" />
                        Continuar
                      </Button>}
                    <Button size="lg" variant="outline" onClick={handleStop}>
                      <Square className="h-5 w-5 mr-2" />
                      Parar
                    </Button>
                  </>}
              </div>

              {/* Status */}
              

              {/* Time Range Info */}
              
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Timer;