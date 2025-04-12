import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Book, ChevronRight, FileText, GraduationCap, Trophy, Users, Briefcase, CheckSquare, BarChart3, ChartPieIcon, Mail, MapPin, Instagram } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
const Index = () => {
  const {
    user
  } = useAuth();
  return <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
      {/* Hero Section with Image */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-100/50 to-emerald-50/50 z-0"></div>
        <div className="absolute inset-0 z-0 opacity-10" style={{
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.2\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
      }}></div>
        
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-emerald-800 text-transparent bg-clip-text">
                Somos todos concurseiros onde o que conta é o HBC. 
              </h1>
              <p className="text-xl text-gray-700 mb-8">
                Compare seus resultados em rankings pós-prova com o resultado oficial da banca.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link to="/editais">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-lg w-full sm:w-auto px-8 py-6 shadow-lg hover:shadow-xl transition duration-300 transform hover:-translate-y-1">
                    Rankings
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                
                {!user && <Link to="/auth">
                    <Button variant="outline" className="border-emerald-600 text-emerald-600 hover:bg-emerald-50 rounded-md text-lg w-full sm:w-auto px-8 py-6 shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1">
                      Criar Conta
                      <Users className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>}
              </div>
            </div>
            
            <div className="relative animate-fade-in hidden md:block">
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full mix-blend-multiply filter blur-xl opacity-90 animate-float"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full mix-blend-multiply filter blur-xl opacity-90 animate-float" style={{
              animationDelay: '1s'
            }}></div>
              
              <img src="https://tibizurada.store/img-10.png" alt="Estudante se preparando para concurso" className="w-full h-auto object-cover" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section with Carousel */}
      <section className="bg-white py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">Siga pessoas com o mesmo propósito que o seu.</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">Uma plataforma para acompanhar seus resultados. Uma comunidade para quem é concurseiro. Já recebeu seu convite?</p>
          
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="feature-card group p-1 h-full">
                  <div className="relative overflow-hidden h-48">
                    <img src="https://tibizurada.store/img-03.png" alt="Tempo TBC" className="feature-card-image group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Mantenha o foco.</h3>
                    <p className="text-gray-600">É importante que tenhamos tudo por perto, inclusive como estão os meus resultados e o dos outros candidatos.</p>
                  </div>
                </div>
              </CarouselItem>
              
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="feature-card group p-1 h-full">
                  <div className="relative overflow-hidden h-48">
                    <img src="https://tibizurada.store/img-04.png" alt="Dia da Prova" className="feature-card-image group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <Trophy className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Cabeça fria.</h3>
                    <p className="text-gray-600">Com o Convoca Aí vamos para a prova sabendo quem são os nossos concorrentes que em que nível eles estão. </p>
                  </div>
                </div>
              </CarouselItem>
              
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="feature-card group p-1 h-full">
                  <div className="relative overflow-hidden h-48">
                    <img src="https://tibizurada.store/img-05.png" alt="Resultado" className="feature-card-image group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <Briefcase className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Nomeações e Convocações</h3>
                    <p className="text-gray-600">Como estamos todos aqui, acompanhe as nomeações e convocações. Veja se quem está melhor colocado assumiu o cargo.</p>
                  </div>
                </div>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="bg-emerald-600 text-white py-16 px-4 mb-0">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Pronto para conquistar sua aprovação?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Junte-se a nós e vamos juntos iniciar uma comunidade onde temos o mesmo propósito: A tão sonhada nomeação no cargo dos sonhos!
          </p>
        </div>
      </section>

      {/* Instagram Banner */}
      <section className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between text-white">
            <div className="mb-4 md:mb-0">
              <h3 className="text-2xl font-bold">Siga a gente no Instagram</h3>
              <p className="text-white/90">Dicas exclusivas, novidades e interações com a comunidade</p>
            </div>
            <a href="https://instagram.com/convoca.ai" target="_blank" rel="noopener noreferrer" className="flex items-center bg-white text-pink-600 font-semibold py-2 px-6 rounded-full hover:bg-pink-100 transition duration-300">
              <Instagram className="mr-2 h-5 w-5" />
              @convoca.ai
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="mb-4">
                <img alt="Convoca.ai Logo" src="/lovable-uploads/15560250-f133-4c6d-ad11-a8931bd1c2ce.png" className="h-30 w-auto object-contain" />
              </div>
              
              <div className="flex items-center mt-4">
                <Mail className="h-5 w-5 mr-2" />
                <span>contato@convocai.com.br</span>
              </div>
              <div className="flex items-center mt-2">
                <MapPin className="h-5 w-5 mr-2" />
                <span>São Paulo</span>
              </div>
              <div className="flex items-center mt-2">
                <Instagram className="h-5 w-5 mr-2" />
                <a href="https://instagram.com/convoca.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  @convoca.ai
                </a>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Links Rápidos</h3>
              <ul className="space-y-2">
                <li>
                  <Link to="/editais" className="hover:text-white transition-colors">Editais</Link>
                </li>
                <li>
                  <Link to="/pre-classificacao" className="hover:text-white transition-colors">Pré-classificação</Link>
                </li>
                <li>
                  <Link to="/comunidade" className="hover:text-white transition-colors">Comunidade</Link>
                </li>
                <li>
                  <Link to="/auth" className="hover:text-white transition-colors">Criar Conta</Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Suporte</h3>
              <ul className="space-y-2">
                <li>
                  <a href="#" className="hover:text-white transition-colors">FAQ</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Contato</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                </li>
              </ul>
            </div>
            
            
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Convoca.ai. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Index;