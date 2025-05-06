
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { supabase } from '@/integrations/supabase/client';
import { getRankingTableColumns } from '@/types/concursos';

// Re-export from more specific modules for backward compatibility
export * from './answerManagement';
export * from './batchOperations';
export * from './concursoManager';
export * from './examStructure';
export * from './scoreCalculation';
export * from './userRankings';

/**
 * Generate ranking table columns based on concurso structure
 * @param concurso The concurso configuration object
 * @returns Array of column definitions for the ranking table
 */
export const generateRankingColumns = async (concursoId: string) => {
  try {
    const { data: concurso, error } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (error) throw error;
    
    if (!concurso) {
      return [
        { id: 'position', label: '#', align: 'center', width: '16' },
        { id: 'name', label: 'Candidato', align: 'left' },
        { id: 'score', label: 'Total', align: 'right' }
      ];
    }
    
    // If using subject-based structure, build columns differently
    if (concurso.minimum_score_type === 'subject') {
      const baseColumns = [
        { id: 'position', label: '#', align: 'center', width: '16' },
        { id: 'name', label: 'Candidato', align: 'left' },
        { id: 'score', label: 'Total', align: 'right' }
      ];
      
      // Parse subjects from concurso
      let subjects: any[] = [];
      try {
        subjects = typeof concurso.subjects === 'string'
          ? JSON.parse(concurso.subjects)
          : concurso.subjects || [];
      } catch (e) {
        console.error('Error parsing subjects:', e);
        return baseColumns;
      }
      
      // Add a column for each subject
      const subjectColumns = subjects.map(subject => ({
        id: `subject_${subject.code}`,
        label: subject.code,
        align: 'right' as 'right'
      }));
      
      return [...baseColumns, ...subjectColumns];
    }
    
    // For knowledge-based structures, use the standard function
    return getRankingTableColumns(concurso);
  } catch (error) {
    console.error('Error generating ranking columns:', error);
    return [
      { id: 'position', label: '#', align: 'center', width: '16' },
      { id: 'name', label: 'Candidato', align: 'left' },
      { id: 'score', label: 'Total', align: 'right' }
    ];
  }
};

/**
 * Get subject scores for a user ranking
 */
export const getSubjectScores = async (rankingId: string, concursoId: string) => {
  try {
    // Get concurso to load subjects
    const { data: concurso, error: concursoError } = await supabase
      .from('concursos')
      .select('*')
      .eq('id', concursoId)
      .single();
      
    if (concursoError || !concurso) {
      console.error('Error fetching concurso:', concursoError);
      return [];
    }
    
    // Parse subjects list
    let subjects: any[] = [];
    try {
      subjects = typeof concurso.subjects === 'string'
        ? JSON.parse(concurso.subjects)
        : concurso.subjects || [];
    } catch (e) {
      console.error('Error parsing subjects:', e);
      return [];
    }
    
    if (subjects.length === 0) {
      return [];
    }
    
    // Get user answers
    const { data: userAnswers, error: answersError } = await supabase
      .from('user_answers')
      .select('*')
      .eq('user_ranking_id', rankingId);
      
    if (answersError) {
      console.error('Error fetching user answers:', answersError);
      return [];
    }
    
    // Get official answers
    const { data: officialAnswers, error: officialError } = await supabase
      .from('official_answer_weights')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (officialError) {
      console.error('Error fetching official answers:', officialError);
      return [];
    }
    
    // Calculate scores for each subject
    const subjectScores = subjects.map(subject => {
      // Determine question range for this subject
      let startQuestion = 1;
      for (const s of subjects) {
        if (s.code === subject.code) break;
        startQuestion += s.questions;
      }
      const endQuestion = startQuestion + subject.questions - 1;
      
      // Count correct answers
      let correctCount = 0;
      for (let q = startQuestion; q <= endQuestion; q++) {
        const userAnswer = userAnswers?.find(a => a.question_number === q);
        const officialAnswer = officialAnswers?.find(a => a.question_number === q);
        
        if (userAnswer && officialAnswer) {
          if (officialAnswer.is_nullified || 
              userAnswer.answer?.toUpperCase() === officialAnswer.correct_answer?.toUpperCase()) {
            correctCount++;
          }
        }
      }
      
      return {
        code: subject.code,
        name: subject.name,
        score: correctCount,
        total: subject.questions,
        minimumScore: subject.minimum_score,
        minimumScoreUnitType: subject.minimum_score_unit_type
      };
    });
    
    return subjectScores;
  } catch (error) {
    console.error('Error getting subject scores:', error);
    return [];
  }
};
