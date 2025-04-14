
import React from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Concurso } from '@/types/concursos';
import { BookOpen, BookText, GraduationCap } from 'lucide-react';

interface SectionToggleProps {
  selectedSection: 'basic' | 'specific1' | 'specific2';
  onSectionChange: (section: 'basic' | 'specific1' | 'specific2') => void;
  concurso: Concurso;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({ 
  selectedSection, 
  onSectionChange, 
  concurso 
}) => {
  return (
    <div className="p-4 border-b bg-gray-50">
      <p className="font-medium mb-3 text-gray-700">Selecione a seção da prova:</p>
      <Tabs 
        value={selectedSection} 
        onValueChange={(val) => onSectionChange(val as 'basic' | 'specific1' | 'specific2')}
        className="w-full"
      >
        <TabsList className="w-full">
          {concurso.has_basic_knowledge && (
            <TabsTrigger value="basic" className="flex items-center gap-1 flex-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden md:inline">Conhecimentos Básicos</span>
              <span className="md:hidden">Básicos</span>
              {concurso.basic_knowledge_questions && (
                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full ml-1">
                  {concurso.basic_knowledge_questions}
                </span>
              )}
            </TabsTrigger>
          )}
          
          {concurso.has_specific_knowledge_1 && (
            <TabsTrigger value="specific1" className="flex items-center gap-1 flex-1">
              <BookText className="h-4 w-4" />
              <span className="hidden md:inline">Conhecimentos Específicos 1</span>
              <span className="md:hidden">Específicos 1</span>
              {concurso.specific_knowledge_1_questions && (
                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full ml-1">
                  {concurso.specific_knowledge_1_questions}
                </span>
              )}
            </TabsTrigger>
          )}
          
          {concurso.has_specific_knowledge_2 && (
            <TabsTrigger value="specific2" className="flex items-center gap-1 flex-1">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden md:inline">Conhecimentos Específicos 2</span>
              <span className="md:hidden">Específicos 2</span>
              {concurso.specific_knowledge_2_questions && (
                <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded-full ml-1">
                  {concurso.specific_knowledge_2_questions}
                </span>
              )}
            </TabsTrigger>
          )}
        </TabsList>
      </Tabs>
    </div>
  );
};
