import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, RotateCcw, X, CheckCircle } from 'lucide-react';
import { useSpacedRepetition } from '@/hooks/useSpacedRepetition';

export const SpacedRepetitionQueue = () => {
  const { reviewQueue, loading, markAsReviewed, removeFromQueue } = useSpacedRepetition();

  const getDifficultyColor = (level: number) => {
    const colors = {
      1: 'bg-red-100 text-red-800',
      2: 'bg-orange-100 text-orange-800', 
      3: 'bg-yellow-100 text-yellow-800',
      4: 'bg-blue-100 text-blue-800',
      5: 'bg-green-100 text-green-800'
    };
    return colors[level as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getDifficultyLabel = (level: number) => {
    const labels = {
      1: 'Muito Difícil',
      2: 'Difícil',
      3: 'Médio',
      4: 'Fácil',
      5: 'Muito Fácil'
    };
    return labels[level as keyof typeof labels] || 'Desconhecido';
  };

  const formatReviewDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Hoje';
    if (diffDays === 1) return 'Amanhã';
    if (diffDays === -1) return 'Ontem';
    if (diffDays < 0) return `${Math.abs(diffDays)} dias atrás`;
    return `Em ${diffDays} dias`;
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-6 bg-muted rounded w-48"></div>
      <div className="grid gap-3">
        <div className="h-20 bg-muted rounded"></div>
        <div className="h-20 bg-muted rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <RotateCcw className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Fila de Revisão</h3>
        <Badge variant="outline">{reviewQueue.length} pendentes</Badge>
      </div>

      {reviewQueue.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma revisão pendente hoje!</p>
            <p className="text-sm">Continue estudando para adicionar mais matérias à fila</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reviewQueue.map(item => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{item.subject_name}</span>
                      {item.block_name && (
                        <Badge variant="outline" className="text-xs">
                          {item.block_name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{formatReviewDate(item.next_review_date)}</span>
                      </div>
                      
                      <Badge className={getDifficultyColor(item.difficulty_level)}>
                        {getDifficultyLabel(item.difficulty_level)}
                      </Badge>
                      
                      <span className="text-muted-foreground">
                        {item.review_count}ª revisão
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Botões de performance */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <Button
                          key={rating}
                          onClick={() => markAsReviewed(item.id, rating as 1 | 2 | 3 | 4 | 5)}
                          size="sm"
                          variant="outline"
                          className="w-8 h-8 p-0"
                          title={getDifficultyLabel(rating)}
                        >
                          {rating}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      onClick={() => removeFromQueue(item.id)}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reviewQueue.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-2">Como avaliar:</p>
              <div className="grid grid-cols-5 gap-2 text-xs">
                <div className="text-center">
                  <Badge className="bg-red-100 text-red-800 mb-1">1</Badge>
                  <p>Muito Difícil</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-orange-100 text-orange-800 mb-1">2</Badge>
                  <p>Difícil</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-yellow-100 text-yellow-800 mb-1">3</Badge>
                  <p>Médio</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-blue-100 text-blue-800 mb-1">4</Badge>
                  <p>Fácil</p>
                </div>
                <div className="text-center">
                  <Badge className="bg-green-100 text-green-800 mb-1">5</Badge>
                  <p>Muito Fácil</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};