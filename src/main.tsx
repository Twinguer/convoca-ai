
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { scheduleScraper } from './services/scraperService.ts'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeProvider as ColorThemeProvider } from '@/contexts/ThemeContext'
import { PresenceProvider } from '@/contexts/PresenceContext'

// Initialize data fetching for concursos
const initializeConcursos = async () => {
  try {
    await scheduleScraper();
    console.log('Initial data load completed');
  } catch (error) {
    console.error('Initial data load failed:', error);
  }
};

// Call initialization
initializeConcursos();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ColorThemeProvider>
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <PresenceProvider>
        <App />
      </PresenceProvider>
    </ThemeProvider>
  </ColorThemeProvider>
)
