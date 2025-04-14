
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
  return <div className="p-4 border-b bg-emerald-50">
      
      <Tabs value={selectedSection} onValueChange={val => onSectionChange(val as 'basic' | 'specific1' | 'specific2')} className="w-full">
        <TabsList className="w-full grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-1 h-auto">
          {concurso.has_basic_knowledge && <TabsTrigger value="basic" className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BookOpen className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Conhecimentos Básicos</span>
                {concurso.basic_knowledge_questions && <span className="text-xs bg-emerald-100 text-emerald-800 data-[state=active]:bg-white data-[state=active]:text-emerald-800 px-1.5 py-0.5 rounded-full">
                    {concurso.basic_knowledge_questions} questões
                  </span>}
              </div>
            </TabsTrigger>}
          
          {concurso.has_specific_knowledge_1 && <TabsTrigger value="specific1" className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <BookText className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Conhecimentos Específicos</span>
                {concurso.specific_knowledge_1_questions && <span className="text-xs bg-emerald-100 text-emerald-800 data-[state=active]:bg-white data-[state=active]:text-emerald-800 px-1.5 py-0.5 rounded-full">
                    {concurso.specific_knowledge_1_questions} questões
                  </span>}
              </div>
            </TabsTrigger>}
          
          {concurso.has_specific_knowledge_2 && <TabsTrigger value="specific2" className="flex items-center gap-2 py-3 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <GraduationCap className="h-5 w-5" />
              <div className="flex flex-col items-start">
                <span className="font-medium">Conhecimentos Específicos 2</span>
                {concurso.specific_knowledge_2_questions && <span className="text-xs bg-emerald-100 text-emerald-800 data-[state=active]:bg-white data-[state=active]:text-emerald-800 px-1.5 py-0.5 rounded-full">
                    {concurso.specific_knowledge_2_questions} questões
                  </span>}
              </div>
            </TabsTrigger>}
        </TabsList>
      </Tabs>
    </div>;
};
