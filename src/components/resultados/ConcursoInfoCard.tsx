
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Concurso } from '@/types/concursos';
import { Building2, Calendar, MapPin, Users, AlertCircle } from 'lucide-react';

interface ConcursoInfoCardProps {
  concurso: Concurso;
}

const ConcursoInfoCard: React.FC<ConcursoInfoCardProps> = ({
  concurso
}) => {
  const formattedDate = concurso.data_publicacao ? format(new Date(concurso.data_publicacao), "dd 'de' MMMM 'de' yyyy", {
    locale: ptBR
  }) : 'Data não informada';
  
  const getLocalidadesText = () => {
    if (!concurso.localidades || concurso.localidades.length === 0) {
      return 'Nacional';
    }
    if (concurso.localidades.includes('Nacional')) {
      return 'Nacional';
    }

    // If more than 3 localities, show the first 3 and indicate there are more
    if (concurso.localidades.length > 3) {
      return `${concurso.localidades.slice(0, 3).join(', ')} e outras`;
    }
    return concurso.localidades.join(', ');
  };
  
  // Helper to format minimum score display
  const getMinimumScoreText = () => {
    if (!concurso.has_minimum_score) {
      return 'Não exigida';
    }
    
    const unitType = concurso.minimum_score_unit_type === 'percentage' ? '%' : ' pontos';
    const scoreType = concurso.minimum_score_type === 'knowledge' 
      ? 'por área de conhecimento' 
      : 'por matéria';
      
    return `${concurso.total_minimum_score || 0}${unitType} ${scoreType}`;
  };
  
  return (
    <Card className="mb-6 my-[30px]">
      <CardContent className="pt-6 py-[15px]">
        <div className="grid gap-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold">{concurso.titulo}</h2>
            <p className="text-muted-foreground">{concurso.orgao}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center">
              <Building2 className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm font-normal">Banca: {concurso.banca || concurso.custom_banca || 'Não informada'}</span>
            </div>

            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Data: {formattedDate}</span>
            </div>

            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Localidade: {getLocalidadesText()}</span>
            </div>

            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Vagas: {concurso.vagas || 'Não informado'}</span>
            </div>
            
            {/* Add minimum score information */}
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm">Nota de corte: {getMinimumScoreText()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConcursoInfoCard;
