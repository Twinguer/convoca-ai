
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
    <div className="p-4 border-b bg-white">
      <p className="font-medium mb-2">Selecione a seção da prova:</p>
      <ToggleGroup 
        type="single" 
        value={selectedSection} 
        onValueChange={(val) => val && onSectionChange(val as any)}
        className="justify-start"
      >
        {concurso.has_basic_knowledge && (
          <ToggleGroupItem value="basic" aria-label="Básicos" className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span className="hidden md:inline">Conhecimentos Básicos</span>
            <span className="md:hidden">Básicos</span>
          </ToggleGroupItem>
        )}
        {concurso.has_specific_knowledge_1 && (
          <ToggleGroupItem value="specific1" aria-label="Específicos 1" className="flex items-center gap-1">
            <BookText className="h-4 w-4" />
            <span className="hidden md:inline">Conhecimentos Específicos 1</span>
            <span className="md:hidden">Específicos 1</span>
          </ToggleGroupItem>
        )}
        {concurso.has_specific_knowledge_2 && (
          <ToggleGroupItem value="specific2" aria-label="Específicos 2" className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            <span className="hidden md:inline">Conhecimentos Específicos 2</span>
            <span className="md:hidden">Específicos 2</span>
          </ToggleGroupItem>
        )}
      </ToggleGroup>
    </div>
  );
};
