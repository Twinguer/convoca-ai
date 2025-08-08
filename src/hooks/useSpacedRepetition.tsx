import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface SpacedRepetitionItem {
  id: string;
  subject_name: string;
  block_name?: string;
  difficulty_level: number;
  next_review_date: string;
  review_count: number;
  last_reviewed_at?: string;
}

export const useSpacedRepetition = () => {
  const { user } = useAuth();
  const [reviewQueue, setReviewQueue] = useState<SpacedRepetitionItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadReviewQueue = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('spaced_repetition_queue')
      .select('*')
      .eq('user_id', user.id)
      .lte('next_review_date', today)
      .order('next_review_date', { ascending: true });

    if (!error && data) {
      setReviewQueue(data);
    }
    setLoading(false);
  };

  const addToQueue = async (subjectName: string, blockName?: string) => {
    if (!user) return;

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + 1); // Primeira revisão amanhã

    const { data, error } = await supabase
      .from('spaced_repetition_queue')
      .insert({
        user_id: user.id,
        subject_name: subjectName,
        block_name: blockName,
        difficulty_level: 1,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        review_count: 0
      })
      .select()
      .single();

    if (!error && data) {
      // Não adicionar à queue atual se for para futuro
      console.log('Adicionado à fila de repetição espaçada:', data);
    }
  };

  const markAsReviewed = async (itemId: string, performanceRating: 1 | 2 | 3 | 4 | 5) => {
    const item = reviewQueue.find(i => i.id === itemId);
    if (!item) return;

    // Algoritmo simples de repetição espaçada
    const intervals = {
      1: 1,   // Muito difícil - 1 dia
      2: 2,   // Difícil - 2 dias  
      3: 4,   // Médio - 4 dias
      4: 7,   // Fácil - 7 dias
      5: 14   // Muito fácil - 14 dias
    };

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + intervals[performanceRating]);

    await supabase
      .from('spaced_repetition_queue')
      .update({
        difficulty_level: performanceRating,
        next_review_date: nextReviewDate.toISOString().split('T')[0],
        review_count: item.review_count + 1,
        last_reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    // Remover da queue atual
    setReviewQueue(prev => prev.filter(i => i.id !== itemId));
  };

  const removeFromQueue = async (itemId: string) => {
    await supabase
      .from('spaced_repetition_queue')
      .delete()
      .eq('id', itemId);

    setReviewQueue(prev => prev.filter(i => i.id !== itemId));
  };

  useEffect(() => {
    loadReviewQueue();
  }, [user]);

  return {
    reviewQueue,
    loading,
    addToQueue,
    markAsReviewed,
    removeFromQueue,
    refreshQueue: loadReviewQueue
  };
};