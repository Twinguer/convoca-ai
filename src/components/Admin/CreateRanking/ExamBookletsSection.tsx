
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, X, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  const { toast } = useToast();

  // Carregar cadernos existentes sempre que o concursoId mudar
  useEffect(() => {
    if (concursoId) {
      loadExistingBooklets();
    } else {
      // Se não há concursoId, permitir adicionar cadernos mesmo assim
      setBooklets([]);
      setIsBookletsSaved(false);
      setHasUnsavedChanges(false);
    }
  }, [concursoId]);

  const loadExistingBooklets = async () => {
    if (!concursoId) return;
    
    try {
      setIsLoading(true);
      console.log('Carregando cadernos para concurso:', concursoId);
      
      const { data, error } = await supabase
        .from('exam_booklets')
        .select('*')
        .eq('concurso_id', concursoId)
        .order('display_order');

      if (error) {
        console.error('Erro ao carregar cadernos:', error);
        throw error;
      }
      
      console.log('Cadernos carregados:', data);
      
      if (data && data.length > 0) {
        setBooklets(data);
        setHasUnsavedChanges(false);
        setIsBookletsSaved(true);
        onBookletsChange?.(data);
        onBookletsSaved?.(true);
      } else {
        // Se não há cadernos salvos, resetar estado
        setBooklets([]);
        setIsBookletsSaved(false);
        setHasUnsavedChanges(false);
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
    const updatedBooklets = booklets
      .filter((_, i) => i !== index)
      .map((booklet, i) => ({ ...booklet, display_order: i + 1 }));
    
    setBooklets(updatedBooklets);
    setHasUnsavedChanges(true);
    setIsBookletsSaved(false);
    onBookletsChange?.(updatedBooklets);
    onBookletsSaved?.(false);
  };

  const updateBookletName = (index: number, name: string) => {
    const upperName = name.toUpperCase();
    const updatedBooklets = booklets.map((booklet, i) => 
      i === index ? { ...booklet, name: upperName } : booklet
    );
    
    setBooklets(updatedBooklets);
    setHasUnsavedChanges(true);
    setIsBookletsSaved(false);
    onBookletsChange?.(updatedBooklets);
    onBookletsSaved?.(false);
  };

  const validateBooklets = () => {
    if (booklets.length === 0) {
      return "Adicione pelo menos um caderno de prova";
    }

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
    const validationError = validateBooklets();
    if (validationError) {
      toast({
        title: "Erro de validação",
        description: validationError,
        variant: "destructive"
      });
      return false;
    }

    // Se não há concursoId ainda, apenas validar e marcar como pronto para salvar
    if (!concursoId) {
      setHasUnsavedChanges(false);
      setIsBookletsSaved(true);
      onBookletsSaved?.(true);
      toast({
        title: "Cadernos validados",
        description: "Cadernos validados com sucesso. Agora você pode salvar o ranking."
      });
      return true;
    }

    try {
      setIsSaving(true);
      console.log('Iniciando salvamento de cadernos para concurso:', concursoId);
      
      // Primeiro, obter cadernos existentes
      const { data: existingBooklets } = await supabase
        .from('exam_booklets')
        .select('*')
        .eq('concurso_id', concursoId);
      
      console.log('Cadernos existentes:', existingBooklets || []);
      
      // Identificar cadernos para deletar (que existem no banco mas não estão no estado local)
      const currentIds = booklets.filter(b => b.id).map(b => b.id);
      const toDelete = (existingBooklets || []).filter(b => !currentIds.includes(b.id));
      
      console.log('Cadernos para deletar:', toDelete);
      
      // Deletar cadernos removidos
      for (const booklet of toDelete) {
        console.log('Deletando caderno:', booklet.id);
        const { error } = await supabase
          .from('exam_booklets')
          .delete()
          .eq('id', booklet.id);
        if (error) {
          console.error('Erro ao deletar caderno:', error);
          throw error;
        }
      }
      
      // Salvar cada caderno individualmente (criar ou atualizar)
      const savedBooklets = [];
      for (const [index, booklet] of booklets.entries()) {
        console.log(`Processando caderno ${index + 1}:`, booklet);
        
        if (booklet.id) {
          // Atualizar caderno existente
          console.log('Atualizando caderno existente:', booklet.id);
          const { data, error } = await supabase
            .from('exam_booklets')
            .update({
              name: booklet.name,
              display_order: booklet.display_order
            })
            .eq('id', booklet.id)
            .select()
            .single();
          
          if (error) {
            console.error('Erro ao atualizar caderno:', error);
            throw error;
          }
          console.log('Caderno atualizado:', data);
          savedBooklets.push(data);
        } else {
          // Criar novo caderno
          console.log('Criando novo caderno:', booklet.name);
          const { data, error } = await supabase
            .from('exam_booklets')
            .insert({
              concurso_id: concursoId,
              name: booklet.name,
              display_order: booklet.display_order
            })
            .select()
            .single();
          
          if (error) {
            console.error('Erro ao criar caderno:', error);
            throw error;
          }
          
          console.log('Caderno criado:', data);
          savedBooklets.push(data);
        }
      }
      
      console.log('Todos os cadernos salvos:', savedBooklets);
      setBooklets(savedBooklets);
      setHasUnsavedChanges(false);
      setIsBookletsSaved(true);
      onBookletsChange?.(savedBooklets);
      onBookletsSaved?.(true);
      
      toast({
        title: "Cadernos salvos",
        description: `${savedBooklets.length} caderno(s) configurado(s) com sucesso`
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Cadernos de Prova
          {isBookletsSaved && (
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Salvos
            </span>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure diferentes cadernos de prova para este concurso. Cada caderno terá seu próprio gabarito.
          <strong className="text-amber-600 block mt-1">
            ⚠️ É obrigatório configurar e salvar os cadernos antes de salvar o ranking.
          </strong>
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
              <div key={`${booklet.id || index}`} className="flex items-center gap-3 p-3 border rounded-lg">
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
            disabled={booklets.length >= 10 || isSaving}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Caderno
          </Button>
          
          {booklets.length > 0 && (
            <div className="flex items-center gap-2">
              {hasUnsavedChanges && !isBookletsSaved && (
                <span className="text-sm text-amber-600">● Alterações não salvas</span>
              )}
              <Button
                type="button"
                onClick={saveBooklets}
                disabled={isLoading || isSaving}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSaving ? 'Salvando...' : 'Salvar Cadernos'}
              </Button>
            </div>
          )}
        </div>

        {booklets.length > 0 && (
          <div className="text-xs text-muted-foreground mt-2">
            <p>• Máximo de 10 cadernos por concurso</p>
            <p>• Nomes são convertidos automaticamente para maiúsculas</p>
            <p>• Cada caderno terá seu próprio gabarito oficial</p>
            <p>• <strong>Os cadernos devem ser salvos antes do ranking</strong></p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
