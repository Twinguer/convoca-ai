
import { ExamSectionBuilder, ExamSectionConfig } from './ExamSectionBuilder';
import { Concurso } from '@/types/concursos';
import { SectionType, sectionDisplayNames } from '@/integrations/supabase/rankings/examStructure';

export class ExamStructureBuilder {
  private sections: Map<SectionType, ExamSectionConfig> = new Map();
  private examType: 'Alternativas' | 'Certo ou Errado' = 'Alternativas';
  private alternativesCount: number = 5;
  private wrongAnswerPenalty: number = 0;
  
  constructor() {
    // Inicializar com seções padrão
    this.initializeDefaultSections();
  }
  
  private initializeDefaultSections() {
    // Seções padrão do sistema
    this.addSection(new ExamSectionBuilder('basic', sectionDisplayNames.basic).build());
    this.addSection(new ExamSectionBuilder('specific1', sectionDisplayNames.specific1).build());
    this.addSection(new ExamSectionBuilder('specific2', sectionDisplayNames.specific2).build());
    this.addSection(new ExamSectionBuilder('specific3', sectionDisplayNames.specific3).build());
    this.addSection(new ExamSectionBuilder('discursive', sectionDisplayNames.discursive).build());
    this.addSection(new ExamSectionBuilder('case_study1', sectionDisplayNames.case_study1).build());
    this.addSection(new ExamSectionBuilder('case_study2', sectionDisplayNames.case_study2).build());
    this.addSection(new ExamSectionBuilder('case_study3', sectionDisplayNames.case_study3).build());
    
    // Seções de disciplinas específicas
    Object.entries(sectionDisplayNames).forEach(([key, displayName]) => {
      if (!['basic', 'specific1', 'specific2', 'specific3', 'discursive', 
           'case_study1', 'case_study2', 'case_study3'].includes(key)) {
        this.addSection(new ExamSectionBuilder(key as SectionType, displayName).build());
      }
    });
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
  
  addSection(section: ExamSectionConfig): ExamStructureBuilder {
    this.sections.set(section.sectionType, section);
    return this;
  }
  
  enableSection(sectionType: SectionType, questionCount: number = 0, weight: number = 1): ExamStructureBuilder {
    const section = this.sections.get(sectionType);
    if (section) {
      section.isEnabled = true;
      section.questionCount = questionCount;
      section.weight = weight;
      this.sections.set(sectionType, section);
    }
    return this;
  }
  
  disableSection(sectionType: SectionType): ExamStructureBuilder {
    const section = this.sections.get(sectionType);
    if (section) {
      section.isEnabled = false;
      this.sections.set(sectionType, section);
    }
    return this;
  }
  
  addCustomSection(name: string, questionCount: number = 0, weight: number = 1): ExamStructureBuilder {
    const sectionType = name.toLowerCase().replace(/\s+/g, '_') as SectionType;
    this.addSection(
      new ExamSectionBuilder(sectionType, name)
        .withQuestionCount(questionCount)
        .withWeight(weight)
        .enabled()
        .asCustomSection(name)
        .build()
    );
    return this;
  }
  
  fromConcurso(concurso: Concurso): ExamStructureBuilder {
    // Configurar tipo de exame
    this.withExamType((concurso.exam_type as 'Alternativas' | 'Certo ou Errado') || 'Alternativas')
        .withAlternativesCount(concurso.alternatives_count || 5)
        .withWrongAnswerPenalty(concurso.wrong_answer_penalty || 0);

    // Configurar seções básicas
    if (concurso.has_basic_knowledge) {
      this.enableSection('basic', concurso.basic_knowledge_questions || 0, concurso.basic_knowledge_weight || 1);
    } else {
      this.disableSection('basic');
    }

    // Seções de conhecimentos específicos
    if (concurso.has_specific_knowledge_1) {
      this.enableSection('specific1', concurso.specific_knowledge_1_questions || 0, concurso.specific_knowledge_1_weight || 1);
    } else {
      this.disableSection('specific1');
    }

    if (concurso.has_specific_knowledge_2) {
      this.enableSection('specific2', concurso.specific_knowledge_2_questions || 0, concurso.specific_knowledge_2_weight || 1);
    } else {
      this.disableSection('specific2');
    }

    if (concurso.has_specific_knowledge_3) {
      this.enableSection('specific3', concurso.specific_knowledge_3_questions || 0, concurso.specific_knowledge_3_weight || 1);
    } else {
      this.disableSection('specific3');
    }

    // Seções subjetivas
    if (concurso.has_discursive) {
      this.enableSection('discursive', 0, concurso.discursive_weight || 1);
    } else {
      this.disableSection('discursive');
    }

    if (concurso.has_case_study_1) {
      this.enableSection('case_study1', 0, concurso.case_study_1_weight || 1);
    } else {
      this.disableSection('case_study1');
    }

    if (concurso.has_case_study_2) {
      this.enableSection('case_study2', 0, concurso.case_study_2_weight || 1);
    } else {
      this.disableSection('case_study2');
    }

    if (concurso.has_case_study_3) {
      this.enableSection('case_study3', 0, concurso.case_study_3_weight || 1);
    } else {
      this.disableSection('case_study3');
    }

    // Inicializar seções de disciplinas específicas
    const disciplineFlags: Array<{
      type: string;
      hasFlag: keyof Concurso;
      questions: keyof Concurso;
      weight: keyof Concurso;
    }> = [
      { type: 'lpt', hasFlag: 'has_lpt', questions: 'lpt_questions', weight: 'lpt_weight' },
      { type: 'ing', hasFlag: 'has_ing', questions: 'ing_questions', weight: 'ing_weight' },
      { type: 'mat', hasFlag: 'has_mat', questions: 'mat_questions', weight: 'mat_weight' },
      { type: 'rlm', hasFlag: 'has_rlm', questions: 'rlm_questions', weight: 'rlm_weight' },
      { type: 'est', hasFlag: 'has_est', questions: 'est_questions', weight: 'est_weight' },
      { type: 'cos', hasFlag: 'has_cos', questions: 'cos_questions', weight: 'cos_weight' }
    ];

    disciplineFlags.forEach(({ type, hasFlag, questions, weight }) => {
      if (concurso[hasFlag]) {
        const questionsCount = concurso[questions] as number || 0;
        const weightValue = concurso[weight] as number || 1;
        this.enableSection(type as SectionType, questionsCount, weightValue);
      } else {
        this.disableSection(type as SectionType);
      }
    });

    // Processar disciplinas customizadas se existirem
    if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
      concurso.disciplines.forEach((discipline: any) => {
        if (discipline.name && discipline.isEnabled) {
          this.addCustomSection(
            discipline.name,
            discipline.questionCount || 0,
            discipline.weight || 1
          );
        }
      });
    }

    return this;
  }
  
