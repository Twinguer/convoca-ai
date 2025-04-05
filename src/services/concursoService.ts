
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

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching concursos:', error);
    throw new Error('Failed to fetch concursos');
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
    return null;
  }

  return data as Concurso;
};

export const triggerScrapeCebraspe = async (): Promise<void> => {
  try {
    const response = await fetch('https://ppsymqrdtjyaguftracc.functions.supabase.co/scrape-cebraspe', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const result = await response.json();
    console.log('Scraping successful:', result);
  } catch (error) {
    console.error('Error triggering scrape:', error);
    throw new Error('Failed to trigger scrape');
  }
};
