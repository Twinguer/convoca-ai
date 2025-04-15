
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { UseFormReturn } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ExamStructureSectionProps {
  form: UseFormReturn<any>;
}

export const ExamStructureSection: React.FC<ExamStructureSectionProps> = ({ form }) => {
  // Helper function to create a weight select component for knowledge sections
  const renderWeightSelect = (name: string) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="mt-2">
          <FormLabel>Peso</FormLabel>
          <Select 
            onValueChange={(value) => field.onChange(parseInt(value))} 
            value={field.value.toString()}
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
          <FormDescription>
            Multiplicador da pontuação
          </FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );

  // Helper function for score inputs (discursive and case studies)
  const renderScoreInput = (name: string) => (
    <FormField 
      control={form.control} 
      name={name} 
      render={({ field }) => (
        <FormItem className="mt-2">
          <FormLabel>Pontuação</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              min="0"
              max="100"
              step="1"
              {...field} 
              onChange={(e) => field.onChange(Number(e.target.value))}
            />
          </FormControl>
          <FormDescription>
            Valor máximo (0-100)
          </FormDescription>
          <FormMessage />
        </FormItem>
      )} 
    />
  );

  return (
    <div className="space-y-4 border p-4 rounded-md">
      <h3 className="text-lg font-medium">Estrutura da Prova</h3>
      
      <div className="space-y-4">
        {/* Conhecimentos Básicos */}
        <FormField 
          control={form.control} 
          name="has_basic_knowledge" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Qtd. Questões C. Básicos</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormField 
                        control={form.control} 
                        name="basic_knowledge_questions" 
                        render={({ field: questionsField }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input type="number" {...questionsField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      
                      {renderWeightSelect("basic_knowledge_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
        
        {/* C. Específicos-1 */}
        <FormField 
          control={form.control} 
          name="has_specific_knowledge_1" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Qtd. C. Específicos-1</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormField 
                        control={form.control} 
                        name="specific_knowledge_1_questions" 
                        render={({ field: questionsField }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input type="number" {...questionsField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      
                      {renderWeightSelect("specific_knowledge_1_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
        
        {/* C. Específicos-2 */}
        <FormField 
          control={form.control} 
          name="has_specific_knowledge_2" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Qtd. C. Específicos-2</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormField 
                        control={form.control} 
                        name="specific_knowledge_2_questions" 
                        render={({ field: questionsField }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input type="number" {...questionsField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      
                      {renderWeightSelect("specific_knowledge_2_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
        
        {/* C. Específicos-3 */}
        <FormField 
          control={form.control} 
          name="has_specific_knowledge_3" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Qtd. C. Específicos-3</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <FormField 
                        control={form.control} 
                        name="specific_knowledge_3_questions" 
                        render={({ field: questionsField }) => (
                          <FormItem className="mt-2">
                            <FormControl>
                              <Input type="number" {...questionsField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )} 
                      />
                      
                      {renderWeightSelect("specific_knowledge_3_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
        
        {/* Discursiva */}
        <FormField 
          control={form.control} 
          name="has_discursive" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Discursiva</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {renderScoreInput("discursive_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
        
        {/* Estudo de Caso 1 */}
        <FormField 
          control={form.control} 
          name="has_case_study_1" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Est. Caso 1</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {renderScoreInput("case_study_1_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
        
        {/* Estudo de Caso 2 */}
        <FormField 
          control={form.control} 
          name="has_case_study_2" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Est. Caso 2</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {renderScoreInput("case_study_2_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
        
        {/* Estudo de Caso 3 */}
        <FormField 
          control={form.control} 
          name="has_case_study_3" 
          render={({ field }) => (
            <FormItem className={`border p-3 rounded-md ${field.value ? 'bg-muted/50' : ''}`}>
              <div className="flex items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange} 
                  />
                </FormControl>
                <div className="space-y-1 leading-none w-full">
                  <FormLabel>Est. Caso 3</FormLabel>
                  {field.value && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {renderScoreInput("case_study_3_weight")}
                    </div>
                  )}
                </div>
              </div>
            </FormItem>
          )} 
        />
      </div>
    </div>
  );
};
