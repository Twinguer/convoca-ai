import { supabase } from '@/integrations/supabase/client';
import type { CoachTask } from '@/types/coach';

/**
 * Serviço para gerenciar tarefas do coach
 */

export const coachTaskService = {
  /**
   * Buscar tarefas do coach
   */
  async getTasks(coachId: string): Promise<CoachTask[]> {
    const { data, error } = await supabase
      .from('coach_profiles')
      .select('coach_tasks')
      .eq('coach_id', coachId)
      .single();

    if (error) throw error;
    return data?.coach_tasks || [];
  },

  /**
   * Buscar tarefas de um aluno específico
   */
  async getStudentTasks(coachId: string, studentId: string): Promise<CoachTask[]> {
    const tasks = await this.getTasks(coachId);
    return tasks.filter(task => task.student_id === studentId);
  },

  /**
   * Criar nova tarefa
   * 
   * NOTA: Por enquanto, vamos fazer via UPDATE manual do array.
   * Função RPC será criada depois.
   */
  async createTask(coachId: string, task: Omit<CoachTask, 'task_id' | 'created_at'>): Promise<void> {
    const tasks = await this.getTasks(coachId);
    
    const newTask: CoachTask = {
      ...task,
      task_id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    };

    tasks.push(newTask);

    const { error } = await supabase
      .from('coach_profiles')
      .update({ coach_tasks: tasks })
      .eq('coach_id', coachId);

    if (error) throw error;
  },

  /**
   * Atualizar status de uma tarefa
   */
  async updateTaskStatus(
    coachId: string,
    taskId: string,
    status: CoachTask['status']
  ): Promise<void> {
    const tasks = await this.getTasks(coachId);
    const updatedTasks = tasks.map(task => 
      task.task_id === taskId 
        ? { ...task, status, completed_at: status === 'completed' ? new Date().toISOString() : task.completed_at }
        : task
    );

    const { error } = await supabase
      .from('coach_profiles')
      .update({ coach_tasks: updatedTasks })
      .eq('coach_id', coachId);

    if (error) throw error;
  }
};


