
import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StateSelectorProps {
  selectedStates: string[];
  setSelectedStates: (states: string[]) => void;
  onStateChange?: (states: string[]) => void; // Adicionando esta prop opcional para compatibilidade
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  selectedStates,
  setSelectedStates,
  onStateChange
}) => {
  const STATES = [
    'Nacional',
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  // Handler para mudanças no checkbox
  const handleStateChange = (state: string, checked: boolean) => {
    let newStates: string[];
    
    if (state === 'Nacional' && checked) {
      // Se "Nacional" for selecionado, desselecione todos os outros estados
      newStates = ['Nacional'];
    } else if (checked) {
      // Se "Nacional" já estava selecionado e outro estado foi agora selecionado,
      // remova "Nacional" e adicione o novo estado
      if (selectedStates.includes('Nacional')) {
        newStates = [state];
      } else {
        newStates = [...selectedStates, state];
      }
    } else {
      // Se um estado for desselecionado, remova-o do array
      newStates = selectedStates.filter(s => s !== state);
    }
    
    setSelectedStates(newStates);
    
    // Chama o callback onStateChange se estiver definido
    if (onStateChange) {
      onStateChange(newStates);
    }
  };
  
  const selectAll = () => {
    const allStates = STATES.filter(state => state !== 'Nacional');
    setSelectedStates(allStates);
    if (onStateChange) {
      onStateChange(allStates);
    }
  };
  
  const clearAll = () => {
    setSelectedStates([]);
    if (onStateChange) {
      onStateChange([]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between mb-2">
        <Label className="text-base">Localidades</Label>
        <div className="space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={selectAll}
          >
            Todas
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={clearAll}
          >
            Limpar
          </Button>
        </div>
      </div>
      
      <ScrollArea className="h-[200px] rounded-md border p-4">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {STATES.map((state) => (
            <div key={state} className="flex items-center space-x-2">
              <Checkbox 
                id={`state-${state}`} 
                checked={selectedStates.includes(state)}
                onCheckedChange={(checked) => 
                  handleStateChange(state, checked as boolean)
                }
              />
              <Label 
                htmlFor={`state-${state}`}
                className="text-sm cursor-pointer"
              >
                {state}
              </Label>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {selectedStates.length > 0 && (
        <div className="mt-2">
          <p className="text-sm text-muted-foreground">
            {selectedStates.includes('Nacional') ? 
              'Nacional' : 
              `${selectedStates.length} localidade(s) selecionada(s)`}
          </p>
        </div>
      )}
    </div>
  );
};

export default StateSelector;
