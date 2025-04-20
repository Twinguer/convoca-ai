
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
  const getLocationDisplay = (localidades?: string[]): string => {
    // Se for vazio ou inexistente, Nacional. 
    if (!localidades || localidades.length === 0) return 'Nacional';
    // Nacional é exclusivo e sempre aparece sozinho.
    if (localidades.includes('Nacional')) return 'Nacional';
    return localidades.join(', ');
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
