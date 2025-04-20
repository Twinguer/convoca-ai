
import React from 'react';
import { FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { MapPin } from 'lucide-react';

interface StateSelectorProps {
  form: any;
  selectedStates: string[];
  setSelectedStates: React.Dispatch<React.SetStateAction<string[]>>;
}

const ESTADOS_BRASILEIROS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export const StateSelector: React.FC<StateSelectorProps> = ({
  form,
  selectedStates,
  setSelectedStates
}) => {
  const handleStateSelection = (estado: string) => {
    setSelectedStates(prev => {
      if (prev.includes(estado)) {
        return prev.filter(s => s !== estado);
      }
      return [...prev, estado];
    });
  };

  return (
    <FormItem>
      <FormLabel>Localidade</FormLabel>
      <div className="flex flex-wrap gap-2">
        {selectedStates.map(estado => (
          <div key={estado} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
            {estado}
          </div>
        ))}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <MapPin className="h-4 w-4" />
              {selectedStates.length > 0 ? "Editar Estados" : "Adicionar Estados"}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Selecione os Estados</AlertDialogTitle>
              <AlertDialogDescription>
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {ESTADOS_BRASILEIROS.map(estado => (
                    <div key={estado} className="flex items-center space-x-2">
                      <Checkbox
                        id={estado}
                        checked={selectedStates.includes(estado)}
                        onCheckedChange={() => handleStateSelection(estado)}
                      />
                      <label htmlFor={estado} className="text-sm font-medium leading-none cursor-pointer">
                        {estado}
                      </label>
                    </div>
                  ))}
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Fechar</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </FormItem>
  );
};
