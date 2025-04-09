
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Save, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '@/components/ui/breadcrumb';
import { fetchConcursoById } from '@/services/concursoService';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { v4 as uuidv4 } from '@/lib/utils';

const ConcursoParticipation: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'basic' | 'specific'>('basic');
  const [basicAnswers, setBasicAnswers] = useState<Record<number, string>>({});
  const [specificAnswers, setSpecificAnswers] = useState<Record<number, string>>({});
  const [discursiveScore, setDiscursiveScore] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch concurso details
  const { data: concurso, isLoading, isError } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id || ''),
    enabled: !!id,
  });
  
  // Check if user is already participating
  const { data: userRanking, isLoading: isLoadingRanking } = useQuery({
    queryKey: ['user-ranking', id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      
      const { data, error } = await supabase
        .from('user_rankings')
        .select('*')
        .eq('user_id', user.id)
        .eq('concurso_id', id)
        .single();
        
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!user && !!id,
  });
  
  // Fetch existing answers if user is already participating
  useEffect(() => {
    const fetchAnswers = async () => {
      if (!userRanking?.id) return;
      
      try {
        // Fetch basic knowledge answers
        const { data: basicData, error: basicError } = await supabase
          .from('user_answers')
          .select('*')
          .eq('user_ranking_id', userRanking.id)
          .eq('is_basic_knowledge', true);
          
        if (basicError) throw basicError;
        
        // Fetch specific knowledge answers
        const { data: specificData, error: specificError } = await supabase
          .from('user_answers')
          .select('*')
          .eq('user_ranking_id', userRanking.id)
          .eq('is_basic_knowledge', false);
          
        if (specificError) throw specificError;
        
        // Transform data to state format
        const basicMap: Record<number, string> = {};
        const specificMap: Record<number, string> = {};
        
        basicData?.forEach(item => {
          basicMap[item.question_number] = item.answer;
        });
        
        specificData?.forEach(item => {
          specificMap[item.question_number] = item.answer;
        });
        
        setBasicAnswers(basicMap);
        setSpecificAnswers(specificMap);
        setDiscursiveScore(userRanking.discursive_score?.toString() || '');
        
      } catch (error) {
        console.error('Error fetching answers:', error);
        toast({
          title: 'Erro ao carregar respostas',
          description: 'Não foi possível carregar suas respostas. Por favor, tente novamente.',
          variant: 'destructive',
        });
      }
    };
    
    fetchAnswers();
  }, [userRanking?.id, toast]);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      toast({
        title: 'Autenticação necessária',
        description: 'Você precisa estar logado para participar deste ranking.',
      });
      navigate('/auth');
    }
  }, [user, isLoading, navigate, toast]);
  
  // Generate question numbers
  const getQuestionNumbers = (count: number, startFrom: number = 1) => {
    return Array.from({ length: count }, (_, i) => i + startFrom);
  };
  
  const basicQuestions = getQuestionNumbers(30);
  const specificQuestions = getQuestionNumbers(40, 31);
  
  // Get allowed answers based on exam type
  const getAllowedAnswers = () => {
    const examType = concurso?.exam_type || 'Alternativas';
    
    if (examType === 'Certo ou Errado') {
      return ['C', 'E'];
    } else if (examType === 'Alternativas') {
      const alternativesCount = concurso?.alternatives_count || 5;
      return Array.from({ length: alternativesCount }, (_, i) => String.fromCharCode(65 + i)); // A, B, C, D, E, ...
    }
    
    return ['A', 'B', 'C', 'D', 'E']; // Default
  };
  
  const allowedAnswers = getAllowedAnswers();
  
  // Handle answer changes
  const handleBasicAnswerChange = (question: number, answer: string) => {
    setBasicAnswers(prev => ({ ...prev, [question]: answer }));
  };
  
  const handleSpecificAnswerChange = (question: number, answer: string) => {
    setSpecificAnswers(prev => ({ ...prev, [question]: answer }));
  };
  
  // Save answers and submit participation
  const handleSubmit = async () => {
    if (!user || !id) return;
    
    setIsSubmitting(true);
    
    try {
      // Check if user is already participating
      let rankingId = userRanking?.id;
      
      // If not, create a new ranking entry
      if (!rankingId) {
        const { data: newRanking, error: rankingError } = await supabase
          .from('user_rankings')
          .insert({
            user_id: user.id,
            concurso_id: id,
            score: 0, // Will be calculated later
          })
          .select();
          
        if (rankingError) throw rankingError;
        rankingId = newRanking?.[0]?.id;
      }
      
      if (!rankingId) throw new Error('Falha ao criar registro do ranking');
      
      // Prepare answers for insertion
      const answersToInsert = [
        ...Object.entries(basicAnswers).map(([question, answer]) => ({
          id: uuidv4(),
          user_ranking_id: rankingId,
          question_number: parseInt(question),
          answer,
          is_basic_knowledge: true
        })),
        ...Object.entries(specificAnswers).map(([question, answer]) => ({
          id: uuidv4(),
          user_ranking_id: rankingId,
          question_number: parseInt(question),
          answer,
          is_basic_knowledge: false
        }))
      ];
      
      // Delete existing answers
      await supabase
        .from('user_answers')
        .delete()
        .eq('user_ranking_id', rankingId);
      
      // Insert new answers
      const { error: answersError } = await supabase
        .from('user_answers')
        .insert(answersToInsert);
        
      if (answersError) throw answersError;
      
      toast({
        title: 'Participação salva com sucesso!',
        description: 'Suas respostas foram salvas e você está participando do ranking.',
      });
      
      // Navigate to results page
      navigate(`/concurso/${id}/resultados`);
      
    } catch (error: any) {
      console.error('Error submitting participation:', error);
      toast({
        title: 'Erro ao salvar participação',
        description: error.message || 'Não foi possível salvar suas respostas. Por favor, tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading || isLoadingRanking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }
  
  if (isError || !concurso) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Concurso não encontrado</h2>
        <p className="text-gray-600 mb-6">O concurso que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/concursos')}>Voltar para Concursos</Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/concurso/${id}`}>{concurso.titulo}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Participar do Ranking</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 flex items-center gap-1"
        onClick={() => navigate(`/concurso/${id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{concurso.titulo}</h1>
        <p className="text-gray-600 mb-2">{concurso.orgao}</p>
        <div className="flex items-center text-sm text-gray-500">
          <span className="mr-2">Banca: {concurso.banca}</span>
          <span>•</span>
          <span className="mx-2">Vagas: {concurso.vagas}</span>
        </div>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Participe do Ranking</CardTitle>
          <CardDescription>
            Preencha o gabarito com suas respostas para participar do ranking não oficial deste concurso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">Como preencher</h3>
              <p className="text-sm text-yellow-700">
                Preencha as respostas conforme o gabarito oficial ou suas respostas. 
                São aceitas apenas as letras: {allowedAnswers.join(', ')}.
              </p>
            </div>
          </div>
          
          <Tabs defaultValue="basic" onValueChange={(value) => setActiveTab(value as 'basic' | 'specific')}>
            <TabsList className="w-full max-w-md grid grid-cols-2 mb-6">
              <TabsTrigger value="basic">Conhecimentos Básicos</TabsTrigger>
              <TabsTrigger value="specific">Conhecimentos Específicos</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basic">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {basicQuestions.map((question) => (
                  <div key={`basic-${question}`} className="flex items-center space-x-4">
                    <div className="font-medium min-w-[30px]">{question}.</div>
                    <RadioGroup 
                      value={basicAnswers[question] || ''} 
                      onValueChange={(value) => handleBasicAnswerChange(question, value)}
                      className="flex space-x-2"
                    >
                      {allowedAnswers.map((answer) => (
                        <div key={`basic-${question}-${answer}`} className="flex items-center space-x-1">
                          <RadioGroupItem value={answer} id={`basic-${question}-${answer}`} />
                          <Label htmlFor={`basic-${question}-${answer}`}>{answer}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="specific">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {specificQuestions.map((question) => (
                  <div key={`specific-${question}`} className="flex items-center space-x-4">
                    <div className="font-medium min-w-[30px]">{question}.</div>
                    <RadioGroup 
                      value={specificAnswers[question] || ''} 
                      onValueChange={(value) => handleSpecificAnswerChange(question, value)}
                      className="flex space-x-2"
                    >
                      {allowedAnswers.map((answer) => (
                        <div key={`specific-${question}-${answer}`} className="flex items-center space-x-1">
                          <RadioGroupItem value={answer} id={`specific-${question}-${answer}`} />
                          <Label htmlFor={`specific-${question}-${answer}`}>{answer}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </div>
              
              {/* Discursive Section */}
              <div className="mt-8 p-6 border border-gray-200 rounded-md">
                <h3 className="text-lg font-medium mb-4">Prova Discursiva/Redação</h3>
                <div className="space-y-2">
                  <Label htmlFor="discursive-score">Nota da Prova Discursiva (0-100)</Label>
                  <Input
                    id="discursive-score"
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Nota da prova discursiva"
                    value={discursiveScore}
                    onChange={(e) => setDiscursiveScore(e.target.value)}
                    className="max-w-xs"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={() => navigate(`/concurso/${id}`)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
            {isSubmitting ? 'Salvando...' : 'Salvar Participação'}
            <Save className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>
      
      <div className="text-center text-sm text-gray-500">
        <p>
          Ao participar, suas respostas serão utilizadas para calcular sua classificação no ranking não oficial.
        </p>
        <p className="mt-1">
          O resultado oficial é de responsabilidade exclusiva da banca organizadora do concurso.
        </p>
      </div>
    </div>
  );
};

export default ConcursoParticipation;
