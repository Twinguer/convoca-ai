import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Timer as TimerIcon, Play, Pause, Square, Plus, Minus, CheckCircle, RotateCcw, BookOpen } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTimer } from '@/contexts/TimerContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StudyCycle {
  id: string;
  name: string;
  organ: string;
  position: string;
  exam_date: string;
  blocks: any[];
}

interface Discipline {
  name: string;
  status: 'inProgress' | 'finished' | 'review';
  studyTime: number;
}

const SessaoEstudos = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
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
    hideTimer,
  } = useTimer();

  const [cycle, setCycle] = useState<StudyCycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchCycle();
    }
  }, [user, id]);

  // Hide floating timer when on session page
  useEffect(() => {
    hideTimer();
    return () => {
      // Don't show floating timer when leaving this page if timer is running
      if (isRunning) {
        hideTimer();
      }
    };
  }, [hideTimer, isRunning]);

  const fetchCycle = async () => {
    try {
      const { data, error } = await supabase
        .from('study_cycles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setCycle(data);
    } catch (error) {
      console.error('Error fetching cycle:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o ciclo de estudos.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCycle = async (updatedCycle: StudyCycle) => {
    try {
      const { error } = await supabase
        .from('study_cycles')
        .update({
          blocks: updatedCycle.blocks,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedCycle.id)
        .eq('user_id', user?.id);

      if (error) throw error;
      
      setCycle(updatedCycle);
      toast({
        title: 'Progresso atualizado',
        description: 'Status da disciplina foi atualizado com sucesso.'
      });
    } catch (error) {
      console.error('Error updating cycle:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o progresso.',
        variant: 'destructive'
      });
    }
  };

  const handleDisciplineStatusChange = (blockIndex: number, disciplineIndex: number, status: 'inProgress' | 'finished' | 'review') => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    updatedCycle.blocks[blockIndex].disciplines[disciplineIndex].status = status;
    
    // Update completion status based on new status
    updatedCycle.blocks[blockIndex].disciplines[disciplineIndex].isCompleted = status === 'finished';
    
    updateCycle(updatedCycle);
  };

  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    const totalSeconds = initialMinutes * 60;
    const remainingSeconds = minutes * 60 + seconds;
    return (totalSeconds - remainingSeconds) / totalSeconds * 100;
  };

  const handleStart = () => {
    startTimer(initialMinutes);
  };

  const addTime = () => {
    if (initialMinutes < 360) {
      const newTime = initialMinutes + 5;
      setInitialTime(newTime);
    }
  };

  const removeTime = () => {
    if (initialMinutes > 5) {
      const newTime = initialMinutes - 5;
      setInitialTime(newTime);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'finished':
        return <Badge variant="default" className="bg-green-100 text-green-800">Finalizada</Badge>;
      case 'review':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Em Revisão</Badge>;
      default:
        return <Badge variant="outline">Em Andamento</Badge>;
    }
  };

  const getDaysUntilExam = () => {
    if (!cycle) return 0;
    const today = new Date();
    const examDate = new Date(cycle.exam_date);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="h-48 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Ciclo não encontrado</h1>
        <Button onClick={() => navigate('/estudos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/estudos')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{cycle.name}</h1>
          <p className="text-muted-foreground">{cycle.organ} - {cycle.position}</p>
        </div>
      </div>

      {/* Compact Header with Timer and Info */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        {/* Timer Section - Compact */}
        <Card className="md:col-span-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-2xl font-bold">
                  {formatTime(minutes, seconds)}
                </div>
                
                {/* Progress Bar */}
                {isRunning && (
                  <div className="w-32 bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-1000" 
                      style={{ width: `${getProgressPercentage()}%` }}
                    ></div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                {/* Time Controls */}
                {!isRunning && (
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={removeTime} disabled={initialMinutes <= 5}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                      {initialMinutes}m
                    </span>
                    <Button variant="outline" size="sm" onClick={addTime} disabled={initialMinutes >= 360}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}

                {/* Control Buttons */}
                {!isRunning ? (
                  <Button onClick={handleStart}>
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    {!isPaused ? (
                      <Button variant="outline" onClick={pauseTimer}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </Button>
                    ) : (
                      <Button onClick={resumeTimer}>
                        <Play className="h-4 w-4 mr-2" />
                        Continuar
                      </Button>
                    )}
                    <Button variant="outline" onClick={stopTimer}>
                      <Square className="h-4 w-4 mr-2" />
                      Parar
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cycle Info - Compact */}
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="text-sm">
              <div className="font-medium">{cycle.organ}</div>
              <div className="text-muted-foreground">{cycle.position}</div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prova:</span>
              <span>{new Date(cycle.exam_date).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Dias restantes:</span>
              <Badge variant={getDaysUntilExam() <= 30 ? "destructive" : "default"} className="text-xs">
                {getDaysUntilExam()} dias
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Study Syllabus */}
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Edital de Estudos
            </CardTitle>
            <CardDescription>
              Acompanhe seu progresso nas disciplinas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {cycle.blocks?.map((block: any, blockIndex: number) => (
                <div key={blockIndex} className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">{block.name}</h3>
                  <div className="space-y-3">
                     {block.disciplines?.map((discipline: any, disciplineIndex: number) => (
                       <div key={disciplineIndex} className="flex items-center justify-between p-2 bg-muted/20 rounded border">
                         <div className="flex items-center gap-2">
                           <span className="font-medium text-sm">{discipline.name}</span>
                           {getStatusBadge(discipline.status || 'inProgress')}
                         </div>
                         
                         <div className="flex items-center gap-3">
                           <label className="flex items-center gap-1 cursor-pointer text-xs">
                             <Checkbox 
                               checked={discipline.status === 'inProgress'}
                               onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'inProgress')}
                               className="h-3 w-3"
                             />
                             <span>Andamento</span>
                           </label>
                           
                           <label className="flex items-center gap-1 cursor-pointer text-xs">
                             <Checkbox 
                               checked={discipline.status === 'finished'}
                               onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'finished')}
                               className="h-3 w-3"
                             />
                             <CheckCircle className="h-3 w-3 text-green-600" />
                             <span>Finalizada</span>
                           </label>
                           
                           <label className="flex items-center gap-1 cursor-pointer text-xs">
                             <Checkbox 
                               checked={discipline.status === 'review'}
                               onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'review')}
                               className="h-3 w-3"
                             />
                             <RotateCcw className="h-3 w-3 text-yellow-600" />
                             <span>Revisão</span>
                           </label>
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SessaoEstudos;