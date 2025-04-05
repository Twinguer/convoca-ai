
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Calendar, 
  User, 
  Building, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  FileText,
  Clock,
  ArrowLeft,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

const ConcursoDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  
  // Normalmente, esses dados viriam de uma API com base no ID
  const concurso = {
    id: id || '1',
    titulo: "Analista Administrativo",
    orgao: "Ministério da Economia",
    cargo: "Analista Administrativo",
    nivel: "Superior",
    localidades: ["Brasília", "Rio de Janeiro", "São Paulo"],
    vagas: 120,
    salario: "R$ 12.500,00",
    dataInscricao: "01/01/2025 a 31/01/2025",
    dataProva: "15/03/2025",
    status: "Em andamento",
    edital: "https://exemplo.com/edital.pdf",
    descricao: "Concurso para o cargo de Analista Administrativo no Ministério da Economia, com oportunidades em diversas localidades. Exige formação superior em qualquer área.",
    etapas: [
      { id: 1, nome: "Inscrições", data: "01/01/2025 a 31/01/2025", status: "Concluído" },
      { id: 2, nome: "Prova Objetiva", data: "15/03/2025", status: "Em andamento" },
      { id: 3, nome: "Resultado Preliminar", data: "30/03/2025", status: "Pendente" },
      { id: 4, nome: "Recursos", data: "01/04/2025 a 05/04/2025", status: "Pendente" },
      { id: 5, nome: "Resultado Final", data: "15/04/2025", status: "Pendente" },
      { id: 6, nome: "Convocação", data: "A definir", status: "Pendente" }
    ],
    disciplinas: [
      { id: 1, nome: "Língua Portuguesa", questoes: 20, peso: 2 },
      { id: 2, nome: "Raciocínio Lógico", questoes: 10, peso: 1 },
      { id: 3, nome: "Noções de Informática", questoes: 10, peso: 1 },
      { id: 4, nome: "Conhecimentos Específicos", questoes: 30, peso: 3 }
    ]
  };
  
  const statusColor = (status: string) => {
    switch (status) {
      case "Concluído": return "bg-blue-100 text-blue-800";
      case "Em andamento": return "bg-green-100 text-green-800";
      case "Pendente": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <div className="page-container">
      <div className="mb-6">
        <Link to="/" className="inline-flex items-center text-convoca-600 hover:text-convoca-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para editais
        </Link>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{concurso.titulo}</h1>
        <div className="flex items-center text-gray-600 mb-4">
          <Building className="h-5 w-5 mr-2" />
          <span className="text-base">{concurso.orgao}</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="flex items-start">
            <Calendar className="h-5 w-5 mr-2 text-convoca-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Data da Prova</p>
              <p className="font-medium">{concurso.dataProva}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <User className="h-5 w-5 mr-2 text-convoca-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Vagas</p>
              <p className="font-medium">{concurso.vagas}</p>
            </div>
          </div>
          
          <div className="flex items-start">
            <DollarSign className="h-5 w-5 mr-2 text-convoca-600 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Salário</p>
              <p className="font-medium">{concurso.salario}</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 pt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="inline-flex items-center">
            <FileText className="mr-2 h-4 w-4" />
            <a href={concurso.edital} target="_blank" rel="noopener noreferrer">
              Ver Edital
            </a>
          </Button>
          
          <Button variant="outline" size="sm" className="inline-flex items-center">
            <BookOpen className="mr-2 h-4 w-4" />
            Materiais de Estudo
          </Button>
          
          <Button variant="outline" size="sm" className="inline-flex items-center">
            <AlertCircle className="mr-2 h-4 w-4" />
            Receber Atualizações
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="detalhes" className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
          <TabsTrigger value="provas">Provas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="detalhes" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Concurso</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-gray-600">{concurso.descricao}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Cargo</h3>
                <div className="flex items-center text-gray-600">
                  <Briefcase className="h-4 w-4 mr-2" />
                  <span>{concurso.cargo}</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Nível</h3>
                <div className="flex items-center text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  <span>{concurso.nivel}</span>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Localidades</h3>
                <div className="flex items-start text-gray-600">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5" />
                  <div>
                    {concurso.localidades.map((localidade, index) => (
                      <div key={index}>{localidade}</div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Período de Inscrição</h3>
                <div className="flex items-center text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{concurso.dataInscricao}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cronograma" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {concurso.etapas.map((etapa) => (
                  <div key={etapa.id} className="flex items-start">
                    <div className="flex-shrink-0 mr-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-convoca-100 text-convoca-600">
                        {etapa.id}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h3 className="font-medium text-gray-900">{etapa.nome}</h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusColor(etapa.status)}`}>
                          {etapa.status}
                        </span>
                      </div>
                      <div className="flex items-center text-gray-500 mt-1">
                        <Clock className="h-4 w-4 mr-1" />
                        <span className="text-sm">{etapa.data}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="provas" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Disciplinas e Pontuação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Disciplina
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Questões
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Peso
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pontos Máximos
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {concurso.disciplinas.map((disciplina) => (
                      <tr key={disciplina.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {disciplina.nome}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {disciplina.questoes}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {disciplina.peso}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {disciplina.questoes * disciplina.peso}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {concurso.disciplinas.reduce((sum, d) => sum + d.questoes, 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        -
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {concurso.disciplinas.reduce((sum, d) => sum + (d.questoes * d.peso), 0)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="bg-convoca-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Acompanhe seu Desempenho</h2>
        <p className="text-gray-600 mb-4">
          Utilize nosso sistema de pré-classificação para acompanhar seu desempenho neste concurso.
        </p>
        <Link to="/pre-classificacao">
          <Button>Ver Pré-Classificação</Button>
        </Link>
      </div>
    </div>
  );
};

export default ConcursoDetails;
