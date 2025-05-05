
import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StateSelectorProps {
  selectedStates: string[];
  setSelectedStates: (states: string[]) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({
  selectedStates,
  setSelectedStates
}) => {
  const STATES = [
    'Nacional',
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO',
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI',
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  // Handler for checkbox changes
  const handleStateChange = (state: string, checked: boolean) => {
    if (state === 'Nacional' && checked) {
      // If "Nacional" is selected, deselect all other states
      setSelectedStates(['Nacional']);
    } else if (checked) {
      // If "Nacional" was already selected and another state is now selected,
      // remove "Nacional" and add the new state
      if (selectedStates.includes('Nacional')) {
        setSelectedStates([state]);
      } else {
        setSelectedStates([...selectedStates, state]);
      }
    } else {
      // If a state is deselected, remove it from the array
      setSelectedStates(selectedStates.filter(s => s !== state));
    }
  };
  
  const selectAll = () => {
    setSelectedStates(STATES.filter(state => state !== 'Nacional'));
  };
  
  const clearAll = () => {
    setSelectedStates([]);
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
