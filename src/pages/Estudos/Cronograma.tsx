import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Settings, BookOpen, Clock, X, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';
import { useQuestionTracking } from '@/hooks/useQuestionTracking';
import { useStudySessions } from '@/hooks/useStudySessions';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { v4 as uuidv4 } from 'uuid';
interface StudySession {
  id: string;
  day: number; // 0-6 (Sunday to Saturday)
  startTime: string;
  endTime: string;
  disciplineName: string;
  blockName: string;
  cycleId: string;
  sessionLink?: string;
}
interface StudyCycle {
  id: string;
  name: string;
  blocks: any[];
}
const Cronograma = () => {
  const {
    user
  } = useAuth();
  const [cycles, setCycles] = useState<StudyCycle[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [sessionLink, setSessionLink] = useState<string>('');

  // Estados para edição de sessão
  const [studyDuration, setStudyDuration] = useState<number>(0);
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [questionsTotal, setQuestionsTotal] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [courseName, setCourseName] = useState<string>('');
  const [courseProgress, setCourseProgress] = useState<string>('');
  const [studyType, setStudyType] = useState<'pdf' | 'video'>('pdf');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [currentVideo, setCurrentVideo] = useState<string>('');
  const {
    addStudySession
  } = useStudyStatistics();
  const {
    trackAnswer
  } = useQuestionTracking();
  const {
    getSessionByScheduleId,
    createOrUpdateSession,
    updateSessionLink
  } = useStudySessions();
  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  useEffect(() => {
    if (user) {
      fetchCycles();
      fetchSessions();
    }
  }, [user]);
  const fetchCycles = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('study_cycles').select('id, name, blocks').eq('user_id', user?.id).eq('is_active', true);
      if (error) throw error;
      setCycles(data || []);
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };
  const fetchSessions = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('study_schedule').select('*').eq('user_id', user?.id).eq('is_active', true);
      if (error) throw error;

      // Transform database format to our StudySession format
      const transformedSessions = (data || []).map(item => ({
        id: item.id,
        day: item.day_of_week,
        startTime: item.start_time,
        endTime: item.end_time,
        disciplineName: item.discipline_name || 'Disciplina',
        blockName: item.block_name || 'Bloco',
        cycleId: item.cycle_id || '',
        sessionLink: item.session_link || ''
      }));
      setSessions(transformedSessions);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };
  const saveSessions = async (newSessions: StudySession[]) => {
    try {
      // Save to database instead of localStorage
      for (const session of newSessions) {
        if (!sessions.find(s => s.id === session.id)) {
          // This is a new session, insert it
          await supabase.from('study_schedule').insert({
            id: session.id,
            user_id: user?.id,
            day_of_week: session.day,
            start_time: session.startTime,
            end_time: session.endTime,
            discipline_name: session.disciplineName,
            block_name: session.blockName,
            cycle_id: session.cycleId,
            session_link: session.sessionLink,
            subject_id: null,
            study_plan_id: null,
            is_active: true
          });
        }
      }
      setSessions(newSessions);
    } catch (error) {
      console.error('Error saving sessions:', error);
      toast.error('Erro ao salvar cronograma');
    }
  };
  const getAvailableDisciplines = () => {
    const selectedCycleData = cycles.find(c => c.id === selectedCycle);
    if (!selectedCycleData || !selectedBlock) return [];
    const block = selectedCycleData.blocks.find((b: any) => b.name === selectedBlock);
    return block?.disciplines || [];
  };
  const getAvailableBlocks = () => {
    const selectedCycleData = cycles.find(c => c.id === selectedCycle);
    return selectedCycleData?.blocks || [];
  };
  const addSession = () => {
    if (!selectedCycle || !selectedBlock || !selectedDiscipline) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    const newSession: StudySession = {
      id: uuidv4(),
      day: selectedDay,
      startTime,
      endTime,
      disciplineName: selectedDiscipline,
      blockName: selectedBlock,
      cycleId: selectedCycle,
      sessionLink: sessionLink
    };
    const updatedSessions = [...sessions, newSession];
    saveSessions(updatedSessions);

    // Limpar campos
    setSelectedCycle('');
    setSelectedBlock('');
    setSelectedDiscipline('');
    setSessionLink('');
    setShowAddModal(false);
    toast.success('Sessão adicionada ao cronograma!');
  };
  const removeSession = async (sessionId: string) => {
    try {
      await supabase.from('study_schedule').delete().eq('id', sessionId).eq('user_id', user?.id);
      const updatedSessions = sessions.filter(s => s.id !== sessionId);
      setSessions(updatedSessions);
      toast.success('Sessão removida do cronograma!');
    } catch (error) {
      console.error('Error removing session:', error);
      toast.error('Erro ao remover sessão');
    }
  };
  const getSessionsForDay = (day: number) => {
    return sessions.filter(s => s.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };
  const isSessionCompleted = (sessionId: string) => {
    const savedSessions = localStorage.getItem(`completed_sessions_${user?.id}`);
    if (!savedSessions) return false;
    const completedSessions = JSON.parse(savedSessions);
    return completedSessions.some((s: any) => s.sessionId === sessionId);
  };
  const getSessionData = (sessionId: string) => {
    const savedSessions = localStorage.getItem(`completed_sessions_${user?.id}`);
    if (!savedSessions) return null;
    const completedSessions = JSON.parse(savedSessions);
    return completedSessions.find((s: any) => s.sessionId === sessionId);
  };
  const getCycleName = (cycleId: string) => {
    return cycles.find(c => c.id === cycleId)?.name || 'Ciclo não encontrado';
  };
  const openEditModal = (session: StudySession) => {
    setEditingSession(session);

    // Carregar dados existentes de sessões acumulativas
    const existingSession = getSessionByScheduleId(session.id);
    if (existingSession) {
      setSessionLink(existingSession.session_link || '');
    } else {
      setSessionLink(session.sessionLink || '');
    }

    // Limpar campos do modal para nova entrada
    setStudyDuration(0);
    setStudyNotes('');
    setQuestionsTotal(0);
    setQuestionsCorrect(0);
    setCourseName('');
    setCourseProgress('');
    setStudyType('pdf');
    setCurrentPage(0);
    setCurrentVideo('');
    setShowEditModal(true);
  };
  const saveStudySession = async () => {
    if (!editingSession || studyDuration < 1) {
      toast.error('Preencha pelo menos a duração do estudo');
      return;
    }
    try {
      // Usar o novo sistema acumulativo de sessões
      await createOrUpdateSession(editingSession.id, {
        duration: studyDuration,
        questions: questionsTotal,
        correctAnswers: questionsCorrect,
        notes: studyNotes
      }, sessionLink);

      // Registrar no sistema de estatísticas globais se >= 20 minutos
      if (studyDuration >= 20) {
        await addStudySession(studyDuration);
      }

      // Registrar questões no sistema de tracking se houver
      if (questionsTotal > 0) {
        const questionsWrong = questionsTotal - questionsCorrect;

        // Registrar cada acerto
        for (let i = 0; i < questionsCorrect; i++) {
          await trackAnswer('A', 'A'); // Simular acerto
        }

        // Registrar cada erro
        for (let i = 0; i < questionsWrong; i++) {
          await trackAnswer('A', 'B'); // Simular erro
        }
      }
      setShowEditModal(false);
      setEditingSession(null);

      // Limpar campos
      setStudyDuration(0);
      setStudyNotes('');
      setQuestionsTotal(0);
      setQuestionsCorrect(0);
      setCourseName('');
      setCourseProgress('');
      setSessionLink('');
    } catch (error) {
      console.error('Error saving study session:', error);
      toast.error('Erro ao salvar sessão de estudo');
    }
  };
  if (loading) {
    return <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>;
  }
  return <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cronograma</h1>
          <p className="text-muted-foreground">Organize seu tempo e maximize seus resultados</p>
        </div>
      </div>
      <div className="flex justify-end items-center mb-8">
        <div className="flex gap-2">
          
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nova Sessão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Sessão de Estudo</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Ciclo de Estudos</label>
                  <Select value={selectedCycle} onValueChange={setSelectedCycle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um ciclo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cycles.map(cycle => <SelectItem key={cycle.id} value={cycle.id}>
                          {cycle.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Bloco</label>
                  <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um bloco" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBlocks().map((block: any) => <SelectItem key={block.name} value={block.name}>
                          {block.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDisciplines().map((discipline: any) => <SelectItem key={discipline.name} value={discipline.name}>
                          {discipline.name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Dia da Semana</label>
                  <Select value={selectedDay.toString()} onValueChange={value => setSelectedDay(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um dia" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDays.map((day, index) => <SelectItem key={index} value={index.toString()}>
                          {day}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Horário de Início</label>
                    <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full p-2 border rounded-md" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Horário de Fim</label>
                    <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full p-2 border rounded-md" />
                  </div>
                </div>


                <div>
                  <label className="text-sm font-medium">Link da Aula/Vídeo (Opcional)</label>
                  <Input type="url" value={sessionLink} onChange={e => setSessionLink(e.target.value)} placeholder="https://exemplo.com/aula" className="w-full" />
                </div>

                <Button onClick={addSession} className="w-full">
                  Adicionar Sessão
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Modal de Edição de Sessão */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Sessão de Estudo</DialogTitle>
          </DialogHeader>
          {editingSession && <div className="space-y-4">
              <div className="p-3 bg-muted rounded-md">
                <div className="text-sm font-medium">{editingSession.disciplineName}</div>
                <div className="text-xs text-muted-foreground">{editingSession.blockName}</div>
                <div className="text-xs text-muted-foreground">
                  {editingSession.startTime} - {editingSession.endTime}
                </div>
              </div>

              <div>
                <Label htmlFor="sessionLink">Link da Sessão (Aula/Vídeo/Sistema)</Label>
                <Input id="sessionLink" type="url" value={sessionLink} onChange={e => setSessionLink(e.target.value)} placeholder="https://exemplo.com/aula ou sistema de questões" />
              </div>

              <div>
                <Label htmlFor="courseName">Nome do Curso</Label>
                <Input id="courseName" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Ex: Curso Completo de Direito Constitucional" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="duration">Tempo estudado (minutos) *</Label>
                  <Input id="duration" type="number" min="1" value={studyDuration} onChange={e => setStudyDuration(Number(e.target.value))} placeholder="Ex: 60" />
                  {studyDuration >= 20 && <p className="text-xs text-green-600 mt-1">✓ Sessão contará para as estatísticas</p>}
                </div>

                <div>
                  <Label htmlFor="studyType">Tipo de Estudo</Label>
                  <Select value={studyType} onValueChange={(value: 'pdf' | 'video') => setStudyType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="video">Vídeo Aula</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="questions-total">Total de questões</Label>
                  <Input id="questions-total" type="number" min="0" value={questionsTotal} onChange={e => setQuestionsTotal(Number(e.target.value))} placeholder="Questões resolvidas" />
                </div>

                {questionsTotal > 0 && <div>
                    <Label htmlFor="questions-correct">Questões corretas</Label>
                    <Input id="questions-correct" type="number" min="0" max={questionsTotal} value={questionsCorrect} onChange={e => setQuestionsCorrect(Number(e.target.value))} placeholder="Acertos" />
                  </div>}
              </div>

              {questionsTotal > 0 && <div className="p-3 bg-muted rounded-md">
                  <div className="text-sm text-muted-foreground">
                    Aproveitamento: {(questionsCorrect / questionsTotal * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {questionsCorrect} acertos • {questionsTotal - questionsCorrect} erros • {questionsTotal} total
                  </div>
                </div>}

              <div>
                <Label htmlFor="courseProgress">Progresso no Curso</Label>
                <Input id="courseProgress" value={courseProgress} onChange={e => setCourseProgress(e.target.value)} placeholder="Ex: Capítulo 5 - Direitos Fundamentais" />
              </div>

              {studyType === 'pdf' && <div>
                  <Label htmlFor="currentPage">Página atual do PDF</Label>
                  <Input id="currentPage" type="number" min="0" value={currentPage} onChange={e => setCurrentPage(Number(e.target.value))} placeholder="Ex: 145" />
                </div>}

              {studyType === 'video' && <div>
                  <Label htmlFor="currentVideo">Aula/Vídeo atual</Label>
                  <Input id="currentVideo" value={currentVideo} onChange={e => setCurrentVideo(e.target.value)} placeholder="Ex: Aula 05 - Princípios Constitucionais" />
                </div>}

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" value={studyNotes} onChange={e => setStudyNotes(e.target.value)} placeholder="O que você estudou, dificuldades, pontos importantes..." rows={3} />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowEditModal(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={saveStudySession} className="flex-1">
                  Salvar Sessão
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {cycles.length === 0 ? <Card>
          <CardContent className="text-center p-8">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ciclo de estudo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie um ciclo de estudos primeiro para poder organizar seu cronograma
            </p>
          </CardContent>
        </Card> : <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronograma Semanal
            </CardTitle>
            <CardDescription>
              Seu cronograma de estudos organizado por dias da semana
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekDays.map((day, index) => <div key={index} className="space-y-2">
                  <h3 className="font-semibold text-center p-2 bg-muted rounded-md">
                    {day}
                  </h3>
                  <div className="space-y-2 min-h-[200px]">
                      {getSessionsForDay(index).map(session => {
                const cumulativeSession = getSessionByScheduleId(session.id);
                const hasData = cumulativeSession && (cumulativeSession.total_duration_minutes > 0 || cumulativeSession.total_questions > 0);
                return <div key={session.id} className={`p-3 rounded-md border relative cursor-pointer transition-colors ${hasData ? 'bg-muted/70 border-green-200 dark:border-green-800 hover:bg-muted/80' : 'bg-primary/10 border-primary/20 hover:bg-primary/20'}`} onClick={() => openEditModal(session)}>
                             <div className="flex flex-col gap-2">
                               <div className="flex justify-between items-start">
                                 <div className="flex-1">
                                   <div className="text-xs font-medium mb-1 flex items-center gap-2">
                                     <span className={hasData ? 'text-green-600' : 'text-primary'}>
                                       {session.startTime} - {session.endTime}
                                     </span>
                                   </div>
                                   <div className="text-sm font-medium">{session.disciplineName}</div>
                                   <div className="text-xs text-muted-foreground">{session.blockName}</div>
                                   <div className="text-xs text-muted-foreground">{getCycleName(session.cycleId)}</div>
                                   {hasData && <div className="text-xs text-green-600 mt-1 space-y-0.5">
                                       <div>{cumulativeSession.total_duration_minutes}min total • {cumulativeSession.session_count} sessões</div>
                                       {cumulativeSession.total_questions > 0 && <div>{cumulativeSession.total_questions} questões • {Math.round(cumulativeSession.total_correct_answers / cumulativeSession.total_questions * 100)}% acertos</div>}
                                     </div>}
                                 </div>
                                 <div className="flex gap-1">
                                   {(session.sessionLink || cumulativeSession && cumulativeSession.session_link) && <Button variant="outline" size="sm" onClick={e => {
                          e.stopPropagation();
                          const linkToOpen = cumulativeSession && cumulativeSession.session_link || session.sessionLink;
                          window.open(linkToOpen, '_blank');
                        }} title="Abrir link da aula" className="h-6 text-xs text-primary mx-0 my-0 px-[6px] rounded-none">
                                       Aula
                                     </Button>}
                                 </div>
                               </div>
                               
                               <div className="flex justify-end pt-1 border-t border-border/50">
                                 <Button variant="outline" size="sm" onClick={e => {
                        e.stopPropagation();
                        removeSession(session.id);
                      }} className="h-6 px-2 text-xs text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground" title="Remover sessão">
                                   Excluir
                                 </Button>
                               </div>
                             </div>
                           </div>;
              })}
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default Cronograma;