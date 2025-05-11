
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Medal, Target, Award, TrendingUp } from 'lucide-react';
import { Ranking } from '@/services/rankingService';
import { Badge } from '@/components/ui/badge';

interface RankingCardProps {
  userRanking: Ranking | undefined;
  participantCount: number;
  inscritos?: number;
}

export const RankingCard: React.FC<RankingCardProps> = ({ 
  userRanking, 
  participantCount,
  inscritos 
}) => {
  // Calculate participants percentage if inscritos is available and valid
  const participantsPercentage = React.useMemo(() => {
    if (!inscritos || inscritos <= 0) return 0;
    const percentage = (participantCount / inscritos) * 100;
    return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
  }, [participantCount, inscritos]);

  return (
    <Card className="overflow-hidden bg-gradient-to-br from-gray-50 to-white border border-gray-200 shadow-md dark:from-gray-900 dark:to-gray-950 dark:border-gray-800">
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Medal className="h-5 w-5 text-amber-500" />
            <h3 className="font-medium">Seu Desempenho</h3>
          </div>

          {userRanking ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-3xl font-semibold text-emerald-600">{userRanking.position}º</span>
                  <span className="text-sm text-gray-500 ml-1">Lugar</span>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">{userRanking.score.toFixed(2)}</span>
                    <span className="text-xs text-gray-500">pontos</span>
                  </div>
                  {userRanking.displayReservation && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-100">
                      {userRanking.displayReservation}
                    </Badge>
                  )}
                  {userRanking.status_concurseiro && (
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 mt-1">
                      {userRanking.status_concurseiro}
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Pontuação total</span>
                <span className="font-medium">{userRanking.score.toFixed(2)}</span>
              </div>

              {/* Display base knowledge scores if traditional knowledge areas */}
              {(userRanking.basicKnowledgeScore || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Conhecimentos Básicos</span>
                  <span className="font-medium">{userRanking.basicKnowledgeScore?.toFixed(2) || '0'}</span>
                </div>
              )}

              {(userRanking.specificKnowledge1Score || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">C. Específicos 1</span>
                  <span className="font-medium">{userRanking.specificKnowledge1Score?.toFixed(2) || '0'}</span>
                </div>
              )}

              {/* Display custom discipline scores if available */}
              {userRanking.customDisciplineScores && Object.keys(userRanking.customDisciplineScores).length > 0 && (
                <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
                  <div className="text-xs font-medium text-gray-500">Disciplinas Customizadas</div>
                  {Object.entries(userRanking.customDisciplineScores).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">{key}</span>
                      <span className="font-medium">{Number(value).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}

              {(userRanking.discursiveScore || 0) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Discursiva</span>
                  <span className="font-medium">{userRanking.discursiveScore?.toFixed(2) || '0'}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <p className="text-gray-500 mb-2">Você ainda não está participando deste ranking.</p>
              <p className="text-sm text-gray-400">Participe para medir seu desempenho</p>
            </div>
          )}
        </div>

        <div className="bg-gray-100 dark:bg-gray-800 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium">Participantes</span>
            </div>
            <div className="text-sm">
              <span className="font-medium">{participantCount}</span>
              {inscritos && inscritos > 0 && (
                <span className="text-gray-500"> / {inscritos}</span>
              )}
            </div>
          </div>
          
          {inscritos && inscritos > 0 && (
            <div className="space-y-1">
              <Progress value={participantsPercentage} className="h-2" />
              <div className="text-xs text-right text-gray-500">{participantsPercentage.toFixed(1)}% dos inscritos</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
