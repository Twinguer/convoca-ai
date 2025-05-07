
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

/**
 * Lista padrão de disciplinas para os concursos
 */
export const DEFAULT_SUBJECTS = [
  { code: 'LPT', name: 'Português' },
  { code: 'ING', name: 'Inglês' },
  { code: 'MAT', name: 'Matemática' },
  { code: 'RLM', name: 'Raciocínio Lógico-Matemático' },
  { code: 'EST', name: 'Estatística' },
  { code: 'COS', name: 'Direito Constitucional' },
  { code: 'ADM', name: 'Direito Administrativo' },
  { code: 'ADO', name: 'Administração' },
  { code: 'COT', name: 'Contabilidade' },
  { code: 'COC', name: 'Contabilidade de Custos' },
  { code: 'ECO', name: 'Economia' },
  { code: 'TRI', name: 'Direito Tributário' },
  { code: 'AFO', name: 'Administração Financeira e Orçamentária' },
  { code: 'LTC', name: 'Legislação Tributária' },
  { code: 'TIC', name: 'Tecnologia da Informação' },
  { code: 'ETT', name: 'Estatuto' },
  { code: 'AUD', name: 'Auditoria' },
  { code: 'CIV', name: 'Direito Civil' },
  { code: 'PEN', name: 'Direito Penal' },
  { code: 'INF', name: 'Informática' },
  { code: 'EMP', name: 'Direito Empresarial' }
];

/**
 * Gera um código de 3 letras a partir do nome de uma disciplina
 */
export const generateSubjectCode = (name: string): string => {
  if (!name) return 'XXX';
  
  // Remove acentos e converte para maiúsculas
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z ]/g, '');
  
  // Tenta criar sigla com as primeiras letras de cada palavra
  const words = normalized.split(' ').filter(word => word.length > 0);
  
  if (words.length >= 3) {
    return `${words[0][0]}${words[1][0]}${words[2][0]}`;
  } else if (words.length === 2) {
    if (words[0].length >= 2) {
      return `${words[0][0]}${words[0][1]}${words[1][0]}`;
    } else {
      return `${words[0][0]}${words[1][0]}${words[1].length > 1 ? words[1][1] : 'X'}`;
    }
  } else if (words.length === 1) {
    if (words[0].length >= 3) {
      return words[0].substring(0, 3);
    } else {
      let code = words[0];
      while (code.length < 3) code += 'X';
      return code;
    }
  }
  
  return 'XXX';
};
