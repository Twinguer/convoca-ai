import React, { useState, useEffect } from 'react';
import { ConcursoCard } from '@/components/ConcursoCard';
import { ConcursoFilter } from '@/types/concursos';
import { fetchConcursos } from '@/services/concursoService';
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Link } from 'react-router-dom';

const CebraspeConcursos = () => {
  const [concursos, setConcursos] = useState([]);
  const [filter, setFilter] = useState<ConcursoFilter>({ status: ['publicado', 'em_andamento'] });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadConcursos = async () => {
      const concursosData = await fetchConcursos(filter);
      setConcursos(concursosData);
    };

    loadConcursos();
  }, [filter]);

  useEffect(() => {
    setFilter({
      ...filter,
      status: ['publicado', 'em_andamento']
    });
  }, []);

  const handleSearch = () => {
    setFilter({ ...filter, searchTerm: searchTerm });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Concursos Cebraspe</h1>

      <div className="flex items-center mb-4">
        <Input
          type="text"
          placeholder="Pesquisar concurso..."
          className="mr-2"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button onClick={handleSearch}>Pesquisar</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {concursos.map((concurso) => (
          <ConcursoCard key={concurso.id} concurso={concurso} />
        ))}
      </div>
      <Link to="/" className="text-blue-500 mt-4 block">Voltar para a página inicial</Link>
    </div>
  );
};

export default CebraspeConcursos;
