import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { StateSelector } from '../FormSections/StateSelector';
interface BasicInfoSectionProps {
  form: any;
  jobTitles: Array<{
    id: string;
    title: string;
  }>;
  isCustomTitle: boolean;
  isCustomBanca: boolean;
  handleJobTitleChange: (value: string) => void;
  handleCustomTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBancaChange: (value: string) => void;
  handleOrgaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedStates: string[];
  setSelectedStates: React.Dispatch<React.SetStateAction<string[]>>;
}
export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  form,
  jobTitles,
  isCustomTitle,
  isCustomBanca,
  handleJobTitleChange,
  handleCustomTitleChange,
  handleBancaChange,
  handleOrgaoChange,
  selectedStates,
  setSelectedStates
}) => {
  return <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Informações Gerais</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Cargo */}
          <div>
            <FormField control={form.control} name="predefined_job_title" render={({
            field
          }) => <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select value={field.value} onValueChange={value => {
              field.onChange(value);
              handleJobTitleChange(value);
            }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cargo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {jobTitles.filter(job => job.title !== 'OUTRO').sort((a, b) => a.title.localeCompare(b.title)).map(job => <SelectItem key={job.id} value={job.title}>
                            {job.title}
                          </SelectItem>)}
                      <SelectItem value="OUTRO">OUTRO</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>} />
            
            {isCustomTitle && <FormField control={form.control} name="custom_job_title" render={({
            field
          }) => <FormItem className="mt-2">
                    <FormLabel>Cargo personalizado</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Digite o cargo" 
                        maxLength={20}
                        onChange={e => {
                const up = e.target.value.toUpperCase().slice(0, 20);
                field.onChange(up);
                handleCustomTitleChange({
                  ...e,
                  target: {
                    ...e.target,
                    value: up
                  }
                });
              }} />
                    </FormControl>
                  </FormItem>} />}
          </div>
          
          {/* Órgão */}
          <FormField control={form.control} name="orgao" render={({
          field
        }) => <FormItem>
                <FormLabel>Órgão</FormLabel>
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="Ex: MINISTÉRIO DA ECONOMIA" 
                    maxLength={20}
                    onChange={e => {
              const up = e.target.value.toUpperCase().slice(0, 20);
              field.onChange(up);
              handleOrgaoChange({
                ...e,
                target: {
                  ...e.target,
                  value: up
                }
              });
            }} />
                </FormControl>
              </FormItem>} />
          
          {/* Localidade */}
          <div className="col-span-2">
            <StateSelector form={form} selectedStates={selectedStates} setSelectedStates={setSelectedStates} />
          </div>
          
          {/* Banca */}
          <div>
            <FormField control={form.control} name="banca" render={({
            field
          }) => <FormItem>
                  <FormLabel>Banca</FormLabel>
                  <Select value={field.value} onValueChange={value => {
              field.onChange(value);
              handleBancaChange(value);
            }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma banca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Cebraspe">Cebraspe</SelectItem>
                      <SelectItem value="FGV">FGV</SelectItem>
                      <SelectItem value="VUNESP">VUNESP</SelectItem>
                      <SelectItem value="FCC">FCC</SelectItem>
                      <SelectItem value="FUNDATEC">FUNDATEC</SelectItem>
                      <SelectItem value="OUTRO">Outro (especificar)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>} />
            
            {isCustomBanca && <FormField control={form.control} name="custom_banca" render={({
            field
          }) => <FormItem className="mt-2">
                    <FormLabel>Banca personalizada</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Digite o nome da banca" 
                        maxLength={20}
                        onChange={e => {
                          const value = e.target.value.toUpperCase().slice(0, 20);
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                  </FormItem>} />}
          </div>
          
          {/* Data da Prova */}
          <FormField control={form.control} name="created_at" render={({
          field
        }) => <FormItem>
                <FormLabel>Data da Prova</FormLabel>
                <FormControl>
                  <Input 
                    type="date" 
                    value={field.value || ''} 
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
              </FormItem>} />
          
          {/* Status do Concurso */}
          <FormField control={form.control} name="status" render={({
          field
        }) => <FormItem>
                <FormLabel>Status do Concurso</FormLabel>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Em andamento">Em andamento</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                    <SelectItem value="Suspenso">Suspenso</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>} />
          
          {/* Etapa Atual */}
          <FormField control={form.control} name="etapa_atual" render={({
          field
        }) => <FormItem>
                <FormLabel>Etapa Atual</FormLabel>
                <Select value={field.value || ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a etapa" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Inscrições">Inscrições</SelectItem>
                    <SelectItem value="Prova Objetiva">Prova Objetiva</SelectItem>
                    <SelectItem value="Prova Discursiva">Prova Discursiva</SelectItem>
                    <SelectItem value="Avaliação de Títulos">Avaliação de Títulos</SelectItem>
                    <SelectItem value="Curso de Formação">Curso de Formação</SelectItem>
                    <SelectItem value="Resultado Final">Resultado Final</SelectItem>
                    <SelectItem value="Nomeação">Nomeação</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>} />
          
          {/* Link do Edital */}
          <FormField control={form.control} name="link" render={({
          field
        }) => <FormItem>
                <FormLabel>Link do Edital</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="https://..." />
                </FormControl>
              </FormItem>} />
          
          {/* Vagas */}
          <FormField control={form.control} name="vagas" render={({
          field
        }) => <FormItem>
                <FormLabel>Quantidade de Vagas</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    min="0" 
                    max="999999"
                    maxLength={6}
                    onChange={e => {
                      const value = e.target.value;
                      if (value.length <= 6 && !isNaN(Number(value)) && Number(value) <= 999999) {
                        field.onChange(Number(value));
                      }
                    }} 
                  />
                </FormControl>
              </FormItem>} />
          
          {/* Inscritos */}
          <FormField control={form.control} name="inscritos" render={({
          field
        }) => <FormItem>
                <FormLabel>Quantidade de Inscritos</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    min="0" 
                    max="999999"
                    maxLength={6}
                    onChange={e => {
                      const value = e.target.value;
                      if (value.length <= 6 && !isNaN(Number(value)) && Number(value) <= 999999) {
                        field.onChange(Number(value));
                      }
                    }} 
                  />
                </FormControl>
              </FormItem>} />
        </div>
      </CardContent>
    </Card>;
};