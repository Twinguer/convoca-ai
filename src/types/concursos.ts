
import { Concurso, SubjectConfig } from './concursos.d';

// Re-export types from the .d.ts file
export type { Concurso, SubjectConfig };

// Also define a UserRankingDisplay type since it's being imported in other files
export interface UserRankingDisplay {
  position: number;
  name: string;
  score: number;
  userId: string;
  id: string;
  avatarUrl: string | null;
  basicKnowledgeScore: number;
  specificKnowledgeScore: number;
  specific1Score: number;
  specific2Score: number;
  specific3Score: number;
  discursiveScore: number;
  weightedBasicScore: number;
  weightedSpecific1Score: number;
  weightedSpecific2Score: number;
  weightedSpecific3Score: number;
  weightedDiscursiveScore: number;
  weightedCaseStudy1Score: number;
  weightedCaseStudy2Score: number;
  weightedCaseStudy3Score: number;
  reservationType: string;
  displayReservation: string;
  isQuotaDisqualified?: boolean;
  subjectScores?: Record<string, number>;
  concursoId?: string;
  concursoTitle?: string;
}

// Define a ConcursoFilter type since it's being imported in other files
export interface ConcursoFilter {
  searchTerm?: string;
  orgao?: string[];
  banca?: string[];
  cargo?: string[];
  status?: string | string[]; // Updating status to accept both string and string[] for compatibility
  mostrarStatus?: string[];
  mostrarBanca?: string[];
  mostrarCargo?: string[];
  mostrarOrgao?: string[];
}

// Colunas padrão da tabela de ranking
export const getRankingTableColumns = (concurso: Concurso) => {
  const baseColumns = [
    { id: 'position', label: '#', align: 'center', width: '16' },
    { id: 'name', label: 'Candidato', align: 'left' },
    { id: 'score', label: 'Total', align: 'right' }
  ];
  
  const columns = [...baseColumns];
  
  // Adicionar colunas de conhecimentos básicos e específicos
  if (concurso.has_basic_knowledge) {
    columns.push({ id: 'basicKnowledgeScore', label: 'CB', align: 'right' });
  }
  
  if (concurso.has_specific_knowledge_1) {
    columns.push({ id: 'specific1Score', label: 'CE1', align: 'right' });
  }
  
  if (concurso.has_specific_knowledge_2) {
    columns.push({ id: 'specific2Score', label: 'CE2', align: 'right' });
  }
  
  if (concurso.has_specific_knowledge_3) {
    columns.push({ id: 'specific3Score', label: 'CE3', align: 'right' });
  }
  
  // Adicionar colunas discursivas e estudos de caso
  if (concurso.has_discursive) {
    columns.push({ id: 'discursiveScore', label: 'Disc', align: 'right' });
  }
  
  if (concurso.has_case_study_1) {
    columns.push({ id: 'caseStudy1Score', label: 'EC1', align: 'right' });
  }
  
  if (concurso.has_case_study_2) {
    columns.push({ id: 'caseStudy2Score', label: 'EC2', align: 'right' });
  }
  
  if (concurso.has_case_study_3) {
    columns.push({ id: 'caseStudy3Score', label: 'EC3', align: 'right' });
  }
  
  return columns;
};

// Lista de códigos de disciplina disponíveis
export const availableSubjectCodes = [
  'DIR', 'PORT', 'MAT', 'INFO', 'RLM', 'HIST', 'GEO', 'FIS', 'QUI', 'BIO',
  'ING', 'ESP', 'CONT', 'ADM', 'ECO', 'ESTAT', 'POL', 'SOC', 'FIL'
];

// Lista de disciplinas pré-definidas
export const availableSubjects = [
  { code: 'DIR', name: 'Direito' },
  { code: 'PORT', name: 'Português' },
  { code: 'MAT', name: 'Matemática' },
  { code: 'INFO', name: 'Informática' },
  { code: 'RLM', name: 'Raciocínio Lógico-Matemático' },
  { code: 'HIST', name: 'História' },
  { code: 'GEO', name: 'Geografia' },
  { code: 'FIS', name: 'Física' },
  { code: 'QUI', name: 'Química' },
  { code: 'BIO', name: 'Biologia' },
  { code: 'ING', name: 'Inglês' },
  { code: 'ESP', name: 'Espanhol' },
  { code: 'CONT', name: 'Contabilidade' },
  { code: 'ADM', name: 'Administração' },
  { code: 'ECO', name: 'Economia' },
  { code: 'ESTAT', name: 'Estatística' },
  { code: 'POL', name: 'Ciência Política' },
  { code: 'SOC', name: 'Sociologia' },
  { code: 'FIL', name: 'Filosofia' }
];

// Função para gerar um código de disciplina
export const generateSubjectCode = (name: string): string => {
  // Remover acentos
  const normalizedName = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Pegar 3-4 primeiras letras e converter para maiúsculas
  let code = normalizedName.substring(0, 4).toUpperCase();
  
  // Remover caracteres especiais
  code = code.replace(/[^A-Z]/g, '');
  
  // Garantir que o código tem pelo menos 2 caracteres
  if (code.length < 2) {
    code = code.padEnd(2, 'X');
  }
  
  return code;
};
