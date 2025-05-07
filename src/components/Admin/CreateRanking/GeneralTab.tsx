
import React, { useEffect, useState } from 'react';
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
  onSaveRanking?: () => Promise<void>;
  isSubmitting?: boolean;
  selectedStates: string[];
  setSelectedStates: React.Dispatch<React.SetStateAction<string[]>>;
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
  handleNextTab,
  onSaveRanking,
  isSubmitting,
  selectedStates,
  setSelectedStates
}) => {
  const [rankingSaved, setRankingSaved] = useState<boolean>(false);
  const { toast } = useToast();
  const [isFirstSaveDone, setIsFirstSaveDone] = useState(false);

  useEffect(() => {
    setIsFirstSaveDone(false);
  }, [form]);

  useEffect(() => {
    const formValues = form.getValues();
    if (formValues.localidades && Array.isArray(formValues.localidades) && formValues.localidades.length > 0) {
      setSelectedStates(formValues.localidades);
    }
  }, [form, setSelectedStates]);

  const validateBeforeSave = () => {
    const currentValues = form.getValues();
    const examStructureType = currentValues.minimum_score_type || 'knowledge';

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

    // Validação para estrutura baseada em áreas de conhecimento
    if (examStructureType === 'knowledge') {
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
    } 
    // Validação para estrutura baseada em disciplinas
    else if (examStructureType === 'subject') {
      const subjects = currentValues.subjects || [];
      
      if (subjects.length === 0) {
        toast({
          title: "Erro de validação",
          description: "Por favor, adicione pelo menos uma disciplina.",
          variant: "destructive"
        });
        return false;
      }
    }

    const hasAnyQuota = 
      currentValues.has_ampla_concorrencia || 
      currentValues.has_ppp || 
      currentValues.has_pcd ||
      currentValues.has_hipossuficientes ||
      currentValues.has_indigenas ||
      currentValues.has_transsexuais;

    if (!hasAnyQuota) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione pelo menos uma cota de reserva.",
        variant: "destructive"
      });
      return false;
    }

    // Validar que todas as áreas de conhecimento ativas têm número de questões > 0
    if (examStructureType === 'knowledge') {
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
    }
    // Validar que todas as disciplinas têm número de questões > 0
    else if (examStructureType === 'subject') {
      const subjects = currentValues.subjects || [];
      const invalidSubjects = subjects.filter(s => !s.question_count || Number(s.question_count) === 0);
      
      if (invalidSubjects.length > 0) {
        toast({
          title: "Erro de validação",
          description: "Todas as disciplinas precisam ter o número de questões maior que zero.",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (validateBeforeSave() && onSaveRanking) {
      form.setValue('localidades', selectedStates, { shouldDirty: true });
      await onSaveRanking();
      setIsFirstSaveDone(true);
    }
  };

  const validateBeforeNext = () => {
    if (!isFirstSaveDone) {
      toast({
        title: "Salvar necessário",
        description: "Salve o ranking antes de preencher o gabarito.",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateBeforeNext()) return;
    handleNextTab();
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

      <div className="flex flex-col items-end gap-2 md:flex-row md:justify-end">
        <Button 
          type="button" 
          onClick={handleSave}
          variant="secondary"
          disabled={isFirstSaveDone || isSubmitting}
          className={isFirstSaveDone ? "bg-gray-200 text-gray-500 cursor-not-allowed" : ""}
        >
          Salvar Ranking
        </Button>
        <Button 
          type="button"
          onClick={handleNext}
          disabled={!isFirstSaveDone}
          className={isFirstSaveDone ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-gray-400 hover:bg-gray-500 text-white cursor-not-allowed"}
        >
          Preencher Gabarito
        </Button>
      </div>
    </div>
  );
};
