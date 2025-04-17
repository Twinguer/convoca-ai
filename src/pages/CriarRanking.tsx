
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GeneralInfoSection } from '@/components/Admin/FormSections/GeneralInfoSection';
import { ExamStructureSection } from '@/components/Admin/FormSections/ExamStructureSection';
import { ReservationQuotasSection } from '@/components/Admin/FormSections/ReservationQuotasSection';
import { createRanking } from '@/integrations/supabase/rankings/concursoManager';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

const CriarRanking = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('general-info');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    // General Info
    titulo: '',
    orgao: '',
    banca: '',
    custom_banca: '',
    data_publicacao: new Date(),
    etapa_atual: 'Prova Objetiva',
    status: 'Em andamento',
    link: '',
    
    // Exam Structure
    exam_type: 'Alternativas',
    alternatives_count: 5,
    wrong_answer_penalty: 0,
    
    // Knowledge Areas
    has_basic_knowledge: true,
    basic_knowledge_questions: 0,
    basic_knowledge_weight: 1,
    
    has_specific_knowledge_1: false,
    specific_knowledge_1_questions: 0,
    specific_knowledge_1_weight: 1,
    
    has_specific_knowledge_2: false,
    specific_knowledge_2_questions: 0,
    specific_knowledge_2_weight: 1,
    
    has_specific_knowledge_3: false,
    specific_knowledge_3_questions: 0,
    specific_knowledge_3_weight: 1,
    
    // Discursive/Essay
    has_discursive: false,
    discursive_weight: 1,
    
    // Case Studies
    has_case_study_1: false,
    case_study_1_weight: 1,
    
    has_case_study_2: false,
    case_study_2_weight: 1,
    
    has_case_study_3: false,
    case_study_3_weight: 1,
    
    // Reservation Quotas
    has_ampla_concorrencia: true,
    has_ppp: false,
    has_pcd: false,
    has_hipossuficientes: false,
    has_indigenas: false,
    has_transsexuais: false,
  });
  
  // Check if user is authenticated
  React.useEffect(() => {
    if (!user) {
      toast.error("Você precisa estar logado para criar um ranking");
      navigate("/auth");
    }
  }, [user, navigate]);
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleNumberInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };
  
  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      data_publicacao: date
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Add user ID to the formData
      const dataToSubmit = {
        ...formData,
        created_by_user_id: user?.id
      };
      
      const result = await createRanking(dataToSubmit);
      
      if (result) {
        toast.success("Ranking criado com sucesso!");
        queryClient.invalidateQueries({ queryKey: ['rankings'] });
        navigate(`/concurso/${result[0].id}/resultados`);
      }
    } catch (error) {
      console.error("Erro ao criar ranking:", error);
      toast.error("Erro ao criar ranking: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleNextTab = () => {
    if (activeTab === 'general-info') {
      // Validate general info fields
      if (!formData.titulo || !formData.orgao || (!formData.banca && !formData.custom_banca)) {
        toast.error("Preencha todos os campos obrigatórios");
        return;
      }
      setActiveTab('exam-structure');
    } else if (activeTab === 'exam-structure') {
      // Validate exam structure fields
      if (
        (formData.has_basic_knowledge && !formData.basic_knowledge_questions) ||
        (formData.has_specific_knowledge_1 && !formData.specific_knowledge_1_questions)
      ) {
        toast.error("Preencha o número de questões para todas as áreas selecionadas");
        return;
      }
      setActiveTab('quotas');
    }
  };
  
  const handlePreviousTab = () => {
    if (activeTab === 'exam-structure') {
      setActiveTab('general-info');
    } else if (activeTab === 'quotas') {
      setActiveTab('exam-structure');
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
          <CardTitle className="text-2xl font-bold">Criar Novo Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="general-info">Informações Gerais</TabsTrigger>
                <TabsTrigger value="exam-structure">Estrutura da Prova</TabsTrigger>
                <TabsTrigger value="quotas">Cotas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general-info">
                <GeneralInfoSection 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleDateChange={handleDateChange}
                />
                
                <div className="flex justify-end mt-6">
                  <Button type="button" onClick={handleNextTab}>
                    Próximo
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="exam-structure">
                <ExamStructureSection 
                  formData={formData}
                  handleInputChange={handleInputChange}
                  handleNumberInputChange={handleNumberInputChange}
                />
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={handlePreviousTab}>
                    Anterior
                  </Button>
                  <Button type="button" onClick={handleNextTab}>
                    Próximo
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="quotas">
                <ReservationQuotasSection 
                  formData={formData}
                  handleInputChange={handleInputChange}
                />
                
                <div className="flex justify-between mt-6">
                  <Button type="button" variant="outline" onClick={handlePreviousTab}>
                    Anterior
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Criando..." : "Criar Ranking"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriarRanking;
