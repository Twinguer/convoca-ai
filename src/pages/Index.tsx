
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Award, 
  Book, 
  ChevronRight, 
  FileText, 
  GraduationCap, 
  Search, 
  Trophy, 
  Users, 
  Briefcase
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-blue-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-convoca-100/50 to-blue-100/50 z-0"></div>
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        ></div>
        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-convoca-600 to-blue-600 text-transparent bg-clip-text animate-fade-in">
              Prepare-se e Conquiste seu Concurso
            </h1>
            <p className="text-xl text-gray-700 mb-8 animate-fade-in">
              Acompanhe editais, pré-classificações, resultados e nomeações de concursos públicos em um só lugar. Sua jornada de sucesso começa aqui.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in">
              <Link to="/editais">
                <Button className="bg-convoca-600 hover:bg-convoca-700 text-white rounded-md text-lg w-full sm:w-auto px-8 py-6 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
                  Ver Editais Abertos
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              {!user && (
                <Link to="/auth">
                  <Button variant="outline" className="border-convoca-600 text-convoca-600 hover:bg-convoca-50 rounded-md text-lg w-full sm:w-auto px-8 py-6 shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
                    Criar Conta
                    <Users className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              )}
            </div>
            
            <div className="absolute bottom-[-30px] left-1/2 transform -translate-x-1/2 w-full max-w-6xl">
              <div className="relative h-6 overflow-hidden">
                <div className="absolute inset-0 bg-white rounded-t-full shadow-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="bg-white py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Seu caminho para a aprovação</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="flex flex-col items-center text-center p-6 hover:shadow-lg transition-shadow duration-300 border-2 border-gray-100 shadow hover:border-convoca-100">
              <div className="bg-convoca-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-convoca-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Editais</h3>
              <p className="text-gray-600">
                Acesse editais de concursos públicos atualizados diariamente. Fique por dentro de todas as oportunidades.
              </p>
            </Card>
            
            <Card className="flex flex-col items-center text-center p-6 hover:shadow-lg transition-shadow duration-300 border-2 border-gray-100 shadow hover:border-convoca-100">
              <div className="bg-convoca-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Trophy className="h-8 w-8 text-convoca-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rankings</h3>
              <p className="text-gray-600">
                Participe dos rankings de classificação e compare seu desempenho com outros candidatos.
              </p>
            </Card>
            
            <Card className="flex flex-col items-center text-center p-6 hover:shadow-lg transition-shadow duration-300 border-2 border-gray-100 shadow hover:border-convoca-100">
              <div className="bg-convoca-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-convoca-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Nomeações</h3>
              <p className="text-gray-600">
                Fique atualizado com as nomeações e convocações mais recentes dos concursos que você acompanha.
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* About / Statistics Section */}
      <section className="bg-gradient-to-br from-blue-50 to-gray-50 py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Por que escolher a Convoca?</h2>
              <p className="text-lg text-gray-700 mb-6">
                Nossa plataforma foi desenvolvida especialmente para concurseiros que desejam organizar sua jornada de estudos e acompanhar seu progresso.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-convoca-100 p-1 rounded-full mr-3">
                    <Search className="h-5 w-5 text-convoca-600" />
                  </div>
                  <p className="text-gray-700">Acompanhamento completo de concursos por todo o Brasil</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-convoca-100 p-1 rounded-full mr-3">
                    <Book className="h-5 w-5 text-convoca-600" />
                  </div>
                  <p className="text-gray-700">Dicas e materiais para otimizar seus estudos</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-convoca-100 p-1 rounded-full mr-3">
                    <Award className="h-5 w-5 text-convoca-600" />
                  </div>
                  <p className="text-gray-700">Comunidade de concurseiros compartilhando experiências</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-convoca-100 p-1 rounded-full mr-3">
                    <GraduationCap className="h-5 w-5 text-convoca-600" />
                  </div>
                  <p className="text-gray-700">Histórico de aprovações e nomeações para inspirar sua jornada</p>
                </li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 text-center border-2 border-gray-100 shadow hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-convoca-600 mb-2">2.500+</div>
                  <p className="text-gray-700">Concursos cadastrados</p>
                </CardContent>
              </Card>
              
              <Card className="p-6 text-center border-2 border-gray-100 shadow hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-convoca-600 mb-2">15.000+</div>
                  <p className="text-gray-700">Usuários ativos</p>
                </CardContent>
              </Card>
              
              <Card className="p-6 text-center border-2 border-gray-100 shadow hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-convoca-600 mb-2">98%</div>
                  <p className="text-gray-700">Satisfação dos usuários</p>
                </CardContent>
              </Card>
              
              <Card className="p-6 text-center border-2 border-gray-100 shadow hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <div className="text-4xl font-bold text-convoca-600 mb-2">5.000+</div>
                  <p className="text-gray-700">Aprovações registradas</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-convoca-600 text-white py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para conquistar sua aprovação?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de concurseiros que estão realizando seus sonhos através da nossa plataforma.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/concursos">
              <Button className="bg-white text-convoca-600 hover:bg-gray-100 rounded-md text-lg px-8 py-3 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
                Ver Todos os Concursos
              </Button>
            </Link>
            
            {!user && (
              <Link to="/auth">
                <Button variant="outline" className="border-white text-white hover:bg-white/10 rounded-md text-lg px-8 py-3 shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
                  Criar Conta Gratuita
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
