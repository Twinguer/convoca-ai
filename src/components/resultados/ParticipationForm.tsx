
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Concurso } from '@/types/concursos';
import { ScoreForm } from './ScoreForm';
import { ArrowDown, PencilLine, CheckCircle, Loader2, InfoIcon } from 'lucide-react';
import { AnswerSheet } from './AnswerSheet';
import { QuotaSelector, QuotaType } from './QuotaSelector';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface ParticipationFormProps {
  concurso: Concurso;
  isAlreadyParticipating: boolean;
  userRankingId?: string;
}

// Interface para detalhes de pontuação
interface ScoreDetails {
  basic_knowledge_score: number;
  specific_knowledge_1_score: number;
  specific_knowledge_2_score: number; 
  specific_knowledge_3_score: number;
  discursive_score: number;
  case_study_1_score: number;
  case_study_2_score: number;
  case_study_3_score: number;
  score: number;
  weights: {
    basic: number;
    specific1: number;
    specific2: number;
    specific3: number;
    discursive: number;
    caseStudy1: number;
    caseStudy2: number;
    caseStudy3: number;
  };
}

export const ParticipationForm: React.FC<ParticipationFormProps> = ({
  concurso,
  isAlreadyParticipating,
  userRankingId
}) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState(true); // Default to true to show answer sheet
  const [showScoreForm, setShowScoreForm] = useState(false);
  const [selectedQuota, setSelectedQuota] = useState<QuotaType>('Ampla Concorrência');
  const [scoreDetails, setScoreDetails] = useState<ScoreDetails | null>(null);
  const [isLoadingScoreDetails, setIsLoadingScoreDetails] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Check URL params to see if we should force display answer sheet
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('showAnswerSheet') === 'true') {
      setShowAnswerSheet(true);
      setShowScoreForm(false);
    }
  }, []);

  // Função para verificar detalhes da pontuação
  const checkScoreDetails = async (rankingId: string) => {
    setIsLoadingScoreDetails(true);
    try {
      // 1. Buscar dados do ranking do usuário
      const { data: ranking, error: rankingError } = await supabase
        .from('user_rankings')
        .select(`
          basic_knowledge_score,
          specific_knowledge_1_score,
          specific_knowledge_2_score,
          specific_knowledge_3_score,
          discursive_score,
          case_study_1_score,
          case_study_2_score,
          case_study_3_score,
          score,
          concurso_id
        `)
        .eq('id', rankingId)
        .single();

      if (rankingError) throw rankingError;

      // 2. Buscar pesos do concurso
      const { data: concursoData, error: concursoError } = await supabase
        .from('concursos')
        .select(`
          basic_knowledge_weight,
          specific_knowledge_1_weight,
          specific_knowledge_2_weight,
          specific_knowledge_3_weight,
          specific_knowledge_weight,
          discursive_weight,
          case_study_1_weight,
          case_study_2_weight,
          case_study_3_weight
        `)
        .eq('id', ranking.concurso_id)
        .single();

      if (concursoError) throw concursoError;

      // 3. Organizar os dados para verificação
      setScoreDetails({
        basic_knowledge_score: ranking.basic_knowledge_score || 0,
        specific_knowledge_1_score: ranking.specific_knowledge_1_score || 0,
        specific_knowledge_2_score: ranking.specific_knowledge_2_score || 0,
        specific_knowledge_3_score: ranking.specific_knowledge_3_score || 0,
        discursive_score: ranking.discursive_score || 0,
        case_study_1_score: ranking.case_study_1_score || 0,
        case_study_2_score: ranking.case_study_2_score || 0,
        case_study_3_score: ranking.case_study_3_score || 0,
        score: ranking.score || 0,
        weights: {
          basic: concursoData.basic_knowledge_weight || 1,
          specific1: concursoData.specific_knowledge_1_weight || concursoData.specific_knowledge_weight || 1,
          specific2: concursoData.specific_knowledge_2_weight || 1,
          specific3: concursoData.specific_knowledge_3_weight || 1,
          discursive: concursoData.discursive_weight || 1,
          caseStudy1: concursoData.case_study_1_weight || 1,
          caseStudy2: concursoData.case_study_2_weight || 1,
          caseStudy3: concursoData.case_study_3_weight || 1
        }
      });

      // 4. Calcular a pontuação esperada para verificação
      const expectedScore = 
        (ranking.basic_knowledge_score || 0) * (concursoData.basic_knowledge_weight || 1) +
        (ranking.specific_knowledge_1_score || 0) * (concursoData.specific_knowledge_1_weight || concursoData.specific_knowledge_weight || 1) +
        (ranking.specific_knowledge_2_score || 0) * (concursoData.specific_knowledge_2_weight || 1) +
        (ranking.specific_knowledge_3_score || 0) * (concursoData.specific_knowledge_3_weight || 1) +
        (ranking.discursive_score || 0) * (concursoData.discursive_weight || 1) +
        (ranking.case_study_1_score || 0) * (concursoData.case_study_1_weight || 1) +
        (ranking.case_study_2_score || 0) * (concursoData.case_study_2_weight || 1) +
        (ranking.case_study_3_score || 0) * (concursoData.case_study_3_weight || 1);

      console.log('Pontuação esperada:', expectedScore);
      console.log('Pontuação armazenada:', ranking.score);
      console.log('Diferença:', Math.abs(expectedScore - ranking.score));

    } catch (error) {
      console.error('Erro ao verificar pontuação:', error);
      toast({
        title: "Erro ao verificar pontuação",
        description: "Não foi possível obter os detalhes do cálculo.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingScoreDetails(false);
    }
  };

  const handleParticipate = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Para participar do ranking, faça login primeiro.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .insert({
          user_id: user.id,
          concurso_id: concurso.id,
          score: 0,
          edit_count: 0,
          all_questions_answered: false,
          reservation_type: selectedQuota
        })
        .select('id')
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['participating', concurso.id, user.id] });
      
      toast({
        title: "Inscrição iniciada!",
        description: "Preencha o cartão de respostas para participar oficialmente do ranking.",
      });
      
      // Just reload the page to show the answer sheet
      setTimeout(() => {
        if (data) {
          setIsLoading(false);
          window.location.reload();
        }
      }, 1000);
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error joining ranking:', error);
      toast({
        title: "Erro ao participar",
        description: error.message || "Não foi possível completar sua inscrição. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
        <p className="mb-4">Faça login para participar do ranking deste concurso.</p>
        <Button onClick={() => navigate('/auth')} className="bg-emerald-600 hover:bg-emerald-700">Fazer Login</Button>
      </div>
    );
  }

  // Show the answer sheet if selected and we have a ranking ID
  if ((showAnswerSheet || isAlreadyParticipating) && userRankingId) {
    return (
      <>
        <div className="flex justify-end mb-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={() => userRankingId && checkScoreDetails(userRankingId)}
              >
                <InfoIcon className="h-4 w-4" />
                Verificar Cálculo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Detalhes do Cálculo de Pontuação</DialogTitle>
              </DialogHeader>
              {isLoadingScoreDetails ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                </div>
              ) : scoreDetails ? (
                <div className="space-y-4 py-2">
                  <h3 className="font-semibold">Pontuações Brutas:</h3>
                  <ul className="space-y-1">
                    <li>Conhecimentos Básicos: {scoreDetails.basic_knowledge_score}</li>
                    <li>Conhecimentos Específicos 1: {scoreDetails.specific_knowledge_1_score}</li>
                    <li>Conhecimentos Específicos 2: {scoreDetails.specific_knowledge_2_score}</li>
                    <li>Conhecimentos Específicos 3: {scoreDetails.specific_knowledge_3_score}</li>
                    <li>Discursiva: {scoreDetails.discursive_score}</li>
                    <li>Estudo de Caso 1: {scoreDetails.case_study_1_score}</li>
                    <li>Estudo de Caso 2: {scoreDetails.case_study_2_score}</li>
                    <li>Estudo de Caso 3: {scoreDetails.case_study_3_score}</li>
                  </ul>
                  
                  <h3 className="font-semibold">Pesos Aplicados:</h3>
                  <ul className="space-y-1">
                    <li>Conhecimentos Básicos: {scoreDetails.weights.basic}</li>
                    <li>Conhecimentos Específicos 1: {scoreDetails.weights.specific1}</li>
                    <li>Conhecimentos Específicos 2: {scoreDetails.weights.specific2}</li>
                    <li>Conhecimentos Específicos 3: {scoreDetails.weights.specific3}</li>
                    <li>Discursiva: {scoreDetails.weights.discursive}</li>
                    <li>Estudo de Caso 1: {scoreDetails.weights.caseStudy1}</li>
                    <li>Estudo de Caso 2: {scoreDetails.weights.caseStudy2}</li>
                    <li>Estudo de Caso 3: {scoreDetails.weights.caseStudy3}</li>
                  </ul>
                  
                  <h3 className="font-semibold">Cálculo:</h3>
                  <div className="text-sm bg-gray-50 p-3 rounded border">
                    <p className="mb-2">Total = (Básico × Peso) + (Específico1 × Peso) + ... + (Estudos3 × Peso)</p>
                    <p className="mb-2">
                      = ({scoreDetails.basic_knowledge_score} × {scoreDetails.weights.basic}) + 
                      ({scoreDetails.specific_knowledge_1_score} × {scoreDetails.weights.specific1}) + 
                      ({scoreDetails.specific_knowledge_2_score} × {scoreDetails.weights.specific2}) + 
                      ({scoreDetails.specific_knowledge_3_score} × {scoreDetails.weights.specific3}) + 
                      ({scoreDetails.discursive_score} × {scoreDetails.weights.discursive}) + 
                      ({scoreDetails.case_study_1_score} × {scoreDetails.weights.caseStudy1}) + 
                      ({scoreDetails.case_study_2_score} × {scoreDetails.weights.caseStudy2}) + 
                      ({scoreDetails.case_study_3_score} × {scoreDetails.weights.caseStudy3})
                    </p>
                    <p className="font-medium">
                      = {(
                        scoreDetails.basic_knowledge_score * scoreDetails.weights.basic +
                        scoreDetails.specific_knowledge_1_score * scoreDetails.weights.specific1 +
                        scoreDetails.specific_knowledge_2_score * scoreDetails.weights.specific2 +
                        scoreDetails.specific_knowledge_3_score * scoreDetails.weights.specific3 +
                        scoreDetails.discursive_score * scoreDetails.weights.discursive +
                        scoreDetails.case_study_1_score * scoreDetails.weights.caseStudy1 +
                        scoreDetails.case_study_2_score * scoreDetails.weights.caseStudy2 +
                        scoreDetails.case_study_3_score * scoreDetails.weights.caseStudy3
                      ).toFixed(2)}
                    </p>
                  </div>
                  
                  <div className="mt-4 p-3 border rounded bg-emerald-50">
                    <p className="font-semibold">Pontuação Total Armazenada: {scoreDetails.score.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      {Math.abs(scoreDetails.score - (
                        scoreDetails.basic_knowledge_score * scoreDetails.weights.basic +
                        scoreDetails.specific_knowledge_1_score * scoreDetails.weights.specific1 +
                        scoreDetails.specific_knowledge_2_score * scoreDetails.weights.specific2 +
                        scoreDetails.specific_knowledge_3_score * scoreDetails.weights.specific3 +
                        scoreDetails.discursive_score * scoreDetails.weights.discursive +
                        scoreDetails.case_study_1_score * scoreDetails.weights.caseStudy1 +
                        scoreDetails.case_study_2_score * scoreDetails.weights.caseStudy2 +
                        scoreDetails.case_study_3_score * scoreDetails.weights.caseStudy3
                      )) < 0.01 
                        ? "Valor correto: o cálculo confere com a pontuação armazenada."
                        : "Possível diferença: o cálculo não confere exatamente com a pontuação armazenada."
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <p>Nenhum detalhe disponível. Tente novamente.</p>
              )}
            </DialogContent>
          </Dialog>
        </div>
        <AnswerSheet 
          concurso={concurso}
          rankingId={userRankingId}
          onSuccess={() => {
            setShowAnswerSheet(false);
            queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
            navigate(`/concurso/${concurso.id}/resultados`);
            toast({
              title: "Cartão de Respostas Processado",
              description: "Suas respostas foram processadas e seu ranking foi atualizado.",
            });
          }}
        />
      </>
    );
  }

  // Default view for non-participating users
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Participe do Ranking</h2>
      <p className="mb-4">
        Participe do ranking deste concurso para comparar seu desempenho com outros candidatos.
        Você poderá preencher seu cartão de respostas e ver sua classificação.
      </p>
      
      {/* Quota selection component */}
      <QuotaSelector 
        concurso={concurso} 
        selectedQuota={selectedQuota} 
        onQuotaChange={setSelectedQuota} 
      />
      
      <Button 
        onClick={handleParticipate} 
        disabled={isLoading}
        className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
            Processando...
          </>
        ) : (
          'Participar do Ranking'
        )}
      </Button>
    </div>
  );
};
