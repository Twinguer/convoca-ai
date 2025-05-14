
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { ExamStructureSection as ExamStructureSectionComponent } from '../CreateRanking/ExamStructureSection';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  return <ExamStructureSectionComponent form={form} />;
};
