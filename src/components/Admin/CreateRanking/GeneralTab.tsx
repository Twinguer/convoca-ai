
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { BasicInfoSection } from './BasicInfoSection';
import { ExamStructureSection } from './ExamStructureSection';
import { ReservationQuotasSection } from './ReservationQuotasSection';
import { MinimumScoreSection } from './MinimumScoreSection';
import { ExamBookletsSection } from './ExamBookletsSection';
import { useToast } from '@/components/ui/use-toast';

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
  createdConcursoId?: string;
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
  setSelectedStates,
  createdConcursoId
}) => {
  const [isFirstSaveDone, setIsFirstSaveDone] = useState(false);
  const [areBookletsSaved, setAreBookletsSaved] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se já existe um ID de concurso salvo
    const formValues = form.getValues();
    if (formValues.id || createdConcursoId) {
      setIsFirstSaveDone(true);
    } else {
      setIsFirstSaveDone(false);
    }
  }, [form, createdConcursoId]);

  useEffect(() => {
    const formValues = form.getValues();
    if (formValues.localidades && Array.isArray(formValues.localidades) && formValues.localidades.length > 0) {
      setSelectedStates(formValues.localidades);
    }
  }, [form, setSelectedStates]);

  const validateBeforeSave = () => {
    const currentValues = form.getValues();
    console.log("Validando form values:", currentValues);

    // Remover validação de cadernos salvos para permitir salvamento inicial
    // if (!areBookletsSaved) {
    //   toast({
    //     title: "Cadernos não salvos",
    //     description: "Por favor, configure e salve os cadernos de prova antes de salvar o ranking.",
    //     variant: "destructive"
    //   });
    //   return false;
    // }

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

    // Verificar se há cotas de reserva selecionadas
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
    
    // Verificar se há pelo menos uma disciplina habilitada na nova estrutura de blocos
    let hasEnabledDiscipline = false;
    
    if (Array.isArray(currentValues.disciplines)) {
      // Iterar pelos blocos
      for (const block of currentValues.disciplines) {
        // Verificar se o bloco tem disciplinas
        if (block.disciplines && Array.isArray(block.disciplines)) {
          // Verificar se há pelo menos uma disciplina habilitada no bloco
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled === true) {
              hasEnabledDiscipline = true;
              break;
            }
          }
        }
        
        if (hasEnabledDiscipline) break;
      }
    }
    
    if (!hasEnabledDiscipline) {
      toast({
        title: "Erro de validação",
        description: "Por favor, selecione ao menos uma disciplina.",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (validateBeforeSave() && onSaveRanking) {
      form.setValue('localidades', selectedStates, { shouldDirty: true });
      
      // Garantir que has_custom_knowledge seja sempre true (padrão agora é disciplinas)
      form.setValue('has_custom_knowledge', true);
      
      // Desabilitar conhecimentos básicos/específicos padrão
      form.setValue('has_basic_knowledge', false);
      form.setValue('has_specific_knowledge_1', false);
      form.setValue('has_specific_knowledge_2', false);
      form.setValue('has_specific_knowledge_3', false);
      
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

  const handleBookletsSaved = (saved: boolean) => {
    setAreBookletsSaved(saved);
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

      <MinimumScoreSection form={form} />

      <ExamStructureSection form={form} />

      <ReservationQuotasSection form={form} />

      {/* Seção de cadernos sempre visível */}
      <ExamBookletsSection 
        concursoId={createdConcursoId}
        onBookletsSaved={handleBookletsSaved}
      />

      <div className="flex flex-col items-end gap-2 md:flex-row md:justify-end">
        <Button 
          type="button" 
          onClick={handleSave}
          variant="secondary"
          disabled={isSubmitting}
        >
          Salvar Ranking
        </Button>
        <Button 
          type="button"
          onClick={handleNext}
          disabled={!isFirstSaveDone}
          className={isFirstSaveDone ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted hover:bg-muted/80 text-muted-foreground cursor-not-allowed"}
        >
          {isFirstSaveDone ? "Editar Gabarito" : "Preencher Gabarito"}
        </Button>
      </div>
    </div>
  );
};
