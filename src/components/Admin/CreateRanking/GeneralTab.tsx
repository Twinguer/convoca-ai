
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BasicInfoSection } from './BasicInfoSection';
import { ReservationQuotasSection } from './ReservationQuotasSection';
import { ExamStructureSection } from './ExamStructureSection';
import { StateSelector } from '@/components/Admin/FormSections/StateSelector';

interface GeneralTabProps {
  form: any;
  jobTitles: { id: string; title: string }[];
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
  setSelectedStates: (states: string[]) => void;
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
      
      {/* Seção de Estrutura da Prova */}
      <ExamStructureSection form={form} />
      
      {/* Seção de Reserva de Vagas */}
      <ReservationQuotasSection form={form} />
      
      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          onClick={onSaveRanking}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar'}
        </Button>
        <Button
          type="button"
          onClick={handleNextTab}
          disabled={isSubmitting}
        >
          Próximo: Gabarito Oficial
        </Button>
      </div>
    </div>
  );
};
