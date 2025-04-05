
export interface Concurso {
  id: string;
  titulo: string;
  orgao: string;
  banca: string;
  vagas: number;
  inscritos: number;
  etapa_atual: string;
  link: string;
  status: string;
  data_publicacao: string;
  created_at?: string;
  updated_at?: string;
}

export interface ConcursoFilter {
  orgao?: string;
  banca?: string;
  status?: string;
}
