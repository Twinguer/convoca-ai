
import { supabase } from '../client';
import { DEFAULT_SUBJECTS, generateSubjectCode } from './examStructure';

/**
 * Gets all available subjects for selection
 */
export const getAvailableSubjects = async () => {
  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching subjects:', error);
      // Return default subjects if DB fetch fails
      return DEFAULT_SUBJECTS.map(subject => ({
        id: subject.code,
        name: subject.name,
        code: subject.code,
        is_predefined: true
      }));
    }
    
    return data || [];
  } catch (err) {
    console.error('Exception in getAvailableSubjects:', err);
    return DEFAULT_SUBJECTS.map(subject => ({
      id: subject.code,
      name: subject.name,
      code: subject.code,
      is_predefined: true
    }));
  }
};

/**
 * Adds a custom subject if it doesn't exist
 */
export const addCustomSubject = async (name: string) => {
  try {
    const code = generateSubjectCode(name);
    
    // Check if subject with similar name already exists
    const { data: existingSubjects } = await supabase
      .from('subjects')
      .select('*')
      .ilike('name', name)
      .limit(1);
    
    if (existingSubjects && existingSubjects.length > 0) {
      return existingSubjects[0];
    }
    
    // Insert new subject
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        name,
        code,
        is_predefined: false
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error adding custom subject:', error);
      // Return a temporary object if insertion fails
      return {
        id: code,
        code,
        name,
        is_predefined: false
      };
    }
    
    return data;
  } catch (err) {
    console.error('Exception in addCustomSubject:', err);
    const code = generateSubjectCode(name);
    return {
      id: code,
      code,
      name,
      is_predefined: false
    };
  }
};

/**
 * Calculates score for a subject-based exam
 */
export const calculateSubjectBasedScore = (
  userAnswers: Record<number, string>,
  officialAnswers: Array<{
    question_number: number,
    correct_answer: string,
    subject_code: string,
    weight: number
  }>,
  subjects: Array<{
    code: string,
    weight: number,
    question_count: number
  }>
) => {
  const subjectScores: Record<string, {
    correct: number,
    total: number,
    weightedScore: number,
    rawScore: number
  }> = {};
  
  // Initialize subject scores
  subjects.forEach(subject => {
    subjectScores[subject.code] = {
      correct: 0,
      total: subject.question_count || 0,
      weightedScore: 0,
      rawScore: 0
    };
  });
  
  // Calculate scores per subject
  officialAnswers.forEach(answer => {
    const userAnswer = userAnswers[answer.question_number];
    if (userAnswer === answer.correct_answer && subjectScores[answer.subject_code]) {
      subjectScores[answer.subject_code].correct += 1;
    }
  });
  
  // Calculate raw and weighted scores
  let totalWeightedScore = 0;
  subjects.forEach(subject => {
    const subjectData = subjectScores[subject.code];
    
    if (subjectData && subjectData.total > 0) {
      subjectData.rawScore = (subjectData.correct / subjectData.total) * 100;
      subjectData.weightedScore = subjectData.rawScore * (subject.weight || 1);
      totalWeightedScore += subjectData.weightedScore;
    }
  });
  
  // Normalize the total score
  const totalWeight = subjects.reduce((sum, subject) => sum + (subject.weight || 1), 0);
  const normalizedTotalScore = totalWeight > 0 ? totalWeightedScore / totalWeight : 0;
  
  return {
    subjectScores,
    totalScore: normalizedTotalScore
  };
};
