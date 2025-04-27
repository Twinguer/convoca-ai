
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { GeneralTab } from '@/components/Admin/CreateRanking/GeneralTab';
import { AnswerKeyTab } from '@/components/Admin/CreateRanking/AnswerKeyTab';
import { createRanking } from '@/integrations/supabase/rankings/concursoManager';

const CriarRanking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general-info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm({
    defaultValues: {
      titulo: '',
      orgao: '',
      banca: '',
      vagas: 0,
      has_ppp: false,
      has_pcd: false
    }
  });

  const handleSaveRanking = async () => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um ranking");
      navigate("/auth");
      return;
    }

    setIsSubmitting(true);

    try {
      const formValues = form.getValues();
      // Fix the argument count here - only pass formValues
      await createRanking(formValues, user.id);
      
      queryClient.invalidateQueries({ queryKey: ['rankings'] });
      toast.success("Ranking criado com sucesso!");
      navigate('/');
    } catch (error) {
      console.error("Erro ao criar ranking:", error);
      toast.error("Erro ao criar ranking: " + (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center gap-2" 
        onClick={() => navigate('/pre-classificacao')}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para Rankings
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Criar Novo Ranking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveRanking)}>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="general-info">Informações Gerais</TabsTrigger>
                  <TabsTrigger value="answer-key" disabled>
                    Gabarito Oficial
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="general-info">
                  <GeneralTab form={form} />
                  
                  <div className="flex justify-end mt-6">
                    <Button 
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {isSubmitting ? 'Criando...' : 'Criar Ranking'}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="answer-key">
                  {/* Add the required props to AnswerKeyTab */}
                  <AnswerKeyTab 
                    hasBasicKnowledge={true}
                    hasSpecificKnowledge1={true}
                    hasSpecificKnowledge2={false}
                    hasSpecificKnowledge3={false}
                    basicKnowledgeQuestions={20}
                    specificKnowledge1Questions={20}
                    specificKnowledge2Questions={0}
                    specificKnowledge3Questions={0}
                    examType="Alternativas"
                    alternativesCount={5}
                  />
                </TabsContent>
              </Tabs>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriarRanking;
