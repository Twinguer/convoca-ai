
import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

// Mapeamento de estados e siglas
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
  { name: 'Nacional', abbr: 'Nacional' }, // Colocamos Nacional por último, conforme solicitado
];

interface StateSelectorProps {
  selectedStates: string[];
  onStateChange: (states: string[]) => void;
}

export const StateSelector: React.FC<StateSelectorProps> = ({ selectedStates, onStateChange }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [tempSelectedStates, setTempSelectedStates] = useState<string[]>(selectedStates);

  const handleStateClick = (state: string) => {
    if (state === 'Nacional') {
      // Se Nacional for selecionado, limpa todas outras seleções
      setTempSelectedStates(['Nacional']);
    } else {
      // Se outro estado for selecionado, remove Nacional se estiver presente
      const newSelection = tempSelectedStates.includes(state)
        ? tempSelectedStates.filter(s => s !== state)
        : [...tempSelectedStates.filter(s => s !== 'Nacional'), state];
      setTempSelectedStates(newSelection);
    }
  };

  const handleSave = () => {
    onStateChange(tempSelectedStates);
    setIsDialogOpen(false);
  };

  const handleDialogOpen = (open: boolean) => {
    if (open) {
      setTempSelectedStates([...selectedStates]);
    }
    setIsDialogOpen(open);
  };

  const getStateDisplay = () => {
    if (selectedStates.length === 0) {
      return <Badge variant="outline" className="text-muted-foreground">Selecione ao menos uma localidade</Badge>;
    }

    if (selectedStates.includes('Nacional')) {
      return <Badge>Nacional</Badge>;
    }

    if (selectedStates.length <= 3) {
      return selectedStates.map((state, index) => (
        <Badge key={state} className="mr-1">{state}</Badge>
      ));
    }

    return (
      <>
        {selectedStates.slice(0, 2).map((state) => (
          <Badge key={state} className="mr-1">{state}</Badge>
        ))}
        <Badge variant="secondary">+{selectedStates.length - 2} localidades</Badge>
      </>
    );
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="localidades">Localidades</Label>
      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1 min-h-10 p-2 border rounded-md flex-1">
          {getStateDisplay()}
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-10">
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Selecionar Localidades</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-3 gap-2">
                {BRAZILIAN_STATES.map(({ name, abbr }) => (
                  <Button
                    key={abbr}
                    variant="outline"
                    size="sm"
                    className={`justify-start ${tempSelectedStates.includes(abbr) ? 'bg-primary/10' : ''}`}
                    onClick={() => handleStateClick(abbr)}
                  >
                    {tempSelectedStates.includes(abbr) && (
                      <Check className="h-4 w-4 mr-1" />
                    )}
                    {abbr === 'Nacional' ? abbr : `${abbr} - ${name}`}
                  </Button>
                ))}
              </div>
            </ScrollArea>
            <div className="flex justify-end mt-4">
              <Button onClick={handleSave} disabled={tempSelectedStates.length === 0}>
                Confirmar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};
