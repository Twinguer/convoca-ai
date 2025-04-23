
import React from 'react';
import { GeneralInfoSection } from '@/components/Admin/FormSections/GeneralInfoSection';
import { ExamStructureSection } from '@/components/Admin/FormSections/ExamStructureSection';
import { ReservationQuotasSection } from '@/components/Admin/FormSections/ReservationQuotasSection';
import { Button } from '@/components/ui/button';

interface GeneralTabProps {
  form: any;
  jobTitles: { id: string; title: string }[];
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
  return (
    <>
      <GeneralInfoSection 
        form={form}
        jobTitles={jobTitles}
        isCustomTitle={isCustomTitle}
        isCustomBanca={isCustomBanca}
        handleJobTitleChange={handleJobTitleChange}
        handleCustomTitleChange={handleCustomTitleChange}
        handleBancaChange={handleBancaChange}
      />
      
      <ExamStructureSection form={form} />
      
      <ReservationQuotasSection form={form} />
      
      <div className="flex justify-end mt-6">
        <Button type="button" onClick={handleNextTab}>
          Próximo
        </Button>
      </div>
    </>
  );
};
