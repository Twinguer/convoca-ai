
import React from 'react';
import { Concurso } from '@/types/concursos';

// Definir nomes de exibição para as seções de conhecimento
const KNOWLEDGE_DISPLAY_NAMES: Record<string, string> = {
  'LPT': 'Português',
  'ING': 'Inglês',
  'MAT': 'Matemática',
  'RLM': 'RLM',
  'EST': 'Estatística',
  'COS': 'Constitucional',
  'ADM': 'Administrativo',
  'ADO': 'Administração',
  'COT': 'Contabilidade',
  'COC': 'Contabilidade Custos',
  'ECO': 'Economia',
  'TRI': 'Tributário',
  'AFO': 'AFO',
  'LTC': 'Leg. Tributária',
  'TIC': 'Tecnologia da Informação',
  'ETT': 'Estatuto',
  'AUD': 'Auditoria',
  'CIV': 'Civil',
  'PEN': 'Penal',
  'INF': 'Informática',
  'EMP': 'Empresarial',
  'MTF': 'Mat. Financeira',
  'OUT': 'Outro'
};

interface SectionToggleProps {
  selectedSection: string;
  onSectionChange: (section: string) => void;
  concurso: Concurso;
}

export const SectionToggle: React.FC<SectionToggleProps> = ({
  selectedSection,
  onSectionChange,
  concurso
}) => {
  // Determinar quais seções estão habilitadas com base na configuração do concurso
  const hasBasic = concurso.has_basic_knowledge;
  const hasSpecific1 = concurso.has_specific_knowledge_1;
  const hasSpecific2 = concurso.has_specific_knowledge_2;
  const hasSpecific3 = concurso.has_specific_knowledge_3;
  const hasDiscursive = concurso.has_discursive;
  const hasCaseStudy1 = concurso.has_case_study_1;
  const hasCaseStudy2 = concurso.has_case_study_2;
  const hasCaseStudy3 = concurso.has_case_study_3;

  // Obter informações sobre as novas áreas de conhecimento
  const knowledgeAreas = [
    'lpt', 'ing', 'mat', 'rlm', 'est', 'cos', 'adm', 'ado',
    'cot', 'coc', 'eco', 'tri', 'afo', 'ltc', 'tic', 'ett',
    'aud', 'civ', 'pen', 'inf', 'emp', 'mtf', 'out'
  ];
  
  // Criar lista de todas as seções habilitadas para exibição
  const enabledSections = [];
  
  // Adicionar seções padrão
  if (hasBasic) {
    enabledSections.push({ key: 'basic', label: 'C. Básicos', weight: concurso.basic_knowledge_weight });
  }
  if (hasSpecific1) {
    enabledSections.push({ key: 'specific1', label: 'C. Específicos 1', weight: concurso.specific_knowledge_1_weight });
  }
  if (hasSpecific2) {
    enabledSections.push({ key: 'specific2', label: 'C. Específicos 2', weight: concurso.specific_knowledge_2_weight });
  }
  if (hasSpecific3) {
    enabledSections.push({ key: 'specific3', label: 'C. Específicos 3', weight: concurso.specific_knowledge_3_weight });
  }
  
  // Adicionar novas áreas de conhecimento
  for (const area of knowledgeAreas) {
    const hasKey = `has_${area}` as keyof Concurso;
    const weightKey = `${area}_weight` as keyof Concurso;
    
    if (concurso[hasKey]) {
      const areaUpperCase = area.toUpperCase();
      let label = KNOWLEDGE_DISPLAY_NAMES[areaUpperCase] || areaUpperCase;
      
      // Para o tipo OUT, usar nome customizado se disponível
      if (area === 'out' && concurso.out_name) {
        label = concurso.out_name;
      }
      
      enabledSections.push({ 
        key: areaUpperCase, 
        label, 
        weight: concurso[weightKey] as number | undefined 
      });
    }
  }
  
  // Adicionar seções discursivas
  if (hasDiscursive) {
    enabledSections.push({ key: 'discursive', label: 'Discursiva', weight: concurso.discursive_weight });
  }
  if (hasCaseStudy1) {
    enabledSections.push({ key: 'case_study1', label: 'Estudo de Caso 1', weight: concurso.case_study_1_weight });
  }
  if (hasCaseStudy2) {
    enabledSections.push({ key: 'case_study2', label: 'Estudo de Caso 2', weight: concurso.case_study_2_weight });
  }
  if (hasCaseStudy3) {
    enabledSections.push({ key: 'case_study3', label: 'Estudo de Caso 3', weight: concurso.case_study_3_weight });
  }

  return (
    <div className="bg-gray-100 border-b overflow-x-auto">
      <div className="flex flex-nowrap min-w-full">
        {enabledSections.map(section => (
          <button
            key={section.key}
            onClick={() => onSectionChange(section.key)}
            className={`py-3 px-4 font-medium text-sm transition-colors whitespace-nowrap
              ${selectedSection === section.key
                ? 'bg-white border-t-2 border-emerald-600 text-emerald-700' 
                : 'text-gray-600 hover:bg-gray-200'}`}
          >
            {section.label} {section.weight && section.weight > 1 ? 
              `(Peso ${section.weight})` : ''}
          </button>
        ))}
      </div>
    </div>
  );
};
