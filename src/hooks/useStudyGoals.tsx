import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface StudyGoal {
  id: string;
  goal_type: 'daily' | 'weekly';
  target_hours: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date?: string;
  is_active: boolean;
}

export const useStudyGoals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<StudyGoal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGoals = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('study_goals_tracking')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (!error && data) {
      setGoals(data);
    }
    setLoading(false);
  };

  const updateStreak = async (goalId: string, studyDurationMinutes: number) => {
    if (!user || studyDurationMinutes < 20) return; // Mínimo 20 minutos

    const goal = goals.find(g => g.id === goalId);
    if (!goal) return;

    const today = new Date().toISOString().split('T')[0];
    const targetMinutes = goal.target_hours * 60;
    
    // Verificar se a meta foi atingida
    if (studyDurationMinutes >= targetMinutes) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      // Se estudou ontem, incrementar streak, senão reiniciar
      const newStreak = goal.last_activity_date === yesterdayStr 
        ? goal.current_streak + 1 
        : 1;

      const longestStreak = Math.max(goal.longest_streak, newStreak);

      await supabase
        .from('study_goals_tracking')
        .update({
          current_streak: newStreak,
          longest_streak: longestStreak,
          last_activity_date: today,
          updated_at: new Date().toISOString()
        })
        .eq('id', goalId);

      // Atualizar estado local
      setGoals(prev => prev.map(g => 
        g.id === goalId 
          ? { ...g, current_streak: newStreak, longest_streak: longestStreak, last_activity_date: today }
          : g
      ));
    }
  };

  const createGoal = async (goalType: 'daily' | 'weekly', targetHours: number) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('study_goals_tracking')
      .insert({
        user_id: user.id,
        goal_type: goalType,
        target_hours: targetHours,
        current_streak: 0,
        longest_streak: 0,
        is_active: true
      })
      .select()
      .single();

    if (!error && data) {
      setGoals(prev => [...prev, data]);
    }
  };

  const updateGoal = async (goalId: string, targetHours: number) => {
    await supabase
      .from('study_goals_tracking')
      .update({ target_hours: targetHours, updated_at: new Date().toISOString() })
      .eq('id', goalId);

    setGoals(prev => prev.map(g => 
      g.id === goalId ? { ...g, target_hours: targetHours } : g
    ));
  };

  const deleteGoal = async (goalId: string) => {
    await supabase
      .from('study_goals_tracking')
      .update({ is_active: false })
      .eq('id', goalId);

    setGoals(prev => prev.filter(g => g.id !== goalId));
  };

  useEffect(() => {
    loadGoals();
  }, [user]);

  return {
    goals,
    loading,
    createGoal,
    updateGoal,
    deleteGoal,
    updateStreak,
    refreshGoals: loadGoals
  };
};