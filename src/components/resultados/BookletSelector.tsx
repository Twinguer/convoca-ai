
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText } from 'lucide-react';

interface ExamBooklet {
  id: string;
  name: string;
  display_order: number;
}

interface BookletSelectorProps {
  booklets: ExamBooklet[];
  selectedBooklet: string;
  onBookletChange: (bookletId: string) => void;
  disabled?: boolean;
}

export const BookletSelector: React.FC<BookletSelectorProps> = ({
  booklets,
  selectedBooklet,
  onBookletChange,
  disabled = false
}) => {
  if (!booklets || booklets.length <= 1) {
    return null; // Não mostra o seletor se há apenas um ou nenhum caderno
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="booklet-select" className="flex items-center gap-2 text-sm font-medium">
        <FileText className="h-4 w-4" />
        Caderno da Prova *
      </Label>
      <Select 
        value={selectedBooklet} 
        onValueChange={onBookletChange}
        disabled={disabled}
      >
        <SelectTrigger id="booklet-select">
          <SelectValue placeholder="Selecione o caderno da sua prova" />
        </SelectTrigger>
        <SelectContent>
          {booklets.map((booklet) => (
            <SelectItem key={booklet.id} value={booklet.id}>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{booklet.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Selecione o caderno correspondente à sua prova. Esta informação é importante para 
        comparar suas respostas com o gabarito correto.
      </p>
    </div>
  );
};
