import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Timer as TimerIcon, Play, Pause, Square, Plus, Minus, CheckCircle, RotateCcw, BookOpen, ExternalLink, Calendar, Target } from 'lucide-react';
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
  edital_link?: string;
  curso_link?: string;
  video_link?: string;
}
interface Discipline {
  name: string;
  status: 'inProgress' | 'finished' | 'review';
  studyTime: number;
}
const SessaoEstudos = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
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
    hideTimer
  } = useTimer();
  const [cycle, setCycle] = useState<StudyCycle | null>(null);
  const [loading, setLoading] = useState(true);
  const [links, setLinks] = useState({
    edital_link: '',
    curso_link: '',
    video_link: ''
  });
  useEffect(() => {
    if (user && id) {
      fetchCycle();
    }
  }, [user, id]);

  // Hide floating timer when on session page
  useEffect(() => {
    hideTimer();
  }, [hideTimer]);
  const fetchCycle = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('study_cycles').select('*').eq('id', id).eq('user_id', user?.id).single();
      if (error) throw error;
      setCycle(data);
      setLinks({
        edital_link: data.edital_link || '',
        curso_link: data.curso_link || '',
        video_link: data.video_link || ''
      });
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
      const {
        error
      } = await supabase.from('study_cycles').update({
        blocks: updatedCycle.blocks,
        edital_link: links.edital_link,
        curso_link: links.curso_link,
        video_link: links.video_link,
        updated_at: new Date().toISOString()
      }).eq('id', updatedCycle.id).eq('user_id', user?.id);
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
  const updateLinks = async (newLinks: typeof links) => {
    try {
      const {
        error
      } = await supabase.from('study_cycles').update({
        edital_link: newLinks.edital_link,
        curso_link: newLinks.curso_link,
        video_link: newLinks.video_link,
        updated_at: new Date().toISOString()
      }).eq('id', id).eq('user_id', user?.id);
      if (error) throw error;
      setLinks(newLinks);
      toast({
        title: 'Link salvo',
        description: 'Link foi salvo com sucesso.'
      });
    } catch (error) {
      console.error('Error updating links:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o link.',
        variant: 'destructive'
      });
    }
  };

  // Component for link buttons
  const LinkButton = ({
    icon,
    label,
    link,
    onLinkChange
  }: {
    icon: string;
    label: string;
    link: string;
    onLinkChange: (link: string) => void;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempLink, setTempLink] = useState('');
    const handleAddClick = () => {
      setTempLink('');
      setIsEditing(true);
    };
    const handleSave = () => {
      if (tempLink.trim()) {
        onLinkChange(tempLink.trim());
        setIsEditing(false);
      }
    };
    const handleCancel = () => {
      setTempLink('');
      setIsEditing(false);
    };
    if (link && !isEditing) {
      return <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            {icon} {label}
          </label>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={link} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Acessar {label}
            </a>
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => {
          setTempLink(link);
          setIsEditing(true);
        }}>
            Editar link
          </Button>
        </div>;
    }
    if (isEditing) {
      return <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            {icon} {label}
          </label>
          <Input placeholder="https://..." value={tempLink} onChange={e => setTempLink(e.target.value)} onKeyDown={e => {
          if (e.key === 'Enter') handleSave();
          if (e.key === 'Escape') handleCancel();
        }} autoFocus />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={!tempLink.trim()}>
              Salvar
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </div>;
    }
    return <div className="space-y-2">
        <label className="text-sm font-medium flex items-center gap-1">
          {icon} {label}
        </label>
        <Button variant="outline" className="w-full justify-center" onClick={handleAddClick}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar {label}
        </Button>
      </div>;
  };
  const handleDisciplineStatusChange = (blockIndex: number, disciplineIndex: number, status: 'inProgress' | 'finished' | 'review') => {
    if (!cycle) return;
    const updatedCycle = {
      ...cycle
    };
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
        return <Badge className="bg-green-500 text-white hover:bg-green-600">Finalizada</Badge>;
      case 'review':
        return <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Em Revisão</Badge>;
      case 'inProgress':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600">Em Andamento</Badge>;
      default:
        return <Badge className="bg-red-500 text-white hover:bg-red-600">Não Iniciado</Badge>;
    }
  };
  const getDaysUntilExam = () => {
    if (!cycle) return 0;
    const today = new Date();
    const examDate = new Date(cycle.exam_date);
    return Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };
  const getDisciplineStats = () => {
    if (!cycle?.blocks) return {
      finished: 0,
      inProgress: 0,
      review: 0,
      total: 0
    };
    let finished = 0;
    let inProgress = 0;
    let review = 0;
    let total = 0;
    cycle.blocks.forEach((block: any) => {
      if (block.disciplines) {
        block.disciplines.forEach((discipline: any) => {
          total++;
          switch (discipline.status) {
            case 'finished':
              finished++;
              break;
            case 'review':
              review++;
              break;
            default:
              inProgress++;
              break;
          }
        });
      }
    });
    return {
      finished,
      inProgress,
      review,
      total
    };
  };
  if (loading) {
    return <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid gap-1 md:grid-cols-2">
            <div className="h-48 bg-muted rounded"></div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </div>
      </div>;
  }
  if (!cycle) {
    return <div className="container mx-auto p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Ciclo não encontrado</h1>
        <Button onClick={() => navigate('/estudos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>;
  }
  return <div className="container mx-auto p-6">
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

      {/* Compact Header with Timer, Info and Stats */}
      <div className="grid gap-1 lg:grid-cols-4 mb-6">
        {/* Timer Section - Compact */}
        <Card className="dark:border-primary/20">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {formatTime(minutes, seconds)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Timer de Estudo
                  </div>
                </div>
                
                {/* Progress Bar */}
                {isRunning && <div className="flex flex-col gap-1">
                    <div className="w-32 bg-secondary rounded-full h-2">
                      <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{
                    width: `${getProgressPercentage()}%`
                  }}></div>
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      {Math.round(getProgressPercentage())}% concluído
                    </div>
                  </div>}
              </div>

              <div className="flex flex-col gap-2">
                {/* Time Controls */}
                {!isRunning && <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={removeTime} disabled={initialMinutes <= 5}>
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                      {initialMinutes}m
                    </span>
                    <Button variant="outline" size="sm" onClick={addTime} disabled={initialMinutes >= 360}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>}

                {/* Control Buttons */}
                <div className="flex justify-center">
                  {!isRunning ? <Button onClick={handleStart} size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      Iniciar
                    </Button> : <div className="flex gap-2">
                      {!isPaused ? <Button variant="outline" onClick={pauseTimer} size="sm">
                          <Pause className="h-4 w-4 mr-1" />
                          Pausar
                        </Button> : <Button onClick={resumeTimer} size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Continuar
                        </Button>}
                      <Button variant="outline" onClick={stopTimer} size="sm">
                        <Square className="h-4 w-4 mr-1" />
                        Parar
                      </Button>
                    </div>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acesso rápido ao Cronograma */}
        <Card className="dark:border-primary/20">
          <CardContent className="p-4 flex items-center justify-between h-full">
            <div>
              <div className="text-sm font-medium">Cronograma</div>
              <div className="text-xs text-muted-foreground">Cronograma semanal</div>
            </div>
            <Button asChild size="sm">
              <Link to="/estudos/cronograma" aria-label="Abrir cronograma de estudos">
                <Calendar className="h-4 w-4 mr-1" />
                Abrir
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Cycle Info - Compact */}
        <Card className="dark:border-primary/20">
          <CardContent className="p-4 space-y-3 h-full">
            <div className="text-sm">
              <div className="font-medium truncate">{cycle.organ}</div>
              <div className="text-muted-foreground text-xs truncate">{cycle.position}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Prova:</span>
                <span className="text-xs">{new Date(cycle.exam_date).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Restam:</span>
                <Badge variant={getDaysUntilExam() <= 30 ? "destructive" : "default"} className="text-xs">
                  {getDaysUntilExam()} dias
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Discipline Stats */}
        <Card className="dark:border-primary/20">
          <CardContent className="p-4 h-full">
            <div className="space-y-3">
              <div className="text-sm font-medium">Progresso</div>
              {(() => {
              const stats = getDisciplineStats();
              return <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Finalizadas</span>
                      <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                        {stats.finished}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Em Andamento</span>
                      <Badge variant="outline" className="text-xs">
                        {stats.inProgress}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted-foreground">Em Revisão</span>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        {stats.review}
                      </Badge>
                    </div>
                    
                  </div>;
            })()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Links Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Links Úteis</CardTitle>
          <CardDescription>
            Clique para adicionar links importantes para seus estudos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1 md:grid-cols-3">
            <LinkButton icon="📋" label="Edital" link={links.edital_link} onLinkChange={link => updateLinks({
            ...links,
            edital_link: link
          })} />
            <LinkButton icon="🎓" label="Curso" link={links.curso_link} onLinkChange={link => updateLinks({
            ...links,
            curso_link: link
          })} />
            <LinkButton icon="📹" label="Vídeo" link={links.video_link} onLinkChange={link => updateLinks({
            ...links,
            video_link: link
          })} />
          </div>
        </CardContent>
      </Card>

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
              {cycle.blocks?.map((block: any, blockIndex: number) => <div key={blockIndex} className="space-y-3">
                  <h3 className="font-semibold text-lg border-b pb-2">{block.name}</h3>
                  <div className="space-y-3">
                     {block.disciplines?.map((discipline: any, disciplineIndex: number) => <div key={disciplineIndex} className={`flex items-center justify-between p-2 rounded border transition-all ${discipline.status === 'finished' ? 'bg-muted/50 text-muted-foreground opacity-60' : 'bg-muted/20'}`}>
                         <div className="flex items-center gap-2">
                           <span className={`font-medium text-sm ${discipline.status === 'finished' ? 'line-through' : ''}`}>
                             {discipline.name}
                           </span>
                            {getStatusBadge(discipline.status || '')}
                         </div>
                         
                         <div className="flex items-center gap-3">
                           <label className="flex items-center gap-1 cursor-pointer text-xs">
                             <Checkbox checked={discipline.status === 'inProgress'} onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'inProgress')} className="h-3 w-3" />
                             <span>Andamento</span>
                           </label>
                           
                           <label className="flex items-center gap-1 cursor-pointer text-xs">
                             <Checkbox checked={discipline.status === 'finished'} onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'finished')} className="h-3 w-3" />
                             <CheckCircle className="h-3 w-3 text-green-600" />
                             <span>Finalizada</span>
                           </label>
                           
                           <label className="flex items-center gap-1 cursor-pointer text-xs">
                             <Checkbox checked={discipline.status === 'review'} onCheckedChange={() => handleDisciplineStatusChange(blockIndex, disciplineIndex, 'review')} className="h-3 w-3" />
                             <RotateCcw className="h-3 w-3 text-yellow-600" />
                             <span>Revisão</span>
                           </label>
                         </div>
                       </div>)}
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default SessaoEstudos;