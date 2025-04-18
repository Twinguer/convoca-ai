
import React from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BRAZILIAN_STATES = [
  { name: 'Acre', abbr: 'AC' },
  { name: 'Alagoas', abbr: 'AL' },
  { name: 'Amapá', abbr: 'AP' },
  { name: 'Amazonas', abbr: 'AM' },
  { name: 'Bahia', abbr: 'BA' },
  { name: 'Ceará', abbr: 'CE' },
  { name: 'Distrito Federal', abbr: 'DF' },
  { name: 'Espírito Santo', abbr: 'ES' },
  { name: 'Goiás', abbr: 'GO' },
  { name: 'Maranhão', abbr: 'MA' },
  { name: 'Mato Grosso', abbr: 'MT' },
  { name: 'Mato Grosso do Sul', abbr: 'MS' },
  { name: 'Minas Gerais', abbr: 'MG' },
  { name: 'Pará', abbr: 'PA' },
  { name: 'Paraíba', abbr: 'PB' },
  { name: 'Paraná', abbr: 'PR' },
  { name: 'Pernambuco', abbr: 'PE' },
  { name: 'Piauí', abbr: 'PI' },
  { name: 'Rio de Janeiro', abbr: 'RJ' },
  { name: 'Rio Grande do Norte', abbr: 'RN' },
  { name: 'Rio Grande do Sul', abbr: 'RS' },
  { name: 'Rondônia', abbr: 'RO' },
  { name: 'Roraima', abbr: 'RR' },
  { name: 'Santa Catarina', abbr: 'SC' },
  { name: 'São Paulo', abbr: 'SP' },
  { name: 'Sergipe', abbr: 'SE' },
  { name: 'Tocantins', abbr: 'TO' },
  { name: 'Nacional', abbr: 'Nacional' }
];

interface StateSelectorProps {
  selectedStates: string[];
  onStateChange: (states: string[]) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({ selectedStates, onStateChange }) => {
  const handleStateChange = (state: string) => {
    if (state === 'Nacional') {
      onStateChange(['Nacional']);
      return;
    }
    
    const newStates = selectedStates.includes(state)
      ? selectedStates.filter(s => s !== state)
      : [...selectedStates.filter(s => s !== 'Nacional'), state];
      
    onStateChange(newStates);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label>Localidades</Label>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Selecione as Localidades</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
              {BRAZILIAN_STATES.map((state) => (
                <div key={state.abbr} className="flex items-center space-x-2">
                  <Checkbox
                    id={`state-${state.abbr}`}
                    checked={selectedStates.includes(state.abbr)}
                    onCheckedChange={() => handleStateChange(state.abbr)}
                  />
                  <Label htmlFor={`state-${state.abbr}`} className="cursor-pointer">
                    {state.abbr}
                  </Label>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      {selectedStates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedStates.map((state) => (
            <Badge 
              key={state} 
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleStateChange(state)}
            >
              {state} ×
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
