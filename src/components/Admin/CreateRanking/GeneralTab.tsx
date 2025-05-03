
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { BasicInfoSection } from './BasicInfoSection';
import { ExamStructureSection } from './ExamStructureSection';
import { ReservationQuotasSection } from './ReservationQuotasSection';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface GeneralTabProps {
  form: UseFormReturn<any>;
  jobTitles: Array<{ id: string; title: string }>;
  isCustomTitle: boolean;
  isCustomBanca: boolean;
  handleJobTitleChange: (value: string) => void;
  handleCustomTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBancaChange: (value: string) => void;
  handleOrgaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNextTab: () => void;
  onSaveRanking: () => void;
  isSubmitting: boolean;
  selectedStates: string[];
  setSelectedStates: React.Dispatch<React.SetStateAction<string[]>>;
  isAdmin?: boolean; // Nova propriedade para indicar se é administrador
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
  isAdmin = false // Valor padrão falso
}) => {
  return (
    <div className="space-y-8">
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
      
      <ExamStructureSection
        form={form}
      />
      
      <ReservationQuotasSection
        form={form}
      />

      <div className="flex justify-end pt-4">
        <Button 
          onClick={onSaveRanking} 
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
              Salvando...
            </>
          ) : isAdmin ? (
            'Salvar Ranking (Admin)'  // Mensagem diferente para administradores
          ) : (
            'Salvar Ranking'
          )}
        </Button>
      </div>
    </div>
  );
};
