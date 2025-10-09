import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useSecureUrls } from '@/services/urlObfuscation';
import { useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { ScoreForm } from './ScoreForm';
import { ArrowDown, PencilLine, CheckCircle, Loader2, UserMinus, Trophy } from 'lucide-react';
import { AnswerSheet } from './AnswerSheet';
import { QuotaSelector, QuotaType } from './QuotaSelector';
import { BookletSelector } from './BookletSelector';
import { useLeaveRanking } from '@/hooks/useLeaveRanking';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
  const {
    user
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(propShowAnswerSheet || true);
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<QuotaType>('Ampla Concorrência');
  const [selectedBooklet, setSelectedBooklet] = useState<string>('');
  const [booklets, setBooklets] = useState<ExamBooklet[]>([]);
  const [isLoadingBooklets, setIsLoadingBooklets] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [localIsParticipating, setLocalIsParticipating] = useState(isAlreadyParticipating);
  const {
    toast
  } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { generateSecureUrl } = useSecureUrls();
  const { leave, isLeaving } = useLeaveRanking();

  // Carregar cadernos disponíveis
  useEffect(() => {
    loadBooklets();
  }, [concurso.id]);

  // Check URL params to see if we should force display answer sheet
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showAnswerSheet') === 'true') {
      setShowAnswerSheet(true);
      setShowScoreForm(false);
    }
  }, []);

  // Update showAnswerSheet when prop changes
  useEffect(() => {
    if (propShowAnswerSheet) {
      setShowAnswerSheet(true);
      setShowScoreForm(false);
    }
  }, [propShowAnswerSheet]);

  // Update local participation state when prop changes
  useEffect(() => {
    setLocalIsParticipating(isAlreadyParticipating);
  }, [isAlreadyParticipating]);
  const loadBooklets = async () => {
    try {
      setIsLoadingBooklets(true);
      const {
        data,
        error
      } = await supabase.rpc('manage_exam_booklets', {
        p_operation: 'GET',
        p_concurso_id: concurso.id
      });
      if (error) throw error;
      if (data?.booklets && data.booklets.length > 0) {
        setBooklets(data.booklets);
        // Se há apenas um caderno, seleciona automaticamente
        if (data.booklets.length === 1) {
          setSelectedBooklet(data.booklets[0].id);
        }
      } else {
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
    if (!selectedQuota) {
      toast({
        title: "Cota obrigatória",
        description: "Por favor, selecione uma cota de reserva",
        variant: "destructive"
      });
      return false;
    }

    // Se há múltiplos cadernos, a seleção é obrigatória
    if (booklets.length > 1 && !selectedBooklet) {
      toast({
        title: "Caderno obrigatório",
        description: "Por favor, selecione o caderno da sua prova",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };
  const handleParticipate = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Para participar do ranking, faça login primeiro.",
        variant: "destructive"
      });
      navigate('/auth');
      return;
    }
    if (!validateParticipation()) {
      return;
    }
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('user_rankings').insert({
        user_id: user.id,
        concurso_id: concurso.id,
        score: 0,
        edit_count: 0,
        all_questions_answered: false,
        reservation_type: selectedQuota,
        selected_booklet: booklets.length > 0 && selectedBooklet ? selectedBooklet as string : null
      }).select('id').single();
      if (error) throw error;
      // Invalidar queries relevantes para atualizar o estado
      await queryClient.invalidateQueries({
        queryKey: ['user-participation', concurso.id, user.id]
      });
      await queryClient.invalidateQueries({
        queryKey: ['user-rankings', concurso.id, user.id]
      });
      await queryClient.invalidateQueries({
        queryKey: ['rankings', concurso.id]
      });
      
      toast({
        title: "Inscrição iniciada!",
        description: "Preencha o cartão de respostas para participar oficialmente do ranking."
      });

      // Navegar para a página de participação com o parâmetro para mostrar o cartão de respostas
      const secureUrl = await generateSecureUrl(concurso.id, 'participar');
      navigate(`${secureUrl}?showAnswerSheet=true`, { replace: true });
      setIsLoading(false);
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

  const handleLeaveRanking = async () => {
    if (!concurso?.id) return;
    
    try {
      await leave(concurso.id);
      setShowLeaveDialog(false);
      
      // Atualizar estado local imediatamente
      setLocalIsParticipating(false);
      
      // Invalidar queries para atualizar o estado
      await queryClient.invalidateQueries({
        queryKey: ['user-participation', concurso.id, user?.id]
      });
      await queryClient.invalidateQueries({
        queryKey: ['rankings', concurso.id]
      });
      
      // Navegar para a página de resultados
      const secureUrl = await generateSecureUrl(concurso.id, 'resultados');
      navigate(secureUrl);
    } catch (error) {
      console.error('Erro ao sair do ranking:', error);
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

  // Show the answer sheet if selected and we have a ranking ID
  if ((showAnswerSheet || localIsParticipating) && userRankingId) {
    return (
      <div className="w-full h-full">
        <AnswerSheet 
          concurso={concurso} 
          rankingId={userRankingId} 
          onSuccess={async () => {
            // Atualizar estado local imediatamente
            setLocalIsParticipating(true);
            setShowAnswerSheet(false);
            
            // Invalidar TODAS as queries relacionadas ao concurso
            await Promise.all([
              queryClient.invalidateQueries({
                queryKey: ['rankings', concurso.id]
              }),
              queryClient.invalidateQueries({
                queryKey: ['user-participation', concurso.id, user?.id]
              }),
              queryClient.invalidateQueries({
                queryKey: ['participant-count', concurso.id]
              }),
              queryClient.invalidateQueries({
                queryKey: ['user-rankings', concurso.id, user?.id]
              })
            ]);
            
            // Forçar refetch imediato de todas as queries críticas
            await Promise.all([
              queryClient.refetchQueries({
                queryKey: ['user-participation', concurso.id, user?.id]
              }),
              queryClient.refetchQueries({
                queryKey: ['rankings', concurso.id]
              })
            ]);
            
            toast({
              title: "Cartão de Respostas Processado",
              description: "Suas respostas foram processadas e seu ranking foi atualizado."
            });
            
            // Navegar para a página de resultados após um pequeno delay
            setTimeout(async () => {
              const secureUrl = await generateSecureUrl(concurso.id, 'resultados');
              navigate(secureUrl);
            }, 2000); // Aumentado para 2 segundos para garantir que as queries sejam atualizadas
          }} 
        />
      </div>
    );
  }

  // Default view for non-participating users
  return <div className="p-6 rounded-lg shadow-sm border border-border bg-muted/30">
      <h2 className="text-xl font-bold mb-4">
        {localIsParticipating ? 'Você está participando deste ranking' : 'Participe do Ranking'}
      </h2>
      
      {localIsParticipating ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
            <CheckCircle className="h-5 w-5" />
            <span className="font-medium">Você já está participando deste ranking!</span>
          </div>
          
          <div className="flex gap-2">
            <Button 
              onClick={() => setShowAnswerSheet(true)} 
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <PencilLine className="mr-2 h-4 w-4" />
              Editar Respostas
            </Button>
            
            <Button 
              onClick={async () => {
                const secureUrl = await generateSecureUrl(concurso.id, 'resultados');
                navigate(secureUrl);
              }}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Trophy className="mr-2 h-4 w-4" />
              Ver Classificação
            </Button>
            
            <Button 
              onClick={() => setShowLeaveDialog(true)} 
              variant="destructive" 
              className="flex-1"
              disabled={isLeaving}
            >
              <UserMinus className="mr-2 h-4 w-4" />
              {isLeaving ? 'Saindo...' : 'Deixar Ranking'}
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {/* Quota selection component */}
            <QuotaSelector concurso={concurso} selectedQuota={selectedQuota} onQuotaChange={setSelectedQuota} />
            
            {/* Booklet selection (only if multiple booklets available) */}
            {isLoadingBooklets ? <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando cadernos...
              </div> : <BookletSelector booklets={booklets} selectedBooklet={selectedBooklet} onBookletChange={setSelectedBooklet} required={booklets.length > 1} />}
          </div>
          
          <Button onClick={handleParticipate} disabled={isLoading || isLoadingBooklets} className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700">
            {isLoading ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                Processando...
              </> : 'Participar do Ranking'}
          </Button>
        </>
      )}
      
      {/* Dialog para confirmar saída do ranking */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sair do Ranking?</AlertDialogTitle>
            <AlertDialogDescription>
              Você tem certeza que deseja sair deste ranking? Todas as suas respostas e pontuações serão permanentemente removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveRanking} className="bg-destructive hover:bg-destructive/90">
              {isLeaving ? 'Saindo...' : 'Sair do Ranking'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
};