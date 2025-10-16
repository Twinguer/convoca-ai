import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { ScoreForm } from './ScoreForm';
import { ArrowDown, PencilLine, CheckCircle, Loader2 } from 'lucide-react';
import { AnswerSheet } from './AnswerSheet';
import { QuotaSelector, QuotaType } from './QuotaSelector';
import { BookletSelector } from './BookletSelector';
interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}
interface ParticipationFormProps {
  concurso: Concurso;
  isAlreadyParticipating: boolean;
  userRankingId?: string;
  showAnswerSheet?: boolean;
}
export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  concurso,
  isAlreadyParticipating,
  userRankingId,
  showAnswerSheet: propShowAnswerSheet = false
}) => {
  // Debug log removed to reduce console spam
  
  const {
    user
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(propShowAnswerSheet || true);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<QuotaType>('Ampla Concorrência');
  
  // Debug log para selectedQuota
  console.log('[ParticipationForm] selectedQuota:', selectedQuota);
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [booklets, setBooklets] = useState<ExamBooklet[]>([]);
  const [isLoadingBooklets, setIsLoadingBooklets] = useState(false);
  const [localIsParticipating, setLocalIsParticipating] = useState(isAlreadyParticipating);
  const [localUserRankingId, setLocalUserRankingId] = useState<string | undefined>(userRankingId);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Carregar cadernos disponíveis
  useEffect(() => {
    loadBooklets();
  }, [concurso.id]);

  // Consolidate all prop updates into a single useEffect with memoization
  useEffect(() => {
    // Check URL params to see if we should force display answer sheet
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showAnswerSheet') === 'true') {
      setShowAnswerSheet(true);
      setShowScoreForm(false);
    } else if (propShowAnswerSheet) {
      setShowAnswerSheet(true);
      setShowScoreForm(false);
    }

    // Update local participation state when prop changes
    setLocalIsParticipating(isAlreadyParticipating);
    setLocalUserRankingId(userRankingId);
  }, [propShowAnswerSheet, isAlreadyParticipating, userRankingId]);

  // Carregar reservation_type existente quando usuário já está participando
  useEffect(() => {
    const loadExistingReservationType = async () => {
      if (isAlreadyParticipating && user?.id && concurso?.id) {
        try {
          const { data: userRankingData } = await supabase
            .from('user_rankings')
            .select('consolidated_data')
            .eq('user_id', user.id)
            .maybeSingle();

          if (userRankingData?.consolidated_data?.rankings) {
            // Procurar pelo ranking deste concurso
            for (const [rankingId, rankingData] of Object.entries(userRankingData.consolidated_data.rankings)) {
              if (rankingData.concurso_id === concurso.id && rankingData.user_data?.reservation_type) {
                console.log('[ParticipationForm] Carregando reservation_type existente:', rankingData.user_data.reservation_type);
                setSelectedQuota(rankingData.user_data.reservation_type as QuotaType);
                break;
              }
            }
          }
        } catch (error) {
          console.error('[ParticipationForm] Erro ao carregar reservation_type existente:', error);
        }
      }
    };

    loadExistingReservationType();
  }, [isAlreadyParticipating, user?.id, concurso?.id]);

  // Memoize expensive calculations
  const isUserParticipating = React.useMemo(() => {
    return localIsParticipating || isAlreadyParticipating;
  }, [localIsParticipating, isAlreadyParticipating]);

  const shouldShowAnswerSheet = React.useMemo(() => {
    const result = (showAnswerSheet || isUserParticipating) && localUserRankingId;
    console.log('[ParticipationForm] shouldShowAnswerSheet DEBUG:', {
      showAnswerSheet,
      isUserParticipating,
      localUserRankingId,
      isAlreadyParticipating,
      localIsParticipating,
      propShowAnswerSheet,
      result
    });
    return result;
  }, [showAnswerSheet, isUserParticipating, localUserRankingId, isAlreadyParticipating, localIsParticipating, propShowAnswerSheet]);

  // Debug adicional para entender o estado
  console.log('[ParticipationForm] Estado atual:', {
    concursoId: concurso?.id,
    user: user?.id,
    isAlreadyParticipating,
    localIsParticipating,
    userRankingId,
    localUserRankingId,
    showAnswerSheet,
    shouldShowAnswerSheet
  });
  const loadBooklets = async () => {
    try {
      console.log('[ParticipationForm] Carregando cadernos para concurso:', concurso.id);
      setIsLoadingBooklets(true);
      const { data: concursoData, error } = await supabase
        .from('concursos')
        .select('exam_booklets')
        .eq('id', concurso.id)
        .single();
      
      if (error) throw error;
      
      const booklets = concursoData?.exam_booklets || [];
      // Ordenar por display_order
      const sortedBooklets = booklets.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
      
      console.log('[ParticipationForm] Cadernos encontrados:', sortedBooklets.length);
      console.log('[ParticipationForm] Cadernos:', sortedBooklets.map(b => ({ id: b.id, name: b.name })));
      
      if (sortedBooklets && sortedBooklets.length > 0) {
        setBooklets(sortedBooklets);
        // Se há apenas um caderno, seleciona automaticamente
        if (sortedBooklets.length === 1) {
          console.log('[ParticipationForm] Selecionando automaticamente o caderno único:', sortedBooklets[0].name);
          setSelectedBooklet(sortedBooklets[0].id);
        }
      } else {
        console.log('[ParticipationForm] Nenhum caderno encontrado');
        setBooklets([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
      setBooklets([]);
    } finally {
      setIsLoadingBooklets(false);
    }
  };
  const validateParticipation = () => {
    console.log('[ParticipationForm] Validando participação...');
    console.log('[ParticipationForm] selectedQuota:', selectedQuota);
    console.log('[ParticipationForm] booklets.length:', booklets.length);
    console.log('[ParticipationForm] selectedBooklet:', selectedBooklet);
    
    if (!selectedQuota) {
      console.log('[ParticipationForm] ❌ Validação falhou: cota não selecionada');
      toast({
        title: "Cota obrigatória",
        description: "Por favor, selecione uma cota de reserva",
        variant: "destructive"
      });
      return false;
    }

    // Se há múltiplos cadernos, a seleção é obrigatória
    if (booklets.length > 1 && !selectedBooklet) {
      console.log('[ParticipationForm] ❌ Validação falhou: caderno não selecionado (múltiplos cadernos)');
      toast({
        title: "Caderno obrigatório",
        description: "Por favor, selecione o caderno da sua prova",
        variant: "destructive"
      });
      return false;
    }
    
    console.log('[ParticipationForm] ✅ Validação passou');
    return true;
  };
  const handleParticipate = async () => {
    // handleParticipate called
    if (!user) {
      // No user, redirecting to auth
      toast({
        title: "Login necessário",
        description: "Para participar do ranking, faça login primeiro.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    if (!validateParticipation()) {
      // Validation failed
      return;
    }
    // Starting participation process
    setIsLoading(true);
    try {
      // Verificar se o concurso existe antes de permitir participação
      const { data: rankingExists, error: rankingError } = await supabase
        .from('concursos')
        .select('id')
        .eq('id', concurso.id)
        .single();

      if (rankingError || !rankingExists) {
        toast({
          title: "Erro",
          description: "Ranking não encontrado ou não está ativo.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Verificar se o usuário já está participando do concurso
      const { data: userRankingData, error: participationError } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (participationError) {
        console.error('Erro ao verificar participação:', participationError);
        toast({
          title: "Erro",
          description: "Erro ao verificar participação no ranking.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Check if user already has this concurso in their consolidated_data
      let isAlreadyParticipating = false;
      if (userRankingData?.consolidated_data?.rankings) {
        Object.values(userRankingData.consolidated_data.rankings).forEach((rankingData: any) => {
          if (rankingData.concurso_id === concurso.id) {
            isAlreadyParticipating = true;
          }
        });
      }

      if (isAlreadyParticipating) {
        toast({
          title: "Já participando",
          description: "Você já está participando deste ranking.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }

      // Inicializar subject_scores baseado nas seções habilitadas do concurso
      // Considera tanto campos diretos quanto JSONB disciplines
      const initializeSubjectScores = (concurso: any) => {
        const subjectScores: Record<string, number> = {};
        
        // 1. Verificar campos diretos (sistema legacy)
        if (concurso.has_discursive) subjectScores.discursive = 0;
        if (concurso.has_case_study_1) subjectScores.case_study_1 = 0;
        if (concurso.has_case_study_2) subjectScores.case_study_2 = 0;
        if (concurso.has_case_study_3) subjectScores.case_study_3 = 0;
        if (concurso.has_other_subjective) subjectScores.other_subjective = 0;
        
        // 2. Verificar JSONB disciplines (sistema atual)
        if (concurso.disciplines) {
          concurso.disciplines.forEach((discipline: any) => {
            if ('disciplines' in discipline) {
              // Estrutura hierárquica (blocos)
              discipline.disciplines?.forEach((d: any) => {
                if (d.isEnabled) {
                  switch (d.type) {
                    case 'discursive':
                      subjectScores.discursive = 0;
                      break;
                    case 'case_study_1':
                      subjectScores.case_study_1 = 0;
                      break;
                    case 'case_study_2':
                      subjectScores.case_study_2 = 0;
                      break;
                    case 'case_study_3':
                      subjectScores.case_study_3 = 0;
                      break;
                    case 'other_subjective':
                      subjectScores.other_subjective = 0;
                      break;
                    default:
                      // Disciplinas customizadas
                      if (d.id) {
                        subjectScores[`custom_${d.id}`] = 0;
                      }
                      break;
                  }
                }
              });
            } else {
              // Estrutura plana
              if (discipline.isEnabled) {
                switch (discipline.type) {
                  case 'discursive':
                    subjectScores.discursive = 0;
                    break;
                  case 'case_study_1':
                    subjectScores.case_study_1 = 0;
                    break;
                  case 'case_study_2':
                    subjectScores.case_study_2 = 0;
                    break;
                  case 'case_study_3':
                    subjectScores.case_study_3 = 0;
                    break;
                  case 'other_subjective':
                    subjectScores.other_subjective = 0;
                    break;
                  default:
                    // Disciplinas customizadas
                    if (discipline.id) {
                      subjectScores[`custom_${discipline.id}`] = 0;
                    }
                    break;
                }
              }
            }
          });
        }
        
        return subjectScores;
      };

      // Generate a unique ranking ID
      const rankingId = `ranking_${concurso.id}_${user.id}_${Date.now()}`;
      
      // Create the new ranking data structure with correct format and order
      const newRankingData = {
        user_data: {
          score: 0,  // Total geral (objetivas + subjetivas)
          answers: {},
          subject_scores_tot: 0,  // Total das objetivas - ANTES de subject_scores
          subject_scores: (() => {
            // Criar subject_scores dinamicamente baseado nas disciplinas do concurso
            const subjectScores: Record<string, number> = {};
            if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
              for (const block of concurso.disciplines) {
                if ('disciplines' in block && Array.isArray(block.disciplines)) {
                  for (const discipline of block.disciplines) {
                    if (discipline.isEnabled && discipline.type && discipline.type.startsWith('custom_')) {
                      subjectScores[discipline.type] = 0;
                    }
                  }
                }
              }
            }
            return subjectScores;
          })(),
          subjective_scores: 0,  // Soma das subjetivas - ANTES de subjectives
          subjectives: {
            // APENAS disciplinas subjetivas
            "case_study_1": 0,
            "other_subjective": 0
          },
          all_questions_answered: false
        },
        concurso_id: concurso.id,
        control_metadata: {
          created_at: new Date().toISOString(),
          edit_history: [],
          last_updated: new Date().toISOString(),
          is_score_recalculated: false
        },
        selected_booklet_id: booklets.length > 0 ? (selectedBooklet as string || booklets[0].id) : null,
        edit_count: 0,
        reservation_type: selectedQuota
      };

      console.log('[ParticipationForm] Creating ranking with selectedQuota:', selectedQuota);
      console.log('[ParticipationForm] newRankingData.user_data.reservation_type:', newRankingData.user_data.reservation_type);

      // Check if user already has a user_rankings record
      const { data: existingUserRanking } = await supabase
        .from('user_rankings')
        .select('consolidated_data')
        .eq('user_id', user.id)
        .maybeSingle();

      let consolidatedData;
      if (existingUserRanking?.consolidated_data) {
        // Update existing consolidated_data
        consolidatedData = {
          ...existingUserRanking.consolidated_data,
          rankings: {
            ...existingUserRanking.consolidated_data.rankings,
            [rankingId]: newRankingData
          }
        };
      } else {
        // Create new consolidated_data
        consolidatedData = {
          rankings: {
            [rankingId]: newRankingData
          }
        };
      }

      console.log('[ParticipationForm] Saving consolidated_data:', JSON.stringify(consolidatedData, null, 2));
      
      const {
        data,
        error
      } = await supabase.from('user_rankings').upsert({
        user_id: user.id,
        consolidated_data: consolidatedData
      }).select('user_id, consolidated_data').single();
      if (error) throw error;
      // Invalidar todas as queries relacionadas para garantir atualização automática
      console.log('[ParticipationForm] 🔄 Invalidando queries para refresh automático...');
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ['participating', concurso.id, user.id]
        }),
        queryClient.invalidateQueries({
          queryKey: ['concursos', concurso.id]
        }),
        queryClient.invalidateQueries({
          queryKey: ['concurso', concurso.id]
        }),
        // ✅ ADICIONAR: invalidação para nova estrutura
        queryClient.invalidateQueries({
          queryKey: ['participant-count-v2', concurso.id]
        }),
        queryClient.invalidateQueries({
          queryKey: ['user-participation-v2', concurso.id, user.id]
        }),
        queryClient.invalidateQueries({
          queryKey: ['concursos-pagination', concurso.id]
        }),
        // ✅ ADICIONAR: invalidação para rankings
        queryClient.invalidateQueries({
          queryKey: ['rankings', concurso.id]
        }),
        queryClient.invalidateQueries({
          queryKey: ['rankings']
        })
      ]);
      console.log('[ParticipationForm] ✅ Queries invalidadas, dados serão atualizados automaticamente');
      toast({
        title: "Inscrição iniciada!",
        description: "Preencha o cartão de respostas para participar oficialmente do ranking."
      });

      // Em vez de recarregar, mostrar o AnswerSheet diretamente
      // Participation successful
      setLocalUserRankingId(rankingId); // ✅ Usar o rankingId gerado, não data.id
      setLocalIsParticipating(true);
      setShowAnswerSheet(true);
      setIsLoading(false);
      // States updated - should show AnswerSheet now
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error joining ranking:', error);
      toast({
        title: "Erro ao participar",
        description: error.message || "Não foi possível completar sua inscrição. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  if (!user) {
    return <div className="bg-card p-6 rounded-lg shadow-sm border border-border">
        <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
        <p className="mb-4">Faça login para participar do ranking deste concurso.</p>
        <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">
          Fazer Login
        </Button>
      </div>;
  }

  // Debug logs para entender o estado
  // Debug states log removed to reduce console spam

  // Show the answer sheet if selected and we have a ranking ID
  console.log('[ParticipationForm] Verificando condição shouldShowAnswerSheet:', shouldShowAnswerSheet);
  if (shouldShowAnswerSheet) {
    console.log('[ParticipationForm] Renderizando AnswerSheet com rankingId:', localUserRankingId);
    // Rendering AnswerSheet
    return (
      <div className="w-full h-full">
        <AnswerSheet concurso={concurso} rankingId={localUserRankingId} onSuccess={() => {
          setLocalIsParticipating(true);
          setShowAnswerSheet(false);
          queryClient.invalidateQueries({
            queryKey: ['concursos', concurso.id]
          });
          navigate(`/concurso/${concurso.id}/resultados`);
          toast({
            title: "Cartão de Respostas Processado",
            description: "Suas respostas foram processadas e seu ranking foi atualizado."
          });
        }} />
      </div>
    );
  }

  // Default view for non-participating users
  return <div className="p-6 rounded-lg shadow-sm border border-border bg-muted/30">
      <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
      
      
      <div className="space-y-4">
        {/* Quota selection component */}
        <QuotaSelector concurso={concurso} selectedQuota={selectedQuota} onQuotaChange={setSelectedQuota} />
        
        {/* Booklet selection (always show if booklets available) */}
        {isLoadingBooklets ? <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando cadernos...
          </div> : booklets.length > 0 ? <BookletSelector booklets={booklets} selectedBooklet={selectedBooklet} onBookletChange={setSelectedBooklet} required={booklets.length > 1} /> : <div className="text-sm text-muted-foreground">Nenhum caderno disponível</div>}
      </div>
      
      <Button onClick={() => {
        // Button clicked
        handleParticipate();
      }} disabled={isLoading || isLoadingBooklets} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
        {isLoading ? <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processando...
          </> : 'Participar do Ranking'}
      </Button>
    </div>;
};