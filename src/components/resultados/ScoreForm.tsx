
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Concurso } from '@/types/concursos';
import { CheckCircle, Loader2 } from 'lucide-react';

interface ScoreFormProps {
  concurso: Concurso;
  rankingId: string;
  onSuccess: () => void;
}

export const ScoreForm: React.FC<ScoreFormProps> = ({ concurso, rankingId, onSuccess }) => {
  const [discursiveScore, setDiscursiveScore] = useState<number | null>(null);
  const [caseStudy1Score, setCaseStudy1Score] = useState<number | null>(null);
  const [caseStudy2Score, setCaseStudy2Score] = useState<number | null>(null);
  const [caseStudy3Score, setCaseStudy3Score] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchExistingScores = async () => {
      try {
        const { data, error } = await supabase
          .from('user_rankings')
          .select('discursive_score, case_study_1_score, case_study_2_score, case_study_3_score')
          .eq('id', rankingId)
          .single();

        if (error) {
          console.error("Erro ao buscar notas existentes:", error);
          return;
        }

        if (data) {
          setDiscursiveScore(data.discursive_score);
          setCaseStudy1Score(data.case_study_1_score);
          setCaseStudy2Score(data.case_study_2_score);
          setCaseStudy3Score(data.case_study_3_score);
        }
      } catch (error) {
        console.error("Erro ao buscar notas:", error);
      }
    };

    fetchExistingScores();
  }, [rankingId]);

  const updateScoresMutation = useMutation({
    mutationFn: async ({
      discursiveScore,
      caseStudy1Score,
      caseStudy2Score,
      caseStudy3Score,
    }: {
      discursiveScore: number | null;
      caseStudy1Score: number | null;
      caseStudy2Score: number | null;
      caseStudy3Score: number | null;
    }) => {
      const { data, error } = await supabase
        .from('user_rankings')
        .update({
          discursive_score: discursiveScore,
          case_study_1_score: caseStudy1Score,
          case_study_2_score: caseStudy2Score,
          case_study_3_score: caseStudy3Score,
        })
        .eq('id', rankingId);

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rankings', concurso.id] });
      toast({
        title: "Notas Salvas",
        description: "Suas notas foram salvas com sucesso!",
        duration: 3000,
      });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: `Ocorreu um erro ao salvar as notas: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSaveScores = async () => {
    try {
      await updateScoresMutation.mutate({
        discursiveScore,
        caseStudy1Score,
        caseStudy2Score,
        caseStudy3Score,
      });
    } catch (error: any) {
      console.error("Erro ao salvar as notas:", error);
    }
  };

  if (!isMounted) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4">
      {concurso.has_discursive && (
        <div>
          <Label htmlFor="discursiveScore">Nota Discursiva:</Label>
          <Input
            type="number"
            id="discursiveScore"
            value={discursiveScore !== null ? discursiveScore.toString() : ''}
            onChange={(e) => setDiscursiveScore(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="Digite a nota"
          />
        </div>
      )}

      {concurso.has_case_study_1 && (
        <div>
          <Label htmlFor="caseStudy1Score">Nota Estudo de Caso 1:</Label>
          <Input
            type="number"
            id="caseStudy1Score"
            value={caseStudy1Score !== null ? caseStudy1Score.toString() : ''}
            onChange={(e) => setCaseStudy1Score(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="Digite a nota"
          />
        </div>
      )}

      {concurso.has_case_study_2 && (
        <div>
          <Label htmlFor="caseStudy2Score">Nota Estudo de Caso 2:</Label>
          <Input
            type="number"
            id="caseStudy2Score"
            value={caseStudy2Score !== null ? caseStudy2Score.toString() : ''}
            onChange={(e) => setCaseStudy2Score(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="Digite a nota"
          />
        </div>
      )}

      {concurso.has_case_study_3 && (
        <div>
          <Label htmlFor="caseStudy3Score">Nota Estudo de Caso 3:</Label>
          <Input
            type="number"
            id="caseStudy3Score"
            value={caseStudy3Score !== null ? caseStudy3Score.toString() : ''}
            onChange={(e) => setCaseStudy3Score(e.target.value === '' ? null : parseFloat(e.target.value))}
            placeholder="Digite a nota"
          />
        </div>
      )}

      <Button onClick={handleSaveScores} disabled={updateScoresMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
        {updateScoresMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Salvar Notas
          </>
        )}
      </Button>
    </div>
  );
};
