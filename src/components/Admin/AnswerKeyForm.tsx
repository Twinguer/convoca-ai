import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Edit } from 'lucide-react';

interface AnswerKeyFormProps {
  concursoId: string;
  hasAnswerKey?: boolean;
}

export const AnswerKeyForm: React.FC<AnswerKeyFormProps> = ({ 
  concursoId, 
  hasAnswerKey = false
}) => {
  const navigate = useNavigate();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-600" />
          Gabarito Oficial
        </CardTitle>
      </CardHeader>
      <CardContent>
        {hasAnswerKey ? (
          <div className="bg-green-50 p-4 rounded-md border border-green-200 text-green-800">
            Este concurso possui um gabarito oficial cadastrado. Você pode editar o gabarito a qualquer momento.
          </div>
        ) : (
          <div className="bg-amber-50 p-4 rounded-md border border-amber-200 text-amber-800">
            Este concurso ainda não possui um gabarito oficial cadastrado. Adicione o gabarito para que os usuários possam ter suas respostas avaliadas corretamente.
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={() => navigate(`/project/admin/man/concursos/gabarito/${concursoId}`)}
          className="w-full bg-emerald-600 hover:bg-emerald-700"
        >
          <Edit className="h-4 w-4 mr-2" />
          {hasAnswerKey ? 'Editar Gabarito' : 'Adicionar Gabarito'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AnswerKeyForm;
