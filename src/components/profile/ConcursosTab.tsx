
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface ConcursosTabProps {
  userId: string;
}

const ConcursosTab: React.FC<ConcursosTabProps> = ({ userId }) => {
  const { toast } = useToast();
  const [concursosAprovados, setConcursosAprovados] = useState('');
  const [concursosParticipando, setConcursosParticipando] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUserConcursos = async () => {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('users_profiles')
          .select('concursos_aprovados, concursos_participando')
          .eq('id', userId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setConcursosAprovados(data.concursos_aprovados || '');
          setConcursosParticipando(data.concursos_participando || '');
        }
      } catch (error) {
        console.error('Error fetching user concursos:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserConcursos();
  }, [userId]);

  const handleSaveConcursos = async () => {
    if (!userId) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('users_profiles')
        .update({
          concursos_aprovados: concursosAprovados,
          concursos_participando: concursosParticipando
        })
        .eq('id', userId);
        
      if (error) throw error;
      
      toast({
        title: "Concursos atualizados",
        description: "Suas informações de concursos foram atualizadas com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Ocorreu um erro ao salvar suas informações.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-6">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="concursos-aprovados">Concursos em que foi aprovado</Label>
          <Textarea 
            id="concursos-aprovados" 
            value={concursosAprovados} 
            onChange={(e) => setConcursosAprovados(e.target.value)}
            placeholder="Liste os concursos em que você foi aprovado (um por linha)"
            rows={5}
          />
          <p className="text-sm text-muted-foreground">
            Dica: Liste um por linha, incluindo o nome do concurso, órgão, ano e sua classificação
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="concursos-participando">Concursos em que está participando</Label>
          <Textarea 
            id="concursos-participando" 
            value={concursosParticipando} 
            onChange={(e) => setConcursosParticipando(e.target.value)}
            placeholder="Liste os concursos em que você está participando atualmente (um por linha)"
            rows={5}
          />
          <p className="text-sm text-muted-foreground">
            Dica: Liste um por linha, incluindo o nome do concurso, órgão e data da prova
          </p>
        </div>

        <Button 
          onClick={handleSaveConcursos} 
          className="w-full" 
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar concursos'
          )}
        </Button>
      </div>
    </Card>
  );
};

export default ConcursosTab;
