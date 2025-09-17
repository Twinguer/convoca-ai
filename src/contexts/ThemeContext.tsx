import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'emerald' | 'rose' | 'blue' | 'slate' | 'purple';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('app-theme');
    return (saved as Theme) || 'emerald';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Remove todas as classes de tema
    root.classList.remove('theme-emerald', 'theme-rose', 'theme-blue', 'theme-slate', 'theme-purple');
    
    // Adiciona a classe do tema atual
    root.classList.add(`theme-${theme}`);
    
    // Salva no localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};