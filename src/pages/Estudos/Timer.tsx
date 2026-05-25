import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Timer as TimerIcon, Play, Pause, Square, Plus, Minus, ArrowLeft, BookOpen } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { getPendingTimerTask } from '@/utils/timerTaskContext';

const Timer = () => {
  const navigate = useNavigate();
  const pendingTask = useMemo(() => getPendingTimerTask(), []);
  const {
    minutes,
    seconds,
    isRunning,
    isPaused,
    initialMinutes,
    startTimer,
    pauseTimer,
    resumeTimer,
    stopTimer,
    setInitialTime,
  } = useTimer();

  const handleStart = () => {
    startTimer(initialMinutes);
  };

  const addTime = () => {
    if (initialMinutes < 360) {
      // 6 hours limit
      const newTime = initialMinutes + 5;
      setInitialTime(newTime);
    }
  };

  const removeTime = () => {
    if (initialMinutes > 5) {
      // Minimum 5 minutes
      const newTime = initialMinutes - 5;
      setInitialTime(newTime);
    }
  };
  const formatTime = (mins: number, secs: number) => {
    // Exibir apenas minutos durante o timer
    return `${mins.toString().padStart(2, '0')} min`;
  };
  const getProgressPercentage = () => {
    const totalSeconds = initialMinutes * 60;
    const remainingSeconds = minutes * 60 + seconds;
    return (totalSeconds - remainingSeconds) / totalSeconds * 100;
  };
  return (
    <>
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Timer de Estudo</h1>
            <p className="text-muted-foreground">
              {pendingTask
                ? 'Ferramenta de foco: salve tempo e questões no cronograma ao terminar.'
                : 'Mantenha o foco com sessões cronometradas'}
            </p>
          </div>

          {pendingTask && (
            <Card className="mb-4 border-primary/40 bg-primary/5">
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-start gap-2">
                  <BookOpen className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="font-medium">{pendingTask.disciplineName}</p>
                    {pendingTask.blockName && (
                      <p className="text-sm text-muted-foreground">{pendingTask.blockName}</p>
                    )}
                    {pendingTask.plannedDurationMinutes != null && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Meta sugerida: {pendingTask.plannedDurationMinutes} min
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate(pendingTask.returnPath)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar ao cronograma
                </Button>
              </CardContent>
            </Card>
          )}

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
                    {!isPaused ? <Button size="lg" variant="outline" onClick={pauseTimer}>
                        <Pause className="h-5 w-5 mr-2" />
                        Pausar
                      </Button> : <Button size="lg" onClick={resumeTimer}>
                        <Play className="h-5 w-5 mr-2" />
                        Continuar
                      </Button>}
                    <Button size="lg" variant="outline" onClick={stopTimer}>
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
      </div>

    </>
  );
};
export default Timer;