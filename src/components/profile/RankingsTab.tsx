
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Trophy } from 'lucide-react';
import { UserRankingDisplay } from '@/types/concursos';

interface RankingsTabProps {
  userRankings: UserRankingDisplay[];
}

const RankingsTab: React.FC<RankingsTabProps> = ({ userRankings }) => {
  const navigate = useNavigate();

  return (
    <>
      {userRankings && userRankings.length > 0 ? (
        <div className="space-y-1">
          {userRankings.map((ranking) => (
            <Card key={ranking.concursoId} className="overflow-hidden">
              <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{ranking.concursoTitle}</h3>
                  <div className="flex items-center mt-1">
                    <Trophy className="h-4 w-4 text-yellow-500 mr-1" />
                    <span className="text-sm">
                      {ranking.position > 0 ? `${ranking.position}º lugar` : 'Posição não definida'}
                    </span>
                  </div>
                </div>
                <div className="bg-white rounded-full h-14 w-14 flex items-center justify-center shadow-sm">
                  <span className="text-lg font-bold">{ranking.score}</span>
                  <span className="text-xs ml-1">pts</span>
                </div>
              </div>
              <div className="p-4 bg-white">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/concurso/${ranking.concursoId}/resultados`)}
                >
                  Ver ranking completo
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium">Você ainda não tem rankings</h3>
          <p className="text-muted-foreground">
            Participe de concursos e simulados para ver sua classificação aqui
          </p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/concursos')}
          >
            Ver concursos disponíveis
          </Button>
        </div>
      )}
    </>
  );
};

export default RankingsTab;
