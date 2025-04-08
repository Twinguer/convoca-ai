
import React from 'react';
import { Button } from '../components/ui/button';
import { Link } from 'react-router-dom';

const FCCConcursos: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Concursos FCC</h1>
        <p className="text-gray-600 mb-8">
          Estamos trabalhando para disponibilizar os concursos da Fundação Carlos Chagas.
        </p>
        <Link to="/concursos/cebraspe">
          <Button>Ver concursos Cebraspe</Button>
        </Link>
      </div>
    </div>
  );
};

export default FCCConcursos;
