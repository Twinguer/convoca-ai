
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { GeneralInfoSection } from '@/components/Admin/FormSections/GeneralInfoSection';
import { ExamStructureSection } from '@/components/Admin/FormSections/ExamStructureSection';
import { ReservationQuotasSection } from '@/components/Admin/FormSections/ReservationQuotasSection';
import { StateSelector } from '@/components/Admin/FormSections/StateSelector';
import { MinimumScoreSection } from '@/components/Admin/FormSections/MinimumScoreSection';

interface GeneralTabProps {
  form: UseFormReturn<any>;
  jobTitles: Array<{id: string, title: string}>;
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
    <div className="space-y-6">
      <GeneralInfoSection 
        form={form}
        jobTitles={jobTitles}
        isCustomTitle={isCustomTitle}
        isCustomBanca={isCustomBanca}
        handleJobTitleChange={handleJobTitleChange}
        handleCustomTitleChange={handleCustomTitleChange}
        handleBancaChange={handleBancaChange}
        handleOrgaoChange={handleOrgaoChange}
      />
      
      <StateSelector 
        selectedStates={selectedStates}
        setSelectedStates={setSelectedStates}
      />
      
      <ExamStructureSection form={form} />
      
      <MinimumScoreSection form={form} />
      
      <ReservationQuotasSection form={form} />

      <div className="flex justify-end gap-2">
        <Button 
          type="button" 
          variant="outline" 
          disabled={isSubmitting} 
          onClick={onSaveRanking}
        >
          Salvar informações
        </Button>
        <Button 
          type="button"
          disabled={isSubmitting}
          onClick={handleNextTab}
        >
          Continuar para Gabarito
          {isSubmitting && <div className="ml-2 w-4 h-4 rounded-full border-2 border-t-transparent border-white animate-spin"></div>}
        </Button>
      </div>
    </div>
  );
};
