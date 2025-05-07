
import { Concurso } from '@/types/concursos';

// Definição dos tipos de seções possíveis
export type SectionType = 
  | 'basic' | 'specific1' | 'specific2' | 'specific3' 
  | 'portugues' | 'ingles' | 'matematica' | 'rlm' | 'estatistica'
  | 'constitucional' | 'administrativo' | 'administracao' | 'contabilidade'
  | 'contabilidade_custos' | 'economia' | 'tributario' | 'afo'
  | 'legislacao_tributaria' | 'tecnologia_informacao' | 'estatuto'
  | 'auditoria' | 'civil' | 'penal' | 'informatica' | 'empresarial'
  | 'matematica_financeira' | 'outro'
  | 'discursive' | 'case_study1' | 'case_study2' | 'case_study3';

// Mapeamento das siglas das disciplinas
export const disciplineSiglas: Record<string, string> = {
  'portugues': 'LPT',
  'ingles': 'ING',
  'matematica': 'MAT',
  'rlm': 'RLM',
  'estatistica': 'EST',
  'constitucional': 'COS',
  'administrativo': 'ADM',
  'administracao': 'ADO',
  'contabilidade': 'COT',
  'contabilidade_custos': 'COC',
  'economia': 'ECO',
  'tributario': 'TRI',
  'afo': 'AFO',
  'legislacao_tributaria': 'LTC',
  'tecnologia_informacao': 'TIC',
  'estatuto': 'ETT',
  'auditoria': 'AUD',
  'civil': 'CIV',
  'penal': 'PEN',
  'informatica': 'INF',
  'empresarial': 'EMP',
  'matematica_financeira': 'MTF'
};

// Função para gerar sigla automática a partir do nome
export const generateSiglaFromName = (name: string): string => {
  // Remove acentos e caracteres especiais
  const normalized = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  
  // Transforma em maiúsculas
  const upperCase = normalized.toUpperCase();
  
  // Pega primeiras letras (máximo 3)
  const words = upperCase.split(/\s+/);
  
  if (words.length === 1) {
    // Para palavra única, pega 3 primeiras letras
    return upperCase.substring(0, 3);
  } else {
    // Para múltiplas palavras, pega primeira letra de cada (máximo 3)
    return words.slice(0, 3).map(word => word[0]).join('');
  }
};

// Função para obter nome amigável da seção
export const getSectionDisplayName = (section: SectionType): string => {
  const displayNames: Record<string, string> = {
    'basic': 'Conhecimentos Básicos',
    'specific1': 'Conhecimentos Específicos 1',
    'specific2': 'Conhecimentos Específicos 2',
    'specific3': 'Conhecimentos Específicos 3',
    'portugues': 'Português',
    'ingles': 'Inglês',
    'matematica': 'Matemática',
    'rlm': 'RLM',
    'estatistica': 'Estatística',
    'constitucional': 'Constitucional',
    'administrativo': 'Administrativo',
    'administracao': 'Administração',
    'contabilidade': 'Contabilidade',
    'contabilidade_custos': 'Contabilidade Custos',
    'economia': 'Economia',
    'tributario': 'Tributário',
    'afo': 'AFO',
    'legislacao_tributaria': 'Legislação Tributária',
    'tecnologia_informacao': 'Tecnologia da Informação',
    'estatuto': 'Estatuto',
    'auditoria': 'Auditoria',
    'civil': 'Civil',
    'penal': 'Penal',
    'informatica': 'Informática',
    'empresarial': 'Empresarial',
    'matematica_financeira': 'Mat. Financeira',
    'outro': 'Outro...',
    'discursive': 'Discursiva',
    'case_study1': 'Estudo de Caso 1',
    'case_study2': 'Estudo de Caso 2',
    'case_study3': 'Estudo de Caso 3',
  };

  return displayNames[section] || section;
};

export const handleQuestionSectionSelection = (
  concurso: Concurso,
  setSelectedSection: React.Dispatch<React.SetStateAction<SectionType>>
) => {
  if (concurso.has_basic_knowledge) {
    setSelectedSection('basic');
  } else if (concurso.has_specific_knowledge_1) {
    setSelectedSection('specific1');
  } else if (concurso.has_specific_knowledge_2) {
    setSelectedSection('specific2');
  } else if (concurso.has_specific_knowledge_3) {
    setSelectedSection('specific3');
  }
};
