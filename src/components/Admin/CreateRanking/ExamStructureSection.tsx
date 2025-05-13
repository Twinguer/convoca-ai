
import React, { useState, useEffect } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl
} from '@/components/ui/form';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { TrashIcon } from 'lucide-react';

// Componente para ExamStructureSection
export const ExamStructureSection = ({ form }: { form: UseFormReturn<any> }) => {
  const [activeTab, setActiveTab] = useState('basic-info');
  const [customDisciplineName, setCustomDisciplineName] = useState('');
  const [customDisciplineQuestionCount, setCustomDisciplineQuestionCount] = useState('');
  const [customDisciplineWeight, setCustomDisciplineWeight] = useState('1');

  const watchHasCustomKnowledge = form.watch('has_custom_knowledge');
  const watchDisciplines = form.watch('disciplines') || [];
  const watchExamType = form.watch('exam_type');

  const addCustomDiscipline = () => {
    if (!customDisciplineName.trim()) return;
    
    // Criar um ID para o tipo de disciplina (slug)
    const disciplineType = customDisciplineName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 20);
    
    // Validar se já existe uma disciplina com esse tipo
    const existingTypeIndex = watchDisciplines.findIndex((d: any) => d.type === disciplineType);
    
    if (existingTypeIndex >= 0) {
      // Disciplina já existe, não adicionar duplicada
      alert('Já existe uma disciplina com esse nome');
      return;
    }
    
    // Garantir que o nome da disciplina seja uma sigla de no máximo 4 caracteres em caixa baixa
    const abbreviation = customDisciplineName
      .toLowerCase()
      .replace(/[^a-z]/g, '')
      .substring(0, 4);

    // Adicionar nova disciplina à lista
    const currentDisciplines = form.getValues('disciplines') || [];
    const updatedDisciplines = [
      ...currentDisciplines,
      {
        type: disciplineType,
        name: abbreviation,
        isEnabled: true,
        questionCount: parseInt(customDisciplineQuestionCount) || 0,
        weight: parseFloat(customDisciplineWeight) || 1.0,
        minimumScore: 0 // Campo para pontuação mínima
      }
    ];
    form.setValue('disciplines', updatedDisciplines, { shouldDirty: true });
    
    // Limpar campos
    setCustomDisciplineName('');
    setCustomDisciplineQuestionCount('');
    setCustomDisciplineWeight('1');
  };

  const removeDiscipline = (index: number) => {
    const currentDisciplines = form.getValues('disciplines') || [];
    const updatedDisciplines = [
      ...currentDisciplines.slice(0, index),
      ...currentDisciplines.slice(index + 1)
    ];
    form.setValue('disciplines', updatedDisciplines, { shouldDirty: true });
  };

  const updateDiscipline = (index: number, field: string, value: any) => {
    const currentDisciplines = form.getValues('disciplines') || [];
    const updatedDisciplines = [...currentDisciplines];
    updatedDisciplines[index] = {
      ...updatedDisciplines[index],
      [field]: value
    };
    form.setValue('disciplines', updatedDisciplines, { shouldDirty: true });
  };

  // Efeito para ajustar a penalidade quando o tipo de exame muda
  useEffect(() => {
    if (watchExamType !== 'Certo ou Errado') {
      form.setValue('wrong_answer_penalty', 0);
    }
  }, [watchExamType, form]);

  return (
    <Card className="border-none shadow-none">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-lg font-medium">Estrutura da Prova</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4">
          {/* Tipo de Prova */}
          <FormField
            control={form.control}
            name="exam_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de Prova</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Múltipla Escolha">Múltipla Escolha</SelectItem>
                    <SelectItem value="Certo ou Errado">Certo ou Errado</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {/* Quantidade de Alternativas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="alternatives_count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade de Alternativas</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value?.toString() || "5"}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Número de alternativas" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="2">2 (A,B)</SelectItem>
                      <SelectItem value="3">3 (A,B,C)</SelectItem>
                      <SelectItem value="4">4 (A,B,C,D)</SelectItem>
                      <SelectItem value="5">5 (A,B,C,D,E)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Penalidade por Erro - Apenas visível para "Certo ou Errado" */}
            {watchExamType === 'Certo ou Errado' && (
              <FormField
                control={form.control}
                name="wrong_answer_penalty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Penalidade por Erro</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseFloat(value))}
                      defaultValue={field.value?.toString() || "0"}
                      value={field.value?.toString() || "0"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Penalidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="0">Sem penalidade</SelectItem>
                        <SelectItem value="0.5">0.5 ponto</SelectItem>
                        <SelectItem value="1">1.0 ponto</SelectItem>
                        <SelectItem value="1.5">1.5 pontos</SelectItem>
                        <SelectItem value="2">2.0 pontos</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Modo de Conhecimentos */}
          <FormField
            control={form.control}
            name="has_custom_knowledge"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Usar disciplinas customizáveis
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Define as disciplinas da prova com pesos e quantidades personalizados
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      field.onChange(checked);
                      // Inicializar disciplines com array vazio se estiver ativando
                      if (checked && (!form.getValues('disciplines') || !form.getValues('disciplines').length)) {
                        form.setValue('disciplines', [], { shouldDirty: true });
                      }
                    }}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Interface de Disciplinas Customizáveis */}
          {watchHasCustomKnowledge && (
            <div className="space-y-4 pl-3 border-l-2 border-gray-100">
              {/* Lista de disciplinas customizadas */}
              {Array.isArray(watchDisciplines) && watchDisciplines.length > 0 && (
                <div className="space-y-2">
                  <Label>Disciplinas Definidas</Label>
                  <div className="space-y-2">
                    {watchDisciplines.map((discipline: any, index: number) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        {/* Switch para habilitar/desabilitar */}
                        <div className="col-span-1">
                          <Switch
                            checked={discipline.isEnabled}
                            onCheckedChange={(checked) => updateDiscipline(index, 'isEnabled', checked)}
                          />
                        </div>
                        
                        {/* Nome da disciplina (sigla) */}
                        <div className="col-span-3">
                          <Input
                            value={discipline.name}
                            onChange={(e) => {
                              // Limitar a 4 caracteres em caixa baixa
                              const value = e.target.value.toLowerCase().replace(/[^a-z]/g, '').substring(0, 4);
                              updateDiscipline(index, 'name', value);
                            }}
                            placeholder="Sigla"
                            disabled={!discipline.isEnabled}
                            className="h-9"
                          />
                        </div>
                        
                        {/* Quantidade de questões */}
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={discipline.questionCount || ''}
                            onChange={(e) => updateDiscipline(index, 'questionCount', parseInt(e.target.value) || 0)}
                            placeholder="Quantidade"
                            disabled={!discipline.isEnabled}
                            className="h-9"
                          />
                        </div>
                        
                        {/* Peso */}
                        <div className="col-span-3">
                          <Input
                            type="number"
                            value={discipline.weight || 1}
                            onChange={(e) => updateDiscipline(index, 'weight', parseFloat(e.target.value) || 1)}
                            step="0.1"
                            min="0.1"
                            placeholder="Peso"
                            disabled={!discipline.isEnabled}
                            className="h-9"
                          />
                        </div>
                        
                        {/* Botão remover */}
                        <div className="col-span-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => removeDiscipline(index)}
                            className="h-9 w-9 p-0"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Adicionar nova disciplina */}
              <div className="space-y-2">
                <Label>Adicionar Nova Disciplina</Label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-4">
                    <Input
                      value={customDisciplineName}
                      onChange={(e) => setCustomDisciplineName(e.target.value)}
                      placeholder="Nome da Disciplina"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={customDisciplineQuestionCount}
                      onChange={(e) => setCustomDisciplineQuestionCount(e.target.value)}
                      placeholder="Qtd. de Questões"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input
                      type="number"
                      value={customDisciplineWeight}
                      onChange={(e) => setCustomDisciplineWeight(e.target.value)}
                      placeholder="Peso"
                      step="0.1"
                      min="0.1"
                      className="h-9"
                    />
                  </div>
                  <div className="col-span-2">
                    <Button 
                      onClick={addCustomDiscipline} 
                      variant="outline" 
                      className="h-9 w-full"
                    >
                      Adicionar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
