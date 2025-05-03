
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays, MapPin, FileText, User, Clock } from 'lucide-react';
import { Concurso } from '@/types/concursos';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ConcursoInfoCardProps {
  concurso: Concurso;
}

export const ConcursoInfoCard: React.FC<ConcursoInfoCardProps> = ({ concurso }) => {
  const hasDate = concurso.data_prova && new Date(concurso.data_prova).getTime() > 0;
  
  // Format locations to display them nicely
  const formatLocations = () => {
    if (!concurso.localidades || concurso.localidades.length === 0) {
      return "Não especificado";
    }
    
    // Check if 'Nacional' is in the locations
    if (concurso.localidades.includes('Nacional')) {
      return 'Nacional';
    }
    
    return concurso.localidades.slice(0, 3).join(', ') + 
           (concurso.localidades.length > 3 ? ` e mais ${concurso.localidades.length - 3}` : '');
  };
  
  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-base sm:text-lg font-medium mb-1">Informações do Concurso</h3>
          
          {concurso.banca && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Banca:</span>{" "}
                <span className="text-sm text-gray-600 dark:text-gray-300">{concurso.banca}</span>
              </div>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-gray-500" />
            <div>
              <span className="text-sm font-medium">Localidades:</span>{" "}
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {formatLocations()}
              </span>
            </div>
          </div>
          
          {hasDate && (
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Data da Prova:</span>{" "}
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {format(new Date(concurso.data_prova), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}
          
          {concurso.created_at && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <div>
                <span className="text-sm font-medium">Criado em:</span>{" "}
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {format(new Date(concurso.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
