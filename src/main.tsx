
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { ThemeProvider } from '@/components/theme-provider'
import { ThemeProvider as ColorThemeProvider } from '@/contexts/ThemeContext'
import { PresenceProvider } from '@/contexts/PresenceContext'

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
