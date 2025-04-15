
import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { KnowledgeSectionBuilder } from './KnowledgeSectionBuilder';
import { EvaluationSectionBuilder } from './EvaluationSectionBuilder';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Estrutura da Prova</h3>
      
      <div className="space-y-8">
        {/* Knowledge Sections Builder */}
        <KnowledgeSectionBuilder form={form} />
        
        {/* Divider */}
        <div className="h-px bg-muted" />
        
        {/* Evaluation Sections Builder */}
        <EvaluationSectionBuilder form={form} />
      </div>
    </div>
  );
};
