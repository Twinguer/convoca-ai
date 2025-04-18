
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Calendar, AlertCircle } from 'lucide-react';
import { Concurso } from '@/types/concursos';
import { formatDate } from '@/lib/utils';

interface ConcursoInfoCardProps {
  concurso?: Concurso;
  creatorName?: string;
}

export const ConcursoInfoCard: React.FC<ConcursoInfoCardProps> = ({ concurso, creatorName }) => {
  const getLocationDisplay = (localidades?: string[]): string => {
    if (!localidades?.length) return 'Nacional';
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
        <p className="text-lg">
          Órgão: <Badge variant="outline">{concurso?.orgao}</Badge>
        </p>
        <p className="mt-2 text-lg">
          Vagas: <Badge variant="outline">{concurso?.vagas}</Badge>
        </p>
        <p className="mt-2 text-lg">
          Localidades: <Badge variant="outline">{getLocationDisplay(concurso?.localidades)}</Badge>
        </p>
        <p className="mt-2 text-lg flex items-center">
          <Calendar className="mr-2 h-4 w-4 text-gray-500" />
          Data da Prova: <Badge variant="outline" className="ml-2">{concurso?.data_publicacao ? formatDate(concurso.data_publicacao) : 'Não definida'}</Badge>
        </p>
        <p className="mt-2 text-lg flex items-center">
          <AlertCircle className="mr-2 h-4 w-4 text-gray-500" />
          Status: <Badge variant="outline" className="ml-2">{concurso?.status || 'Em andamento'}</Badge>
        </p>
        {creatorName && (
          <p className="mt-2 text-lg">
            Criado por: <Badge variant="outline">{creatorName}</Badge>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
