import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { ExamStructureSection } from '@/components/Admin/CreateRanking/ExamStructureSection';
import { Plus, Save } from 'lucide-react';

interface GeneralTabProps {
  form: any;
  jobTitles: Array<{ id: string; title: string }>;
  isCustomTitle: boolean;
  isCustomBanca: boolean;
  handleJobTitleChange: (value: string) => void;
  handleCustomTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBancaChange: (value: string) => void;
  handleOrgaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNextTab: () => void;
  onSaveRanking: () => Promise<void>;
  isSubmitting: boolean;
  selectedStates: string[];
  setSelectedStates: (states: string[]) => void;
}

const states = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' },
  { value: 'NA', label: 'Nacional' }
];

export const GeneralTab: React.FC<GeneralTabProps> = ({
  form,
  jobTitles,
  isCustomTitle,
  isCustomBanca,
  handleJobTitleChange,
  handleCustomTitleChange,
  handleBancaChange,
  handleOrgaoChange,
  handleNextTab,
  onSaveRanking,
  isSubmitting,
  selectedStates,
  setSelectedStates
}) => {
  const [selectedState, setSelectedState] = useState<string>('');

  const handleAddState = () => {
    if (selectedState && !selectedStates.includes(selectedState)) {
      setSelectedStates([...selectedStates, selectedState]);
      setSelectedState('');
    }
  };

  const handleRemoveState = (state: string) => {
    setSelectedStates(selectedStates.filter(s => s !== state));
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Informações Básicas</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Job Title */}
            <div>
              <FormField
                control={form.control}
                name="predefined_job_title"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Cargo</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleJobTitleChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o cargo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jobTitles.map((job) => (
                          <SelectItem key={job.id} value={job.title}>
                            {job.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              {isCustomTitle && (
                <FormField
                  control={form.control}
                  name="custom_job_title"
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Cargo Personalizado</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Digite o nome do cargo"
                          onChange={(e) => {
                            field.onChange(e);
                            handleCustomTitleChange(e);
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Orgão */}
            <FormField
              control={form.control}
              name="orgao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Digite o nome do órgão"
                      onChange={(e) => {
                        field.onChange(e);
                        handleOrgaoChange(e);
                      }}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Banca */}
            <FormField
              control={form.control}
              name="banca"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banca</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleBancaChange(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a banca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cebraspe">Cebraspe</SelectItem>
                      <SelectItem value="FGV">FGV</SelectItem>
                      <SelectItem value="VUNESP">VUNESP</SelectItem>
                      <SelectItem value="FCC">FCC</SelectItem>
                      <SelectItem value="FUNDATEC">FUNDATEC</SelectItem>
                      <SelectItem value="OUTRO">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {isCustomBanca && (
              <FormField
                control={form.control}
                name="custom_banca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banca Personalizada</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Digite o nome da banca" />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Date */}
            <FormField
              control={form.control}
              name="data_publicacao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data da Prova</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Stage */}
            <FormField
              control={form.control}
              name="etapa_atual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Etapa</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a etapa" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Prova Objetiva">Prova Objetiva</SelectItem>
                      <SelectItem value="Prova Discursiva">Prova Discursiva</SelectItem>
                      <SelectItem value="Prova de Títulos">Prova de Títulos</SelectItem>
                      <SelectItem value="Teste de Aptidão Física">Teste de Aptidão Física</SelectItem>
                      <SelectItem value="Avaliação Médica">Avaliação Médica</SelectItem>
                      <SelectItem value="Avaliação Psicológica">Avaliação Psicológica</SelectItem>
                      <SelectItem value="Investigação Social">Investigação Social</SelectItem>
                      <SelectItem value="Curso de Formação">Curso de Formação</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Em andamento">Em andamento</SelectItem>
                      <SelectItem value="Concluído">Concluído</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />

            {/* Link */}
            <FormField
              control={form.control}
              name="link"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link do Edital</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Link para o edital ou site do concurso" />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Vagas */}
            <FormField
              control={form.control}
              name="vagas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vagas</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Inscritos */}
            <FormField
              control={form.control}
              name="inscritos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscritos</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Localidades */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Localidades</h3>
          
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Select value={selectedState} onValueChange={setSelectedState}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um estado" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={handleAddState}
            >
              Adicionar
            </Button>
          </div>

          {selectedStates.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-4">
              {selectedStates.map((stateValue) => {
                const state = states.find(s => s.value === stateValue);
                return (
                  <div 
                    key={stateValue}
                    className="bg-secondary text-secondary-foreground px-3 py-1.5 rounded-md flex items-center"
                  >
                    <span>{state?.label || stateValue}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveState(stateValue)}
                      className="ml-2 text-secondary-foreground/70 hover:text-secondary-foreground"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma localidade selecionada.</p>
          )}
        </CardContent>
      </Card>

      {/* Exam Structure */}
      <ExamStructureSection form={form} />

      {/* Cotas */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold mb-4">Cotas</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="has_ampla_concorrencia"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium">
                      Ampla Concorrência
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_ppp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium">
                      PPP
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_pcd"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium">
                      PCD
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_hipossuficientes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium">
                      Hipossuficientes
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_indigenas"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium">
                      Indígenas
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_transsexuais"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel className="text-sm font-medium">
                      Transexuais
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Buttons */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          onClick={onSaveRanking}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : 'Salvar Dados Gerais'}
        </Button>
        <Button
          type="button"
          onClick={handleNextTab}
          disabled={isSubmitting}
          variant="default"
        >
          Próximo: Gabarito Oficial
        </Button>
      </div>
    </div>
  );
};