  toConcurso(concurso: Partial<Concurso> = {}): Concurso {
    // Configurações básicas do exame
    const result: Partial<Concurso> = {
      ...concurso,
      exam_type: this.examType,
      alternatives_count: this.alternativesCount,
      wrong_answer_penalty: this.wrongAnswerPenalty,
      
      // Inicializar flags para false
      has_basic_knowledge: false,
      has_specific_knowledge_1: false,
      has_specific_knowledge_2: false,
      has_specific_knowledge_3: false,
      has_discursive: false,
      has_case_study_1: false,
      has_case_study_2: false,
      has_case_study_3: false,
      
      // Inicializar listas
      disciplines: []
    };
    
    // Processar cada seção
    this.sections.forEach((section, type) => {
      if (section.isEnabled) {
        switch (type) {
          case 'basic':
            result.has_basic_knowledge = true;
            result.basic_knowledge_questions = section.questionCount;
            result.basic_knowledge_weight = section.weight;
            break;
          case 'specific1':
            result.has_specific_knowledge_1 = true;
            result.specific_knowledge_1_questions = section.questionCount;
            result.specific_knowledge_1_weight = section.weight;
            break;
          case 'specific2':
            result.has_specific_knowledge_2 = true;
            result.specific_knowledge_2_questions = section.questionCount;
            result.specific_knowledge_2_weight = section.weight;
            break;
          case 'specific3':
            result.has_specific_knowledge_3 = true;
            result.specific_knowledge_3_questions = section.questionCount;
            result.specific_knowledge_3_weight = section.weight;
            break;
          case 'discursive':
            result.has_discursive = true;
            result.discursive_weight = section.weight;
            break;
          case 'case_study1':
            result.has_case_study_1 = true;
            result.case_study_1_weight = section.weight;
            break;
          case 'case_study2':
            result.has_case_study_2 = true;
            result.case_study_2_weight = section.weight;
            break;
          case 'case_study3':
            result.has_case_study_3 = true;
            result.case_study_3_weight = section.weight;
            break;
          default:
            // Para disciplinas específicas ou customizadas
            if (section.isCustom) {
              // Adicionar à lista de disciplinas customizadas
              if (!result.disciplines) result.disciplines = [];
              (result.disciplines as any[]).push({
                name: section.customName || section.displayName,
                type: section.sectionType,
                questionCount: section.questionCount,
                weight: section.weight,
                isEnabled: true
              });
            } else {
              // Para disciplinas conhecidas (lpt, mat, etc.)
              const hasFlag = `has_${type}` as keyof Concurso;
              const questionsField = `${type}_questions` as keyof Concurso;
              const weightField = `${type}_weight` as keyof Concurso;
              
              result[hasFlag] = true;
              result[questionsField] = section.questionCount;
              result[weightField] = section.weight;
            }
        }
      }
    });
    
    return result as Concurso;
  }
  
  getEnabledSections(): ExamSectionConfig[] {
    return Array.from(this.sections.values()).filter(section => section.isEnabled);
  }
  
  build(): {
    examType: 'Alternativas' | 'Certo ou Errado';
    alternativesCount: number;
    wrongAnswerPenalty: number;
    sections: ExamSectionConfig[];
  } {
    return {
      examType: this.examType,
      alternativesCount: this.alternativesCount,
      wrongAnswerPenalty: this.wrongAnswerPenalty,
      sections: this.getEnabledSections()
    };
  }
}
