
import { SectionType } from '@/integrations/supabase/rankings/examStructure';

export interface ExamSectionConfig {
  sectionType: SectionType;
  displayName: string;
  questionCount: number;
  weight: number;
  isEnabled: boolean;
  isCustom?: boolean;
  customName?: string;
}

export class ExamSectionBuilder {
  private section: ExamSectionConfig;
  
  constructor(sectionType: SectionType, displayName: string) {
    this.section = {
      sectionType,
      displayName,
      questionCount: 0,
      weight: 1,
      isEnabled: false
    };
  }
  
  withQuestionCount(count: number): ExamSectionBuilder {
    this.section.questionCount = count;
    return this;
  }
  
  withWeight(weight: number): ExamSectionBuilder {
    this.section.weight = weight;
    return this;
  }
  
  enabled(): ExamSectionBuilder {
    this.section.isEnabled = true;
    return this;
  }
  
  disabled(): ExamSectionBuilder {
    this.section.isEnabled = false;
    return this;
  }
  
  asCustomSection(customName: string): ExamSectionBuilder {
    this.section.isCustom = true;
    this.section.customName = customName;
    return this;
  }
  
  build(): ExamSectionConfig {
    return { ...this.section };
  }
}
