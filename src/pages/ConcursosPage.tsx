
import React from 'react';
import { Link } from 'react-router-dom';
import { Building } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const ConcursosPage: React.FC = () => {
  const bancas = [
    {
      id: 'cebraspe',
      name: 'Cebraspe',
      description: 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos',
      path: '/concursos/cebraspe'
    },
    {
      id: 'fcc',
      name: 'FCC',
      description: 'Fundação Carlos Chagas',
      path: '/concursos/fcc'
    },
    {
      id: 'fgv',
      name: 'FGV',
      description: 'Fundação Getúlio Vargas',
      path: '/concursos/fgv'
    },
    {
      id: 'vunesp',
      name: 'Vunesp',
      description: 'Fundação para o Vestibular da Universidade Estadual Paulista',
      path: '/concursos/vunesp'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Concursos Públicos</h1>
        <p className="text-gray-600">
          Confira os concursos abertos e em andamento por organizadora
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0.5">
        {bancas.map((banca) => (
          <Link to={banca.path} key={banca.id}>
            <Card className="h-full hover:shadow-md transition-all">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-convoca-600" />
                  <CardTitle>{banca.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription>{banca.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ConcursosPage;
