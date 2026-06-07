import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Play, Pause, Square, Plus, Minus, ArrowLeft, BookOpen } from 'lucide-react';
import { useTimer } from '@/contexts/TimerContext';
import { getPendingTimerTask } from '@/utils/timerTaskContext';
import {
  getStoredTimerCycleId,
  resolveInitialTimerCycleId,
  setStoredTimerCycleId,
} from '@/utils/timerCycleSelection';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { StudyCycleV2, StudySession } from '@/types/userStudy';
import { TimerDisciplineList } from '../components/TimerDisciplineList';
import type { EditalBlock } from '../components/editalTypes';
import { aggregateDisciplineStatsForCycle } from '../domain/disciplineStudyStats';
import { devLog } from '@/utils/productionLogger';

interface TimerProps {
  cycleId?: string;
  secureToken?: string;
}

const Timer = ({ cycleId: secureCycleId, secureToken }: TimerProps = {}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { token: urlToken } = useParams();
  const pendingTask = useMemo(() => getPendingTimerTask(), []);
  const [cycles, setCycles] = useState<StudyCycleV2[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [activeCycleId, setActiveCycleId] = useState<string | null>(null);
  const [loadingDisciplines, setLoadingDisciplines] = useState(true);

  const ownerUserId = pendingTask?.ownerUserId ?? user?.id;
  const lockCycleSelection = Boolean(pendingTask?.cycleId);
  const activeCycle = cycles.find((item) => item.id === activeCycleId) ?? null;
  const disciplineBlocks = (activeCycle?.schedule_data?.available_blocks as EditalBlock[]) ?? [];
  const disciplineStats = useMemo(
    () =>
      activeCycleId
        ? aggregateDisciplineStatsForCycle(studySessions, activeCycleId)
        : {},
    [studySessions, activeCycleId]
  );

  useEffect(() => {
    let cancelled = false;

    const loadCycles = async () => {
      if (!ownerUserId) {
        setCycles([]);
        setStudySessions([]);
        setActiveCycleId(null);
        setLoadingDisciplines(false);
        return;
      }

      setLoadingDisciplines(true);

      try {
        const userStudyData = await UserStudyService.getUserStudyData(ownerUserId);
        if (cancelled) return;

        const availableCycles = userStudyData?.study_cycles ?? [];
        setCycles(availableCycles);
        setStudySessions(userStudyData?.study_sessions ?? []);

        const initialCycleId = resolveInitialTimerCycleId({
          secureCycleId,
          pendingTaskCycleId: pendingTask?.cycleId,
          storedCycleId: getStoredTimerCycleId(),
          availableCycleIds: availableCycles.map((item) => item.id),
        });

        setActiveCycleId(initialCycleId);
        if (initialCycleId) setStoredTimerCycleId(initialCycleId);
      } catch (error) {
        devLog.error('Erro ao carregar disciplinas do timer:', error);
        if (!cancelled) {
          setCycles([]);
          setStudySessions([]);
          setActiveCycleId(null);
        }
      } finally {
        if (!cancelled) setLoadingDisciplines(false);
      }
    };

    loadCycles();

    return () => {
      cancelled = true;
    };
  }, [ownerUserId, secureCycleId, pendingTask?.cycleId]);

  const handleCycleChange = (cycleId: string) => {
    setActiveCycleId(cycleId);
    setStoredTimerCycleId(cycleId);
  };
  const cronogramaPath =
    pendingTask?.returnPath ??
    (secureToken ?? urlToken ? `/estudos/cronograma/${secureToken ?? urlToken}` : '/estudos/cronograma');
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
        <div className="max-w-6xl mx-auto">
          <Button
            type="button"
            variant="ghost"
            className="mb-4 -ml-2"
            onClick={() => navigate(cronogramaPath)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao cronograma
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Timer de Estudo</h1>
            {pendingTask && (
              <p className="text-muted-foreground">
                Ferramenta de foco: salve tempo e questões no cronograma ao terminar.
              </p>
            )}
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
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <Card>
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

          <div className="space-y-3">
            {cycles.length > 1 && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Ciclo de estudos</label>
                <Select
                  value={activeCycleId ?? undefined}
                  onValueChange={handleCycleChange}
                  disabled={lockCycleSelection || loadingDisciplines}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um ciclo" />
                  </SelectTrigger>
                  <SelectContent>
                    {cycles.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.cycle_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {lockCycleSelection && (
                  <p className="text-xs text-muted-foreground">
                    Ciclo fixado pela tarefa aberta no cronograma.
                  </p>
                )}
              </div>
            )}

            <TimerDisciplineList
              blocks={disciplineBlocks}
              disciplineStats={disciplineStats}
              cycleName={activeCycle?.cycle_name}
              highlightDisciplineName={
                pendingTask?.cycleId === activeCycleId ? pendingTask.disciplineName : undefined
              }
              highlightBlockName={
                pendingTask?.cycleId === activeCycleId ? pendingTask.blockName : undefined
              }
              loading={loadingDisciplines}
            />
          </div>
          </div>
        </div>
      </div>

    </>
  );
};
export default Timer;