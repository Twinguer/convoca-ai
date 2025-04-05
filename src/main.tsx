
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { triggerScrapeCebraspe } from './services/concursoService.ts'

// Initialize data fetching for concursos
const initializeConcursos = async () => {
  try {
    await triggerScrapeCebraspe();
    console.log('Initial scraping completed');
  } catch (error) {
    console.error('Initial scraping failed:', error);
  }
};

// Call initialization
initializeConcursos();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
