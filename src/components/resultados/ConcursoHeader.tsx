
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface ConcursoHeaderProps {
  concurso: {
    id: string;
    name: string;
    organization: string;
    date?: string | null;
    status?: string;
  };
  userScore?: number;
}

export const ConcursoHeader: React.FC<ConcursoHeaderProps> = ({ 
  concurso,
  userScore 
}) => {
  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="sm" asChild className="p-1">
          <Link to="/resultado" className="flex items-center text-gray-600">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Link>
        </Button>
      </div>
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">{concurso.name}</h1>
          <div className="flex items-center mt-1 text-gray-600">
            <span>{concurso.organization}</span>
            {concurso.date && (
              <div className="flex items-center ml-4">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{concurso.date}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center">
          {concurso.status && (
            <Badge variant="outline" className="mr-3">
              {concurso.status}
            </Badge>
          )}
          
          {userScore !== undefined && (
            <div className="flex items-center bg-green-50 text-green-800 px-3 py-1 rounded-md">
              <Award className="h-4 w-4 mr-1 text-green-600" />
              <span className="font-medium">{userScore} pontos</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <h2 className="text-lg font-semibold">Classificação Pós-prova</h2>
        <p className="text-gray-600 text-sm mt-1">
          Classificação atualizada com base nos gabaritos oficiais e resultados divulgados.
        </p>
      </div>
    </div>
  );
};
