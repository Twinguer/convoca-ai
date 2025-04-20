
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StateSelectorProps {
  selectedStates: string[];
  onStateChange: (states: string[]) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  selectedStates,
  onStateChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localStates, setLocalStates] = useState<string[]>(selectedStates);

  const states = [
    { value: 'Nacional', label: 'Nacional' },
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
  ];

  const handleStateToggle = (state: string) => {
    setLocalStates(current => {
      const newStates = current.includes(state)
        ? current.filter(s => s !== state)
        : [...current, state];
      
      // Se "Nacional" foi selecionado, limpar outros estados
      if (state === 'Nacional' && !current.includes('Nacional')) {
        return ['Nacional'];
      }
      
      // Se outro estado foi selecionado, remover "Nacional"
      if (state !== 'Nacional') {
        return newStates.filter(s => s !== 'Nacional');
      }
      
      return newStates;
    });
  };

  const handleSave = () => {
    onStateChange(localStates);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label>Localidades</Label>
      <div className="flex flex-wrap gap-2">
        {selectedStates.map(state => (
          <div key={state} className="bg-secondary text-secondary-foreground px-2 py-1 rounded-md text-sm">
            {state}
          </div>
        ))}
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecione as Localidades</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {states.map(state => (
                  <div key={state.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={state.value}
                      checked={localStates.includes(state.value)}
                      onCheckedChange={() => handleStateToggle(state.value)}
                    />
                    <Label htmlFor={state.value}>{state.label}</Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSave}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
