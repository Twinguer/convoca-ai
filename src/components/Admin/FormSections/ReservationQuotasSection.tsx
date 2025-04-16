import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormDescription } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormReturn } from 'react-hook-form';
interface ReservationQuotasSectionProps {
  form: UseFormReturn<any>;
}
export const ReservationQuotasSection: React.FC<ReservationQuotasSectionProps> = ({
  form
}) => {
  return <div className="space-y-4">
      <h3 className="text-lg font-medium">Reserva de Vagas</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <FormField control={form.control} name="has_ampla_concorrencia" render={({
        field
      }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Ampla Concorrência
                </FormLabel>
                
              </div>
            </FormItem>} />
        
        <FormField control={form.control} name="has_ppp" render={({
        field
      }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  PPP
                </FormLabel>
                
              </div>
            </FormItem>} />
        
        <FormField control={form.control} name="has_pcd" render={({
        field
      }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  PCD
                </FormLabel>
                
              </div>
            </FormItem>} />
        
        <FormField control={form.control} name="has_hipossuficientes" render={({
        field
      }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Hipossuficientes
                </FormLabel>
                
              </div>
            </FormItem>} />
        
        <FormField control={form.control} name="has_indigenas" render={({
        field
      }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Indígenas
                </FormLabel>
                
              </div>
            </FormItem>} />
        
        <FormField control={form.control} name="has_transsexuais" render={({
        field
      }) => <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  Pessoas Trans
                </FormLabel>
                
              </div>
            </FormItem>} />
      </div>
    </div>;
};