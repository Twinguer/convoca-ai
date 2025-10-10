import { supabase } from '@/integrations/supabase/client';
import { generateId } from '@/lib/utils';
import { logger } from '@/utils/logger';
import { 
  UserStudy, 
  StudySession, 
  StudySchedule, 
  StudyStatistics, 
  StudyCycleV2,
  StudyPlan,
  StudySubject,
  StudyGoal,
  StudyGoalsTracking,
  StudyProgress,
  StudyReminder,
  SpacedRepetitionItem,
  UserStudyDay,
  StudyContest,
  SessionProgress,
  StudyDataUpdate,
  defaultUserStudy
} from '@/types/userStudy';

/**
 * Service for managing user study data in the consolidated user_study table
 * This service replaces direct access to multiple study tables
 */
export class UserStudyService {
  // Cache simples para otimizar carregamento
  private static cache = new Map<string, { data: UserStudy; timestamp: number }>();
  private static CACHE_DURATION = 30 * 1000; // 30 segundos

  /**
   * Get complete user study data with cache
   */
  static async getUserStudyData(userId: string, forceRefresh = false): Promise<UserStudy | null> {
    try {
      // Verificar cache primeiro
      if (!forceRefresh) {
        const cached = this.cache.get(userId);
        if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
          logger.debug('Retornando dados do cache', { userId });
          return cached.data;
        }
      }

      logger.debug('Buscando dados do usuário', { userId, forceRefresh });
      
      // Verificar autenticação atual
      const { data: { user: authUser } } = await supabase.auth.getUser();
      logger.debug('Verificação de autenticação', { 
        authUserId: authUser?.id, 
        requestedUserId: userId,
        match: authUser?.id === userId 
      });
      
      const { data, error } = await supabase
        .from('user_study')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          logger.warn('Nenhum dado encontrado para o usuário');
          return null;
        }
        logger.error('Erro ao buscar dados do usuário', { error, code: error.code });
        return null;
      }

      logger.debug('Dados do usuário encontrados', { 
        hasData: !!data, 
        cyclesCount: data?.study_cycles?.length || 0 
      });
      
      const userData = data as UserStudy;
      
      // Armazenar no cache
      this.cache.set(userId, { data: userData, timestamp: Date.now() });
      
      return userData;
    } catch (error) {
      logger.error('Erro na função getUserStudyData', error);
      return null;
    }
  }

  /**
   * Clear cache for a specific user
   */
  static clearCache(userId?: string): void {
    if (userId) {
      this.cache.delete(userId);
      logger.debug('Cache limpo para usuário', { userId });
    } else {
      this.cache.clear();
      logger.debug('Cache limpo para todos os usuários');
    }
  }

  /**
   * Create or update user study data
   */
  static async upsertUserStudyData(userId: string, studyData: StudyDataUpdate): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('upsert_user_study_data', {
        user_uuid: userId,
        study_data: studyData
      });

      if (error) {
        console.error('Error upserting user study data:', error);
        return false;
      }

      // Limpar cache após atualização
      this.clearCache(userId);
      logger.debug('Cache limpo após atualização', { userId });

      return true;
    } catch (error) {
      console.error('Error upserting user study data:', error);
      return false;
    }
  }

  /**
   * Initialize user study data with defaults
   */
  static async initializeUserStudyData(userId: string): Promise<boolean> {
    try {
      // Usar a função RPC upsert_user_study_data para garantir que apenas uma linha seja criada
      const { error } = await supabase.rpc('upsert_user_study_data', {
        user_uuid: userId,
        study_data: defaultUserStudy
      });

      if (error) {
        console.error('Error initializing user study data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing user study data:', error);
      return false;
    }
  }

  // ===== STUDY SESSIONS =====

  /**
   * Get user study sessions
   */
  static async getSessions(userId: string): Promise<StudySession[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_sessions || [];
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }
  }

  /**
   * Add a new study session
   */
  static async addSession(userId: string, session: Omit<StudySession, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newSession: StudySession = {
        ...session,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase.rpc('add_study_session', {
        user_uuid: userId,
        session_data: newSession
      });

      if (error) {
        console.error('Error adding session:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error adding session:', error);
      return false;
    }
  }

  /**
   * Update an existing study session
   */
  static async updateSession(userId: string, sessionId: string, updates: Partial<StudySession>): Promise<boolean> {
    try {
      const data = await this.getUserStudyData(userId);
      if (!data) return false;

      const updatedSessions = data.study_sessions.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates, updated_at: new Date().toISOString() }
          : session
      );

      return await this.upsertUserStudyData(userId, {
        study_sessions: updatedSessions
      });
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  }

  /**
   * Get session by schedule ID
   */
  static async getSessionByScheduleId(userId: string, scheduleSessionId: string): Promise<StudySession | null> {
    try {
      const sessions = await this.getSessions(userId);
      return sessions.find(session => session.schedule_session_id === scheduleSessionId) || null;
    } catch (error) {
      console.error('Error getting session by schedule ID:', error);
      return null;
    }
  }

  // ===== STUDY SCHEDULE =====

  /**
   * Get user study schedule
   */
  static async getSchedule(userId: string): Promise<StudySchedule[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_schedule || [];
    } catch (error) {
      console.error('Error fetching schedule:', error);
      return [];
    }
  }

  /**
   * Add session to schedule
   */
  static async addScheduleSession(userId: string, session: Omit<StudySchedule, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newSession: StudySchedule = {
        ...session,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentSchedule = data?.study_schedule || [];
      const updatedSchedule = [...currentSchedule, newSession];

      return await this.upsertUserStudyData(userId, {
        study_schedule: updatedSchedule
      });
    } catch (error) {
      console.error('Error adding schedule session:', error);
      return false;
    }
  }

  /**
   * Update schedule session
   */
  static async updateScheduleSession(userId: string, sessionId: string, updates: Partial<StudySchedule>): Promise<boolean> {
    try {
      const data = await this.getUserStudyData(userId);
      if (!data) return false;

      const updatedSchedule = data.study_schedule.map(session => 
        session.id === sessionId 
          ? { ...session, ...updates, updated_at: new Date().toISOString() }
          : session
      );

      return await this.upsertUserStudyData(userId, {
        study_schedule: updatedSchedule
      });
    } catch (error) {
      console.error('Error updating schedule session:', error);
      return false;
    }
  }

  /**
   * Remove schedule session from study cycles
   */
  static async removeScheduleSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      logger.debug('Removendo sessão do cronograma', { userId, sessionId });
      
      const data = await this.getUserStudyData(userId);
      if (!data) {
        logger.error('Dados do usuário não encontrados');
        return false;
      }

      // Atualizar ciclos removendo a sessão
      const updatedCycles = data.study_cycles.map(cycle => {
        const updatedSchedule = { ...cycle.schedule_data };
        
        updatedSchedule.weekly_schedule = updatedSchedule.weekly_schedule.map(daySchedule => ({
          ...daySchedule,
          sessions: daySchedule.sessions.filter(session => session.id !== sessionId)
        }));

        // Recalcular metadados
        const totalSessions = updatedSchedule.weekly_schedule.reduce(
          (total, day) => total + day.sessions.length, 
          0
        );

        return {
          ...cycle,
          schedule_data: {
            ...updatedSchedule,
            metadata: {
              ...updatedSchedule.metadata,
              total_sessions: totalSessions
            }
          }
        };
      });

      logger.debug('Ciclos atualizados após remoção', { 
        totalCycles: updatedCycles.length,
        sessionRemoved: sessionId 
      });

      return await this.upsertUserStudyData(userId, {
        study_cycles: updatedCycles
      });
    } catch (error) {
      logger.error('Erro ao remover sessão do cronograma', error);
      return false;
    }
  }

  // ===== STUDY STATISTICS =====

  /**
   * Get user study statistics
   */
  static async getStatistics(userId: string): Promise<StudyStatistics | null> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_statistics || null;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return null;
    }
  }

  /**
   * Update study statistics
   */
  static async updateStatistics(userId: string, statistics: StudyStatistics): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('update_study_statistics', {
        user_uuid: userId,
        stats_data: statistics
      });

      if (error) {
        console.error('Error updating statistics:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error updating statistics:', error);
      return false;
    }
  }

  // ===== STUDY CYCLES =====

  /**
   * Get user study cycles
   */
  static async getCycles(userId: string): Promise<StudyCycleV2[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_cycles || [];
    } catch (error) {
      console.error('Error fetching cycles:', error);
      return [];
    }
  }

  /**
   * Add study cycle V2
   * Usuário sempre existe se chegou até aqui (autenticado)
   */
  static async addCycle(userId: string, cycle: Omit<StudyCycleV2, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      // Debug: Verificar ciclo recebido
      console.log('🔍 Debug - Ciclo recebido no addCycle:', cycle);
      console.log('🔍 Debug - Available blocks no ciclo:', cycle.schedule_data?.available_blocks);

      const newCycle: StudyCycleV2 = {
        ...cycle,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Debug: Verificar ciclo final
      console.log('🔍 Debug - Ciclo final criado:', newCycle);
      console.log('🔍 Debug - Available blocks no ciclo final:', newCycle.schedule_data?.available_blocks);

      // Buscar dados existentes do usuário
      const data = await this.getUserStudyData(userId);
      
      if (!data) {
        // Se não existir dados, criar com ciclo já incluído
        console.log('🔍 Debug - Criando dados iniciais do usuário com ciclo');
        return await this.upsertUserStudyData(userId, {
          study_cycles: [newCycle],
          ...defaultUserStudy
        });
      }

      // Se existir, adicionar ciclo aos existentes
      const currentCycles = data.study_cycles || [];
      const updatedCycles = [...currentCycles, newCycle];

      console.log('🔍 Debug - Adicionando ciclo aos existentes. Total de ciclos:', updatedCycles.length);

      return await this.upsertUserStudyData(userId, {
        study_cycles: updatedCycles
      });
    } catch (error) {
      console.error('Error adding cycle:', error);
      return false;
    }
  }

  /**
   * Update study cycle
   */
  static async updateCycle(userId: string, cycleId: string, updates: Partial<StudyCycleV2>): Promise<boolean> {
    try {
      const data = await this.getUserStudyData(userId);
      if (!data) return false;

      const updatedCycles = data.study_cycles.map(cycle => 
        cycle.id === cycleId 
          ? { ...cycle, ...updates, updated_at: new Date().toISOString() }
          : cycle
      );

      return await this.upsertUserStudyData(userId, {
        study_cycles: updatedCycles
      });
    } catch (error) {
      console.error('Error updating cycle:', error);
      return false;
    }
  }

  /**
   * Remove study cycle
   */
  static async removeCycle(userId: string, cycleId: string): Promise<boolean> {
    try {
      const data = await this.getUserStudyData(userId);
      if (!data) return false;

      const updatedCycles = data.study_cycles.filter(cycle => cycle.id !== cycleId);

      return await this.upsertUserStudyData(userId, {
        study_cycles: updatedCycles
      });
    } catch (error) {
      console.error('Error removing cycle:', error);
      return false;
    }
  }

  // ===== STUDY PLANS =====

  /**
   * Get user study plans
   */
  static async getPlans(userId: string): Promise<StudyPlan[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_plans || [];
    } catch (error) {
      console.error('Error fetching plans:', error);
      return [];
    }
  }

  /**
   * Add study plan
   */
  static async addPlan(userId: string, plan: Omit<StudyPlan, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newPlan: StudyPlan = {
        ...plan,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentPlans = data?.study_plans || [];
      const updatedPlans = [...currentPlans, newPlan];

      return await this.upsertUserStudyData(userId, {
        study_plans: updatedPlans
      });
    } catch (error) {
      console.error('Error adding plan:', error);
      return false;
    }
  }

  // ===== STUDY SUBJECTS =====

  /**
   * Get user study subjects
   */
  static async getSubjects(userId: string): Promise<StudySubject[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_subjects || [];
    } catch (error) {
      console.error('Error fetching subjects:', error);
      return [];
    }
  }

  /**
   * Add study subject
   */
  static async addSubject(userId: string, subject: Omit<StudySubject, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newSubject: StudySubject = {
        ...subject,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentSubjects = data?.study_subjects || [];
      const updatedSubjects = [...currentSubjects, newSubject];

      return await this.upsertUserStudyData(userId, {
        study_subjects: updatedSubjects
      });
    } catch (error) {
      console.error('Error adding subject:', error);
      return false;
    }
  }

  // ===== STUDY GOALS =====

  /**
   * Get user study goals
   */
  static async getGoals(userId: string): Promise<StudyGoal[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_goals || [];
    } catch (error) {
      console.error('Error fetching goals:', error);
      return [];
    }
  }

  /**
   * Get user study goals tracking
   */
  static async getGoalsTracking(userId: string): Promise<StudyGoalsTracking> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_goals_tracking || {};
    } catch (error) {
      console.error('Error fetching goals tracking:', error);
      return {};
    }
  }

  /**
   * Update goals tracking
   */
  static async updateGoalsTracking(userId: string, tracking: StudyGoalsTracking): Promise<boolean> {
    try {
      return await this.upsertUserStudyData(userId, {
        study_goals_tracking: tracking
      });
    } catch (error) {
      console.error('Error updating goals tracking:', error);
      return false;
    }
  }

  // ===== STUDY PROGRESS =====

  /**
   * Get user study progress
   */
  static async getProgress(userId: string): Promise<StudyProgress[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_progress || [];
    } catch (error) {
      console.error('Error fetching progress:', error);
      return [];
    }
  }

  /**
   * Add study progress
   */
  static async addProgress(userId: string, progress: Omit<StudyProgress, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newProgress: StudyProgress = {
        ...progress,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentProgress = data?.study_progress || [];
      const updatedProgress = [...currentProgress, newProgress];

      return await this.upsertUserStudyData(userId, {
        study_progress: updatedProgress
      });
    } catch (error) {
      console.error('Error adding progress:', error);
      return false;
    }
  }

  // ===== STUDY REMINDERS =====

  /**
   * Get user study reminders
   */
  static async getReminders(userId: string): Promise<StudyReminder[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_reminders || [];
    } catch (error) {
      console.error('Error fetching reminders:', error);
      return [];
    }
  }

  /**
   * Add study reminder
   */
  static async addReminder(userId: string, reminder: Omit<StudyReminder, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newReminder: StudyReminder = {
        ...reminder,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentReminders = data?.study_reminders || [];
      const updatedReminders = [...currentReminders, newReminder];

      return await this.upsertUserStudyData(userId, {
        study_reminders: updatedReminders
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
      return false;
    }
  }

  // ===== SPACED REPETITION =====

  /**
   * Get spaced repetition queue
   */
  static async getSpacedRepetitionQueue(userId: string): Promise<SpacedRepetitionItem[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.spaced_repetition_queue || [];
    } catch (error) {
      console.error('Error fetching spaced repetition queue:', error);
      return [];
    }
  }

  /**
   * Add item to spaced repetition queue
   */
  static async addSpacedRepetitionItem(userId: string, item: Omit<SpacedRepetitionItem, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newItem: SpacedRepetitionItem = {
        ...item,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentQueue = data?.spaced_repetition_queue || [];
      const updatedQueue = [...currentQueue, newItem];

      return await this.upsertUserStudyData(userId, {
        spaced_repetition_queue: updatedQueue
      });
    } catch (error) {
      console.error('Error adding spaced repetition item:', error);
      return false;
    }
  }

  // ===== USER STUDY DAYS =====

  /**
   * Get user study days
   */
  static async getStudyDays(userId: string): Promise<UserStudyDay[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.user_study_days || [];
    } catch (error) {
      console.error('Error fetching study days:', error);
      return [];
    }
  }

  /**
   * Add study day
   */
  static async addStudyDay(userId: string, studyDate: string): Promise<boolean> {
    try {
      const newStudyDay: UserStudyDay = {
        id: generateId(),
        study_date: studyDate,
        created_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentStudyDays = data?.user_study_days || [];
      const updatedStudyDays = [...currentStudyDays, newStudyDay];

      return await this.upsertUserStudyData(userId, {
        user_study_days: updatedStudyDays
      });
    } catch (error) {
      console.error('Error adding study day:', error);
      return false;
    }
  }

  // ===== STUDY CONTESTS =====

  /**
   * Get user study contests
   */
  static async getContests(userId: string): Promise<StudyContest[]> {
    try {
      const data = await this.getUserStudyData(userId);
      return data?.study_contests || [];
    } catch (error) {
      console.error('Error fetching contests:', error);
      return [];
    }
  }

  /**
   * Add study contest
   */
  static async addContest(userId: string, contest: Omit<StudyContest, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      const newContest: StudyContest = {
        ...contest,
        id: generateId(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const data = await this.getUserStudyData(userId);
      if (!data) {
        await this.initializeUserStudyData(userId);
        const newData = await this.getUserStudyData(userId);
        if (!newData) return false;
      }

      const currentContests = data?.study_contests || [];
      const updatedContests = [...currentContests, newContest];

      return await this.upsertUserStudyData(userId, {
        study_contests: updatedContests
      });
    } catch (error) {
      console.error('Error adding contest:', error);
      return false;
    }
  }

  // ===== UTILITY METHODS =====

  /**
   * Delete all user study data
   */
  static async deleteUserStudyData(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_study')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting user study data:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error deleting user study data:', error);
      return false;
    }
  }

  /**
   * Check if user has study data
   */
  static async hasStudyData(userId: string): Promise<boolean> {
    try {
      const data = await this.getUserStudyData(userId);
      return data !== null;
    } catch (error) {
      console.error('Error checking study data:', error);
      return false;
    }
  }
}
