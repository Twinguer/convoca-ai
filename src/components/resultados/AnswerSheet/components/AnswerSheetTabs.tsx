import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AnswerSheetTabsProps } from '../utils/answerSheetTypes';
import { AnswerMatrix } from '../../AnswerMatrix';
import { SubjectScoresTab } from '../../SubjectScoresTab';

export const AnswerSheetTabs: React.FC<AnswerSheetTabsProps> = ({
  objectiveSections,
  selectedSection,
  onSectionChange,
  shouldShowSubjective,
  concurso
}) => {
  const handleSectionChange = (value: string) => {
    onSectionChange(value);
  };

  return (
    <div className="border rounded-md overflow-hidden shadow-sm">
      <Tabs
        value={selectedSection}
        onValueChange={handleSectionChange}
        className="w-full"
      >
        <TabsList 
          className="grid w-full" 
          style={{ 
            gridTemplateColumns: `repeat(${Math.min(objectiveSections.length + (shouldShowSubjective ? 1 : 0), 5)}, 1fr)` 
          }}
        >
          {objectiveSections.map(section => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
          {shouldShowSubjective && (
            <TabsTrigger value="subjective">
              Discursivas/Est.Caso
            </TabsTrigger>
          )}
        </TabsList>

        {objectiveSections.map(section => (
          <TabsContent key={section.key} value={section.key}>
            {/* Conteúdo será renderizado pelo componente pai */}
          </TabsContent>
        ))}

        {shouldShowSubjective && (
          <TabsContent value="subjective">
            {/* Conteúdo será renderizado pelo componente pai */}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};
