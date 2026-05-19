import type { DisciplineProgressStatus } from '@/utils/disciplineStudyStats';

export interface EditalDiscipline {
  id: string;
  name: string;
  isCompleted?: boolean;
  status?: DisciplineProgressStatus | 'finalizada' | string | null;
}

export interface EditalBlock {
  id: string;
  name: string;
  disciplines: EditalDiscipline[];
}
