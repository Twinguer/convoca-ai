import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users } from 'lucide-react';
import { Concurso } from '@/types/concursos';
interface ConcursoInfoCardProps {
  concurso?: Concurso;
  creatorName?: string;
}
export const ConcursoInfoCard: React.FC<ConcursoInfoCardProps> = ({
  concurso,
  creatorName
}) => {
  const getLocationDisplay = (localidades?: string[]): string => {
    if (!localidades?.length) return 'Nacional';
    if (localidades.includes('Nacional')) return 'Nacional';
    const stateAbbreviations: {
      [key: string]: string;
    } = {
      'Acre': 'AC',
      'Alagoas': 'AL',
      'Amapá': 'AP',
      'Amazonas': 'AM',
      'Bahia': 'BA',
      'Ceará': 'CE',
      'Distrito Federal': 'DF',
      'Espírito Santo': 'ES',
      'Goiás': 'GO',
      'Maranhão': 'MA',
      'Mato Grosso': 'MT',
      'Mato Grosso do Sul': 'MS',
      'Minas Gerais': 'MG',
      'Pará': 'PA',
      'Paraíba': 'PB',
      'Paraná': 'PR',
      'Pernambuco': 'PE',
      'Piauí': 'PI',
      'Rio de Janeiro': 'RJ',
      'Rio Grande do Norte': 'RN',
      'Rio Grande do Sul': 'RS',
      'Rondônia': 'RO',
      'Roraima': 'RR',
      'Santa Catarina': 'SC',
      'São Paulo': 'SP',
      'Sergipe': 'SE',
      'Tocantins': 'TO'
    };
    return localidades.map(state => stateAbbreviations[state] || state).join(', ');
  };
  return <Card>
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
          
          {creatorName}
        </div>
      </CardContent>
    </Card>;
};