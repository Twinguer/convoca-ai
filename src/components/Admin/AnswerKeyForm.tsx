
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { useAnswerSheet } from '@/hooks/useAnswerSheet';
import { NullifyQuestionButton } from './NullifyQuestionButton';
import { WeightedAnswerInput } from './AnswerKeyForm/WeightedAnswerInput';
import { supabase } from '@/integrations/supabase/client';
import { fetchOfficialAnswerWeights, saveAnswerKeyAndRecalculate } from '@/services/answerKeyService';
import { getExamStructure, getSubjectExamStructure } from '@/integrations/supabase/rankings/examStructure';

interface AnswerKeyFormProps {
  concursoId: string;
}

export const AnswerKeyForm = ({ concursoId }: AnswerKeyFormProps) => {
  const [concurso, setConcurso] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [officialAnswers, setOfficialAnswers] = useState<Record<string, any>>({});
  const [nullifiedQuestions, setNullifiedQuestions] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState('basic');
  
  const { initializeAnswers, answers, setAnswers } = useAnswerSheet();
  
  const isSubjectBased = concurso?.minimum_score_type === 'subject';
  
  // Fetch concurso and official answers
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Get concurso data
        const { data: concursoData, error: concursoError } = await supabase
          .from('concursos')
          .select('*')
          .eq('id', concursoId)
          .single();
          
        if (concursoError) throw concursoError;
        
        setConcurso(concursoData);
        
        // Get official answers
        const officialAnswers = await fetchOfficialAnswerWeights(concursoId);
        setOfficialAnswers(officialAnswers);
        
        // Initialize form with existing answers
        const initialAnswers: Record<number, string> = {};
        const nullified = new Set<number>();
        
        Object.entries(officialAnswers).forEach(([key, value]) => {
          const questionNumber = parseInt(key.replace('questao', ''));
          initialAnswers[questionNumber] = value.resposta;
          
          if (value.anulada) {
            nullified.add(questionNumber);
          }
        });
        
        initializeAnswers(initialAnswers);
        setNullifiedQuestions(nullified);
        
        // Set initial active tab
        if (isSubjectBased && concursoData.subjects && concursoData.subjects.length > 0) {
          setActiveTab(concursoData.subjects[0].code);
        } else if (concursoData.has_basic_knowledge) {
          setActiveTab('basic');
        } else if (concursoData.has_specific_knowledge_1) {
          setActiveTab('specific1');
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Erro ao carregar dados do gabarito');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [concursoId, initializeAnswers]);
  
  const handleSaveAnswers = async () => {
    try {
      setSaving(true);
      
      // Format answers for saving
      const formattedAnswers: Record<string, any> = {};
      
      Object.entries(answers).forEach(([questionNumber, answer]) => {
        const question = parseInt(questionNumber);
        formattedAnswers[`questao${question}`] = {
          resposta: answer,
          anulada: nullifiedQuestions.has(question)
        };
      });
      
      // Save answer key and recalculate scores
      const { success, error } = await saveAnswerKeyAndRecalculate(concursoId, formattedAnswers, true);
      
      if (!success) {
        throw error;
      }
      
      toast.success('Gabarito salvo com sucesso!');
      
      // Refresh official answers
      const updatedAnswers = await fetchOfficialAnswerWeights(concursoId);
      setOfficialAnswers(updatedAnswers);
      
    } catch (error) {
      console.error('Error saving answer key:', error);
      toast.error('Erro ao salvar gabarito');
    } finally {
      setSaving(false);
    }
  };
  
  const handleToggleNullified = (questionNumber: number) => {
    const newNullified = new Set(nullifiedQuestions);
    
    if (newNullified.has(questionNumber)) {
      newNullified.delete(questionNumber);
    } else {
      newNullified.add(questionNumber);
    }
    
    setNullifiedQuestions(newNullified);
  };
  
  const renderQuestionsForKnowledgeTab = (tab: string) => {
    if (!concurso) return null;
    
    const { basicEnd, specific1End, specific2End, specific3End } = getExamStructure(concurso);
    
    let startQ = 1;
    let endQ = basicEnd;
    
    if (tab === 'specific1') {
      startQ = basicEnd + 1;
      endQ = specific1End;
    } else if (tab === 'specific2') {
      startQ = specific1End + 1;
      endQ = specific2End;
    } else if (tab === 'specific3') {
      startQ = specific2End + 1;
      endQ = specific3End;
    }
    
    return renderQuestionRange(startQ, endQ);
  };
  
  const renderQuestionsForSubjectTab = (subjectCode: string) => {
    if (!concurso || !concurso.subjects) return null;
    
    const { subjectRanges } = getSubjectExamStructure(concurso);
    const range = subjectRanges[subjectCode];
    
    if (!range) return null;
    
    return renderQuestionRange(range.start, range.end);
  };
  
  const renderQuestionRange = (startQ: number, endQ: number) => {
    const questions = [];
    
    for (let i = startQ; i <= endQ; i++) {
      questions.push(
        <div key={i} className="flex items-center gap-2 mb-2">
          <WeightedAnswerInput
            questionNumber={i}
            answer={answers[i] || ''}
            onChange={(value) => {
              setAnswers({...answers, [i]: value});
            }}
            nullified={nullifiedQuestions.has(i)}
          />
          <NullifyQuestionButton 
            questionNumber={i}
            isNullified={nullifiedQuestions.has(i)} 
            onToggleNullify={handleToggleNullified}
          />
        </div>
      );
    }
    
    return questions;
  };
  
  const renderSubjectTabs = () => {
    if (!concurso || !concurso.subjects || !Array.isArray(concurso.subjects)) {
      return (
        <div className="p-4 text-center">
          Nenhuma disciplina configurada para este concurso
        </div>
      );
    }
    
    return (
      <>
        <TabsList className="mb-4">
          {concurso.subjects.map((subject: any) => (
            <TabsTrigger 
              key={subject.code} 
              value={subject.code}
              className="min-w-[100px]"
            >
              {subject.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {concurso.subjects.map((subject: any) => (
          <TabsContent key={subject.code} value={subject.code}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {renderQuestionsForSubjectTab(subject.code)}
            </div>
          </TabsContent>
        ))}
      </>
    );
  };
  
  const renderKnowledgeTabs = () => {
    return (
      <>
        <TabsList className="mb-4">
          {concurso?.has_basic_knowledge && <TabsTrigger value="basic">Conhecimentos Básicos</TabsTrigger>}
          {concurso?.has_specific_knowledge_1 && <TabsTrigger value="specific1">Conhecimentos Específicos</TabsTrigger>}
          {concurso?.has_specific_knowledge_2 && <TabsTrigger value="specific2">Conhecimentos Específicos 2</TabsTrigger>}
          {concurso?.has_specific_knowledge_3 && <TabsTrigger value="specific3">Conhecimentos Específicos 3</TabsTrigger>}
        </TabsList>
        
        {concurso?.has_basic_knowledge && (
          <TabsContent value="basic">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {renderQuestionsForKnowledgeTab('basic')}
            </div>
          </TabsContent>
        )}
        
        {concurso?.has_specific_knowledge_1 && (
          <TabsContent value="specific1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {renderQuestionsForKnowledgeTab('specific1')}
            </div>
          </TabsContent>
        )}
        
        {concurso?.has_specific_knowledge_2 && (
          <TabsContent value="specific2">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {renderQuestionsForKnowledgeTab('specific2')}
            </div>
          </TabsContent>
        )}
        
        {concurso?.has_specific_knowledge_3 && (
          <TabsContent value="specific3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {renderQuestionsForKnowledgeTab('specific3')}
            </div>
          </TabsContent>
        )}
      </>
    );
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gabarito Oficial</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Gabarito Oficial</span>
          <Button 
            onClick={handleSaveAnswers} 
            disabled={saving}
          >
            {saving ? 'Salvando...' : 'Salvar Gabarito'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          {isSubjectBased ? renderSubjectTabs() : renderKnowledgeTabs()}
        </Tabs>
      </CardContent>
    </Card>
  );
};
