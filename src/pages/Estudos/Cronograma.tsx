import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarIcon, Plus, Settings, BookOpen, Clock, X, ArrowLeft, Timer, Play, Pause, Square, Minus, ExternalLink, Trash2, FileText, Upload, Loader2, Pencil, Check } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn, generateId } from '@/lib/utils';
import { useTimer } from '@/contexts/TimerContext';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useStudyStatistics } from '@/hooks/useStudyStatistics';
import { useQuestionTracking } from '@/hooks/useQuestionTracking';
import { StudyCycleV2 } from '@/types/userStudy';
import { useStudySessions } from '@/hooks/useStudySessions';
import { useStudyCyclesV2 } from '@/hooks/useStudyCyclesV2';
import { UserStudyService } from '@/services/userStudyService';
import { v4 as uuidv4 } from 'uuid';
import { useOptimizedSessionData } from '@/hooks/useOptimizedSessionData';
import { supabase } from '@/integrations/supabase/client';
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
// Interface para props do modo coach
interface CronogramaProps {
  coachMode?: boolean;
  targetStudentId?: string;
  targetCycleId?: string;
  onSuccess?: () => void;
}

// Usar StudyCycleV2 do types
const Cronograma = ({ coachMode, targetStudentId, targetCycleId, onSuccess }: CronogramaProps = {}) => {
  const {
    user
  } = useAuth();
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
    setInitialTime
  } = useTimer();
  const {
    addScheduleSession,
    recordCompletedSession,
    fetchCycles: refetchCycles
  } = useStudyCyclesV2();

  // Clock state
  const [currentTime, setCurrentTime] = useState(new Date());

  // Calendar state (simplificado - apenas visual)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Calendário simplificado - sem funcionalidades de estatísticas

  // Calendário simplificado - sem funcionalidades de estatísticas
  const [cycles, setCycles] = useState<StudyCycleV2[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<string>('');
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedDay, setSelectedDay] = useState<number>(0);
  const [customBlock, setCustomBlock] = useState<string>('');
  const [customDiscipline, setCustomDiscipline] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('08:00');
  const [endTime, setEndTime] = useState<string>('09:00');
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSessionDetailsModal, setShowSessionDetailsModal] = useState(false);
  const [selectedDateSessions, setSelectedDateSessions] = useState<any[]>([]);
  const [editingSession, setEditingSession] = useState<StudySession | null>(null);
  const [sessionLink, setSessionLink] = useState<string>('');

  // Estados para edição de sessão
  const [studyDuration, setStudyDuration] = useState<number>(0);
  const [studyNotes, setStudyNotes] = useState<string>('');
  const [questionsTotal, setQuestionsTotal] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);
  const [questionsError, setQuestionsError] = useState<string>('');
  const [courseName, setCourseName] = useState<string>('');
  const [courseProgress, setCourseProgress] = useState<string>('');
  const [studyType, setStudyType] = useState<'pdf' | 'video'>('pdf');
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [currentVideo, setCurrentVideo] = useState<string>('');

  // Função de validação das questões
  const validateQuestions = (total: number, correct: number) => {
    if (correct > total) {
      setQuestionsError('Questões corretas não podem ser maiores que o total');
      return false;
    }
    setQuestionsError('');
    return true;
  };
  const {
    addStudySession
  } = useStudyStatistics();
  const {
    trackAnswer
  } = useQuestionTracking();
  const {
    createOrUpdateSession,
    updateSessionLink
  } = useStudySessions();

  // Usar hook otimizado para dados de sessão
  const {
    sessionData,
    loading: sessionDataLoading,
    error: sessionDataError,
    refreshData
  } = useOptimizedSessionData({
    targetUserId: coachMode ? targetStudentId : undefined
  });

  // Armazenar userStudy completo para acessar study_sessions
  const [userStudy, setUserStudy] = useState<any>(null);

  // Estados para upload de PDF
  const [uploadingPDF, setUploadingPDF] = useState<string | null>(null);

  // Estados para edição de labels
  const [editingLabel, setEditingLabel] = useState<'trilha_semanal' | 'subjetiva' | null>(null);
  const [labelValue, setLabelValue] = useState<string>('');

  // Timer helper functions
  const formatTime = (mins: number, secs: number) => {
    return `${mins.toString().padStart(2, '0')} min`;
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
  const weekDays = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  useEffect(() => {
    const targetUserId = coachMode ? targetStudentId : user?.id;
    if (targetUserId) {
      fetchCycles();
      fetchSessions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, targetStudentId, coachMode]);

  // Inicializar selectedCycle automaticamente
  useEffect(() => {
    // Se targetCycleId foi fornecido, usar ele
    if (targetCycleId && cycles.length > 0) {
      const cycleExists = cycles.find(c => c.id === targetCycleId);
      if (cycleExists && selectedCycle !== targetCycleId) {
        setSelectedCycle(targetCycleId);
      }
    }
    // Se não há ciclo selecionado e há ciclos disponíveis, selecionar o primeiro
    else if (!selectedCycle && cycles.length > 0) {
      setSelectedCycle(cycles[0].id);
    }
  }, [cycles, targetCycleId, selectedCycle]);

  // Update clock every 5 seconds - otimizado para melhor performance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 5000); // 5 segundos em vez de 1 segundo para reduzir re-renders
    return () => clearInterval(timer);
  }, []);
  const fetchCycles = async () => {
    const targetUserId = coachMode ? targetStudentId : user?.id;
    if (!targetUserId) return;
    
    try {
      const userStudyData = await UserStudyService.getUserStudyData(targetUserId);
      if (userStudyData) {
        setUserStudy(userStudyData); // Armazenar dados completos incluindo study_sessions
        const activeCycles = userStudyData.study_cycles.filter(cycle => cycle.is_active);
        setCycles(activeCycles);
      }
    } catch (error) {
      console.error('Error fetching cycles:', error);
    }
  };
  const fetchSessions = async () => {
    const targetUserId = coachMode ? targetStudentId : user?.id;
    if (!targetUserId) return;
    
    try {
      const userStudyData = await UserStudyService.getUserStudyData(targetUserId);
      if (!userStudyData) {
        setUserStudy(null);
        setSessions([]);
        return;
      }
      setUserStudy(userStudyData);
      const allSessions: StudySession[] = [];

      // ✅ Buscar de study_schedule primeiro
      if (userStudyData.study_schedule && userStudyData.study_schedule.length > 0) {
        userStudyData.study_schedule.forEach(session => {
          // Verificar se o ciclo está ativo
          const cycle = userStudyData.study_cycles.find(c => c.id === session.cycle_id);
          if (cycle && cycle.is_active) {
            // IMPORTANTE: day_of_week está no formato ISO (1=segunda, 7=domingo)
            // Precisamos converter para formato JavaScript (0=domingo, 6=sábado)
            let dayOfWeek = session.day_of_week;
            
            // Se for formato ISO (1-7), converter para JavaScript (0-6)
            if (dayOfWeek >= 1 && dayOfWeek <= 7) {
              dayOfWeek = dayOfWeek === 7 ? 0 : dayOfWeek; // Domingo: 7 -> 0
            }
            
            allSessions.push({
              id: session.id,
              day: dayOfWeek,
              startTime: session.start_time,
              endTime: session.end_time,
              disciplineName: session.discipline_name || 'Disciplina',
              blockName: session.block_name || 'Bloco',
              cycleId: session.cycle_id!,
              sessionLink: session.session_link || ''
            });
          }
        });
      }

      // ✅ Fallback: buscar de weekly_schedule (legado)
      if (allSessions.length === 0) {
        userStudyData.study_cycles.forEach(cycle => {
          if (cycle.is_active && cycle.schedule_data?.weekly_schedule) {
            cycle.schedule_data.weekly_schedule.forEach(daySchedule => {
              daySchedule.sessions.forEach(session => {
                allSessions.push({
                  id: session.id,
                  day: daySchedule.day,
                  startTime: session.start_time,
                  endTime: session.end_time,
                  disciplineName: session.discipline_name || 'Disciplina',
                  blockName: session.block_name || 'Bloco',
                  cycleId: cycle.id,
                  sessionLink: session.session_link || ''
                });
              });
            });
          }
        });
      }
      setSessions(allSessions);
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
          // This is a new session, add it
          await UserStudyService.addScheduleSession(user?.id, {
            day_of_week: session.day,
            start_time: session.startTime,
            end_time: session.endTime,
            discipline_name: session.disciplineName,
            block_name: session.blockName,
            cycle_id: session.cycleId,
            session_link: session.sessionLink,
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
  // Função para extrair blocos únicos do available_blocks do schedule_data
  const getAvailableBlocks = () => {
    const selectedCycleData = cycles.find(c => c.id === selectedCycle);
    if (!selectedCycleData) return [];

    // Buscar blocos salvos no ciclo (available_blocks)
    const savedBlocks = selectedCycleData.schedule_data.available_blocks || [];

    // Se não há blocos salvos, mostrar opção customizada
    if (savedBlocks.length === 0) {
      return [{
        name: '+ Adicionar novo bloco',
        id: '__custom__'
      }];
    }
    return savedBlocks.map(block => ({
      name: block.name,
      id: block.name
    }));
  };

  // Função para extrair disciplinas únicas do available_disciplines do schedule_data
  const getAvailableDisciplines = () => {
    const selectedCycleData = cycles.find(c => c.id === selectedCycle);
    if (!selectedCycleData || !selectedBlock) return [];

    // Buscar disciplinas salvas no ciclo (available_disciplines) para o bloco selecionado
    const savedDisciplines = selectedCycleData.schedule_data.available_disciplines || [];
    const blockDisciplines = savedDisciplines.filter(d => d.block_name === selectedBlock);

    // Se não há disciplinas salvas para este bloco, mostrar opção customizada
    if (blockDisciplines.length === 0) {
      return [{
        name: '+ Adicionar nova disciplina',
        id: '__custom__'
      }];
    }
    return blockDisciplines.map(discipline => ({
      name: discipline.name,
      id: discipline.name
    }));
  };
  const addSession = async () => {
    // Usar valores customizados se selecionados
    const finalBlock = selectedBlock === '__custom__' ? customBlock : selectedBlock;
    const finalDiscipline = selectedDiscipline === '__custom__' ? customDiscipline : selectedDiscipline;
    const targetUserId = coachMode ? targetStudentId : user?.id;
    
    if (!selectedCycle || !finalBlock || !finalDiscipline) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    // Validar horários
    if (endTime <= startTime) {
      toast.error('O horário de fim deve ser posterior ao horário de início');
      return;
    }
    try {
      // Adicionar sessão ao cronograma usando o hook useStudyCyclesV2
      const success = await addScheduleSession(selectedCycle, selectedDay, {
        start_time: startTime,
        end_time: endTime,
        discipline_name: finalDiscipline,
        block_name: finalBlock,
        session_link: sessionLink
      }, targetUserId);
      if (success) {
        // Recarregar ciclos para atualizar a lista de blocos e disciplinas
        await fetchCycles();

        // Recarregar sessões para mostrar a nova sessão imediatamente
        await fetchSessions();

        // Limpar campos
        setSelectedBlock('');
        setSelectedDiscipline('');
        setCustomBlock('');
        setCustomDiscipline('');
        setStartTime('08:00');
        setEndTime('09:00');
        setSessionLink('');
        setShowAddModal(false);
        toast.success('Tarefa adicionada ao cronograma!');
      } else {
        toast.error('Erro ao adicionar tarefa');
      }
    } catch (error) {
      console.error('Error adding session:', error);
      toast.error('Erro ao adicionar tarefa');
    }
  };
  const removeSession = async (sessionId: string) => {
    try {
      const targetUserId = coachMode ? targetStudentId : user?.id;
      if (!targetUserId) {
        toast.error('Erro ao identificar usuário');
        return;
      }
      
      // Remove session from schedule
      const success = await UserStudyService.removeScheduleSession(targetUserId, sessionId);
      if (success) {
        // Recarregar sessões do banco
        await fetchSessions();
        toast.success('Tarefa removida do cronograma!');
      } else {
        toast.error('Erro ao remover tarefa');
      }
    } catch (error) {
      toast.error('Erro ao remover tarefa');
    }
  };

  // Funções para upload/download de PDFs
  const handlePDFUpload = (type: 'trilha_semanal' | 'subjetiva') => {
    if (!selectedCycle) {
      toast.error('Nenhum ciclo selecionado');
      return;
    }
    if (uploadingPDF === type) {
      return; // Já está fazendo upload
    }
    const inputId = type === 'trilha_semanal' ? 'trilha-semanal-upload' : 'subjetiva-upload';
    const input = document.getElementById(inputId) as HTMLInputElement;
    if (input) {
      // Resetar o valor para permitir selecionar o mesmo arquivo novamente se necessário
      input.value = '';
      // Garantir que o input não está desabilitado antes de clicar
      if (input.disabled) {
        console.warn(`Input ${inputId} está desabilitado`);
        toast.error('Não é possível fazer upload no momento');
        return;
      }
      input.click();
    } else {
      console.error(`Input ${inputId} não encontrado`);
      toast.error('Erro ao abrir seletor de arquivos');
    }
  };

  const handlePDFFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'trilha_semanal' | 'subjetiva'
  ) => {
    const file = event.target.files?.[0];
    if (!file || !selectedCycle) {
      event.target.value = '';
      return;
    }

    // Validação de tipo (MIME type ou extensão)
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();
    
    // Tipos de imagem permitidos
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const allowedImageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    
    // Verificar se é PDF
    const hasPDFExtension = fileName.endsWith('.pdf') || 
                           fileName.endsWith('pdf') ||
                           fileName.includes('.pdf');
    const isPDFMimeType = fileType === 'application/pdf' || 
                         fileType === 'application/x-pdf' ||
                         fileType === 'application/acrobat' ||
                         fileType.includes('pdf');
    const isPDF = isPDFMimeType || hasPDFExtension;
    
    // Verificar se é imagem
    const hasImageExtension = allowedImageExtensions.some(ext => fileName.endsWith(ext));
    const isImage = allowedImageTypes.includes(fileType) || hasImageExtension;
    
    if (!isPDF && !isImage) {
      toast.error(`Apenas arquivos PDF ou imagens (JPG, PNG, GIF, WEBP) são permitidos. Arquivo selecionado: ${file.name} (tipo: ${file.type || 'desconhecido'})`);
      event.target.value = '';
      return;
    }

    // Validação de tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo: 10MB');
      event.target.value = '';
      return;
    }

    setUploadingPDF(type);
    const targetUserId = coachMode ? targetStudentId : user?.id;
    
    if (!targetUserId) {
      toast.error('Erro ao identificar usuário');
      setUploadingPDF(null);
      event.target.value = '';
      return;
    }

    try {
      const cycle = cycles.find(c => c.id === selectedCycle);
      if (!cycle) {
        toast.error('Ciclo não encontrado');
        setUploadingPDF(null);
        event.target.value = '';
        return;
      }

      // Determinar extensão baseado no tipo do arquivo
      let fileExt: string;
      if (isPDF) {
        fileExt = 'pdf';
      } else {
        // Extrair extensão da imagem
        const imageExt = fileName.match(/\.(jpg|jpeg|png|gif|webp)$/)?.[1] || 'jpg';
        fileExt = imageExt === 'jpeg' ? 'jpg' : imageExt;
      }
      
      const uploadFileName = `cycle-${selectedCycle}-${type}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `study-documents/${targetUserId}/${uploadFileName}`;

      // Upload para storage
      // Manter o arquivo original, apenas garantir que tem a extensão correta no nome
      let fileToUpload: File | Blob = file;
      
      // Se for PDF e o tipo não for application/pdf, criar um novo File/Blob com tipo correto
      if (isPDF && file.type !== 'application/pdf') {
        // Ler o arquivo como ArrayBuffer
        const arrayBuffer = await file.arrayBuffer();
        // Criar um Blob com tipo application/pdf
        const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
        // Converter Blob para File mantendo o nome original
        fileToUpload = new File([blob], file.name.endsWith('.pdf') ? file.name : `${file.name}.pdf`, {
          type: 'application/pdf',
          lastModified: file.lastModified
        });
      }
      
      const { data, error: uploadError } = await supabase.storage
        .from('profiles') // Usando bucket profiles (mesmo que CreatePostForm)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          // Não especificar contentType - deixar o Supabase usar o tipo do File/Blob
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);

      // Atualizar ciclo com nova URL
      const updateField = type === 'trilha_semanal' ? 'trilha_semanal_pdf_url' : 'subjetiva_pdf_url';
      await UserStudyService.updateCycle(targetUserId, selectedCycle, {
        [updateField]: publicUrl
      });

      // Recarregar ciclos
      await fetchCycles();
      const fileTypeLabel = isPDF ? 'PDF' : 'imagem';
      toast.success(`${type === 'trilha_semanal' ? 'Trilha Semanal' : 'Subjetiva'} (${fileTypeLabel}) enviada com sucesso!`);
    } catch (error: any) {
      toast.error(`Erro ao fazer upload: ${error.message || 'Tente novamente'}`);
    } finally {
      setUploadingPDF(null);
      event.target.value = '';
    }
  };

  const handlePDFRemove = async (type: 'trilha_semanal' | 'subjetiva') => {
    if (!selectedCycle) {
      toast.error('Nenhum ciclo selecionado');
      return;
    }
    
    const targetUserId = coachMode ? targetStudentId : user?.id;
    if (!targetUserId) {
      toast.error('Erro ao identificar usuário');
      return;
    }

    const updateField = type === 'trilha_semanal' ? 'trilha_semanal_pdf_url' : 'subjetiva_pdf_url';
    
    try {
      await UserStudyService.updateCycle(targetUserId, selectedCycle, {
        [updateField]: null
      });
      
      await fetchCycles();
      toast.success(`${type === 'trilha_semanal' ? 'Trilha Semanal' : 'Subjetiva'} removida`);
    } catch (error) {
      console.error('Error removing PDF:', error);
      toast.error('Erro ao remover PDF');
    }
  };

  // Funções para edição de labels
  const startEditingLabel = (type: 'trilha_semanal' | 'subjetiva') => {
    const cycle = cycles.find(c => c.id === selectedCycle);
    if (!cycle) return;
    
    const currentLabel = type === 'trilha_semanal' 
      ? (cycle.trilha_semanal_label || 'Trilha Semanal')
      : (cycle.subjetiva_label || 'Subjetiva');
    
    setEditingLabel(type);
    setLabelValue(currentLabel);
  };

  const cancelEditingLabel = () => {
    setEditingLabel(null);
    setLabelValue('');
  };

  const saveLabel = async (type: 'trilha_semanal' | 'subjetiva') => {
    if (!selectedCycle) {
      toast.error('Nenhum ciclo selecionado');
      return;
    }

    const trimmedValue = labelValue.trim();
    if (trimmedValue.length === 0) {
      toast.error('O nome não pode estar vazio');
      return;
    }

    if (trimmedValue.length > 20) {
      toast.error('O nome deve ter no máximo 20 caracteres');
      return;
    }
    
    const targetUserId = coachMode ? targetStudentId : user?.id;
    if (!targetUserId) {
      toast.error('Erro ao identificar usuário');
      return;
    }

    const updateField = type === 'trilha_semanal' ? 'trilha_semanal_label' : 'subjetiva_label';
    
    try {
      await UserStudyService.updateCycle(targetUserId, selectedCycle, {
        [updateField]: trimmedValue
      });
      
      await fetchCycles();
      setEditingLabel(null);
      setLabelValue('');
      toast.success('Nome atualizado');
    } catch (error) {
      console.error('Error saving label:', error);
      toast.error('Erro ao salvar nome');
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
    return cycles.find(c => c.id === cycleId)?.cycle_name || 'Ciclo não encontrado';
  };

  // Função para verificar se um dia tem sessões estudadas
  const getSessionsForDate = (date: Date) => {
    // ✅ Formato correto: YYYY-MM-DD usando locale canadense (evita problemas de timezone)
    const dateString = date.toLocaleDateString('en-CA');
    const allSessions: any[] = [];

    // Buscar APENAS sessões completadas (study_sessions)
    if (userStudy?.study_sessions && Array.isArray(userStudy.study_sessions)) {
      userStudy.study_sessions.forEach((completedSession: any) => {
        if (completedSession.date === dateString) {
          // ✅ BUSCAR CICLO usando cycle_id OU primeiro ciclo ativo
          let cycle = null;
          if (completedSession.cycle_id) {
            cycle = userStudy.study_cycles?.find((c: any) => c.id === completedSession.cycle_id);
          }
          // Fallback: usar primeiro ciclo ativo se não encontrar pelo ID
          if (!cycle && userStudy.study_cycles) {
            cycle = userStudy.study_cycles.find((c: any) => c.is_active);
          }
          
          // ✅ ADICIONAR SESSÃO mesmo sem ciclo
          allSessions.push({
            cycle: cycle ? {
              name: cycle.cycle_name,
              organ: cycle.organ,
              position: cycle.position
            } : {
              name: 'Ciclo não encontrado',
              organ: '',
              position: ''
            },
            session: {
              discipline: completedSession.discipline_name || 'Sem disciplina',
              topic: completedSession.block_name || 'Sem tópico',
              startTime: completedSession.start_time || '08:00',
              endTime: completedSession.end_time || '09:00',
              duration: completedSession.duration_minutes || 0,
              questions: completedSession.questions || 0,
              correct: completedSession.correct_answers || 0,
              notes: completedSession.notes || '',
              link: completedSession.session_link || '',
              studyType: completedSession.study_type || 'manual',
              courseName: completedSession.course_name || ''
            }
          });
        }
      });
    }
    
    return allSessions;
  };

  // Função para abrir modal de detalhes das sessões
  const openSessionDetailsModal = (date: Date) => {
    const sessions = getSessionsForDate(date);
    setSelectedDate(date);
    setSelectedDateSessions(sessions);
    setShowSessionDetailsModal(true);
  };

  // Função para verificar se um dia tem sessões (para cor do calendário)
  const hasSessionsOnDate = (date: Date) => {
    const sessions = getSessionsForDate(date);
    return sessions.length > 0;
  };

  // Função para registrar sessão completada (usando RPC para separar em study_sessions)
  const updateScheduleSessionStats = async (sessionId: string, stats: {
    duration: number;
    questions: number;
    correctAnswers: number;
    sessionLink: string;
    notes?: string;
    courseName?: string;
    studyType?: string;
  }) => {
    try {
      // Encontrar a sessão no cronograma para obter cycleId e dayOfWeek
      let cycleId = '';
      let dayOfWeek = 0;
      for (const session of sessions) {
        if (session.id === sessionId) {
          cycleId = session.cycleId;
          dayOfWeek = session.day;
          break;
        }
      }
      if (!cycleId) {
        toast.error('Tarefa não encontrada');
        return;
      }

      // Determinar o userId correto (targetStudentId em coach mode, user.id em modo normal)
      const targetUserId = coachMode ? targetStudentId : user?.id;

      // Usar recordCompletedSession do hook para registrar via RPC
      const success = await recordCompletedSession(cycleId, dayOfWeek, sessionId, {
        duration_minutes: stats.duration,
        questions: stats.questions,
        correct_answers: stats.correctAnswers,
        notes: stats.notes || ''
      }, targetUserId); // ✅ Passar targetUserId
      if (success) {
        // Recarregar ciclos para atualizar total_stats
        await refetchCycles();
        await fetchSessions();
      }
    } catch (error) {
      console.error('Error recording session:', error);
      toast.error('Erro ao registrar tarefa');
    }
  };
  const openEditModal = (session: StudySession) => {
    setEditingSession(session);

    // Carregar dados existentes de sessões acumulativas do sessionData
    const existingSession = sessionData[session.id];
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

    // Validar questões antes de salvar
    if (questionsTotal > 0 && !validateQuestions(questionsTotal, questionsCorrect)) {
      toast.error('Corrija os valores das questões antes de salvar');
      return;
    }
    try {
      // Salvar APENAS no cronograma (fonte única de verdade)
      await updateScheduleSessionStats(editingSession.id, {
        duration: studyDuration,
        questions: questionsTotal,
        correctAnswers: questionsCorrect,
        sessionLink: sessionLink,
        notes: studyNotes,
        courseName: courseName,
        studyType: studyType
      });

      // Registrar no sistema de estatísticas globais se >= 20 minutos
      if (studyDuration >= 20) {
        await addStudySession(studyDuration, 'manual', editingSession.disciplineName);
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

      // Recarregar dados para sincronizar
      await refreshData(); // Recarregar dados do cronograma
      await fetchCycles(); // Recarregar ciclos para atualizar calendário

      // Limpar campos
      setStudyDuration(0);
      setStudyNotes('');
      setQuestionsTotal(0);
      setQuestionsCorrect(0);
      setCourseName('');
      setCourseProgress('');
      setSessionLink('');
      toast.success('Tarefa de estudo salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar tarefa de estudo');
    }
  };
  if (loading) {
    return <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>;
  }
  return <div className="min-h-screen p-6 bg-page-background">
      <div className="flex items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-foreground">Cronograma de Estudos</h1>
      </div>

      {/* Clock, Timer, and Calendar Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-[5px]">
        {/* Clock Card */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Relógio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-2">
              <div className="text-6xl font-bold">
                {format(currentTime, 'HH:mm:ss')}
              </div>
              <div className="text-sm text-muted-foreground">
                {format(currentTime, 'EEEE, dd/MM/yyyy', {
                locale: ptBR
              })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Timer Card */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Timer className="h-5 w-5" />
              Timer de Estudo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              {/* Time Display */}
              <div className="text-4xl font-bold">
                {formatTime(minutes, seconds)}
              </div>

              {/* Progress Bar */}
              {isRunning && <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full transition-all duration-1000" style={{
                width: `${getProgressPercentage()}%`
              }} />
                </div>}

              {/* Time Controls */}
              {!isRunning && <div className="flex justify-center items-center gap-2 mb-4">
                  <Button variant="outline" size="sm" onClick={removeTime} disabled={initialMinutes <= 5}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  
                  <div className="text-sm text-muted-foreground min-w-[60px]">
                    {initialMinutes} min
                  </div>
                  
                  <Button variant="outline" size="sm" onClick={addTime} disabled={initialMinutes >= 360}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>}

              {/* Control Buttons */}
              <div className="flex justify-center gap-2">
                {!isRunning ? <Button onClick={handleStart} className="w-full">
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar
                  </Button> : <>
                    {!isPaused ? <Button variant="outline" onClick={pauseTimer} className="flex-1">
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </Button> : <Button onClick={resumeTimer} className="flex-1">
                        <Play className="h-4 w-4 mr-2" />
                        Continuar
                      </Button>}
                    <Button variant="outline" onClick={stopTimer} className="flex-1">
                      <Square className="h-4 w-4 mr-2" />
                      Parar
                    </Button>
                  </>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calendar Card */}
        <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{
        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Calendário de Estudos
            </CardTitle>
            
          </CardHeader>
          <CardContent className="space-y-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-9", !selectedDate && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? format(selectedDate, 'dd/MM/yyyy', {
                  locale: ptBR
                }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent 
                  mode="single" 
                  selected={selectedDate} 
                  onSelect={date => {
                    if (date) {
                      setSelectedDate(date);
                      if (hasSessionsOnDate(date)) {
                        openSessionDetailsModal(date);
                      }
                    }
                  }} 
                  initialFocus 
                  className={cn("p-3")} 
                  components={{
                    Day: ({
                      date,
                      displayMonth,
                      className,
                      ...props
                    }) => {
                      const hasSessions = hasSessionsOnDate(date);
                      return (
                        <button
                          type="button"
                          {...props}
                          className={cn(
                            className, // Isso já inclui rdp-day, rdp-day_selected, etc.
                            hasSessions && "studied-day" // Adicionar nossa classe para os estilos CSS
                          )}
                          style={hasSessions ? {
                            backgroundColor: '#10b981',
                            color: 'white',
                            fontWeight: 600,
                            border: 'none',
                            borderRadius: '50%',
                            width: '30px',
                            height: '30px'
                          } : undefined}
                          onClick={(e) => {
                            // Preservar comportamento padrão do DayPicker
                            if (props.onClick) {
                              (props.onClick as any)(e);
                            }
                            // Abrir modal se tiver sessões
                            if (hasSessions) {
                              openSessionDetailsModal(date);
                            }
                          }}
                        >
                          <span className="relative z-0">{date.getDate()}</span>
                        </button>
                      );
                    }
                  }} 
                />
              </PopoverContent>
            </Popover>

            {/* Divisor e Documentos - Compacto */}
            {selectedCycle && (
              <div className="border-t border-border pt-2 space-y-1.5">
                {/* Trilha Semanal - Linha única */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    {editingLabel === 'trilha_semanal' ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Input
                          value={labelValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.length <= 20) {
                              setLabelValue(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveLabel('trilha_semanal');
                            } else if (e.key === 'Escape') {
                              cancelEditingLabel();
                            }
                          }}
                          className="h-6 px-2 text-xs flex-1 min-w-0"
                          autoFocus
                          maxLength={20}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => saveLabel('trilha_semanal')}
                          title="Salvar"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={cancelEditingLabel}
                          title="Cancelar"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-1 min-w-0 group">
                        <span className="font-medium truncate">
                          {cycles.find(c => c.id === selectedCycle)?.trilha_semanal_label || 'Trilha Semanal'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditingLabel('trilha_semanal')}
                          title="Editar nome"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {cycles.find(c => c.id === selectedCycle)?.trilha_semanal_pdf_url ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const cycle = cycles.find(c => c.id === selectedCycle);
                            if (cycle?.trilha_semanal_pdf_url) {
                              window.open(cycle.trilha_semanal_pdf_url, '_blank');
                            }
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handlePDFUpload('trilha_semanal')}
                          disabled={uploadingPDF === 'trilha_semanal'}
                          title="Substituir PDF"
                        >
                          {uploadingPDF === 'trilha_semanal' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handlePDFRemove('trilha_semanal')}
                          title="Remover PDF"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handlePDFUpload('trilha_semanal')}
                        disabled={uploadingPDF === 'trilha_semanal'}
                      >
                        {uploadingPDF === 'trilha_semanal' ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-1" />
                            Enviar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <input
                    id="trilha-semanal-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handlePDFFileSelect(e, 'trilha_semanal')}
                    className="hidden"
                    disabled={!selectedCycle || uploadingPDF === 'trilha_semanal'}
                  />
                </div>

                {/* Subjetiva - Linha única */}
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    {editingLabel === 'subjetiva' ? (
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <Input
                          value={labelValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.length <= 20) {
                              setLabelValue(val);
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              saveLabel('subjetiva');
                            } else if (e.key === 'Escape') {
                              cancelEditingLabel();
                            }
                          }}
                          className="h-6 px-2 text-xs flex-1 min-w-0"
                          autoFocus
                          maxLength={20}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => saveLabel('subjetiva')}
                          title="Salvar"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={cancelEditingLabel}
                          title="Cancelar"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 flex-1 min-w-0 group">
                        <span className="font-medium truncate">
                          {cycles.find(c => c.id === selectedCycle)?.subjetiva_label || 'Subjetiva'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => startEditingLabel('subjetiva')}
                          title="Editar nome"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {cycles.find(c => c.id === selectedCycle)?.subjetiva_pdf_url ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => {
                            const cycle = cycles.find(c => c.id === selectedCycle);
                            if (cycle?.subjetiva_pdf_url) {
                              window.open(cycle.subjetiva_pdf_url, '_blank');
                            }
                          }}
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handlePDFUpload('subjetiva')}
                          disabled={uploadingPDF === 'subjetiva'}
                          title="Substituir PDF"
                        >
                          {uploadingPDF === 'subjetiva' ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Upload className="h-3 w-3" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => handlePDFRemove('subjetiva')}
                          title="Remover PDF"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handlePDFUpload('subjetiva')}
                        disabled={uploadingPDF === 'subjetiva'}
                      >
                        {uploadingPDF === 'subjetiva' ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Upload className="h-3 w-3 mr-1" />
                            Enviar
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <input
                    id="subjetiva-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif,.webp,application/pdf,image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => handlePDFFileSelect(e, 'subjetiva')}
                    className="hidden"
                    disabled={!selectedCycle || uploadingPDF === 'subjetiva'}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end items-center mb-4">
        <div className="flex gap-2">
          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogTrigger asChild>
              
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Tarefa de Estudo</DialogTitle>
                <DialogDescription>
                  Adicione uma nova tarefa de estudo ao seu cronograma semanal
                </DialogDescription>
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
                          {cycle.cycle_name}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Bloco</label>
                  <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou digite um bloco" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBlocks().map((block: any) => <SelectItem key={block.name} value={block.name}>
                          {block.name}
                        </SelectItem>)}
                      <SelectItem value="__custom__">+ Adicionar novo bloco</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedBlock === '__custom__' && <Input placeholder="Digite o nome do bloco" value={customBlock} onChange={e => setCustomBlock(e.target.value)} className="mt-2" />}
                </div>

                <div>
                  <label className="text-sm font-medium">Disciplina</label>
                  <Select value={selectedDiscipline} onValueChange={setSelectedDiscipline}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione ou digite uma disciplina" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableDisciplines().map((discipline: any) => <SelectItem key={discipline.name} value={discipline.name}>
                          {discipline.name}
                        </SelectItem>)}
                      <SelectItem value="__custom__">+ Adicionar nova disciplina</SelectItem>
                    </SelectContent>
                  </Select>
                  {selectedDiscipline === '__custom__' && <Input placeholder="Digite o nome da disciplina" value={customDiscipline} onChange={e => setCustomDiscipline(e.target.value)} className="mt-2" />}
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
                  Adicionar Tarefa
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Calendário simplificado - sem funcionalidades de estatísticas */}

      {/* Modal de Edição de Sessão */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Registrar Tarefa de Estudo</DialogTitle>
            <DialogDescription>
              Registre os detalhes da sua tarefa de estudo realizada
            </DialogDescription>
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
                <Label htmlFor="sessionLink">Link da Tarefa (Aula/Vídeo/Sistema)</Label>
                <Input id="sessionLink" type="url" value={sessionLink} onChange={e => setSessionLink(e.target.value)} placeholder="https://exemplo.com/aula ou sistema de questões" />
              </div>

              <div>
                <Label htmlFor="courseName">Assunto</Label>
                <Input id="courseName" value={courseName} onChange={e => setCourseName(e.target.value)} placeholder="Ex: Curso Completo de Direito Constitucional" />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="duration">Tempo estudado (minutos) *</Label>
                  <Input id="duration" type="number" min="1" value={studyDuration} onChange={e => setStudyDuration(Number(e.target.value))} placeholder="Ex: 60" />
                  {studyDuration >= 20 && <p className="text-xs text-green-600 mt-1">✓ Tarefa contará para as estatísticas</p>}
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
                  <Input id="questions-total" type="number" min="0" value={questionsTotal} onChange={e => {
                const value = Number(e.target.value);
                setQuestionsTotal(value);
                // Validar se as questões corretas não ficaram maiores que o novo total
                if (questionsCorrect > value) {
                  setQuestionsCorrect(value);
                  setQuestionsError('');
                }
              }} placeholder="Questões resolvidas" />
                </div>

                {questionsTotal > 0 && <div>
                    <Label htmlFor="questions-correct">Questões corretas</Label>
                    <Input id="questions-correct" type="number" min="0" max={questionsTotal} value={questionsCorrect} onChange={e => {
                const value = Number(e.target.value);
                setQuestionsCorrect(value);
                validateQuestions(questionsTotal, value);
              }} placeholder="Acertos" className={questionsError ? 'border-red-500' : ''} />
                    {questionsError && <p className="text-sm text-red-500 mt-1">{questionsError}</p>}
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

              

              {studyType === 'pdf'}

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
                  Salvar Tarefa
                </Button>
              </div>
            </div>}
        </DialogContent>
      </Dialog>

      {cycles.length === 0 ? <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
          <CardContent className="text-center p-8">
            <BookOpen className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum ciclo de estudo encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Crie um ciclo de estudos primeiro para poder organizar seu cronograma
            </p>
          </CardContent>
        </Card> : <Card className="rounded-xl border border-border bg-card text-card-foreground shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden" style={{
      boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
    }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Cronograma Semanal
              </CardTitle>
              
            </div>
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Tarefa de Estudo</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova tarefa de estudo ao seu cronograma semanal
                  </DialogDescription>
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
                            {cycle.cycle_name}
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
                      <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Horário de Fim</label>
                      <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Link da Tarefa (opcional)</label>
                    <Input type="url" value={sessionLink} onChange={e => setSessionLink(e.target.value)} placeholder="https://..." />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowAddModal(false)} className="flex-1">
                      Cancelar
                    </Button>
                    <Button onClick={addSession} className="flex-1">
                      Adicionar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {weekDays.map((day, index) => <div key={index} className="space-y-2">
                  <h3 className="font-medium text-center p-2 bg-muted rounded-md text-sm">
                    {day}
                  </h3>
                  <div className="space-y-2 min-h-[250px]">
                      {sessionDataLoading ? <div className="flex items-center justify-center h-32">
                          <div className="text-sm text-muted-foreground">Carregando dados...</div>
                        </div> : sessionDataError ? <div className="flex flex-col items-center justify-center h-32 space-y-2">
                          <div className="text-sm text-destructive">Erro ao carregar dados</div>
                          <Button variant="outline" size="sm" onClick={refreshData} className="text-xs">
                            Tentar novamente
                          </Button>
                        </div> : getSessionsForDay(index).map(session => {
                const cumulativeSession = sessionData[session.id];
                const hasData = cumulativeSession && (cumulativeSession.duration_minutes > 0 || cumulativeSession.questions > 0);
                const accuracy = cumulativeSession && cumulativeSession.questions > 0 ? Math.round(cumulativeSession.correct_answers / cumulativeSession.questions * 100) : 0;
                const sessionCount = cumulativeSession?.session_count || 1;
                return <div key={session.id} className={`p-3 rounded-lg border relative cursor-pointer transition-all duration-300 min-h-[180px] ${hasData ? 'border-primary/20 bg-primary/5 hover:bg-primary/10' : 'border-muted bg-muted/30 hover:bg-muted/50'} rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden`} style={{
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.05)'
                }} onClick={e => {
                  openEditModal(session);
                }}>
                            <div className="space-y-3 h-full flex flex-col">
                              {/* Header com horário e botão de deletar */}
                              <div className="flex justify-between items-center">
                                <div className="text-sm font-medium text-muted-foreground">
                                  {session.startTime.substring(0, 5)} - {session.endTime.substring(0, 5)}
                                </div>
                                <div className="cursor-pointer transition-colors p-1 rounded hover:bg-destructive/10" onClick={e => {
                        e.stopPropagation();
                        removeSession(session.id);
                      }} title="Remover tarefa">
                                  <Trash2 className="h-4 w-4 text-destructive/70 hover:text-destructive transition-colors" />
                                </div>
                              </div>
                              
                              {/* Disciplina principal */}
                              <div className="space-y-1 flex-1">
                                <h4 className="font-medium text-sm text-foreground leading-tight">{session.disciplineName}</h4>
                                <p className="text-xs text-muted-foreground">{session.blockName}</p>
                                {cumulativeSession?.cycle_name && <p className="text-xs text-primary font-medium">Ciclo: {cumulativeSession.cycle_name}</p>}
                                {!cumulativeSession?.cycle_name && <p className="text-xs text-red-500">⚠️ Nome do ciclo não encontrado</p>}
                              </div>
                              
                              {/* Estatísticas detalhadas */}
                              {hasData && <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                                    <span className="text-muted-foreground">Tempo total:</span>
                                    <span className="font-medium text-foreground">{cumulativeSession.duration_minutes}min</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                                    <span className="text-muted-foreground">Tarefas:</span>
                                    <span className="font-medium text-foreground">{sessionCount}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                                    <span className="text-muted-foreground">Questões:</span>
                                    <span className="font-medium text-foreground">{cumulativeSession.questions}</span>
                                  </div>
                                  <div className="flex justify-between items-center p-2 bg-background/50 rounded">
                                    <span className="text-muted-foreground">Acertos:</span>
                                    <span className="font-medium text-foreground">{accuracy}%</span>
                                  </div>
                                </div>
                              </div>}
                              
                              {/* Botão para ir à aula */}
                              {(session.sessionLink || cumulativeSession?.session_link) && <div className="pt-2">
                                <Button variant="outline" size="sm" onClick={e => {
                        e.stopPropagation();
                        const linkToOpen = cumulativeSession?.session_link || session.sessionLink;
                        window.open(linkToOpen, '_blank');
                      }} className="w-full text-xs">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Ir à aula
                                </Button>
                              </div>}
                            </div>
                          </div>;
              })}
                  </div>
                </div>)}
            </div>
          </CardContent>
        </Card>}

      {/* Modal de Detalhes das Tarefas */}
      <Dialog open={showSessionDetailsModal} onOpenChange={setShowSessionDetailsModal}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Tarefas do dia {selectedDate && format(selectedDate, 'dd/MM/yyyy', {
              locale: ptBR
            })}
            </DialogTitle>
            <DialogDescription>
              Detalhes das tarefas de estudo realizadas neste dia
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedDateSessions.length === 0 ? <div className="text-center py-8">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h4 className="text-lg font-medium text-foreground mb-2">Nenhuma tarefa registrada</h4>
                <p className="text-muted-foreground">Este dia não possui tarefas de estudo registradas.</p>
              </div> : selectedDateSessions.map((sessionData, index) => <div key={index} className="border border-border rounded-lg p-4 bg-card">
                  {/* Header do Ciclo */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                       <h4 className="font-semibold text-foreground">{sessionData.cycle?.name || 'N/A'}</h4>
                       <p className="text-sm text-muted-foreground">
                         {sessionData.cycle?.organ || 'N/A'} - {sessionData.cycle?.position || 'N/A'}
                       </p>
                      </div>
                    <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      {sessionData.session.startTime} - {sessionData.session.endTime}
                    </span>
                  </div>
                  
                  {/* Matéria e Tópico */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">{sessionData.session.discipline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                      </div>
                      <span className="text-sm text-muted-foreground">{sessionData.session.topic}</span>
                    </div>
                  </div>
                  
                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">{sessionData.session.duration}min</div>
                      <div className="text-xs text-muted-foreground">Tempo</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">{sessionData.session.questions}</div>
                      <div className="text-xs text-muted-foreground">Questões</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">{sessionData.session.correct}</div>
                      <div className="text-xs text-muted-foreground">Acertos</div>
                    </div>
                    <div className="bg-muted rounded-lg p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">
                        {Math.round(sessionData.session.correct / sessionData.session.questions * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Taxa</div>
                    </div>
                  </div>
                  
                  {/* Observações */}
                  {sessionData.session.notes && <div className="mb-3">
                      <h5 className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                        Observações
                      </h5>
                      <p className="text-sm text-muted-foreground bg-muted rounded p-3">
                        {sessionData.session.notes}
                      </p>
                    </div>}
                  
                  {/* Botão Ir à Aula */}
                  {sessionData.session.link && <div className="flex justify-end">
                      <Button onClick={() => window.open(sessionData.session.link, '_blank')} className="flex items-center gap-2" size="sm">
                        <ExternalLink className="w-4 h-4" />
                        Ir à Aula
                      </Button>
                    </div>}
                </div>)}
          </div>
        </DialogContent>
      </Dialog>

    </div>;
};
export default Cronograma;