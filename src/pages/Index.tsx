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
  Trophy, 
  Users, 
  Briefcase,
  CheckSquare,
  BarChart3,
  Mail,
  MapPin,
  Instagram,
  UserCircle2,
  LayoutDashboard,
  Search
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { 
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious
} from "@/components/ui/carousel";
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import Logo from '@/assets/logo';

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50">
      {/* Hero Section with new layout matching the design */}
      <section className="relative py-16 px-4 overflow-hidden">
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side with text */}
            <div className="space-y-8">
              <div>
                <Logo variant="large" className="h-20 w-auto mb-8" />
                <h1 className="text-4xl md:text-5xl font-bold text-emerald-700 mb-4">
                  Somos todos concurseiros onde o que conta é o TBC.
                </h1>
                <p className="text-xl text-gray-700 mb-6">
                  Compare seus resultados em rankings pós-prova com o resultado oficial da banca.
                </p>
                <Link to="/editais">
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-md px-6 py-3 shadow-lg hover:shadow-xl transition duration-300">
                    Ver Rankings
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right side with images */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <img 
                  src="https://tibizurada.store/img-03.png" 
                  alt="Concurseiro estudando" 
                  className="rounded-lg shadow-md w-full h-100 object-cover"
                />
                <img 
                  src="https://tibizurada.store/img-04.png" 
                  alt="Material de estudo" 
                  className="rounded-lg shadow-md w-full h-64 object-cover"
                />
              </div>
              <div className="mt-8 space-y-4">
                <img 
                  src="https://tibizurada.store/img-05.png" 
                  alt="Pessoa comemorando aprovação" 
                  className="rounded-lg shadow-md w-full h-64 object-cover"
                />
                <img 
                  src="/lovable-uploads/95b3453d-2c74-48d6-b670-44eff515a18a.png" 
                  alt="Ranking de aprovados" 
                  className="rounded-lg shadow-md w-full h-48 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Section heading */}
      <section className="bg-white py-12 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold text-center mb-4">Siga pessoas com o mesmo propósito que o seu</h2>
          <p className="text-gray-600 text-center max-w-2xl mx-auto mb-12">
            Uma plataforma para acompanhar seus resultados. Uma comunidade só para quem é concurseiro. Já recebeu seu convite? 
          </p>
        </div>
      </section>

      {/* Features Section with Carousel */}
      <section className="bg-white py-12 px-4">
        <div className="container mx-auto">
          <Carousel className="w-full max-w-5xl mx-auto">
            <CarouselContent>
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="feature-card group p-1 h-full">
                  <div className="relative overflow-hidden h-48">
                    <img 
                      src="https://tibizurada.store/img-03.png" 
                      alt="Hora dos estudos" 
                      className="feature-card-image group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Informações Atualizados</h3>
                    <p className="text-gray-600">
                      Todos os participantes comprovaram que fazem ou já fizeram algum concurso público. 
                    </p>
                  </div>
                </div>
              </CarouselItem>
              
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="feature-card group p-1 h-full">
                  <div className="relative overflow-hidden h-48">
                    <img 
                      src="https://tibizurada.store/img-04.png" 
                      alt="Hora da prova" 
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
              </CarouselItem>
              
              <CarouselItem className="md:basis-1/2 lg:basis-1/3">
                <div className="feature-card group p-1 h-full">
                  <div className="relative overflow-hidden h-48">
                    <img 
                      src="https://tibizurada.store/img-05.png" 
                      alt="Fui nomeado" 
                      className="feature-card-image group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                  <div className="p-6">
                    <div className="bg-emerald-100 p-4 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                      <Briefcase className="h-8 w-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Conhecemos o Processo</h3>
                    <p className="text-gray-600">
                      Sabemos que a jornada é longa e muitas vezes solitária, estamos aqui para te dar um ânimo. Somos todos iguais a você, buscamos o mesmo objetivo.
                    </p>
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
            <a 
              href="https://instagram.com/convoca.ai" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center bg-white text-pink-600 font-semibold py-2 px-6 rounded-full hover:bg-pink-100 transition duration-300"
            >
              <Instagram className="mr-2 h-5 w-5" />
              @convoca.ai
            </a>
          </div>
        </div>
      </section>
      
      {/* Footer with logo added */}
      <footer className="bg-gray-900 text-gray-300">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <img 
                  src="https://tibizurada.store/logo-01.png" 
                  alt="Convoca.ai Logo" 
                  className="h-10 w-auto" 
                />
              </div>
              <p className="mb-4">
                Uma plataforma para acompanhar seus resultados. Uma comunidade só para quem é concurseiro.
              </p>
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
                <a 
                  href="https://instagram.com/convoca.ai" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
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
            
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Sobre</h3>
              <p>
                Nossa missão é ajudar concurseiros a acompanhar seus resultados e conectar-se com uma comunidade de pessoas com o mesmo propósito.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center">
            <p>&copy; {new Date().getFullYear()} Convoca.ai. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
