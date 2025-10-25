import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import UserMenu from './UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from "@/components/ui/navigation-menu";
import { LayoutDashboard, FileText, Award, Medal, Users, Menu as MenuIcon, MessageSquare, Trophy, Home, ShieldAlert, BookOpen, CreditCard, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { UserActions } from './Admin/UserActions';
import AdminMenu from './AdminMenu';
const Menu = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  useEffect(() => {
    // Check if admin mode is enabled via URL param
    const urlParams = new URLSearchParams(window.location.search);
    const adminParam = urlParams.get('admin');
    setIsAdminMode(adminParam === 'true');
  }, [location]);
  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };
  const isAdmin = () => {
    return user?.email?.includes('admin') || isAdminMode;
  };
  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  return <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        {/* User login button - Now on the left */}
        <div className="flex items-center">
          <UserMenu />
          {isAdminMode && <div className="ml-4 bg-accent text-accent-foreground px-2 py-1 rounded-md flex items-center">
              <ShieldAlert className="h-4 w-4 mr-1" />
              <span className="text-xs font-medium">Modo Administrador</span>
            </div>}
        </div>
        
        {/* Navigation - Now on the right */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="space-x-1">
              <NavigationMenuItem>
                <Link to="/">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/pre-classificacao">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                     <Trophy className="mr-2 h-4 w-4 text-primary" />
                    Ranking
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/estudos">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Estudar
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link to="/estatisticas">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Estatistica
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
                <Link to="/planos">
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Planos
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              {isAdmin() && <NavigationMenuItem>
                <NavigationMenuTrigger>Admin</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="p-4">
                    <AdminMenu />
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>}
            </NavigationMenuList>
          </NavigationMenu>

          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
                <MenuIcon className="w-6 h-6" />
                <span className="sr-only">Abrir Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pr-0 max-w-[280px]">
              <nav className="flex flex-col gap-4 px-4 pt-8">
                <Link to="/" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/') ? "text-primary" : "text-foreground/70")}>
                  <Home className="mr-2 h-4 w-4" />
                  Home
                </Link>
                <Link to="/pre-classificacao" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/pre-classificacao') ? "text-primary" : "text-foreground/70")}>
                  <Trophy className="mr-2 h-4 w-4 text-primary" />
                  Ranking
                </Link>
                <Link to="/estudos" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/estudos') ? "text-primary" : "text-foreground/70")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Estudar
                </Link>
                <Link to="/estatisticas" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/estatisticas') ? "text-primary" : "text-foreground/70")}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Estatistica
                </Link>
                <Link to="/comunidade" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/comunidade') ? "text-primary" : "text-foreground/70")}>
                  <Users className="mr-2 h-4 w-4" />
                  Comunidade
                </Link>
                <Link to="/planos" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/planos') ? "text-primary" : "text-foreground/70")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Planos
                </Link>
                
                {isAdmin() && <>
                  <div className="h-px bg-border mt-2 mb-2"></div>
                  <div className="font-bold text-foreground/70 mb-2">Administração</div>
                  <Link to="/project/admin/man/dashboard" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/admin/dashboard') ? "text-primary" : "text-foreground/70")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                  <Link to="/project/admin/man/concursos" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/admin/concursos') ? "text-primary" : "text-foreground/70")}>
                    <FileText className="mr-2 h-4 w-4" />
                    Concursos
                  </Link>
                  <Link to="/project/admin/man/usuarios" onClick={handleLinkClick} className={cn("flex items-center text-lg font-semibold", isActive('/admin/usuarios') ? "text-primary" : "text-foreground/70")}>
                    <Users className="mr-2 h-4 w-4" />
                    Usuários
                  </Link>
                </>}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>;
};
export default Menu;