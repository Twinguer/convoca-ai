
import { supabase } from '../integrations/supabase/client';
import { Concurso, ConcursoFilter } from '../types/concursos';

export const fetchConcursos = async (filters?: ConcursoFilter): Promise<Concurso[]> => {
  let query = supabase
    .from('concursos')
    .select('*');

  // Apply filters if provided
  if (filters) {
    if (filters.orgao) {
      query = query.eq('orgao', filters.orgao);
    }
    if (filters.banca) {
      query = query.eq('banca', filters.banca);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
  }

  // Order by publication date (newest first)
  query = query.order('data_publicacao', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching concursos:', error);
    throw new Error('Failed to fetch concursos');
  }

  // If no data is returned, we'll provide some mock data for development
  if (!data || data.length === 0) {
    console.log('No concursos found in database, using mock data');
    return filters?.banca === 'Cebraspe' ? getMockCebraspeConcursos() : getMockConcursos();
  }

  return data as Concurso[];
};

export const fetchConcursoById = async (id: string): Promise<Concurso | null> => {
  const { data, error } = await supabase
    .from('concursos')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching concurso by ID:', error);
    return getMockConcursoById(id);
  }

  return data as Concurso;
};

export const triggerScrapeCebraspe = async (): Promise<void> => {
  try {
    console.log('Triggering Cebraspe scraper...');
    const response = await fetch('https://ppsymqrdtjyaguftracc.functions.supabase.co/scrape-cebraspe', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorDetails = await response.text();
      console.error(`Error response: ${errorDetails}`);
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Scraping successful:', result);
  } catch (error) {
    console.error('Error triggering scrape:', error);
    throw new Error('Failed to trigger scrape');
  }
};

// Update main.tsx to trigger the scraper less frequently to avoid hitting API limits
export const scheduleScraper = () => {
  // Only run once every 6 hours
  const lastScraped = localStorage.getItem('lastScraped');
  const now = new Date();
  
  if (!lastScraped || (now.getTime() - new Date(lastScraped).getTime()) > 6 * 60 * 60 * 1000) {
    console.log('Scheduled scraping initiated...');
    triggerScrapeCebraspe()
      .then(() => {
        localStorage.setItem('lastScraped', now.toISOString());
        console.log('Scheduled scraping completed');
      })
      .catch(err => console.error('Scheduled scraping failed:', err));
  } else {
    console.log('Skipping scheduled scraping - ran recently');
  }
};

// Mock concursos for development
const getMockConcursos = (): Concurso[] => {
  const currentYear = new Date().getFullYear();
  
  return [
    {
      id: "1",
      titulo: "Concurso Banco do Brasil",
      orgao: "Banco do Brasil",
      banca: "Cebraspe",
      vagas: 4000,
      inscritos: 1500000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/bb_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-03-15`
    },
    {
      id: "2",
      titulo: "Concurso Polícia Federal - Agente",
      orgao: "Polícia Federal",
      banca: "Cebraspe",
      vagas: 1500,
      inscritos: 500000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/pf_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-20`
    },
    {
      id: "3",
      titulo: "Concurso INSS",
      orgao: "INSS",
      banca: "Cebraspe",
      vagas: 1000,
      inscritos: 1000000,
      etapa_atual: "Resultado Final",
      link: "https://www.cebraspe.org.br/concursos/inss_22",
      status: "Finalizado",
      data_publicacao: `${currentYear-1}-11-10`
    },
    {
      id: "4",
      titulo: "Tribunal Regional Federal da 1ª Região",
      orgao: "TRF 1",
      banca: "Cebraspe",
      vagas: 250,
      inscritos: 120000,
      etapa_atual: "Prova de Títulos",
      link: "https://www.cebraspe.org.br/concursos/trf1_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-02-28`
    },
    {
      id: "5",
      titulo: "Concurso Ministério Público Federal",
      orgao: "MPF",
      banca: "Cebraspe",
      vagas: 100,
      inscritos: 80000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/mpf_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-04-05`
    },
    {
      id: "6",
      titulo: "Banco Central do Brasil",
      orgao: "BACEN",
      banca: "Cebraspe",
      vagas: 100,
      inscritos: 150000,
      etapa_atual: "Prova Discursiva",
      link: "https://www.cebraspe.org.br/concursos/bacen_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-15`
    }
  ];
};

// Mock Cebraspe concursos 
const getMockCebraspeConcursos = (): Concurso[] => {
  const currentYear = new Date().getFullYear();
  
  return [
    {
      id: "c1",
      titulo: "Concurso Banco do Brasil",
      orgao: "Banco do Brasil",
      banca: "Cebraspe",
      vagas: 4000,
      inscritos: 1500000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/bb_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-03-15`
    },
    {
      id: "c2",
      titulo: "Polícia Federal - Agente",
      orgao: "Polícia Federal",
      banca: "Cebraspe",
      vagas: 1500,
      inscritos: 500000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/pf_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-20`
    },
    {
      id: "c3",
      titulo: "INSS - Técnico do Seguro Social",
      orgao: "INSS",
      banca: "Cebraspe",
      vagas: 1000,
      inscritos: 1000000,
      etapa_atual: "Resultado Final",
      link: "https://www.cebraspe.org.br/concursos/inss_22",
      status: "Finalizado",
      data_publicacao: `${currentYear-1}-11-10`
    },
    {
      id: "c4",
      titulo: "Tribunal Regional Federal - 1ª Região",
      orgao: "TRF 1",
      banca: "Cebraspe",
      vagas: 250,
      inscritos: 120000,
      etapa_atual: "Prova de Títulos",
      link: "https://www.cebraspe.org.br/concursos/trf1_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-02-28`
    },
    {
      id: "c5",
      titulo: "Ministério Público Federal",
      orgao: "MPF",
      banca: "Cebraspe",
      vagas: 100,
      inscritos: 80000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/mpf_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-04-05`
    },
    {
      id: "c6",
      titulo: "Banco Central do Brasil",
      orgao: "BACEN",
      banca: "Cebraspe",
      vagas: 100,
      inscritos: 150000,
      etapa_atual: "Prova Discursiva",
      link: "https://www.cebraspe.org.br/concursos/bacen_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-15`
    },
    {
      id: "c7",
      titulo: "Agência Nacional de Transportes Terrestres",
      orgao: "ANTT",
      banca: "Cebraspe",
      vagas: 150,
      inscritos: 95000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/antt_22",
      status: "Em andamento",
      data_publicacao: `${currentYear-1}-12-10`
    },
    {
      id: "c8",
      titulo: "Defensoria Pública da União",
      orgao: "DPU",
      banca: "Cebraspe",
      vagas: 50,
      inscritos: 30000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/dpu_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-03-25`
    },
    {
      id: "c9",
      titulo: "Tribunal Superior Eleitoral",
      orgao: "TSE",
      banca: "Cebraspe",
      vagas: 70,
      inscritos: 85000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/tse_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-02-10`
    },
    {
      id: "c10",
      titulo: "Agência Nacional de Energia Elétrica",
      orgao: "ANEEL",
      banca: "Cebraspe",
      vagas: 80,
      inscritos: 60000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/aneel_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-05-01`
    },
    {
      id: "c11",
      titulo: "Tribunal de Contas da União",
      orgao: "TCU",
      banca: "Cebraspe",
      vagas: 30,
      inscritos: 45000,
      etapa_atual: "Resultado Preliminar",
      link: "https://www.cebraspe.org.br/concursos/tcu_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-30`
    },
    {
      id: "c12",
      titulo: "Agência Brasileira de Inteligência",
      orgao: "ABIN",
      banca: "Cebraspe",
      vagas: 90,
      inscritos: 75000,
      etapa_atual: "Prova de Capacidade Física",
      link: "https://www.cebraspe.org.br/concursos/abin_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-03-05`
    },
    {
      id: "c13",
      titulo: "Polícia Rodoviária Federal",
      orgao: "PRF",
      banca: "Cebraspe",
      vagas: 2000,
      inscritos: 350000,
      etapa_atual: "Curso de Formação",
      link: "https://www.cebraspe.org.br/concursos/prf_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-01-05`
    },
    {
      id: "c14",
      titulo: "Receita Federal do Brasil",
      orgao: "RFB",
      banca: "Cebraspe",
      vagas: 700,
      inscritos: 220000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/rfb_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-04-15`
    },
    {
      id: "c15",
      titulo: "Superior Tribunal de Justiça",
      orgao: "STJ",
      banca: "Cebraspe",
      vagas: 50,
      inscritos: 65000,
      etapa_atual: "Prova Discursiva",
      link: "https://www.cebraspe.org.br/concursos/stj_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-02-15`
    },
    {
      id: "c16",
      titulo: "Instituto Brasileiro de Geografia e Estatística",
      orgao: "IBGE",
      banca: "Cebraspe",
      vagas: 5000,
      inscritos: 180000,
      etapa_atual: "Resultado Final",
      link: "https://www.cebraspe.org.br/concursos/ibge_22",
      status: "Finalizado",
      data_publicacao: `${currentYear-1}-10-20`
    },
    {
      id: "c17",
      titulo: "Controladoria-Geral da União",
      orgao: "CGU",
      banca: "Cebraspe",
      vagas: 120,
      inscritos: 95000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/cgu_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-04-25`
    },
    {
      id: "c18",
      titulo: "Banco da Amazônia",
      orgao: "BASA",
      banca: "Cebraspe",
      vagas: 300,
      inscritos: 70000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/basa_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-03-10`
    },
    {
      id: "c19",
      titulo: "Petrobras",
      orgao: "Petrobras",
      banca: "Cebraspe",
      vagas: 1500,
      inscritos: 250000,
      etapa_atual: "Inscrições Abertas",
      link: "https://www.cebraspe.org.br/concursos/petrobras_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-05-05`
    },
    {
      id: "c20",
      titulo: "Polícia Federal - Escrivão",
      orgao: "Polícia Federal",
      banca: "Cebraspe",
      vagas: 800,
      inscritos: 180000,
      etapa_atual: "Prova Objetiva",
      link: "https://www.cebraspe.org.br/concursos/pf_escrivao_23",
      status: "Em andamento",
      data_publicacao: `${currentYear}-02-20`
    }
  ];
};

// Mock concurso by ID
const getMockConcursoById = (id: string): Concurso => {
  const mockConcursos = getMockConcursos();
  const concurso = mockConcursos.find(c => c.id === id);
  
  if (concurso) {
    return concurso;
  }
  
  // Default concurso if ID not found
  return {
    id: id,
    titulo: "Concurso Exemplo",
    orgao: "Órgão Federal",
    banca: "Cebraspe",
    vagas: 100,
    inscritos: 50000,
    etapa_atual: "Inscrições Abertas",
    link: "https://www.cebraspe.org.br/concursos/exemplo",
    status: "Em andamento",
    data_publicacao: new Date().toISOString().split('T')[0]
  };
};
