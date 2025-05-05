import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from "@/components/ui/textarea"
import { UseFormReturn } from 'react-hook-form';
import { ExamStructureSection } from './ExamStructureSection';
import { StateSelector } from './StateSelector';

interface GeneralTabProps {
  form: UseFormReturn<any>;
  jobTitles: { id: string; title: string }[];
  isCustomTitle: boolean;
  isCustomBanca: boolean;
  handleJobTitleChange: (value: string) => void;
  handleCustomTitleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBancaChange: (value: string) => void;
  handleOrgaoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNextTab: () => void;
  onSaveRanking: () => void;
  isSubmitting: boolean;
  selectedStates: string[];
  setSelectedStates: React.Dispatch<React.SetStateAction<string[]>>;
}

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
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Predefined Job Title */}
            <FormField
              control={form.control}
              name="predefined_job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo</FormLabel>
                  <Select onValueChange={(value) => {
                      field.onChange(value);
                      handleJobTitleChange(value);
                    }} defaultValue={field.value}>
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
                      <SelectItem value="OUTRO">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o cargo ou escolha "Outro" para inserir um
                    cargo não listado
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Custom Job Title */}
            {isCustomTitle && (
              <FormField
                control={form.control}
                name="custom_job_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cargo (Outro)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o cargo"
                        {...field}
                        onChange={handleCustomTitleChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Informe o nome do cargo caso não encontre na lista
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            {/* Organ */}
            <FormField
              control={form.control}
              name="orgao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Órgão</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Informe o nome do órgão"
                      {...field}
                      onChange={handleOrgaoChange}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o nome do órgão responsável pelo concurso
                  </FormDescription>
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
                    onValueChange={(value) => {
                      field.onChange(value);
                      handleBancaChange(value);
                    }}
                    defaultValue={field.value}
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
                  <FormDescription>
                    Selecione a banca organizadora do concurso
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Custom Banca */}
            {isCustomBanca && (
              <FormField
                control={form.control}
                name="custom_banca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Banca (Outra)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o nome da banca"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Informe o nome da banca caso não encontre na lista
                    </FormDescription>
                  </FormItem>
                )}
              />
            )}

            {/* Publication Date */}
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
                    Informe a data de publicação do edital
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Current Stage */}
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
                      <SelectItem value="Edital Aberto">Edital Aberto</SelectItem>
                      <SelectItem value="Prova Objetiva">Prova Objetiva</SelectItem>
                      <SelectItem value="Prova Discursiva">Prova Discursiva</SelectItem>
                      <SelectItem value="Prova de Títulos">Prova de Títulos</SelectItem>
                      <SelectItem value="TAF">TAF</SelectItem>
                      <SelectItem value="Curso de Formação">Curso de Formação</SelectItem>
                      <SelectItem value="Homologação">Homologação</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione a etapa atual do concurso
                  </FormDescription>
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
                      <SelectItem value="Finalizado">Finalizado</SelectItem>
                      <SelectItem value="Previsto">Previsto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o status atual do concurso
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Vacancies */}
            <FormField
              control={form.control}
              name="vagas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vagas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Informe o número de vagas"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o número de vagas disponíveis
                  </FormDescription>
                </FormItem>
              )}
            />

            {/* Subscribers */}
            <FormField
              control={form.control}
              name="inscritos"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscritos</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Informe o número de inscritos"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o número de inscritos no concurso
                  </FormDescription>
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
                    <Input
                      placeholder="Informe o link do edital"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Informe o link para o edital do concurso
                  </FormDescription>
                </FormItem>
              )}
            />
            
            {/* Localidades */}
            <FormField
              control={form.control}
              name="localidades"
              render={() => (
                <FormItem>
                  <FormLabel>Localidades</FormLabel>
                  <FormControl>
                    <StateSelector
                      selectedStates={selectedStates}
                      setSelectedStates={setSelectedStates}
                    />
                  </FormControl>
                  <FormDescription>
                    Selecione as localidades do concurso
                  </FormDescription>
                </FormItem>
              )}
            />
          </div>
          
          {/* Reservation Types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="has_ampla_concorrencia"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      Ampla Concorrência
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Candidatos da ampla concorrência
                    </FormDescription>
                  </div>
                  <FormControl>
                    
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_ppp"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      PPP
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Candidatos que se autodeclaram pretos, pardos ou
                      indígenas
                    </FormDescription>
                  </div>
                  <FormControl>
                    
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_pcd"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      PCD
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Pessoas com deficiência
                    </FormDescription>
                  </div>
                  <FormControl>
                    
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_hipossuficientes"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      Hipossuficientes
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Candidatos de baixa renda
                    </FormDescription>
                  </div>
                  <FormControl>
                    
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_indigenas"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      Indígenas
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Candidatos indígenas
                    </FormDescription>
                  </div>
                  <FormControl>
                    
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_transsexuais"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-sm">
                      Pessoas Trans
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Candidatos transsexuais
                    </FormDescription>
                  </div>
                  <FormControl>
                    
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Exam Structure Section */}
      <ExamStructureSection form={form} />

      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          onClick={onSaveRanking}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar e Continuar"}
        </button>
      </div>
    </div>
  );
};
