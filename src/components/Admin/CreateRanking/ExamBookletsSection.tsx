
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ExamBooklet {
  id?: string;
  name: string;
  display_order: number;
}

interface ExamBookletsSectionProps {
  concursoId?: string;
  onBookletsChange?: (booklets: ExamBooklet[]) => void;
}

export const ExamBookletsSection: React.FC<ExamBookletsSectionProps> = ({
  concursoId,
  onBookletsChange
}) => {
  const [booklets, setBooklets] = useState<ExamBooklet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Carregar cadernos existentes se houver um concursoId
  useEffect(() => {
    if (concursoId) {
      loadExistingBooklets();
    }
  }, [concursoId]);

  const loadExistingBooklets = async () => {
    if (!concursoId) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase.rpc('manage_exam_booklets', {
        p_operation: 'GET',
        p_concurso_id: concursoId
      });

      if (error) throw error;
      
      if (data?.booklets && data.booklets.length > 0) {
        setBooklets(data.booklets);
      }
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addBooklet = () => {
    if (booklets.length >= 10) {
      toast({
        title: "Limite atingido",
        description: "Máximo de 10 cadernos permitidos por concurso",
        variant: "destructive"
      });
      return;
    }

    const newBooklet: ExamBooklet = {
      name: '',
      display_order: booklets.length + 1
    };
    
    const updatedBooklets = [...booklets, newBooklet];
    setBooklets(updatedBooklets);
    onBookletsChange?.(updatedBooklets);
  };

  const removeBooklet = (index: number) => {
    const updatedBooklets = booklets
      .filter((_, i) => i !== index)
      .map((booklet, i) => ({ ...booklet, display_order: i + 1 }));
    
    setBooklets(updatedBooklets);
    onBookletsChange?.(updatedBooklets);
  };

  const updateBookletName = (index: number, name: string) => {
    const upperName = name.toUpperCase();
    const updatedBooklets = booklets.map((booklet, i) => 
      i === index ? { ...booklet, name: upperName } : booklet
    );
    
    setBooklets(updatedBooklets);
    onBookletsChange?.(updatedBooklets);
  };

  const validateBooklets = () => {
    // Verificar nomes únicos e não vazios
    const names = booklets.map(b => b.name.trim()).filter(n => n);
    const uniqueNames = new Set(names);
    
    if (names.length !== booklets.length) {
      return "Todos os cadernos devem ter um nome preenchido";
    }
    
    if (names.length !== uniqueNames.size) {
      return "Nomes dos cadernos devem ser únicos";
    }
    
    return null;
  };

  const saveBooklets = async () => {
    if (!concursoId) {
      toast({
        title: "Erro",
        description: "ID do concurso não encontrado",
        variant: "destructive"
      });
      return false;
    }

    const validationError = validateBooklets();
    if (validationError) {
      toast({
        title: "Erro de validação",
        description: validationError,
        variant: "destructive"
      });
      return false;
    }

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.rpc('manage_exam_booklets', {
        p_operation: 'UPDATE',
        p_concurso_id: concursoId,
        p_booklets: booklets
      });

      if (error) throw error;
      
      if (data?.success) {
        toast({
          title: "Cadernos salvos",
          description: `${booklets.length} caderno(s) configurado(s) com sucesso`
        });
        return true;
      } else {
        throw new Error(data?.error || 'Erro ao salvar cadernos');
      }
    } catch (error: any) {
      console.error('Erro ao salvar cadernos:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar os cadernos",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cadernos de Prova
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure diferentes cadernos de prova para este concurso. Cada caderno terá seu próprio gabarito.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {booklets.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum caderno configurado</p>
            <p className="text-xs">Clique em "Adicionar Caderno" para começar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {booklets.map((booklet, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`booklet-${index}`} className="text-sm">
                    Caderno {index + 1}
                  </Label>
                  <Input
                    id={`booklet-${index}`}
                    value={booklet.name}
                    onChange={(e) => updateBookletName(index, e.target.value)}
                    placeholder="Nome do caderno (ex: BRANCO, AZUL, A, B...)"
                    className="mt-1"
                    maxLength={20}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeBooklet(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={addBooklet}
            disabled={booklets.length >= 10}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Caderno
          </Button>
          
          {booklets.length > 0 && (
            <Button
              type="button"
              onClick={saveBooklets}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isLoading ? 'Salvando...' : 'Salvar Cadernos'}
            </Button>
          )}
        </div>

        {booklets.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            <p>• Máximo de 10 cadernos por concurso</p>
            <p>• Nomes são convertidos automaticamente para maiúsculas</p>
            <p>• Cada caderno terá seu próprio gabarito oficial</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Adicionar import do supabase
import { supabase } from '@/integrations/supabase/client';
