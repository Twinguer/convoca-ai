
import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

const BRAZILIAN_STATES = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará',
  'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
  'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará',
  'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro',
  'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia', 'Roraima',
  'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

interface StateSelectorProps {
  selectedStates: string[];
  onStateChange: (states: string[]) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({ selectedStates, onStateChange }) => {
  const handleStateChange = (state: string) => {
    const updatedStates = selectedStates.includes(state)
      ? selectedStates.filter(s => s !== state)
      : [...selectedStates, state];
    onStateChange(updatedStates);
  };

  return (
    <div className="space-y-4">
      <Label>Localidades</Label>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[300px] overflow-y-auto p-2 border rounded-md">
        {BRAZILIAN_STATES.map((state) => (
          <div key={state} className="flex items-center space-x-2">
            <Checkbox
              id={`state-${state}`}
              checked={selectedStates.includes(state)}
              onCheckedChange={() => handleStateChange(state)}
            />
            <Label htmlFor={`state-${state}`} className="cursor-pointer">
              {state}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};
