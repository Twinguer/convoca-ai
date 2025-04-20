import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { BasicInfoSection } from './BasicInfoSection';
import { ExamStructureSection } from './ExamStructureSection';
import { ReservationQuotasSection } from './ReservationQuotasSection';
import { useToast } from '@/hooks/use-toast';

interface GeneralTabProps {
  form: any;
  jobTitles: Array<{id: string, title: string}>;
  isCustomTitle: boolean;
  isCustomBanca: boolean;
  handleJobTitleChange: (value: string) => void;
  handleCustomTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBancaChange: (value: string) => void;
  handleOrgaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNextTab: () => void;
}

export const GeneralTab: React.FC<GeneralTabProps> = ({
  form,
  jobTitles,
  isCustomTitle,
  isCustomBanca,
  handleJobTitleChange,
  handleCustomTitleChange,
  handleBancaChange,
  handleOrgaoChange,
  handleNextTab
}) => {
  const [selectedStates, setSelectedStates] = React.useState<string[]>(form.getValues('localidades') || []);
  const { toast } = useToast();
  
  useEffect(() => {
    form.setValue('localidades', selectedStates);
  }, [selectedStates, form]);
  
  useEffect(() => {
    const localidades = form.getValues('localidades');
    if (localidades && Array.isArray(localidades)) {
      setSelectedStates(localidades);
    }
  }, [form]);

  const validateBeforeNext = () => {
    const currentValues = form.getValues();
    
    if (!currentValues.predefined_job_title) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione um cargo.",
        variant: "destructive"
      });
      return false;
    }
    
    if (currentValues.predefined_job_title === "OUTRO" && !currentValues.custom_job_title) {
      toast({
        title: "Erro de validação",
        description: "Por favor, informe o cargo personalizado.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!currentValues.orgao) {
      toast({
        title: "Erro de validação",
        description: "Por favor, informe o órgão.",
        variant: "destructive"
      });
      return false;
    }
    
    if (selectedStates.length === 0) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione pelo menos um estado.",
        variant: "destructive"
      });
      return false;
    }
    
    if (!currentValues.banca) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione uma banca.",
        variant: "destructive"
      });
      return false;
    }
    
    if (currentValues.banca === "OUTRO" && !currentValues.custom_banca) {
      toast({
        title: "Erro de validação",
        description: "Por favor, informe a banca personalizada.",
        variant: "destructive"
      });
      return false;
    }
    
    const hasAnyKnowledgeArea = 
      currentValues.has_basic_knowledge || 
      currentValues.has_specific_knowledge_1 || 
      currentValues.has_specific_knowledge_2 || 
      currentValues.has_specific_knowledge_3 ||
      currentValues.has_discursive ||
      currentValues.has_case_study_1 ||
      currentValues.has_case_study_2 ||
      currentValues.has_case_study_3;
    
    if (!hasAnyKnowledgeArea) {
      toast({
        title: "Erro de validação",
        description: "Por favor, adicione pelo menos uma área de conhecimento.",
        variant: "destructive"
      });
      return false;
    }
    
    const hasAnyQuota = 
      currentValues.has_ampla_concorrencia || 
      currentValues.has_ppp || 
      currentValues.has_pcd ||
      currentValues.has_hiposuficientes ||
      currentValues.has_indigenas ||
      currentValues.has_trans;
    
    if (!hasAnyQuota) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione pelo menos uma cota de reserva.",
        variant: "destructive"
      });
      return false;
    }

    if (
      (currentValues.has_basic_knowledge && Number(currentValues.basic_knowledge_questions) === 0) ||
      (currentValues.has_specific_knowledge_1 && Number(currentValues.specific_knowledge_1_questions) === 0) ||
      (currentValues.has_specific_knowledge_2 && Number(currentValues.specific_knowledge_2_questions) === 0) ||
      (currentValues.has_specific_knowledge_3 && Number(currentValues.specific_knowledge_3_questions) === 0)
    ) {
      toast({
        title: "Erro de validação",
        description: "Todas as áreas de conhecimento ativas precisam ter o número de questões maior que zero.",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };
  
  const handleNext = () => {
    if (validateBeforeNext()) {
      handleNextTab();
    }
  };

  return (
    <div className="space-y-6">
      <BasicInfoSection 
        form={form}
        jobTitles={jobTitles}
        isCustomTitle={isCustomTitle}
        isCustomBanca={isCustomBanca}
        handleJobTitleChange={handleJobTitleChange}
        handleCustomTitleChange={handleCustomTitleChange}
        handleBancaChange={handleBancaChange}
        handleOrgaoChange={handleOrgaoChange}
        selectedStates={selectedStates}
        setSelectedStates={setSelectedStates}
      />
      
      <ExamStructureSection form={form} />
      
      <ReservationQuotasSection form={form} />
      
      <div className="flex justify-end">
        <Button type="button" onClick={handleNext}>
          Preencher Gabarito
        </Button>
      </div>
    </div>
  );
};
