
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Users, Home, FileText, Trophy, AwardCheck, User } from 'lucide-react';

const Menu = () => {
  const location = useLocation();
  
  const isActive = (paths: string[]) => {
    return paths.some(path => location.pathname === path || location.pathname.startsWith(path));
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto py-4 px-4 flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/" className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">ConvocAI</span>
          </Link>
        </div>
        
        <nav className="flex flex-wrap justify-center gap-1 md:gap-0.5">
          <Button
            variant={isActive(['/']) ? 'default' : 'ghost'}
            asChild
            className="flex items-center gap-1"
          >
            <Link to="/">
              <Home className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Início</span>
            </Link>
          </Button>
          
          <Button
            variant={isActive(['/editais']) ? 'default' : 'ghost'}
            asChild
            className="flex items-center gap-1"
          >
            <Link to="/editais">
              <FileText className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Editais</span>
            </Link>
          </Button>
          
          <Button
            variant={isActive(['/concursos', '/concurso']) ? 'default' : 'ghost'}
            asChild
            className="flex items-center gap-1"
          >
            <Link to="/concursos">
              <Users className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Concursos</span>
            </Link>
          </Button>
          
          <Button
            variant={isActive(['/pre-classificacao']) ? 'default' : 'ghost'}
            asChild
            className="flex items-center gap-1"
          >
            <Link to="/pre-classificacao">
              <Trophy className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Pré-classificação</span>
            </Link>
          </Button>
          
          <Button
            variant={isActive(['/resultado']) ? 'default' : 'ghost'}
            asChild
            className="flex items-center gap-1"
          >
            <Link to="/resultado">
              <AwardCheck className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Resultado</span>
            </Link>
          </Button>
          
          <Button
            variant={isActive(['/nomeacoes']) ? 'default' : 'ghost'}
            asChild
            className="flex items-center gap-1"
          >
            <Link to="/nomeacoes">
              <User className="h-4 w-4" />
              <span className="hidden md:inline ml-1">Nomeações</span>
            </Link>
          </Button>
          
          <Button
            variant="outline"
            asChild
            className="flex items-center gap-1 ml-2"
          >
            <Link to="/admin/login">
              <User className="h-4 w-4" />
              <span className="ml-1">Admin</span>
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Menu;
