
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from '@/components/ui/select';
import { FormField } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';

interface GeneralTabProps {
  form: any;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ form }) => {
  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Concurso</Label>
            <Input 
              id="titulo"
              placeholder="Ex: Concurso INSS 2023"
              {...form.register("titulo")}
            />
            {form.formState.errors.titulo && (
              <p className="text-sm text-red-500">
                {form.formState.errors.titulo.message}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="orgao">Órgão</Label>
            <Input 
              id="orgao"
              placeholder="Ex: INSS, Receita Federal"
              {...form.register("orgao")}
            />
            {form.formState.errors.orgao && (
              <p className="text-sm text-red-500">
                {form.formState.errors.orgao.message}
              </p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea 
            id="descricao"
            placeholder="Descreva o concurso"
            {...form.register("descricao")}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="banca">Banca</Label>
            <Select 
              onValueChange={(value) => form.setValue("banca", value)}
              defaultValue={form.getValues("banca")}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a banca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CEBRASPE">CEBRASPE</SelectItem>
                <SelectItem value="FGV">FGV</SelectItem>
                <SelectItem value="CESPE">CESPE</SelectItem>
                <SelectItem value="VUNESP">VUNESP</SelectItem>
                <SelectItem value="FCC">FCC</SelectItem>
                <SelectItem value="OUTRO">OUTRO</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="vagas">Número de Vagas</Label>
            <Input 
              id="vagas"
              type="number"
              min="0"
              {...form.register("vagas", { valueAsNumber: true })}
            />
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Modalidades de Cotas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="has_ppp"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="has_ppp" 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="has_ppp">PPP (Negros)</Label>
                </div>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_pcd"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="has_pcd" 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="has_pcd">PCD</Label>
                </div>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_hipossuficientes"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="has_hipossuficientes" 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="has_hipossuficientes">Hipossuficientes</Label>
                </div>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_indigenas"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="has_indigenas" 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="has_indigenas">Indígenas</Label>
                </div>
              )}
            />
            
            <FormField
              control={form.control}
              name="has_transsexuais"
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <Switch 
                    id="has_transsexuais" 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="has_transsexuais">Pessoas Trans</Label>
                </div>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GeneralTab;
