
import React, { useState } from 'react';
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
  handleNextTab
}) => {
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const { toast } = useToast();
  
  // Set default form values if not set
  React.useEffect(() => {
    // Define default values for form if they don't exist
    if (form.getValues("exam_type") === undefined) {
      form.setValue("exam_type", "Alternativas");
    }
    if (form.getValues("alternatives_count") === undefined) {
      form.setValue("alternatives_count", 5);
    }
    if (form.getValues("wrong_answer_penalty") === undefined) {
      form.setValue("wrong_answer_penalty", 0);
    }
    
    // Update form when selectedStates changes
    form.setValue('estados', selectedStates);
  }, [form, selectedStates]);
  
  const validateBeforeNext = () => {
    const currentValues = form.getValues();
    
    // Validação básica
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
    
    // Verificar se pelo menos uma área de conhecimento foi adicionada
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
    
    // Verificar se pelo menos uma cota de reserva foi selecionada
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
    
    return true;
  };
  
  const handleNext = () => {
    if (validateBeforeNext()) {
      handleNextTab();
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Básicas */}
      <BasicInfoSection 
        form={form}
        jobTitles={jobTitles}
        isCustomTitle={isCustomTitle}
        isCustomBanca={isCustomBanca}
        handleJobTitleChange={handleJobTitleChange}
        handleCustomTitleChange={handleCustomTitleChange}
        handleBancaChange={handleBancaChange}
        selectedStates={selectedStates}
        setSelectedStates={setSelectedStates}
      />
      
      {/* Estrutura da Prova */}
      <ExamStructureSection form={form} />
      
      {/* Cotas de Reserva */}
      <ReservationQuotasSection form={form} />
      
      <div className="flex justify-end">
        <Button type="button" onClick={handleNext}>
          Próximo: Gabarito
        </Button>
      </div>
    </div>
  );
};
