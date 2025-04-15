import React from 'react';
import { Button } from '@/components/ui/button';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from 'react-hook-form';
import { X, Plus } from 'lucide-react';

interface EvaluationSectionBuilderProps {
  form: UseFormReturn<any>;
}

// Evaluation type options
const EVALUATION_TYPE_OPTIONS = [
  { value: 'discursive', label: 'Discursiva' },
  { value: 'casestudy', label: 'Estudo de Caso' },
  { value: 'other', label: 'Outro' }
];

export const EvaluationSectionBuilder: React.FC<EvaluationSectionBuilderProps> = ({ form }) => {
  // Get the current evaluation sections from the form
  const watchSections = form.watch('evaluationSections') || [];

  // Add a new section
  const addSection = () => {
    if (watchSections.length >= 5) return; // Limit to 5 sections
    
    const newSection = {
      id: `eval-${Date.now()}`,
      type: 'discursive',
      name: 'Discursiva',
      maxScore: 100
    };
    
    form.setValue('evaluationSections', [...watchSections, newSection]);
  };

  // Remove a section by id
  const removeSection = (id: string) => {
    form.setValue(
      'evaluationSections',
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
    
    form.setValue('evaluationSections', updatedSections);
  };

  // Handle evaluation type change
  const handleSectionTypeChange = (id: string, value: string) => {
    const typeLabels: Record<string, string> = {
      'discursive': 'Discursiva',
      'casestudy': 'Estudo de Caso',
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
        <h3 className="text-lg font-medium">Avaliações Dissertativas</h3>
        <Button 
          type="button" 
          onClick={addSection}
          variant="outline" 
          size="sm"
          disabled={watchSections.length >= 5}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Adicionar Avaliação
        </Button>
      </div>

      {watchSections.length === 0 && (
        <div className="text-center py-6 border border-dashed rounded-md text-muted-foreground">
          Clique em "Adicionar Avaliação" para configurar avaliações dissertativas
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
                  {EVALUATION_TYPE_OPTIONS.map((option) => (
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

            {/* Max Score */}
            <div>
              <FormLabel>Pontuação Máxima</FormLabel>
              <Input
                type="number"
                min="0"
                max="100"
                value={section.maxScore}
                onChange={(e) => updateSection(section.id, 'maxScore', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
