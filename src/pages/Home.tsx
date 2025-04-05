
import React from 'react';
import ConcursoCard from '../components/ConcursoCard';

const Home: React.FC = () => {
  // Exemplo de dados. Em uma aplicação real, isso viria de uma API
  const concursosRecentes = [
    {
      id: "1",
      titulo: "Analista Administrativo",
      orgao: "Ministério da Economia",
      data: "15/03/2025",
      vagas: 120,
      status: "Em andamento",
      path: "/resultado/1"
    },
    {
      id: "2",
      titulo: "Técnico em Informática",
      orgao: "INSS",
      data: "10/04/2025",
      vagas: 80,
      status: "Em andamento",
      path: "/resultado/2"
    },
    {
      id: "3",
      titulo: "Auditor Fiscal",
      orgao: "Receita Federal",
      data: "22/02/2025",
      vagas: 50,
      status: "Finalizado",
      path: "/resultado/3"
    },
    {
      id: "4",
      titulo: "Técnico Judiciário",
      orgao: "Tribunal Regional Federal",
      data: "05/05/2025",
      vagas: 65,
      status: "Próximo",
      path: "/resultado/4"
    }
  ];

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Concursos Públicos</h1>
        <p className="text-gray-600 max-w-3xl">
          Acompanhe os rankings, resultados e nomeações dos principais concursos públicos em andamento.
        </p>
      </div>
      
      <section className="mb-10">
        <h2 className="section-title">Últimos Resultados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concursosRecentes.map((concurso) => (
            <ConcursoCard
              key={concurso.id}
              id={concurso.id}
              titulo={concurso.titulo}
              orgao={concurso.orgao}
              data={concurso.data}
              vagas={concurso.vagas}
              status={concurso.status}
              path={concurso.path}
            />
          ))}
        </div>
      </section>
      
      <section className="mb-10 bg-convoca-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Como Funciona o Convoca Aí</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-convoca-600 font-bold text-lg mb-2">1. Acompanhe Resultados</div>
            <p className="text-gray-600 text-sm">Acesse resultados atualizados dos principais concursos públicos federais.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-convoca-600 font-bold text-lg mb-2">2. Confira Pré-Classificações</div>
            <p className="text-gray-600 text-sm">Veja sua posição provável no ranking antes mesmo do resultado oficial.</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-convoca-600 font-bold text-lg mb-2">3. Monitore Nomeações</div>
            <p className="text-gray-600 text-sm">Fique por dentro das nomeações e convocações em tempo real.</p>
          </div>
        </div>
      </section>
      
      <section>
        <h2 className="section-title">Perguntas Frequentes</h2>
        <div className="space-y-4 max-w-3xl">
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Como é feito o cálculo da pré-classificação?</h3>
            <p className="text-gray-600 text-sm">A pré-classificação é calculada com base nas notas divulgadas e nos critérios de desempate previstos no edital de cada concurso.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Os resultados são oficiais?</h3>
            <p className="text-gray-600 text-sm">Não. O Convoca Aí reúne e organiza informações divulgadas pelos órgãos oficiais, mas a plataforma não substitui a consulta aos canais oficiais de cada concurso.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-2">Como saber quando serei nomeado?</h3>
            <p className="text-gray-600 text-sm">A nomeação depende da classificação final, do número de vagas e do cronograma definido pelo órgão realizador do concurso. O Convoca Aí acompanha as publicações no Diário Oficial.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
