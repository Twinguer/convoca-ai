
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Concurso } from '@/types/concursos';

interface ConcursoInfoCardProps {
  concurso?: Concurso;
}

export const ConcursoInfoCard: React.FC<ConcursoInfoCardProps> = ({
  concurso
}) => {
  // Exibe todas as localidades reais, sem "Nacional"
  const getLocationDisplay = (localidades?: string[]): string => {
    if (!localidades || localidades.length === 0) return '-';
    // remove "Nacional" e mostra somente as localidades escolhidas (Estados)
    const filtered = localidades.filter(loc => loc !== 'Nacional');
    if (filtered.length === 0 && localidades.includes('Nacional')) {
      return '-';
    }
    return filtered.join(', ');
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Users className="mr-2 h-5 w-5 text-blue-500" />
          Informações do Concurso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p className="text-sm">
            Vagas: <Badge variant="outline">{concurso?.vagas}</Badge>
          </p>
          <p className="text-sm">
            Localidades: <Badge variant="outline">{getLocationDisplay(concurso?.localidades)}</Badge>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
