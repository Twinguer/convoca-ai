
import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BasicInfoSection } from './BasicInfoSection';
import { ExamStructureSection } from './ExamStructureSection';
import { ReservationQuotasSection } from './ReservationQuotasSection';
import { MinimumScoreSection } from './MinimumScoreSection';
import { ExamBookletsSection } from './ExamBookletsSection';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

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
  onSaveRanking?: () => Promise<string | null>;
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
  const [booklets, setBooklets] = useState<Array<{id?: string, name: string, display_order: number}>>([]);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const { toast } = useToast();
  const bookletsRef = useRef<Array<{id?: string, name: string, display_order: number}>>([]);

  useEffect(() => {
    const formValues = form.getValues();
    if (formValues.localidades && Array.isArray(formValues.localidades) && formValues.localidades.length > 0) {
      setSelectedStates(formValues.localidades);
    }
  }, [form, setSelectedStates]);

  // Keep booklets in ref for access during save
  useEffect(() => {
    bookletsRef.current = booklets;
  }, [booklets]);

  const validateBeforeSave = () => {
    const currentValues = form.getValues();
    // Debug logs removed for security

    // Validação de cadernos criados (não salvos, pois handleFillAnswerKey salva depois)
    // Debug logs removed for security
    
    // Verificar se há cadernos criados (não se já foram salvos)
    const currentBooklets = booklets.length > 0 ? booklets : bookletsRef.current;
    if (currentBooklets.length === 0) {
      // Debug logs removed for security
      toast({
        title: "Cadernos obrigatórios",
        description: "É necessário criar ao menos 1 caderno de prova antes de salvar o ranking.",
        variant: "destructive"
      });
      return false;
    }

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

  const validateBooklets = (): boolean => {
    // Usar o estado booklets em vez de bookletsRef.current
    const currentBooklets = booklets.length > 0 ? booklets : bookletsRef.current;
    
    // Debug logs removed for security
    // Debug logs removed for security
    // Debug logs removed for security
    
    // Validar se há pelo menos 1 caderno
    if (currentBooklets.length === 0) {
      // Debug logs removed for security
      toast({
        title: "Cadernos obrigatórios",
        description: "É necessário criar ao menos 1 caderno de prova antes de preencher o gabarito",
        variant: "destructive"
      });
      return false;
    }

    const names = currentBooklets.map(b => b.name.trim()).filter(n => n);
    const uniqueNames = new Set(names);
    
    if (names.length !== currentBooklets.length) {
      toast({
        title: "Erro nos cadernos",
        description: "Todos os cadernos devem ter um nome preenchido",
        variant: "destructive"
      });
      return false;
    }
    
    if (names.length !== uniqueNames.size) {
      toast({
        title: "Erro nos cadernos",
        description: "Nomes dos cadernos devem ser únicos",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const saveBooklets = async (concursoId: string, bookletsSnapshot: Array<{id?: string, name: string, display_order: number}>) => {
    // Validar snapshot recebido
    if (bookletsSnapshot.length === 0) {
      toast({
        title: "Erro nos cadernos",
        description: "Nenhum caderno para salvar. Adicione pelo menos um caderno.",
        variant: "destructive"
      });
      return false;
    }

    if (!concursoId) {
      toast({
        title: "Erro",
        description: "ID do concurso não encontrado",
        variant: "destructive"
      });
      return false;
    }

    try {
      const currentBooklets = bookletsSnapshot;
      
      // Processar cadernos para JSONB
      const processedBooklets = currentBooklets.map((booklet, index) => ({
        id: booklet.id || crypto.randomUUID(),
        name: booklet.name,
        display_order: booklet.display_order || index + 1,
        is_active: true,
        total_questions: 0
      }));

      // Atualizar a coluna exam_booklets na tabela concursos
      const { error: updateError } = await supabase
        .from('concursos')
        .update({ exam_booklets: processedBooklets })
        .eq('id', concursoId);

      if (updateError) throw updateError;

      const savedBooklets = processedBooklets;

      setBooklets(savedBooklets);
      // Debug logs removed for security
      return true;
    } catch (error: any) {
      toast({
        title: "Erro ao salvar cadernos",
        description: error.message || "Não foi possível salvar os cadernos",
        variant: "destructive"
      });
      return false;
    }
  };

  const handleFillAnswerKey = async () => {
    if (!validateBeforeSave()) return;
    
    // Validar se há cadernos antes de prosseguir
    if (!validateBooklets()) return;

    // Criar snapshot dos cadernos ANTES de qualquer operação assíncrona
    const bookletsSnapshot = bookletsRef.current.map(b => ({ ...b }));

    setIsSavingAll(true);
    
    try {
      // Step 1: Save ranking and obtain concursoId diretamente
      form.setValue('localidades', selectedStates, { shouldDirty: true });
      form.setValue('has_custom_knowledge', true);
      form.setValue('has_basic_knowledge', false);
      form.setValue('has_specific_knowledge_1', false);
      form.setValue('has_specific_knowledge_2', false);
      form.setValue('has_specific_knowledge_3', false);
      
      let concursoIdToUse: string | null = createdConcursoId || null;
      if (onSaveRanking) {
        const id = await onSaveRanking();
        concursoIdToUse = id || concursoIdToUse;
      }

      // Garantir que temos um ID de concurso
      if (!concursoIdToUse) {
        toast({
          title: "Erro",
          description: "Não foi possível obter o ID do ranking",
          variant: "destructive"
        });
        return;
      }

      // Step 2: Save booklets usando o ID retornado e o snapshot
      const bookletsSaved = await saveBooklets(concursoIdToUse, bookletsSnapshot);
      if (!bookletsSaved) return;

      toast({
        title: "Sucesso!",
        description: "Ranking e cadernos salvos. Preencha agora o gabarito oficial."
      });

      // Step 3: Mudar para a aba de gabarito sem salvar novamente
      handleNextTab();
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingAll(false);
    }
  };

  const handleBookletsChange = (newBooklets: Array<{id?: string, name: string, display_order: number}>) => {
    setBooklets(newBooklets);
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
        onBookletsChange={handleBookletsChange}
        onBookletsSaved={() => {}}
      />

      <div className="flex justify-end">
        <Button 
          type="button"
          onClick={handleFillAnswerKey}
          disabled={isSubmitting || isSavingAll}
          size="lg"
        >
          {isSavingAll ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
};
