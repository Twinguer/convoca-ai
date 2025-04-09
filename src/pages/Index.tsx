
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
  Briefcase,
  CheckSquare,
  BarChart3,
  ChartPieIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
      {/* Hero Section with Image */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-emerald-50/50 z-0"></div>
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={{ 
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        ></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-emerald-800 text-transparent bg-clip-text">
                Compare seus resultados com outros que buscam o mesmo objetivo. Mostre seu sucesso para inspirar outros concurseiros.
              </h1>
              <p className="text-xl text-gray-700 mb-8">
                Acompanhe editais, pré-classificações, resultados e nomeações de concursos públicos em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/editais">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-lg w-full sm:w-auto px-8 py-6 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
                    Participar da comunidade.
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                {!user && (
                  <Link to="/auth">
                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-md text-lg w-full sm:w-auto px-8 py-6 shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
                      Criar Conta
                      <Users className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            
            <div className="relative animate-fade-in hidden md:block">
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '1s' }}></div>
              
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img 
                  src="/lovable-uploads/d9dd6b7e-0366-4902-bda7-4276442d9a96.png" 
                  alt="Estudante se preparando para concurso" 
                  className="w-full h-auto rounded-xl object-cover"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="font-semibold text-lg">Estude com foco e determinação</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section with Images */}
      <section className="bg-white py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Siga pessoas com o mesmo propósito que o seu</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Uma plataforma para acompanhar seus resultados. Uma comunidade só para quem é concurseiro. Já recebeu seu convite? 
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="feature-card group">
              <div className="relative overflow-hidden">
                <img 
                  src="/lovable-uploads/36833afc-6f71-4ffe-b0f2-41aee0a8e0c4.png" 
                  alt="Gabarito de concurso" 
                  className="feature-card-image group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Editais Atualizados</h3>
                <p className="text-gray-600">
                  Todos os participantes comprovaram que fazem ou já fizeram algum concurso público. 
                </p>
              </div>
            </div>
            
            <div className="feature-card group">
              <div className="relative overflow-hidden">
                <img 
                  src="/lovable-uploads/fd0eba58-40c1-491f-8f67-241432ac3290.png" 
                  alt="Resultado de concurso" 
                  className="feature-card-image group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Trophy className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Rankings Detalhados</h3>
                <p className="text-gray-600">
                  Participe dos rankings de classificação e compare seu desempenho com outros candidatos.
                </p>
              </div>
            </div>
            
            <div className="feature-card group">
              <div className="relative overflow-hidden">
                <img 
                  src="/lovable-uploads/b9f4f05a-3df3-4589-a1c0-72d8c6f86bec.png" 
                  alt="Sala de aula de concurso" 
                  className="feature-card-image group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <div className="p-6">
                <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <Briefcase className="h-8 w-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nomeações e Convocações</h3>
                <p className="text-gray-600">
                  Fique atualizado com as nomeações e convocações mais recentes dos concursos que você acompanha.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* About / Statistics Section */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Por que escolher a Convoca?</h2>
              <p className="text-lg text-gray-700 mb-6">
                Nossa plataforma foi desenvolvida especialmente para concurseiros que desejam organizar sua jornada de estudos e acompanhar seu progresso.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-emerald-100 p-1 rounded-full mr-3">
                    <CheckSquare className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-gray-700">Acompanhamento completo de concursos por todo o Brasil</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-emerald-100 p-1 rounded-full mr-3">
                    <Book className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-gray-700">Dicas e materiais para otimizar seus estudos</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-emerald-100 p-1 rounded-full mr-3">
                    <Award className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-gray-700">Comunidade de concurseiros compartilhando experiências</p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 bg-emerald-100 p-1 rounded-full mr-3">
                    <GraduationCap className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="text-gray-700">Histórico de aprovações e nomeações para inspirar sua jornada</p>
                </li>
              </ul>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <Card className="p-6 text-center border-2 border-emerald-100 shadow hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardContent className="p-0">
                  <BarChart3 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <div className="text-4xl font-bold text-emerald-600 mb-2">2.500+</div>
                  <p className="text-gray-700">Concursos cadastrados</p>
                </CardContent>
              </Card>
              
              <Card className="p-6 text-center border-2 border-emerald-100 shadow hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardContent className="p-0">
                  <Users className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <div className="text-4xl font-bold text-emerald-600 mb-2">15.000+</div>
                  <p className="text-gray-700">Usuários ativos</p>
                </CardContent>
              </Card>
              
              <Card className="p-6 text-center border-2 border-emerald-100 shadow hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardContent className="p-0">
                  <ChartPieIcon className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <div className="text-4xl font-bold text-emerald-600 mb-2">98%</div>
                  <p className="text-gray-700">Satisfação dos usuários</p>
                </CardContent>
              </Card>
              
              <Card className="p-6 text-center border-2 border-emerald-100 shadow hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardContent className="p-0">
                  <Award className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                  <div className="text-4xl font-bold text-emerald-600 mb-2">5.000+</div>
                  <p className="text-gray-700">Aprovações registradas</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Tools Section */}
      <section className="bg-white py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Ferramentas para seu sucesso</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Acompanhe todo o processo do concurso, desde o edital até sua nomeação.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full bg-white hover:shadow-xl transition-shadow duration-300">
              <div className="relative h-64">
                <img 
                  src="/lovable-uploads/95b3453d-2c74-48d6-b670-44eff515a18a.png" 
                  alt="Ferramentas digitais para concursos" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/70 to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">Gabaritos e Pré-classificação</h3>
                    <p>Compare suas respostas e veja sua posição antes do resultado oficial</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-center">
                    <div className="mr-3 text-emerald-500"><CheckSquare size={18} /></div>
                    <span>Lançamento automático do seu gabarito</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 text-emerald-500"><CheckSquare size={18} /></div>
                    <span>Cálculo de pontuação por tipo de prova</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 text-emerald-500"><CheckSquare size={18} /></div>
                    <span>Visualização da posição no ranking</span>
                  </li>
                </ul>
                
                <Link to="/pre-classificacao">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Acessar Pré-classificação
                  </Button>
                </Link>
              </div>
            </div>
            
            <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100 flex flex-col h-full bg-white hover:shadow-xl transition-shadow duration-300">
              <div className="relative h-64">
                <img 
                  src="/lovable-uploads/6ee31b0a-acde-4381-aee0-cc2cef46d263.png" 
                  alt="Pessoa estudando para concurso" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/70 to-transparent flex items-end">
                  <div className="p-6 text-white">
                    <h3 className="text-2xl font-bold mb-2">Editais e Resultados</h3>
                    <p>Acompanhe todas as etapas dos concursos em um só lugar</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 flex flex-col flex-grow">
                <ul className="space-y-3 mb-6 flex-grow">
                  <li className="flex items-center">
                    <div className="mr-3 text-emerald-500"><CheckSquare size={18} /></div>
                    <span>Notificações de novos editais</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 text-emerald-500"><CheckSquare size={18} /></div>
                    <span>Resultados oficiais</span>
                  </li>
                  <li className="flex items-center">
                    <div className="mr-3 text-emerald-500"><CheckSquare size={18} /></div>
                    <span>Informações sobre nomeações e convocações</span>
                  </li>
                </ul>
                
                <Link to="/editais">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                    Ver concursos com ranking
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-emerald-600 text-white py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para conquistar sua aprovação?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a milhares de concurseiros que estão juntos trocando experiências em nossa comunidade.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/concursos">
              <Button className="bg-white text-emerald-600 hover:bg-gray-100 rounded-md text-lg px-8 py-3 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
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
