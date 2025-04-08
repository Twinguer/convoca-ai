
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu as MenuIcon, X, ChevronDown } from 'lucide-react';
import Logo from '../assets/logo';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const Menu: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const concursosBancas = [
    { name: 'Cebraspe', path: '/concursos/cebraspe' },
    { name: 'FCC', path: '/concursos/fcc' },
    { name: 'FGV', path: '/concursos/fgv' },
    { name: 'Vunesp', path: '/concursos/vunesp' },
  ];

  const navItems = [
    { 
      path: '/concursos', 
      label: 'Concursos',
      hasSubmenu: true,
      submenu: concursosBancas
    },
    { path: '/pre-classificacao', label: 'Pré-Classificação', hasSubmenu: false },
    { path: '/resultado', label: 'Resultado', hasSubmenu: false },
    { path: '/nomeacoes', label: 'Nomeações', hasSubmenu: false },
  ];

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/">
                <Logo className="h-10 w-auto" />
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => (
                item.hasSubmenu ? (
                  <NavigationMenu key={item.path}>
                    <NavigationMenuList>
                      <NavigationMenuItem>
                        <NavigationMenuTrigger className={isActive(item.path) ? 'text-convoca-600 border-b-2 border-convoca-600' : 'text-gray-500 hover:text-gray-700'}>
                          {item.label}
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                          <ul className="grid gap-3 p-4 w-[200px]">
                            {item.submenu?.map((subItem) => (
                              <li key={subItem.path}>
                                <NavigationMenuLink asChild>
                                  <Link
                                    to={subItem.path}
                                    className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                                  >
                                    <div className="text-sm font-medium leading-none">{subItem.name}</div>
                                  </Link>
                                </NavigationMenuLink>
                              </li>
                            ))}
                          </ul>
                        </NavigationMenuContent>
                      </NavigationMenuItem>
                    </NavigationMenuList>
                  </NavigationMenu>
                ) : (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={isActive(item.path) ? 'nav-link-active' : 'nav-link'}
                  >
                    {item.label}
                  </Link>
                )
              ))}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden">
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-convoca-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <MenuIcon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`sm:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="pt-2 pb-3 space-y-1">
          {navItems.map((item) => (
            <React.Fragment key={item.path}>
              {item.hasSubmenu ? (
                <>
                  <div className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700">
                    {item.label}
                  </div>
                  <div className="pl-6">
                    {item.submenu?.map((subItem) => (
                      <Link
                        key={subItem.path}
                        to={subItem.path}
                        className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <Link
                  to={item.path}
                  className={`block pl-3 pr-4 py-2 border-l-4 ${
                    isActive(item.path)
                      ? 'border-convoca-500 text-convoca-700 bg-convoca-50 font-medium'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Menu;
