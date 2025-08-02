import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Settings, BookOpen, Clock, X, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';
import { useQuestionTracking } from '@/hooks/useQuestionTracking';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
interface StudySession {
  id: string;
  day: number; // 0-6 (Sunday to Saturday)
  startTime: string;
  endTime: string;
  disciplineName: string;
  blockName: string;
  cycleId: string;
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
      // Note: You'd need to create a study_schedule table for this
      // For now, we'll use localStorage as a temporary solution
      const savedSessions = localStorage.getItem(`study_sessions_${user?.id}`);
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };
  const saveSessions = (newSessions: StudySession[]) => {
    localStorage.setItem(`study_sessions_${user?.id}`, JSON.stringify(newSessions));
    setSessions(newSessions);
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
      id: Date.now().toString(),
      day: selectedDay,
      startTime,
      endTime,
      disciplineName: selectedDiscipline,
      blockName: selectedBlock,
      cycleId: selectedCycle
    };
    const updatedSessions = [...sessions, newSession];
    saveSessions(updatedSessions);
    setShowAddModal(false);
    toast.success('Sessão adicionada ao cronograma!');
  };
  const removeSession = (sessionId: string) => {
    const updatedSessions = sessions.filter(s => s.id !== sessionId);
    saveSessions(updatedSessions);
    toast.success('Sessão removida do cronograma!');
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

    // Carregar dados existentes se a sessão já foi completada
    const existingData = getSessionData(session.id);
    if (existingData) {
      setStudyDuration(existingData.duration || 0);
      setStudyNotes(existingData.notes || '');
      setQuestionsTotal(existingData.questionsTotal || 0);
      setQuestionsCorrect(existingData.questionsCorrect || 0);
      setCourseName(existingData.courseName || '');
      setCourseProgress(existingData.courseProgress || '');
      setStudyType(existingData.studyType || 'pdf');
      setCurrentPage(existingData.currentPage || 0);
      setCurrentVideo(existingData.currentVideo || '');
    } else {
      setStudyDuration(0);
      setStudyNotes('');
      setQuestionsTotal(0);
      setQuestionsCorrect(0);
      setCourseName('');
      setCourseProgress('');
      setStudyType('pdf');
      setCurrentPage(0);
      setCurrentVideo('');
    }
    setShowEditModal(true);
  };
  const saveStudySession = async () => {
    if (!editingSession || studyDuration < 1) {
      toast.error('Preencha pelo menos a duração do estudo');
      return;
    }
    try {
      // Registrar sessão de estudo se duração >= 20 minutos
      if (studyDuration >= 20) {
        await addStudySession(studyDuration);
      }

      // Registrar questões se houver
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

      // Salvar dados da sessão no localStorage (você pode implementar uma tabela específica depois)
      const sessionData = {
        sessionId: editingSession.id,
        date: new Date().toISOString(),
        duration: studyDuration,
        notes: studyNotes,
        questionsTotal,
        questionsCorrect,
        discipline: editingSession.disciplineName,
        block: editingSession.blockName,
        courseName,
        courseProgress,
        studyType,
        currentPage: studyType === 'pdf' ? currentPage : undefined,
        currentVideo: studyType === 'video' ? currentVideo : undefined
      };
      const savedSessions = localStorage.getItem(`completed_sessions_${user?.id}`);
      const completedSessions = savedSessions ? JSON.parse(savedSessions) : [];
      completedSessions.push(sessionData);
      localStorage.setItem(`completed_sessions_${user?.id}`, JSON.stringify(completedSessions));
      setShowEditModal(false);
      setEditingSession(null);
      toast.success('Sessão de estudo registrada com sucesso!');
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Cronograma</h1>
          <p className="text-muted-foreground">Organize seu tempo e maximize seus resultados</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
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
                     {getSessionsForDay(index).map(session => <div key={session.id} className={`p-3 rounded-md border relative cursor-pointer transition-colors ${isSessionCompleted(session.id) ? 'bg-muted/70 border-green-200 dark:border-green-800 hover:bg-muted/80' : 'bg-primary/10 border-primary/20 hover:bg-primary/20'}`} onClick={() => openEditModal(session)}>
                         <div className="flex justify-between items-start">
                           <div className="flex-1">
                             <div className="text-xs font-medium mb-1 flex items-center gap-2">
                               <span className={isSessionCompleted(session.id) ? 'text-green-600' : 'text-primary'}>
                                 {session.startTime} - {session.endTime}
                               </span>
                               {isSessionCompleted(session.id) && <span className="text-green-600 text-xs">✓</span>}
                             </div>
                             <div className="text-sm font-medium">{session.disciplineName}</div>
                             <div className="text-xs text-muted-foreground">{session.blockName}</div>
                             <div className="text-xs text-muted-foreground">{getCycleName(session.cycleId)}</div>
                             {isSessionCompleted(session.id) && <div className="text-xs text-green-600 mt-1">
                                 {(() => {
                        const sessionData = getSessionData(session.id);
                        return sessionData ? `${sessionData.duration}min estudados` : '';
                      })()}
                               </div>}
                           </div>
                           <div className="flex gap-1">
                             <button onClick={e => {
                      e.stopPropagation();
                      openEditModal(session);
                    }} className="text-muted-foreground hover:text-primary" title="Editar sessão">
                               <Edit className="h-3 w-3" />
                             </button>
                             <button onClick={e => {
                      e.stopPropagation();
                      removeSession(session.id);
                    }} className="text-muted-foreground hover:text-destructive" title="Remover sessão">
                               <X className="h-3 w-3" />
                             </button>
                           </div>
                         </div>
                       </div>)}
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};
export default Cronograma;