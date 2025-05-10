import React, { useState, useEffect } from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { PlusCircle, X, Save, AlertTriangle, Loader2 } from 'lucide-react';
import { customAlphabet } from 'nanoid';
import { useToast } from '@/hooks/use-toast';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useState as useHookState } from '@hookstate/core';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { ExamStructureBuilder } from '@/models/examBuilder/ExamStructureBuilder';
import { ExamSectionConfig } from '@/models/examBuilder/ExamSectionBuilder';
import { sectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';
import { SectionType } from '@/types/concursos';

interface CustomExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const CustomExamStructureSection: React.FC<CustomExamStructureSectionProps> = ({
  form
}) => {
  const [isCustomEnabled, setIsCustomEnabled] = useState(false);
  const [customSections, setCustomSections] = useState<ExamSectionConfig[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [currentSection, setCurrentSection] = useState<ExamSectionConfig | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  
  const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 10);
  
  useEffect(() => {
    const disciplines = form.getValues('disciplines') || [];
    if (Array.isArray(disciplines)) {
      setCustomSections(disciplines);
      setIsCustomEnabled(disciplines.length > 0);
    }
  }, [form.getValues('disciplines')]);
  
  const handleEnableCustom = (enabled: boolean) => {
    setIsCustomEnabled(enabled);
    if (!enabled) {
      setCustomSections([]);
      form.setValue('disciplines', []);
    }
  };
  
  const handleOpenSectionDialog = (section?: ExamSectionConfig) => {
    setCurrentSection(section || null);
    setIsEditMode(!!section);
    setIsSectionDialogOpen(true);
  };
  
  const handleCloseSectionDialog = () => {
    setIsSectionDialogOpen(false);
    setCurrentSection(null);
    setIsEditMode(false);
  };
  
  const handleAddSection = (newSection: ExamSectionConfig) => {
    if (!newSection.type) {
      newSection.type = nanoid();
    }
    
    setCustomSections(prevSections => {
      const updatedSections = [...prevSections, newSection];
      form.setValue('disciplines', updatedSections);
      return updatedSections;
    });
    handleCloseSectionDialog();
  };
  
  const handleUpdateSection = (updatedSection: ExamSectionConfig) => {
    setCustomSections(prevSections => {
      const updatedSections = prevSections.map(section =>
        section.type === updatedSection.type ? updatedSection : section
      );
      form.setValue('disciplines', updatedSections);
      return updatedSections;
    });
    handleCloseSectionDialog();
  };
  
  const handleDeleteSection = (sectionToDelete: ExamSectionConfig) => {
    setCustomSections(prevSections => {
      const updatedSections = prevSections.filter(section => section.type !== sectionToDelete.type);
      form.setValue('disciplines', updatedSections);
      return updatedSections;
    });
  };
  
  const handleSectionChange = (sectionToUpdate: ExamSectionConfig, field: keyof ExamSectionConfig, value: any) => {
    setCustomSections(prevSections => {
      const updatedSections = prevSections.map(section => {
        if (section.type === sectionToUpdate.type) {
          return { ...section, [field]: value };
        }
        return section;
      });
      form.setValue('disciplines', updatedSections);
      return updatedSections;
    });
  };
  
  return (
    <Card className="shadow-md">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <FormItem>
            <div className="space-y-0.5">
              <FormLabel>Habilitar Disciplinas Customizadas</FormLabel>
              <FormDescription>
                Adicione disciplinas customizadas para o seu concurso.
              </FormDescription>
            </div>
          </FormItem>
          <FormControl>
            <Switch
              checked={isCustomEnabled}
              onCheckedChange={handleEnableCustom}
            />
          </FormControl>
        </div>
        
        {isCustomEnabled && (
          <div className="space-y-4">
            <Button onClick={() => handleOpenSectionDialog()} className="bg-emerald-600 hover:bg-emerald-700 text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Adicionar Disciplina
            </Button>
            
            {customSections.map(section => (
              <Card key={section.type} className="border">
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <Label>Nome da Disciplina</Label>
                    <Input
                      type="text"
                      value={section.name || ''}
                      onChange={(e) => handleSectionChange(section, 'name', e.target.value)}
                    />
                  </div>
                  
                  <div className="col-span-2 md:col-span-1">
                    <Label>Número de Questões</Label>
                    <Input
                      type="number"
                      value={section.questionCount?.toString() || ''}
                      onChange={(e) => handleSectionChange(section, 'questionCount', Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <div className="flex items-center justify-between">
                      <Label>Habilitado</Label>
                      <Switch
                        checked={section.isEnabled}
                        onCheckedChange={(checked) => handleSectionChange(section, 'isEnabled', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="col-span-2 flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleOpenSectionDialog(section)}>
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteSection(section)}>
                      Excluir
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditMode ? 'Editar Disciplina' : 'Adicionar Disciplina'}</DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nome
                </Label>
                <Input
                  id="name"
                  defaultValue={currentSection?.name || ''}
                  className="col-span-3"
                  onChange={(e) => setCurrentSection(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="questionCount" className="text-right">
                  Número de Questões
                </Label>
                <Input
                  id="questionCount"
                  type="number"
                  defaultValue={currentSection?.questionCount?.toString() || ''}
                  className="col-span-3"
                  onChange={(e) => setCurrentSection(prev => ({ ...prev, questionCount: Number(e.target.value) }))}
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="isEnabled" className="text-right">
                  Habilitado
                </Label>
                <Switch
                  id="isEnabled"
                  checked={currentSection?.isEnabled || false}
                  onCheckedChange={(checked) => setCurrentSection(prev => ({ ...prev, isEnabled: checked }))}
                  className="col-span-3"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleCloseSectionDialog}>
                Cancelar
              </Button>
              <Button type="submit" onClick={() => {
                if (isEditMode && currentSection) {
                  handleUpdateSection(currentSection);
                } else if (currentSection) {
                  handleAddSection(currentSection);
                }
              }}>
                {isEditMode ? 'Atualizar' : 'Salvar'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
