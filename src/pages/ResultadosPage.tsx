
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbList } from '../components/ui/breadcrumb';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { fetchConcursoById } from '../services/concursoService';

// Generate mock data for rankings
const generateMockRanking = (seed: number) => {
  const names = [
    "Maria Silva", "João Santos", "Ana Oliveira", "Carlos Pereira", "Juliana Costa", 
    "Pedro Almeida", "Fernanda Lima", "Rodrigo Souza", "Camila Ferreira", "Lucas Martins",
    "Aline Rodrigues", "Marcos Gomes", "Patrícia Carvalho", "Bruno Ribeiro", "Mariana Nunes",
    "Rafael Mendes", "Daniela Barbosa", "Gustavo Cardoso", "Lúcia Alves", "André Vieira",
    "Bianca Teixeira", "Felipe Dias", "Clara Rocha", "Eduardo Moreira", "Vanessa Castro",
    "Igor Duarte", "Natália Campos", "Roberto Ramos", "Larissa Soares", "Gabriel Pinto",
    "Beatriz Lopes", "Leandro Moura", "Roberta Machado", "Fábio Correia", "Carolina Freitas",
    "Vinícius Nascimento", "Gabriela Araújo", "Fernando Reis", "Luiza Melo", "Alexandre Barros"
  ];

  // Use seed to get different candidates for unofficial and official rankings
  const startIdx = seed * 20;
  
  if (seed === 0) {
    // For unofficial ranking, generate detailed scores
    return Array.from({ length: 20 }, (_, i) => {
      const nameSeed = (startIdx + i) % names.length;
      
      // Generate scores for each category with one decimal place
      const basicScore = (15 + Math.random() * 15).toFixed(1);
      const specificScore = (20 + Math.random() * 30).toFixed(1);
      const discursiveScore = (10 + Math.random() * 10).toFixed(1);
      
      // Calculate final score (sum of all categories)
      const finalScore = (
        parseFloat(basicScore) + 
        parseFloat(specificScore) + 
        parseFloat(discursiveScore)
      ).toFixed(1);
      
      return {
        position: i + 1,
        name: names[nameSeed],
        basicScore,
        specificScore,
        discursiveScore,
        finalScore
      };
    }).sort((a, b) => parseFloat(b.finalScore) - parseFloat(a.finalScore))
      .map((candidate, idx) => ({ ...candidate, position: idx + 1 }));
  } else {
    // For official ranking, only use final score
    return Array.from({ length: 20 }, (_, i) => {
      const nameSeed = (startIdx + i) % names.length;
      // Generate a score between 70 and 100 with one decimal place
      const score = (70 + Math.random() * 30).toFixed(1);
      
      return {
        position: i + 1,
        name: names[nameSeed],
        score: score
      };
    }).sort((a, b) => parseFloat(b.score) - parseFloat(a.score))
      .map((candidate, idx) => ({ ...candidate, position: idx + 1 }));
  }
};

const unofficialRanking = generateMockRanking(0);
const officialRanking = generateMockRanking(1);

const ResultadosPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'unofficial' | 'official'>('unofficial');
  
  const { data: concurso, isLoading, isError } = useQuery({
    queryKey: ['concurso', id],
    queryFn: () => fetchConcursoById(id || ''),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
        <div className="h-40 bg-gray-200 rounded mb-6"></div>
      </div>
    );
  }

  if (isError || !concurso) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Concurso não encontrado</h2>
        <p className="text-gray-600 mb-6">O concurso que você está procurando não existe ou foi removido.</p>
        <Button onClick={() => navigate('/concursos/cebraspe')}>Voltar para Concursos</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/concursos/cebraspe">Concursos Cebraspe</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/concurso/${id}`}>{concurso.titulo}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink>Resultados</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <Button
        variant="ghost"
        size="sm"
        className="mb-4 flex items-center gap-1"
        onClick={() => navigate(`/concurso/${id}`)}
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Button>
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{concurso.titulo}</h1>
        <p className="text-gray-600">{concurso.orgao}</p>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Resultados do Concurso</CardTitle>
          <CardDescription>
            Confira abaixo o ranking não oficial e o resultado oficial do concurso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="unofficial" onValueChange={(value) => setActiveTab(value as 'unofficial' | 'official')}>
            <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 mb-6">
              <TabsTrigger value="unofficial">Ranking não oficial</TabsTrigger>
              <TabsTrigger value="official">Resultado Oficial</TabsTrigger>
            </TabsList>
            
            <TabsContent value="unofficial">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Posição</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-center">C. Básicos</TableHead>
                      <TableHead className="text-center">C. Específicos</TableHead>
                      <TableHead className="text-center">Discur/Est. Caso</TableHead>
                      <TableHead className="text-right">Nota Final</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unofficialRanking.map((candidate) => (
                      <TableRow key={`unofficial-${candidate.position}`}>
                        <TableCell className="font-medium">{candidate.position}º</TableCell>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell className="text-center">{candidate.basicScore}</TableCell>
                        <TableCell className="text-center">{candidate.specificScore}</TableCell>
                        <TableCell className="text-center">{candidate.discursiveScore}</TableCell>
                        <TableCell className="text-right font-medium">{candidate.finalScore}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-gray-500 mt-4 italic">
                * Este ranking é não oficial e pode diferir do resultado divulgado pela banca organizadora.
              </p>
            </TabsContent>
            
            <TabsContent value="official">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Posição</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-32 text-right">Nota</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {officialRanking.map((candidate) => (
                      <TableRow key={`official-${candidate.position}`}>
                        <TableCell className="font-medium">{candidate.position}º</TableCell>
                        <TableCell>{candidate.name}</TableCell>
                        <TableCell className="text-right">{candidate.score}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Fonte: Resultado oficial publicado pela banca organizadora.
              </p>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <div className="flex justify-center">
        <Button asChild variant="outline" className="gap-2">
          <a href={concurso.link} target="_blank" rel="noopener noreferrer">
            Acessar site oficial da banca
          </a>
        </Button>
      </div>
    </div>
  );
};

export default ResultadosPage;
