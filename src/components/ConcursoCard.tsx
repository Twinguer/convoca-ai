import React from 'react';
import { Calendar, User, Building, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
interface ConcursoCardProps {
  id: string;
  titulo: string;
  orgao: string;
  data: string;
  vagas: number;
  status?: string;
  path?: string;
}
const ConcursoCard: React.FC<ConcursoCardProps> = ({
  id,
  titulo,
  orgao,
  data,
  vagas,
  status = "Em andamento",
  path
}) => {
  // If no custom path is provided, use the concurso/:id path
  const detailsPath = path || `/concurso/${id}`;
  const resultsPath = `/concurso/${id}/resultados`;
  return <div className="concurso-card bg-slate-100">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${status === "Em andamento" ? "bg-green-100 text-green-800" : status === "Finalizado" ? "bg-blue-100 text-blue-800" : "bg-yellow-100 text-yellow-800"}`}>
          {status}
        </span>
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-gray-600">
          <Building className="h-4 w-4 mr-2" />
          <span className="text-sm">{orgao}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <Calendar className="h-4 w-4 mr-2" />
          <span className="text-sm">{data}</span>
        </div>
        
        <div className="flex items-center text-gray-600">
          <User className="h-4 w-4 mr-2" />
          <span className="text-sm">{vagas} vagas</span>
        </div>
      </div>
      
      <div className="flex space-x-4">
        <Link to={detailsPath} className="flex items-center text-convoca-600 hover:text-convoca-700 text-sm font-medium">
          Ver detalhes
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
        
        <Link to={resultsPath} className="flex items-center text-convoca-600 hover:text-convoca-700 text-sm font-medium">
          Resultados
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </div>;
};
export default ConcursoCard;