
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { answerKeyService } from '@/services/answerKeyService';
import { updateSectionTypeForConcurso } from '@/integrations/supabase/rankings/scoreCalculation';
import { SubjectConfig } from '@/types/concursos';

interface SubjectAnswerKeyTabProps {
  concursoId: string;
  subjects: SubjectConfig[];
  examType: string;
  alternativesCount: number;
}

export const SubjectAnswerKeyTab: React.FC<SubjectAnswerKeyTabProps> = ({
  concursoId,
  subjects,
  examType,
  alternativesCount
}) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [answerKey, setAnswerKey] = useState<Record<number, any>>({});
  const [totalQuestions, setTotalQuestions] = useState(0);
  
  // Calculate total questions from subjects
  useEffect(() => {
    const total = subjects.reduce((acc, subject) => acc + subject.questions, 0);
    setTotalQuestions(total);
    
    // Initialize answer key with empty values
    const initialAnswerKey: Record<number, any> = {};
    let questionNumber = 1;
    
    subjects.forEach(subject => {
      for (let i = 0; i < subject.questions; i++) {
        initialAnswerKey[questionNumber] = {
          question_number: questionNumber,
          correct_answer: '',
          weight: 1,
          is_nullified: false,
          section_type: subject.code
        };
        questionNumber++;
      }
    });
    
    setAnswerKey(initialAnswerKey);
  }, [subjects]);
  
  // Fetch existing answer key
  useEffect(() => {
    const fetchAnswerKey = async () => {
      try {
        setLoading(true);
        const data = await answerKeyService.fetchOfficialAnswerWeights(concursoId);
        
        const existingAnswerKey = { ...answerKey };
        
        // Process the fetched data
        Object.keys(data || {}).forEach(key => {
          const questionNumber = parseInt(key.replace('questao', ''));
          if (!isNaN(questionNumber)) {
            const questionData = data[key];
            
            existingAnswerKey[questionNumber] = {
              ...existingAnswerKey[questionNumber],
              question_number: questionNumber,
              correct_answer: questionData.resposta || '',
              weight: questionData.peso || 1,
              is_nullified: questionData.anulada || false,
              section_type: questionData.secao || existingAnswerKey[questionNumber]?.section_type
            };
          }
        });
        
        setAnswerKey(existingAnswerKey);
      } catch (error) {
        console.error('Error fetching answer key:', error);
        toast.error('Erro ao carregar o gabarito');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnswerKey();
  }, [concursoId]);
  
  const handleAnswerChange = (questionNumber: number, answer: string) => {
    setAnswerKey(prev => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        correct_answer: answer.toUpperCase()
      }
    }));
  };
  
  const handleWeightChange = (questionNumber: number, weight: number) => {
    setAnswerKey(prev => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        weight: weight
      }
    }));
  };
  
  const handleNullifyToggle = (questionNumber: number, isNullified: boolean) => {
    setAnswerKey(prev => ({
      ...prev,
      [questionNumber]: {
        ...prev[questionNumber],
        is_nullified: isNullified
      }
    }));
  };
  
  const handleSaveAnswerKey = async () => {
    try {
      setSaving(true);
      
      // Convert answer key object to array for saving
      const answerKeyArray = Object.values(answerKey).map(item => ({
        concurso_id: concursoId,
        question_number: item.question_number,
        correct_answer: item.correct_answer,
        weight: item.weight,
        is_nullified: item.is_nullified,
        section_type: item.section_type,
        question_type: 'MULTIPLE_CHOICE'
      }));

      console.log('Saving answer key:', answerKeyArray);
      
      // Ensure all questions have section_type
      let questionNumber = 1;
      const answerKeyWithSections = answerKeyArray.map(item => {
        // If no section_type, determine it from subjects
        if (!item.section_type) {
          let currentQuestion = 1;
          let sectionType = '';
          
          // Find which subject this question belongs to
          for (const subject of subjects) {
            const subjectEndQuestion = currentQuestion + subject.questions - 1;
            if (item.question_number >= currentQuestion && item.question_number <= subjectEndQuestion) {
              sectionType = subject.code;
              break;
            }
            currentQuestion += subject.questions;
          }
          
          return { ...item, section_type: sectionType };
        }
        
        return item;
      });
      
      // First ensure all section_types are properly set in the database
      await updateSectionTypeForConcurso(concursoId);
      
      // Then save the full answer key
      const result = await answerKeyService.saveAnswerKeyAndRecalculate(concursoId, answerKeyWithSections);
      
      if (result.success) {
        toast.success(`Gabarito salvo com sucesso. ${result.updatedCount || 0} candidatos atualizados.`);
      } else {
        throw new Error('Erro ao salvar gabarito');
      }
    } catch (error) {
      console.error('Error saving answer key:', error);
      toast.error('Erro ao salvar o gabarito');
    } finally {
      setSaving(false);
    }
  };
  
  // Generate answer options based on alternativesCount
  const generateAnswerOptions = () => {
    const options = [];
    for (let i = 0; i < alternativesCount; i++) {
      options.push(String.fromCharCode(65 + i)); // 65 = ASCII for 'A'
    }
    return options;
  };
  
  const answerOptions = generateAnswerOptions();
  
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p>Carregando gabarito...</p>
            <Progress className="mt-4" value={100} />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Gabarito Oficial por Disciplina</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button 
            onClick={handleSaveAnswerKey} 
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? 'Salvando...' : 'Salvar Gabarito Completo'}
          </Button>
        </div>
        
        {subjects.map((subject, subjectIndex) => {
          // Calculate question range for this subject
          let startQuestion = 1;
          for (let i = 0; i < subjectIndex; i++) {
            startQuestion += subjects[i].questions;
          }
          const endQuestion = startQuestion + subject.questions - 1;
          
          // Create an array of question numbers for this subject
          const questions = Array.from(
            { length: subject.questions },
            (_, i) => startQuestion + i
          );
          
          return (
            <div key={subject.code} className="mb-8">
              <h3 className="text-lg font-semibold mb-2">
                {subject.name} ({subject.code})
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Questões {startQuestion} a {endQuestion} - Peso: {subject.weight}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {questions.map(questionNumber => (
                  <div key={questionNumber} className="border p-4 rounded-md">
                    <div className="flex justify-between items-center mb-2">
                      <Label htmlFor={`q${questionNumber}`} className="font-semibold">
                        Questão {questionNumber}
                      </Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`nullify-${questionNumber}`}
                          checked={answerKey[questionNumber]?.is_nullified}
                          onCheckedChange={(checked) => 
                            handleNullifyToggle(questionNumber, checked === true)
                          }
                        />
                        <Label htmlFor={`nullify-${questionNumber}`} className="text-sm">
                          Anulada
                        </Label>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 mb-2">
                      {answerOptions.map(option => (
                        <Button
                          key={option}
                          type="button"
                          size="sm"
                          variant={answerKey[questionNumber]?.correct_answer === option ? "default" : "outline"}
                          onClick={() => handleAnswerChange(questionNumber, option)}
                          disabled={answerKey[questionNumber]?.is_nullified}
                          className="w-9 h-9 p-0"
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Label htmlFor={`weight-${questionNumber}`} className="text-sm">
                        Peso:
                      </Label>
                      <Input
                        id={`weight-${questionNumber}`}
                        type="number"
                        min="0"
                        step="0.1"
                        value={answerKey[questionNumber]?.weight || 1}
                        onChange={(e) => handleWeightChange(questionNumber, parseFloat(e.target.value))}
                        className="w-20"
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <Separator className="my-4" />
            </div>
          );
        })}
        
        <div className="mt-4">
          <Button 
            onClick={handleSaveAnswerKey} 
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? 'Salvando...' : 'Salvar Gabarito Completo'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
