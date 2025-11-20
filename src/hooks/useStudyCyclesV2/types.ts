export interface SessionData {
  id: string;
  start_time?: string; // Opcional para tarefas de duração livre
  end_time?: string; // Opcional para tarefas de duração livre
  duration_minutes?: number; // Para tarefas de duração livre (sem horário fixo)
  discipline_name: string;
  block_name: string;
  session_link?: string;
  completed_sessions?: CompletedSession[];
  total_stats?: SessionStats;
}

export interface CompletedSession {
  date: string;
  duration_minutes: number;
  questions: number;
  correct_answers: number;
  notes?: string;
}

export interface SessionStats {
  total_duration_minutes: number;
  total_questions: number;
  total_correct: number;
  session_count: number;
  last_session_date?: string;
}

export interface WeeklySchedule {
  day: number;
  sessions: SessionData[];
}

export interface ScheduleMetadata {
  total_sessions: number;
  total_hours: number;
}

export interface StudyCycleV2 {
  id: string;
  user_id: string;
  cycle_name: string;
  exam_date: string;
  organ?: string;
  position?: string;
  edital_link?: string;
  curso_link?: string;
  video_link?: string;
  trilha_semanal_pdf_url?: string;
  subjetiva_pdf_url?: string;
  is_active: boolean;
  schedule_data: {
    weekly_schedule: WeeklySchedule[];
    metadata: ScheduleMetadata;
  };
  created_at: string;
  updated_at: string;
}

export interface CreateCycleInput {
  cycle_name: string;
  exam_date: string;
  organ?: string;
  position?: string;
  edital_link?: string;
  curso_link?: string;
  video_link?: string;
  trilha_semanal_pdf_url?: string;
  subjetiva_pdf_url?: string;
}

export interface AddSessionInput {
  start_time?: string; // Opcional para tarefas de duração livre
  end_time?: string; // Opcional para tarefas de duração livre
  duration_minutes?: number; // Para tarefas de duração livre (sem horário fixo)
  discipline_name: string;
  block_name: string;
  session_link?: string;
}

export interface RecordSessionInput {
  duration_minutes: number;
  questions: number;
  correct_answers: number;
  notes?: string;
}
