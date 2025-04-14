
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { PencilLine, Trophy, ExternalLink } from 'lucide-react';

interface RankingsTabProps {
  userId: string;
}

const RankingsTab: React.FC<RankingsTabProps> = ({ userId }) => {
  const navigate = useNavigate();
  
  const { data: rankings, isLoading } = useQuery({
    queryKey: ['user-rankings', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_rankings')
        .select(`
          id, 
          score,
          basic_knowledge_score,
          specific_knowledge_score,
          created_at,
          concursos(id, titulo, orgao, banca)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    },
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  if (!rankings || rankings.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">
            Este usuário ainda não está participando de nenhum ranking.
          </p>
          <Button variant="outline" onClick={() => navigate('/')}>
            Ver concursos disponíveis
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Rankings ({rankings.length})</h3>
      
      <div className="grid gap-4">
        {rankings.map((ranking: any) => (
          <Card key={ranking.id} className="overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-white p-4 flex flex-col sm:flex-row justify-between gap-4 items-start sm:items-center border-b">
              <div>
                <h4 className="font-bold">{ranking.concursos?.titulo}</h4>
                <p className="text-sm text-muted-foreground">{ranking.concursos?.orgao} • {ranking.concursos?.banca}</p>
              </div>
              
              <div className="flex items-center gap-2 self-end">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex items-center gap-1"
                  onClick={() => navigate(`/concurso/${ranking.concursos?.id}/resultados`)}
                >
                  <Trophy className="h-4 w-4" />
                  <span>Ver Ranking</span>
                </Button>
                
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate(`/concurso/${ranking.concursos?.id}/participar?showAnswerSheet=true`)}
                >
                  <PencilLine className="h-4 w-4" />
                  <span>Editar Respostas</span>
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-blue-50 rounded-md text-center">
                  <p className="text-sm font-medium text-gray-600">Pontuação Total</p>
                  <p className="text-xl font-bold text-blue-700">{ranking.score || 0}</p>
                </div>
                
                {ranking.basic_knowledge_score !== null && (
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-sm font-medium text-gray-600">Conhecimentos Básicos</p>
                    <p className="text-lg font-bold text-gray-700">{ranking.basic_knowledge_score || 0}</p>
                  </div>
                )}
                
                {ranking.specific_knowledge_score !== null && (
                  <div className="p-3 bg-gray-50 rounded-md text-center">
                    <p className="text-sm font-medium text-gray-600">Conhecimentos Específicos</p>
                    <p className="text-lg font-bold text-gray-700">{ranking.specific_knowledge_score || 0}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RankingsTab;
