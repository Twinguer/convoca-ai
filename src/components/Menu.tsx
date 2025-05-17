
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { UserMenu } from './UserMenu';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { Logo } from '@/assets/logo';

export const Menu: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-4 font-semibold">
          <div onClick={() => navigate('/')} className="cursor-pointer">
            <Logo height={30} />
          </div>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Rankings</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <Link
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-emerald-500 to-emerald-600 p-6 no-underline outline-none focus:shadow-md"
                          to="/resultados"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium text-white">
                            Classificações
                          </div>
                          <p className="text-sm leading-tight text-white/90">
                            Veja a classificação de todos os concursos da plataforma.
                          </p>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div onClick={() => navigate('/cebraspe')}>
                            <div className="text-sm font-medium leading-none">Cebraspe</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Todos os concursos do Cebraspe
                            </p>
                          </div>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div onClick={() => navigate('/fgv')}>
                            <div className="text-sm font-medium leading-none">FGV</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Todos os concursos da FGV
                            </p>
                          </div>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div onClick={() => navigate('/fcc')}>
                            <div className="text-sm font-medium leading-none">FCC</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Todos os concursos da FCC
                            </p>
                          </div>
                        </div>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <div className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                          <div onClick={() => navigate('/vunesp')}>
                            <div className="text-sm font-medium leading-none">Vunesp</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Todos os concursos da Vunesp
                            </p>
                          </div>
                        </div>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    className={navigationMenuTriggerStyle()}
                    to="/editais"
                  >
                    Editais
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    className={navigationMenuTriggerStyle()}
                    to="/nomeacoes"
                  >
                    Nomeações
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link 
                    className={navigationMenuTriggerStyle()}
                    to="/comunidade"
                  >
                    Comunidade
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="ml-auto flex items-center space-x-4">
          <UserMenu />
        </div>
      </div>
    </header>
  );
};
