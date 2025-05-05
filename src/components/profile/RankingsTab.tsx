
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { fetchUserRankings } from '@/services/rankingService';
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const RankingsTab: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error("Você precisa estar logado para ver seus rankings");
      navigate("/auth");
      return;
    }

    const loadRankings = async () => {
      setIsLoading(true);
      try {
        const fetchedRankings = await fetchUserRankingsForUser(user.id);
        setRankings(fetchedRankings);
      } catch (error) {
        console.error("Erro ao carregar rankings:", error);
        toast.error("Erro ao carregar seus rankings.");
      } finally {
        setIsLoading(false);
      }
    };

    loadRankings();
  }, [user, navigate]);

  const fetchUserRankingsForUser = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select(`
          concurso_id,
          concursos (titulo)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user rankings:', error);
        return [];
      }

      // Extract concursoId and titulo from the fetched data
      const userRankings = data.map(item => ({
        concursoId: item.concurso_id,
        concursoTitle: item.concursos ? item.concursos.titulo : 'Título não encontrado',
      }));

      return userRankings;
    } catch (error) {
      console.error('Error fetching user rankings:', error);
      return [];
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Seus Rankings</CardTitle>
          <CardDescription>
            Veja os rankings que você já participou.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {isLoading ? (
            <>
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </>
          ) : rankings.length === 0 ? (
            <p>Você ainda não participou de nenhum ranking. <Link to="/pre-classificacao" className="underline">Comece agora!</Link></p>
          ) : (
            <div className="grid gap-2">
              {rankings.map(ranking => (
                <div key={ranking.concursoId} className="border rounded-md p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-lg font-semibold">{ranking.concursoTitle}</p>
                      <Link to={`/concurso/${ranking.concursoId}/resultados`} className="text-blue-500 hover:underline">
                        Ver resultados
                      </Link>
                    </div>
                    {ranking.isDisqualified && (
                      <Badge variant="destructive">Não Classificado</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingsTab;
