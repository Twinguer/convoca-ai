
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Concurso } from '@/types/concursos';

interface ConcursoInfoCardProps {
  concurso?: Concurso;
}

export const ConcursoInfoCard: React.FC<ConcursoInfoCardProps> = ({ concurso }) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center">
          <Users className="mr-2 h-5 w-5 text-blue-500" />
          Informações do Concurso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-lg">
          Órgão: <Badge variant="outline">{concurso?.orgao}</Badge>
        </p>
        <p className="mt-2 text-lg">
          Vagas: <Badge variant="outline">{concurso?.vagas}</Badge>
        </p>
      </CardContent>
    </Card>
  );
};
