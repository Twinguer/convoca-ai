
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';
import UserMenu from './UserMenu';

const Menu = () => {
  const location = useLocation();
  const pathname = location.pathname;

  const isActive = (path: string) => {
    if (path === '/' && pathname === '/') return true;
    if (path !== '/' && pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden font-bold sm:inline-block">
              Convoca<span className="text-convoca-600">.</span>
            </span>
          </Link>
          <nav className="flex items-center gap-3 font-medium md:gap-6">
            <Link
              to="/"
              className={cn(
                "text-foreground/60 transition-colors hover:text-foreground",
                isActive('/') ? "text-foreground" : ""
              )}
            >
              Home
            </Link>
            <Link
              to="/concursos"
              className={cn(
                "text-foreground/60 transition-colors hover:text-foreground",
                isActive('/concursos') ? "text-foreground" : ""
              )}
            >
              Concursos
            </Link>
            <Link
              to="/editais"
              className={cn(
                "text-foreground/60 transition-colors hover:text-foreground",
                isActive('/editais') ? "text-foreground" : ""
              )}
            >
              Editais
            </Link>
            <Link
              to="/pre-classificacao"
              className={cn(
                "text-foreground/60 transition-colors hover:text-foreground",
                isActive('/pre-classificacao') ? "text-foreground" : ""
              )}
            >
              Pré-classificação
            </Link>
            <Link
              to="/nomeacoes"
              className={cn(
                "text-foreground/60 transition-colors hover:text-foreground",
                isActive('/nomeacoes') ? "text-foreground" : ""
              )}
            >
              Nomeações
            </Link>
          </nav>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:text-accent-foreground h-9 py-2 mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
          type="button"
          aria-haspopup="dialog"
          aria-expanded="false"
          aria-controls="radix-:R36hja:"
          data-state="closed"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <line x1="4" x2="20" y1="12" y2="12"></line>
            <line x1="4" x2="20" y1="6" y2="6"></line>
            <line x1="4" x2="20" y1="18" y2="18"></line>
          </svg>
          <span className="sr-only">Toggle Menu</span>
        </button>
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
