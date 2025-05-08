
import { Concurso } from '@/types/concursos';

/**
 * Calcula a estrutura (faixas) do exame com base nas configurações do concurso
 */
export const getExamStructure = (concurso: any) => {
  // Calcula o fim de cada seção
  const basicEnd = concurso.basic_knowledge_questions || 0;
  const specific1End = basicEnd + (concurso.specific_knowledge_1_questions || 0);
  const specific2End = specific1End + (concurso.specific_knowledge_2_questions || 0);
  const specific3End = specific2End + (concurso.specific_knowledge_3_questions || 0);
  
  return {
    basicEnd,
    specific1End,
    specific2End,
    specific3End,
    totalQuestions: specific3End
  };
};

// Define todos os tipos de seção possíveis no sistema
export type SectionType = 
  | 'basic' 
  | 'specific1' 
  | 'specific2' 
  | 'specific3' 
  | 'discursive' 
  | 'case_study1' 
  | 'case_study2' 
  | 'case_study3'
  | 'lpt' | 'ing' | 'mat' | 'rlm' | 'est' | 'cos' | 'adm' | 'ado'
  | 'cot' | 'coc' | 'eco' | 'tri' | 'afo' | 'ltc' | 'tic' | 'ett'
  | 'aud' | 'civ' | 'pen' | 'inf' | 'emp' | 'mtf' | 'out'
  | string; // Para tipos customizados digitados pelo usuário

// Mapeamento de seções para nomes de exibição
export const sectionDisplayNames: Record<string, string> = {
  basic: 'Conhecimentos Básicos',
  specific1: 'Conhecimentos Específicos 1',
  specific2: 'Conhecimentos Específicos 2',
  specific3: 'Conhecimentos Específicos 3',
  discursive: 'Discursiva',
  case_study1: 'Estudo de Caso 1',
  case_study2: 'Estudo de Caso 2',
  case_study3: 'Estudo de Caso 3',
  lpt: 'Língua Portuguesa',
  ing: 'Inglês',
  mat: 'Matemática',
  rlm: 'Raciocínio Lógico',
  est: 'Estatística',
  cos: 'Contabilidade Superior',
  adm: 'Administração',
  ado: 'Administração Orçamentária',
  cot: 'Contabilidade',
  coc: 'Controle',
  eco: 'Economia',
  tri: 'Tributário',
  afo: 'AFO',
  ltc: 'Legislação Tributária',
  tic: 'Tecnologia da Informação',
  ett: 'Ética',
  aud: 'Auditoria',
  civ: 'Direito Civil',
  pen: 'Direito Penal',
  inf: 'Informática',
  emp: 'Empreendedorismo',
  mtf: 'Matemática Financeira',
  out: 'Outros'
};
