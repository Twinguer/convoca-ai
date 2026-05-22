import { PciConcursosFeed } from '@/components/concursos/PciConcursosFeed';

const ConcursosPage = () => {
  return (
    <div className="min-h-screen bg-page-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Concursos abertos</h1>
          <p className="text-muted-foreground mt-1">
            Inscrições abertas em todo o país — vagas, salários e prazos.
          </p>
        </header>
        <PciConcursosFeed />
      </div>
    </div>
  );
};

export default ConcursosPage;
