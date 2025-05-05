
import React, { useState } from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface KnowledgeAreasProps {
  form: UseFormReturn<any>;
  examStructureForm?: boolean; // If true, this is being used in the exam structure section
}

export const KnowledgeAreas: React.FC<KnowledgeAreasProps> = ({ form, examStructureForm = false }) => {
  const [customSubject, setCustomSubject] = useState('');

  const predefinedSubjects = [
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
    'Tecnologia da Informação'
  ];

  const knowledgeAreas = form.watch('knowledgeAreas') || [];

  const handleAddSubject = (subject: string) => {
    if (!knowledgeAreas.includes(subject) && subject.trim() !== '') {
      const updatedAreas = [...knowledgeAreas, subject];
      form.setValue('knowledgeAreas', updatedAreas, { shouldDirty: true });
    }
  };

  const handleAddCustomSubject = () => {
    if (customSubject.trim() !== '' && !knowledgeAreas.includes(customSubject)) {
      const updatedAreas = [...knowledgeAreas, customSubject];
      form.setValue('knowledgeAreas', updatedAreas, { shouldDirty: true });
      setCustomSubject('');
    }
  };

  const handleRemoveSubject = (subject: string) => {
    const updatedAreas = knowledgeAreas.filter(area => area !== subject);
    form.setValue('knowledgeAreas', updatedAreas, { shouldDirty: true });
  };

  return (
    <Card className={`p-4 ${examStructureForm ? '' : 'border p-4 rounded-md'}`}>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium">Áreas de Conhecimento / Matérias</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {knowledgeAreas.map((subject: string) => (
            <Badge key={subject} className="flex items-center gap-1 bg-slate-100 text-slate-800 hover:bg-slate-200">
              {subject}
              <button 
                type="button" 
                onClick={() => handleRemoveSubject(subject)}
                className="ml-1 text-slate-500 hover:text-slate-700"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {knowledgeAreas.length === 0 && (
            <div className="text-sm text-muted-foreground">Nenhuma matéria adicionada</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormItem>
            <FormLabel>Matéria</FormLabel>
            <Select onValueChange={(value) => handleAddSubject(value)}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar matéria" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {predefinedSubjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>

          <div className="flex items-end gap-2">
            <FormItem className="flex-grow">
              <FormLabel>Outra matéria</FormLabel>
              <FormControl>
                <Input 
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  placeholder="Digite uma matéria personalizada"
                />
              </FormControl>
            </FormItem>
            <Button 
              type="button" 
              onClick={handleAddCustomSubject} 
              disabled={!customSubject.trim()}
              size="icon"
              className="mb-0.5"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
