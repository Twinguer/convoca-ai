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
  } = useTimer();

  const [cycle, setCycle] = useState<StudyCycle | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      fetchCycle();
    }
  }, [user, id]);

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

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Timer Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TimerIcon className="h-5 w-5" />
              Timer de Estudo
            </CardTitle>
            <CardDescription>
              Cronometr e sua sessão de estudos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center p-6">
              {/* Time Display */}
              <div className="text-5xl font-bold mb-4">
                {formatTime(minutes, seconds)}
              </div>

              {/* Progress Bar */}
              {isRunning && (
                <div className="w-full bg-secondary rounded-full h-2 mb-6">
                  <div 
                    className="bg-primary h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${getProgressPercentage()}%` }}
                  ></div>
                </div>
              )}

              {/* Time Controls */}
              {!isRunning && (
                <div className="flex justify-center items-center gap-4 mb-6">
                  <Button variant="outline" size="sm" onClick={removeTime} disabled={initialMinutes <= 5}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm text-muted-foreground min-w-[80px]">
                    {initialMinutes} min
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={addTime} disabled={initialMinutes >= 360}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Control Buttons */}
              <div className="flex justify-center gap-4">
                {!isRunning ? (
                  <Button size="lg" onClick={handleStart}>
                    <Play className="h-5 w-5 mr-2" />
                    Iniciar
                  </Button>
                ) : (
                  <>
                    {!isPaused ? (
                      <Button size="lg" variant="outline" onClick={pauseTimer}>
                        <Pause className="h-5 w-5 mr-2" />
                        Pausar
                      </Button>
                    ) : (
                      <Button size="lg" onClick={resumeTimer}>
                        <Play className="h-5 w-5 mr-2" />
                        Continuar
                      </Button>
                    )}
                    <Button size="lg" variant="outline" onClick={stopTimer}>
                      <Square className="h-5 w-5 mr-2" />
                      Parar
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cycle Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Concurso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Órgão:</span>
              <span className="font-medium">{cycle.organ}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cargo:</span>
              <span className="font-medium">{cycle.position}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Data da Prova:</span>
              <span className="font-medium">{new Date(cycle.exam_date).toLocaleDateString('pt-BR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dias restantes:</span>
              <Badge variant={getDaysUntilExam() <= 30 ? "destructive" : "default"}>
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
                      <div key={disciplineIndex} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{discipline.name}</span>
                          {getStatusBadge(discipline.status || 'inProgress')}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-4 text-sm">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox 
                                checked={discipline.status === 'inProgress'}
                                onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'inProgress')}
                              />
                              <span>Em Andamento</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox 
                                checked={discipline.status === 'finished'}
                                onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'finished')}
                              />
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span>Finalizada</span>
                            </label>
                            
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox 
                                checked={discipline.status === 'review'}
                                onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'review')}
                              />
                              <RotateCcw className="h-4 w-4 text-yellow-600" />
                              <span>Em Revisão</span>
                            </label>
                          </div>
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