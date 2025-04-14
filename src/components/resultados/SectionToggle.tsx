
import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Concurso } from '@/types/concursos';

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
      <p className="font-medium mb-2">Seções da Prova</p>
      <ToggleGroup 
        type="single" 
        value={selectedSection} 
        onValueChange={(val) => val && onSectionChange(val as any)}
      >
        {concurso.has_basic_knowledge && (
          <ToggleGroupItem value="basic" aria-label="Básicos" className="text-sm">
            Conhecimentos Básicos
          </ToggleGroupItem>
        )}
        {concurso.has_specific_knowledge_1 && (
          <ToggleGroupItem value="specific1" aria-label="Específicos 1" className="text-sm">
            Específicos 1
          </ToggleGroupItem>
        )}
        {concurso.has_specific_knowledge_2 && (
          <ToggleGroupItem value="specific2" aria-label="Específicos 2" className="text-sm">
            Específicos 2
          </ToggleGroupItem>
        )}
      </ToggleGroup>
    </div>
  );
};
