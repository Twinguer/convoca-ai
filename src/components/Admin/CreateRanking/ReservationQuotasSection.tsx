
import React from 'react';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface ReservationQuotasSectionProps {
  form: any;
}

export const ReservationQuotasSection: React.FC<ReservationQuotasSectionProps> = ({ form }) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Cotas de Reserva</h3>
        
        <div className="space-y-2">
          <FormField
            control={form.control}
            name="has_ampla_concorrencia"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Ampla Concorrência</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_ppp"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">PPP (Pessoas Pretas e Pardas)</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_pcd"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">PCD (Pessoas com Deficiência)</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_hiposuficientes"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Hipossuficientes</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_indigenas"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Indígenas</FormLabel>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="has_trans"
            render={({ field }) => (
              <FormItem className="flex items-center space-x-2">
                <FormControl>
                  <Checkbox 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="text-sm font-normal">Pessoas Trans</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
};
