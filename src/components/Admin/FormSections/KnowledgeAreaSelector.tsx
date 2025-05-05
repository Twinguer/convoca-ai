
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const PREDEFINED_SUBJECTS = [
  'Português', 
  'Inglês', 
  'Espanhol', 
  'Matemática', 
  'RLM', 
  'Estatística', 
  'Mat. Financeira', 
  'Dir. Constitucional', 
  'Dir. Administrativo', 
  'Dir. Civil', 
  'Dir. Penal', 
  'Dir. Tributário', 
  'AFO', 
  'Cont. Geral', 
  'Cont. Custos', 
  'Economia', 
  'Tecnologia da Informação',
  'Outros'
];

interface KnowledgeAreaSelectorProps {
  form: UseFormReturn<any>;
  sectionId: string;
  label?: string;
}

export const KnowledgeAreaSelector: React.FC<KnowledgeAreaSelectorProps> = ({
  form,
  sectionId,
  label = "Matéria"
}) => {
  const [selectedSubject, setSelectedSubject] = React.useState<string>('');
  const [customSubject, setCustomSubject] = React.useState<string>('');
  
  const currentKnowledgeAreas = form.watch('knowledgeAreas') || [];
  
  const handleSubjectSelection = (subject: string) => {
    setSelectedSubject(subject);
    
    if (subject !== 'Outros') {
      // Add the selected subject to knowledgeAreas if not already present
      if (!currentKnowledgeAreas.includes(subject)) {
        form.setValue('knowledgeAreas', [...currentKnowledgeAreas, subject]);
      }
    }
  };
  
  const handleCustomSubjectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomSubject(e.target.value);
  };
  
  const handleCustomSubjectSave = () => {
    if (customSubject.trim() && !currentKnowledgeAreas.includes(customSubject)) {
      form.setValue('knowledgeAreas', [...currentKnowledgeAreas, customSubject]);
      setCustomSubject('');
    }
  };
  
  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name={`${sectionId}_subject`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select
              onValueChange={(value) => {
                field.onChange(value);
                handleSubjectSelection(value);
              }}
              value={field.value}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a matéria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PREDEFINED_SUBJECTS.map(subject => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
        )}
      />
      
      {selectedSubject === 'Outros' && (
        <div className="flex space-x-2">
          <Input
            placeholder="Digite a matéria"
            value={customSubject}
            onChange={handleCustomSubjectChange}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleCustomSubjectSave();
              }
            }}
          />
        </div>
      )}
      
      {currentKnowledgeAreas.length > 0 && (
        <div className="mt-2">
          <p className="text-sm font-medium mb-1">Matérias selecionadas:</p>
          <div className="flex flex-wrap gap-2">
            {currentKnowledgeAreas.map((area: string, index: number) => (
              <div key={index} className="bg-gray-100 px-2 py-1 rounded-md flex items-center">
                <span className="text-sm">{area}</span>
                <button
                  type="button"
                  className="ml-1 text-red-500 hover:text-red-700"
                  onClick={() => {
                    form.setValue(
                      'knowledgeAreas', 
                      currentKnowledgeAreas.filter((_, i) => i !== index)
                    );
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
