import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Clock, BookOpen, Target, CheckCircle2, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';

interface StudyCycle {
  id: string;
  name: string;
  organ: string;
  position: string;
  exam_date: string;
  is_active: boolean;
  blocks: any[];
  created_at: string;
  updated_at: string;
}

const CicloDetalhes = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast: toastHook } = useToast();
  const [cycle, setCycle] = useState<StudyCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDiscipline, setEditingDiscipline] = useState<string | null>(null);
  const [tempStudyTime, setTempStudyTime] = useState<number>(0);

  useEffect(() => {
    if (user && id) {
      fetchCycle();
    }
  }, [user, id]);

  const fetchCycle = async () => {
    try {
      const { data: cycleData, error } = await supabase
        .from('study_cycles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setCycle(cycleData);
    } catch (error) {
      console.error('Error fetching cycle:', error);
      toast.error('Erro ao carregar ciclo de estudos');
    } finally {
      setLoading(false);
    }
  };

  const updateCycle = async (updatedCycle: StudyCycle) => {
    try {
      const { error } = await supabase
        .from('study_cycles')
        .update({ blocks: updatedCycle.blocks, updated_at: new Date().toISOString() })
        .eq('id', updatedCycle.id);

      if (error) throw error;
      setCycle(updatedCycle);
      toast.success('Ciclo atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating cycle:', error);
      toast.error('Erro ao atualizar ciclo');
    }
  };

  const toggleDisciplineCompletion = (blockIndex: number, disciplineIndex: number) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    const discipline = updatedCycle.blocks[blockIndex].disciplines[disciplineIndex];
    discipline.isCompleted = !discipline.isCompleted;

    updateCycle(updatedCycle);
  };

  const updateStudyTime = (blockIndex: number, disciplineIndex: number, newTime: number) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    updatedCycle.blocks[blockIndex].disciplines[disciplineIndex].studyTime = newTime;

    updateCycle(updatedCycle);
    setEditingDiscipline(null);
  };

  const deleteBlock = (blockIndex: number) => {
    if (!cycle) return;

    toastHook({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir este bloco e todas as suas disciplinas?',
      action: (
        <Button
          onClick={() => {
            const updatedCycle = { ...cycle };
            updatedCycle.blocks.splice(blockIndex, 1);
            updateCycle(updatedCycle);
          }}
          variant="destructive"
          size="sm"
        >
          Excluir
        </Button>
      ),
    });
  };

  const deleteDiscipline = (blockIndex: number, disciplineIndex: number) => {
    if (!cycle) return;

    toastHook({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir esta disciplina?',
      action: (
        <Button
          onClick={() => {
            const updatedCycle = { ...cycle };
            updatedCycle.blocks[blockIndex].disciplines.splice(disciplineIndex, 1);
            updateCycle(updatedCycle);
          }}
          variant="destructive"
          size="sm"
        >
          Excluir
        </Button>
      ),
    });
  };

  const calculateProgress = () => {
    if (!cycle || !cycle.blocks) return { completed: 0, total: 0, percentage: 0 };

    let completed = 0;
    let total = 0;

    cycle.blocks.forEach(block => {
      block.disciplines?.forEach((discipline: any) => {
        total++;
        if (discipline.isCompleted) completed++;
      });
    });

    return {
      completed,
      total,
      percentage: total > 0 ? (completed / total) * 100 : 0
    };
  };

  const calculateTotalStudyTime = () => {
    if (!cycle || !cycle.blocks) return 0;

    return cycle.blocks.reduce((total, block) => {
      return total + (block.disciplines?.reduce((blockTotal: number, discipline: any) => {
        return blockTotal + (discipline.studyTime || 0);
      }, 0) || 0);
    }, 0);
  };

  const getDaysUntilExam = () => {
    if (!cycle) return 0;
    const today = new Date();
    const examDate = new Date(cycle.exam_date);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="min-h-screen p-6 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Ciclo não encontrado</h1>
        <Link to="/estudos">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Estudos
          </Button>
        </Link>
      </div>
    );
  }

  const progress = calculateProgress();
  const totalStudyTime = calculateTotalStudyTime();
  const daysUntilExam = getDaysUntilExam();

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/estudos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{cycle.name}</h1>
          <p className="text-muted-foreground">{cycle.organ} - {cycle.position}</p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-1.5 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progresso Geral</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.percentage.toFixed(1)}%</div>
            <Progress value={progress.percentage} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {progress.completed} de {progress.total} disciplinas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Estudado</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudyTime}h</div>
            <p className="text-xs text-muted-foreground mt-2">
              horas registradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data da Prova</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Date(cycle.exam_date).toLocaleDateString('pt-BR')}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {daysUntilExam} dias restantes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocos de Estudo</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycle.blocks?.length || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              blocos configurados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Study Blocks */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">Blocos de Estudo</h2>
        
        {cycle.blocks?.map((block, blockIndex) => (
          <Card key={blockIndex}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {block.name}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteBlock(blockIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                {block.disciplines?.length || 0} disciplinas neste bloco
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {block.disciplines?.map((discipline: any, disciplineIndex: number) => (
                  <div key={disciplineIndex} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={discipline.isCompleted}
                        onCheckedChange={() => toggleDisciplineCompletion(blockIndex, disciplineIndex)}
                      />
                      <div>
                        <h4 className="font-medium">{discipline.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {discipline.description || 'Sem descrição'}
                        </p>
                      </div>
                    </div>
                    
                      <div className="flex items-center gap-4">
                        {discipline.isCompleted && (
                          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
                            Concluída
                          </Badge>
                        )}
                      
                        <div className="flex items-center gap-2">
                          {editingDiscipline === `${blockIndex}-${disciplineIndex}` ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={tempStudyTime}
                                onChange={(e) => setTempStudyTime(Number(e.target.value))}
                                className="w-20"
                                min="0"
                              />
                              <Button
                                size="sm"
                                onClick={() => updateStudyTime(blockIndex, disciplineIndex, tempStudyTime)}
                              >
                                <Save className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingDiscipline(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{discipline.studyTime || 0}h</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setEditingDiscipline(`${blockIndex}-${disciplineIndex}`);
                                  setTempStudyTime(discipline.studyTime || 0);
                                }}
                              >
                                <Edit3 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteDiscipline(blockIndex, disciplineIndex)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CicloDetalhes;