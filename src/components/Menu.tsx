
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import UserMenu from './UserMenu';
import { useAuth } from '@/hooks/useAuth';
import Logo from '@/assets/logo';
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { 
  LayoutDashboard, 
  FileText, 
  Award, 
  Medal, 
  Users,
  Menu as MenuIcon,
  MessageSquare,
  Trophy
} from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';

const Menu = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  const isAdmin = () => {
    // Verificar se o usuário possui privilégios de administrador
    // Isso poderia ser baseado em metadados do usuário ou em uma tabela de roles
    return user?.email?.includes('admin'); // Exemplo simples, deve ser substituído por lógica real
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <Logo variant="full" className="h-12 w-auto" />
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/comunidade">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Users className="mr-2 h-4 w-4" />
                    Comunidade
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/pre-classificacao">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                    Rankings
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              {isAdmin() && (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Administração</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid gap-3 p-4 w-[220px]">
                      <li>
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <LayoutDashboard className="mr-2 h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Dashboard</div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/concursos"
                          className="flex items-center select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Concursos</div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/concursos/novo"
                          className="flex items-center select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <Medal className="mr-2 h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Novo Concurso</div>
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="/admin/usuarios"
                          className="flex items-center select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <Users className="mr-2 h-4 w-4" />
                          <div className="text-sm font-medium leading-none">Usuários</div>
                        </Link>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <MenuIcon className="w-6 h-6" />
              <span className="sr-only">Abrir Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <div className="px-7">
              <Link to="/" className="flex items-center space-x-2 mb-8">
                <Logo variant="full" className="h-10 w-auto" />
              </Link>
            </div>
            <nav className="flex flex-col gap-4 px-7">
              <Link to="/" className={cn("flex items-center text-lg font-semibold", isActive('/') ? "text-convoca-600" : "text-foreground/70")}>
                Home
              </Link>
              <Link to="/comunidade" className={cn("flex items-center text-lg font-semibold", isActive('/comunidade') ? "text-convoca-600" : "text-foreground/70")}>
                <Users className="mr-2 h-4 w-4" />
                Comunidade
              </Link>
              <Link to="/pre-classificacao" className={cn("flex items-center text-lg font-semibold", isActive('/pre-classificacao') ? "text-convoca-600" : "text-foreground/70")}>
                <Trophy className="mr-2 h-4 w-4 text-yellow-500" />
                Rankings
              </Link>
              
              {isAdmin() && (
                <>
                  <div className="h-px bg-border mt-2 mb-2"></div>
                  <div className="font-bold text-foreground/70 mb-2">Administração</div>
                  <Link to="/admin/dashboard" className={cn("flex items-center text-lg font-semibold", isActive('/admin/dashboard') ? "text-convoca-600" : "text-foreground/70")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link to="/admin/concursos" className={cn("flex items-center text-lg font-semibold", isActive('/admin/concursos') ? "text-convoca-600" : "text-foreground/70")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Concursos
                  </Link>
                  <Link to="/admin/concursos/novo" className={cn("flex items-center text-lg font-semibold", isActive('/admin/concursos/novo') ? "text-convoca-600" : "text-foreground/70")}>
                    <Medal className="mr-2 h-4 w-4" />
                    Novo Concurso
                  </Link>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 items-center justify-between md:justify-end gap-6">
          <nav className="flex items-center">
            <UserMenu />
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Menu;
