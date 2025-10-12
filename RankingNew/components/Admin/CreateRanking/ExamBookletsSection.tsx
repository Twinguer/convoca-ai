import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, FileText, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
interface ExamBooklet {
  id?: string;
  name: string;
  display_order: number;
}
interface ExamBookletsSectionProps {
  concursoId?: string;
  onBookletsChange?: (booklets: ExamBooklet[]) => void;
  onBookletsSaved?: (saved: boolean) => void;
}
// Export saveBooklets functionality
export const useBookletsSave = (
  concursoId: string | undefined,
  booklets: ExamBooklet[],
  validateBooklets: () => string | null,
  onSuccess: (savedBooklets: ExamBooklet[]) => void,
  onError: (error: string) => void
) => {
  const saveBooklets = async () => {
    const validationError = validateBooklets();
    if (validationError) {
      onError(validationError);
      return false;
    }

    if (!concursoId) {
      onError("Salve primeiro as informações básicas do ranking antes de configurar os cadernos.");
      return false;
    }

    try {
      // Processar cadernos para JSONB
      const processedBooklets = booklets.map((booklet, index) => ({
        id: booklet.id || crypto.randomUUID(),
        name: booklet.name,
        display_order: booklet.display_order || index + 1,
        is_active: true,
        total_questions: 0
      }));

      // Atualizar a coluna exam_booklets na tabela concursos
      const { error: updateError } = await supabase
        .from('concursos')
        .update({ exam_booklets: processedBooklets })
        .eq('id', concursoId);

      if (updateError) throw updateError;

      onSuccess(processedBooklets);
      return true;
    } catch (error: any) {
      onError(error.message || "Não foi possível salvar os cadernos");
      return false;
    }
  };

  return { saveBooklets };
};

