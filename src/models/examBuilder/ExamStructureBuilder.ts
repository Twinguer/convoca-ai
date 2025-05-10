
import { ExamSectionBuilder, ExamSectionConfig } from './ExamSectionBuilder';
import { Concurso, SectionType } from '@/types/concursos';

export class ExamStructureBuilder {
  private examType: 'Alternativas' | 'Certo ou Errado' = 'Alternativas';
  private alternativesCount: number = 5;
  private wrongAnswerPenalty: number = 0;
  private sections: ExamSectionConfig[] = [];

  constructor() {
    // Inicialização vazia
  }

  withExamType(type: 'Alternativas' | 'Certo ou Errado'): ExamStructureBuilder {
    this.examType = type;
    return this;
  }

  withAlternativesCount(count: number): ExamStructureBuilder {
    this.alternativesCount = count;
    return this;
  }

  withWrongAnswerPenalty(penalty: number): ExamStructureBuilder {
    this.wrongAnswerPenalty = penalty;
    return this;
  }

  enableSection(sectionType: SectionType, questionCount: number = 0, weight: number = 1): ExamStructureBuilder {
    let displayName = '';

    // Determinar o nome de exibição baseado no tipo
    switch (sectionType) {
      case 'basic':
        displayName = 'Conhecimentos Básicos';
        break;
      case 'specific1':
        displayName = 'Conhecimentos Específicos 1';
        break;
      case 'specific2':
        displayName = 'Conhecimentos Específicos 2';
        break;
      case 'specific3':
        displayName = 'Conhecimentos Específicos 3';
        break;
      case 'discursive':
        displayName = 'Discursiva';
        break;
      case 'case_study1':
        displayName = 'Estudo de Caso 1';
        break;
      case 'case_study2':
        displayName = 'Estudo de Caso 2';
        break;
      case 'case_study3':
        displayName = 'Estudo de Caso 3';
        break;
      default:
        displayName = sectionType;
        break;
    }

    // Verificar se já existe uma seção desse tipo
    const existingIndex = this.sections.findIndex(s => s.sectionType === sectionType);
    if (existingIndex >= 0) {
      // Atualizar a seção existente
      this.sections[existingIndex] = new ExamSectionBuilder(sectionType, displayName)
        .withQuestionCount(questionCount)
        .withWeight(weight)
        .enabled()
        .build();
    } else {
      // Adicionar nova seção
      this.sections.push(
        new ExamSectionBuilder(sectionType, displayName)
          .withQuestionCount(questionCount)
          .withWeight(weight)
          .enabled()
          .build()
      );
    }

    return this;
  }

  disableSection(sectionType: SectionType): ExamStructureBuilder {
    // Remover a seção específica
    this.sections = this.sections.filter(s => s.sectionType !== sectionType);
    return this;
  }

  getEnabledSections(): ExamSectionConfig[] {
    return [...this.sections];
  }

  toConcurso(): Partial<Concurso> {
    const concurso: any = {
      // Configurações gerais do exame
      exam_type: this.examType,
      alternatives_count: this.alternativesCount,
      wrong_answer_penalty: this.wrongAnswerPenalty,
      
      // Configurações de seções - inicializando todas como false (estrutura vazia)
      has_basic_knowledge: false,
      has_specific_knowledge_1: false,
      has_specific_knowledge_2: false,
      has_specific_knowledge_3: false,
      has_discursive: false,
      has_case_study_1: false,
      has_case_study_2: false,
      has_case_study_3: false,
      
      // Quantidades de questões - garantindo que sejam números
      basic_knowledge_questions: 0,
      specific_knowledge_1_questions: 0,
      specific_knowledge_2_questions: 0,
      specific_knowledge_3_questions: 0,
      
      // Pesos - garantindo que sejam números
      basic_knowledge_weight: 1,
      specific_knowledge_1_weight: 1,
      specific_knowledge_2_weight: 1,
      specific_knowledge_3_weight: 1,
      discursive_weight: 1,
      case_study_1_weight: 1,
      case_study_2_weight: 1,
      case_study_3_weight: 1
    };
    
    // Processar seções
    this.sections.forEach(section => {
      switch (section.sectionType) {
        case 'basic':
          concurso.has_basic_knowledge = true;
          concurso.basic_knowledge_questions = Number(section.questionCount);
          concurso.basic_knowledge_weight = Number(section.weight);
          break;
        case 'specific1':
          concurso.has_specific_knowledge_1 = true;
          concurso.specific_knowledge_1_questions = Number(section.questionCount);
          concurso.specific_knowledge_1_weight = Number(section.weight);
          break;
        case 'specific2':
          concurso.has_specific_knowledge_2 = true;
          concurso.specific_knowledge_2_questions = Number(section.questionCount);
          concurso.specific_knowledge_2_weight = Number(section.weight);
          break;
        case 'specific3':
          concurso.has_specific_knowledge_3 = true;
          concurso.specific_knowledge_3_questions = Number(section.questionCount);
          concurso.specific_knowledge_3_weight = Number(section.weight);
          break;
        case 'discursive':
          concurso.has_discursive = true;
          concurso.discursive_weight = Number(section.weight);
          break;
        case 'case_study1':
          concurso.has_case_study_1 = true;
          concurso.case_study_1_weight = Number(section.weight);
          break;
        case 'case_study2':
          concurso.has_case_study_2 = true;
          concurso.case_study_2_weight = Number(section.weight);
          break;
        case 'case_study3':
          concurso.has_case_study_3 = true;
          concurso.case_study_3_weight = Number(section.weight);
          break;
      }
    });
    
    return concurso;
  }
}
