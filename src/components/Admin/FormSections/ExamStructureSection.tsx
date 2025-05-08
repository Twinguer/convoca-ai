
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import CustomExamStructureSection from './CustomExamStructureSection';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  return <CustomExamStructureSection form={form} />;
};
