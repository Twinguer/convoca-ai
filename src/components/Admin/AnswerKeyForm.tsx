
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AnswerKeyTab } from '@/components/Admin/CreateRanking/AnswerKeyTab';
import { SubjectAnswerKeyTab } from '@/components/Admin/CreateRanking/SubjectAnswerKeyTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { answerKeyService } from '@/services/answerKeyService';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Concurso, SubjectConfig } from '@/types/concursos';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ concursoId }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [concurso, setConcurso] = useState<Concurso | null>(null);
  const [tabMode, setTabMode] = useState<'knowledge' | 'subject'>('knowledge');
  const [subjects, setSubjects] = useState<SubjectConfig[]>([]);

  useEffect(() => {
    const fetchConcursoData = async () => {
      try {
        setIsLoading(true);
        
        const { data, error } = await supabase
          .from('concursos')
          .select('*')
          .eq('id', concursoId)
          .single();
          
        if (error) throw error;
        
        setConcurso(data);
        
        // Determine tab mode based on minimum_score_type
        if (data.minimum_score_type === 'subject') {
          setTabMode('subject');
          
          // Parse the subjects from the data
          try {
            const subjectsData = typeof data.subjects === 'string' 
              ? JSON.parse(data.subjects) 
              : data.subjects || [];
            
            setSubjects(subjectsData);
          } catch (e) {
            console.error('Error parsing subjects:', e);
            setSubjects([]);
          }
        } else {
          setTabMode('knowledge');
        }
      } catch (error) {
        console.error('Error fetching concurso data:', error);
        toast.error('Erro ao carregar dados do concurso');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConcursoData();
  }, [concursoId]);

  const handleSaveAnswerKey = async (answerKeyData: any[]) => {
    try {
      const result = await answerKeyService.saveAnswerKeyAndRecalculate(concursoId, answerKeyData);
      
      if (result.success) {
        toast.success('Gabarito salvo com sucesso');
        return true;
      } else {
        throw new Error('Erro ao salvar gabarito');
      }
    } catch (error) {
      console.error('Error saving answer key:', error);
      toast.error('Erro ao salvar gabarito');
      return false;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Carregando dados do concurso...
        </CardContent>
      </Card>
    );
  }

  if (!concurso) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          Concurso não encontrado
        </CardContent>
      </Card>
    );
  }

  if (tabMode === 'knowledge') {
    return (
      <AnswerKeyTab
        concursoId={concursoId}
        hasBasicKnowledge={concurso.has_basic_knowledge === true}
        hasSpecificKnowledge1={concurso.has_specific_knowledge_1 === true}
        hasSpecificKnowledge2={concurso.has_specific_knowledge_2 === true}
        hasSpecificKnowledge3={concurso.has_specific_knowledge_3 === true}
        basicKnowledgeQuestions={concurso.basic_knowledge_questions || 0}
        specificKnowledge1Questions={concurso.specific_knowledge_1_questions || 0}
        specificKnowledge2Questions={concurso.specific_knowledge_2_questions || 0}
        specificKnowledge3Questions={concurso.specific_knowledge_3_questions || 0}
        examType={concurso.exam_type || 'Alternativas'}
        alternativesCount={concurso.alternatives_count || 5}
      />
    );
  }

  return (
    <SubjectAnswerKeyTab
      concursoId={concursoId}
      subjects={subjects}
      examType={concurso.exam_type || 'Alternativas'}
      alternativesCount={concurso.alternatives_count || 5}
    />
  );
};
