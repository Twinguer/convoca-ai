import React from 'react';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { X, Plus } from 'lucide-react';

interface KnowledgeSectionBuilderProps {
  form: UseFormReturn<any>;
}

// Section type options
const SECTION_TYPE_OPTIONS = [
  { value: 'basic', label: 'Conhecimentos Básicos' },
  { value: 'specific', label: 'Conhecimentos Específicos' },
  { value: 'other', label: 'Outros' }
];

export const KnowledgeSectionBuilder: React.FC<KnowledgeSectionBuilderProps> = ({ form }) => {
  // Get the current knowledge sections from the form
  const watchSections = form.watch('knowledgeSections') || [];

  // Add a new section
  const addSection = () => {
    if (watchSections.length >= 5) return; // Limit to 5 sections
    
    const newSection = {
      id: `section-${Date.now()}`,
      type: 'basic',
      name: '',
      questions: 0,
      weight: 1
    };
    
    form.setValue('knowledgeSections', [...watchSections, newSection]);
  };

  // Remove a section by id
  const removeSection = (id: string) => {
    form.setValue(
      'knowledgeSections',
      watchSections.filter((section: any) => section.id !== id)
    );
  };

  // Update a section property
  const updateSection = (id: string, property: string, value: any) => {
    const updatedSections = watchSections.map((section: any) => {
      if (section.id === id) {
        return { ...section, [property]: value };
      }
      return section;
    });
    
    form.setValue('knowledgeSections', updatedSections);
  };

  // Handle section type change
  const handleSectionTypeChange = (id: string, value: string) => {
    const typeLabels: Record<string, string> = {
      'basic': 'Conhecimentos Básicos',
      'specific': 'Conhecimentos Específicos',
      'other': ''
    };

    // If the type is 'other', we'll keep the current name, otherwise we'll set the default label
    if (value !== 'other') {
      updateSection(id, 'name', typeLabels[value]);
    }
    
    updateSection(id, 'type', value);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Áreas de Conhecimento</h3>
        <Button 
          type="button" 
          onClick={addSection}
          variant="outline" 
          size="sm"
          disabled={watchSections.length >= 5}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Adicionar Seção
        </Button>
      </div>

      {watchSections.length === 0 && (
        <div className="text-center py-6 border border-dashed rounded-md text-muted-foreground">
          Clique em "Adicionar Seção" para configurar áreas de conhecimento
        </div>
      )}

      {watchSections.map((section: any, index: number) => (
        <div key={section.id} className="border p-4 rounded-md relative bg-muted/30">
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            className="absolute top-2 right-2 text-muted-foreground h-6 w-6 p-0" 
            onClick={() => removeSection(section.id)}
          >
            <X className="h-4 w-4" />
          </Button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Section Type */}
            <div>
              <FormLabel>Tipo</FormLabel>
              <Select 
                value={section.type}
                onValueChange={(value) => handleSectionTypeChange(section.id, value)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {SECTION_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section Name (only editable for "Other" type) */}
            <div>
              <FormLabel>Nome</FormLabel>
              <Input
                value={section.name}
                onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                disabled={section.type !== 'other'}
                placeholder={section.type === 'other' ? "Digite o nome" : ""}
              />
            </div>

            {/* Number of Questions */}
            <div>
              <FormLabel>Questões</FormLabel>
              <Input
                type="number"
                min="0"
                value={section.questions}
                onChange={(e) => updateSection(section.id, 'questions', parseInt(e.target.value) || 0)}
              />
            </div>

            {/* Weight */}
            <div>
              <FormLabel>Peso</FormLabel>
              <Select 
                value={section.weight.toString()}
                onValueChange={(value) => updateSection(section.id, 'weight', parseInt(value))}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o peso" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="1">1</SelectItem>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="3">3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