export const ExamBookletsSection: React.FC<ExamBookletsSectionProps> = ({
  concursoId,
  onBookletsChange,
  onBookletsSaved
}) => {
  const [booklets, setBooklets] = useState<ExamBooklet[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBookletsSaved, setIsBookletsSaved] = useState(false);
  const {
    toast
  } = useToast();

  // Carregar cadernos existentes sempre que o concursoId mudar
  useEffect(() => {
    if (concursoId) {
      loadExistingBooklets();
    } else {
      // Se não há concursoId, inicializar com um caderno padrão se estiver vazio
      if (booklets.length === 0) {
        setBooklets([{
          name: '',
          display_order: 1
        }]);
      }
      setIsBookletsSaved(false);
      setHasUnsavedChanges(booklets.length > 0);
    }
  }, [concursoId]);
  const loadExistingBooklets = async () => {
    if (!concursoId) return;
    try {
      setIsLoading(true);
      console.log('Carregando cadernos para concurso:', concursoId);
      const { data, error } = await supabase
        .from('concursos')
        .select('exam_booklets')
        .eq('id', concursoId)
        .single();
      
      if (error) {
        console.error('Erro ao carregar cadernos:', error);
        throw error;
      }
      
      const booklets = data?.exam_booklets || [];
      console.log('Cadernos carregados:', booklets);
      if (booklets && booklets.length > 0) {
        setBooklets(booklets);
        setHasUnsavedChanges(false);
        setIsBookletsSaved(true);
        onBookletsChange?.(booklets);
        onBookletsSaved?.(true);
      } else {
        // Se não há cadernos salvos, inicializar com um caderno padrão
        const defaultBooklet = [{
          name: '',
          display_order: 1
        }];
        setBooklets(defaultBooklet);
        setIsBookletsSaved(false);
        setHasUnsavedChanges(true);
        onBookletsSaved?.(false);
      }
    } catch (error) {
      console.error('Erro ao carregar cadernos:', error);
      toast({
        title: "Erro ao carregar cadernos",
        description: "Não foi possível carregar os cadernos existentes",
        variant: "destructive"
      });
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
    setHasUnsavedChanges(true);
    setIsBookletsSaved(false);
    onBookletsChange?.(updatedBooklets);
    onBookletsSaved?.(false);
  };
  const removeBooklet = (index: number) => {
    const updatedBooklets = booklets.filter((_, i) => i !== index).map((booklet, i) => ({
      ...booklet,
      display_order: i + 1
    }));
    setBooklets(updatedBooklets);
    setHasUnsavedChanges(true);
    setIsBookletsSaved(false);
    onBookletsChange?.(updatedBooklets);
    onBookletsSaved?.(false);
  };
  const updateBookletName = (index: number, name: string) => {
    const upperName = name.toUpperCase();
    const updatedBooklets = booklets.map((booklet, i) => i === index ? {
      ...booklet,
      name: upperName
    } : booklet);
    setBooklets(updatedBooklets);
    setHasUnsavedChanges(true);
    setIsBookletsSaved(false);
    onBookletsChange?.(updatedBooklets);
    onBookletsSaved?.(false);
  };
  const validateBooklets = () => {
    console.log('Validando cadernos:', booklets);
    
    if (booklets.length === 0) {
      console.log('Validação falhou: sem cadernos');
      return "Adicione pelo menos um caderno de prova";
    }

    // Verificar nomes únicos e não vazios
    const names = booklets.map(b => b.name.trim()).filter(n => n);
    const uniqueNames = new Set(names);
    
    console.log('Names:', names, 'Unique names:', Array.from(uniqueNames));
    console.log('Names length:', names.length, 'Booklets length:', booklets.length);
    
    if (names.length !== booklets.length) {
      console.log('Validação falhou: nomes vazios');
      return "Todos os cadernos devem ter um nome preenchido";
    }
    if (names.length !== uniqueNames.size) {
      console.log('Validação falhou: nomes duplicados');
      return "Nomes dos cadernos devem ser únicos";
    }
    
    console.log('Validação passou');
    return null;
  };
  // Export this function to be callable from parent components
  const saveBooklets = async () => {
    const validationError = validateBooklets();
    if (validationError) {
      toast({
        title: "Erro de validação",
        description: validationError,
        variant: "destructive"
      });
      return false;
    }

    // Log para debug
    console.log('Salvando cadernos:', { concursoId, booklets });

    // Se não há concursoId ainda, mostrar aviso ao usuário
    if (!concursoId) {
      console.log('Sem concursoId - não é possível salvar ainda');
      toast({
        title: "Atenção",
        description: "Salve primeiro as informações básicas do ranking antes de configurar os cadernos.",
        variant: "destructive"
      });
      return false;
    }
    try {
      setIsSaving(true);
      console.log('Iniciando salvamento de cadernos para concurso:', concursoId);

      // Processar cadernos para JSONB
      const processedBooklets = booklets.map((booklet, index) => ({
        id: booklet.id || crypto.randomUUID(),
        name: booklet.name,
        display_order: booklet.display_order || index + 1,
        is_active: true,
        total_questions: 0
      }));

      // Atualizar a coluna exam_booklets na tabela concursos
      const { error: updateError } = await supabase
        .from('concursos')
        .update({ exam_booklets: processedBooklets })
        .eq('id', concursoId);

      if (updateError) {
        console.error('Erro ao atualizar cadernos:', updateError);
        throw updateError;
      }

      console.log('Todos os cadernos salvos:', processedBooklets);
      setBooklets(processedBooklets);
      setHasUnsavedChanges(false);
      setIsBookletsSaved(true);
      onBookletsChange?.(processedBooklets);
      onBookletsSaved?.(true);
      toast({
        title: "Cadernos salvos",
        description: `${processedBooklets.length} caderno(s) configurado(s) com sucesso`
      });
      return true;
    } catch (error: any) {
      console.error('Erro ao salvar cadernos:', error);
      toast({
        title: "Erro ao salvar",
        description: error.message || "Não foi possível salvar os cadernos",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cadernos de Prova
          {isBookletsSaved && <span className="text-xs bg-success/10 text-success px-2 py-1 rounded-full">
              Salvos
            </span>}
          {hasUnsavedChanges && !isBookletsSaved && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
              Não Salvos
            </span>}
        </CardTitle>
        
      </CardHeader>
      <CardContent className="space-y-4">
        {!isBookletsSaved}

        {booklets.length === 0 ? <div className="text-center py-6 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum caderno configurado</p>
            <p className="text-xs">Clique em "Adicionar Caderno" para começar</p>
          </div> : <div className="space-y-3">
            {booklets.map((booklet, index) => <div key={`${booklet.id || index}`} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label htmlFor={`booklet-${index}`} className="text-sm">
                    Caderno {index + 1}
                  </Label>
                  <Input id={`booklet-${index}`} value={booklet.name} onChange={e => updateBookletName(index, e.target.value)} placeholder="Nome do caderno (ex: BRANCO, AZUL, A, B...)" className="mt-1" maxLength={100} />
                </div>
                {booklets.length > 1 && <Button type="button" variant="outline" size="sm" onClick={() => removeBooklet(index)} className="text-destructive hover:text-destructive/80">
                    <X className="h-4 w-4" />
                  </Button>}
              </div>)}
          </div>}

        <div className="flex justify-start items-center pt-4 border-t">
          <Button type="button" variant="outline" onClick={addBooklet} disabled={booklets.length >= 10 || isSaving} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Adicionar Caderno
          </Button>
        </div>

        {booklets.length > 0 && <div className="text-xs text-muted-foreground mt-2">
            
            
            
            
          </div>}
      </CardContent>
    </Card>;
};