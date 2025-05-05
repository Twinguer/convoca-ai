import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { StateSelector } from '@/components/Admin/FormSections/StateSelector';

interface BasicInfoSectionProps {
  form: any;
  jobTitles: { id: string; title: string }[];
  isCustomTitle: boolean;
  isCustomBanca: boolean;
  handleJobTitleChange: (value: string) => void;
  handleCustomTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBancaChange: (value: string) => void;
  handleOrgaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedStates: string[];
  setSelectedStates: (states: string[]) => void;
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
  const handleCustomBancaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    form.setValue('banca', e.target.value.toUpperCase());
  };
  
  return (
    <div className="space-y-4">
      {/* Título do Cargo */}
      <FormField
        control={form.control}
        name="predefined_job_title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título do Cargo</FormLabel>
            <Select onValueChange={(value) => {
              field.onChange(value);
              handleJobTitleChange(value);
            }}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cargo" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {jobTitles.map((jobTitle) => (
                  <SelectItem key={jobTitle.id} value={jobTitle.title}>
                    {jobTitle.title}
                  </SelectItem>
                ))}
                <SelectItem value="OUTRO">Outro</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Selecione o título do cargo ou escolha "Outro" para inserir um título personalizado.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {isCustomTitle && (
        <FormField
          control={form.control}
          name="custom_job_title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título do Cargo Personalizado</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Digite o título do cargo" 
                  {...field} 
                  onChange={handleCustomTitleChange}
                />
              </FormControl>
              <FormDescription>
                Insira o título do cargo desejado.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      {/* Órgão */}
      <FormField
        control={form.control}
        name="orgao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Órgão</FormLabel>
            <FormControl>
              <Input placeholder="Nome do órgão" {...field} onChange={handleOrgaoChange} />
            </FormControl>
            <FormDescription>
              Nome do órgão responsável pelo concurso.
            </FormDescription>
            <FormMessage />
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
            <Select onValueChange={(value) => {
              field.onChange(value);
              handleBancaChange(value);
            }}>
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
            <FormDescription>
              Selecione a banca organizadora do concurso ou escolha "Outra" para inserir uma banca personalizada.
            </FormDescription>
            <FormMessage />
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
                <Input 
                  placeholder="Digite o nome da banca" 
                  {...field} 
                  onChange={handleCustomBancaChange}
                />
              </FormControl>
              <FormDescription>
                Insira o nome da banca organizadora do concurso.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      
      {/* Data de Publicação */}
      <FormField
        control={form.control}
        name="data_publicacao"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Data de Publicação</FormLabel>
            <FormControl>
              <Input type="date" {...field} />
            </FormControl>
            <FormDescription>
              Data em que o edital foi publicado.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Etapa Atual */}
      <FormField
        control={form.control}
        name="etapa_atual"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Etapa Atual</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a etapa" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Prova Objetiva">Prova Objetiva</SelectItem>
                <SelectItem value="Prova Discursiva">Prova Discursiva</SelectItem>
                <SelectItem value="Prova de Títulos">Prova de Títulos</SelectItem>
                <SelectItem value="TAF">TAF (Teste de Aptidão Física)</SelectItem>
                <SelectItem value="Investigação Social">Investigação Social</SelectItem>
                <SelectItem value="Curso de Formação">Curso de Formação</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Selecione a etapa atual do concurso.
            </FormDescription>
            <FormMessage />
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
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Publicado">Publicado</SelectItem>
                <SelectItem value="Finalizado">Finalizado</SelectItem>
                <SelectItem value="Previsto">Previsto</SelectItem>
              </SelectContent>
            </Select>
            <FormDescription>
              Selecione o status atual do concurso.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Link */}
      <FormField
        control={form.control}
        name="link"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Link</FormLabel>
            <FormControl>
              <Input placeholder="Link para o edital" {...field} />
            </FormControl>
            <FormDescription>
              Link para o edital do concurso.
            </FormDescription>
            <FormMessage />
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
              <Input type="number" placeholder="Número de vagas" {...field} />
            </FormControl>
            <FormDescription>
              Número de vagas disponíveis no concurso.
            </FormDescription>
            <FormMessage />
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
              <Input type="number" placeholder="Número de inscritos" {...field} />
            </FormControl>
            <FormDescription>
              Número de inscritos no concurso.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Localidades */}
      <div className="space-y-2">
        <StateSelector
          selectedStates={selectedStates}
          setSelectedStates={setSelectedStates}
        />
      </div>
    </div>
  );
};
