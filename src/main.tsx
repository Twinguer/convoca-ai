
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { scheduleScraper } from './services/concursoService.ts'

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
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
