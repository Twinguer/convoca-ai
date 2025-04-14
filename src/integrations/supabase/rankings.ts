
import { supabase } from './client';

// Function to generate fake rankings for a concurso
export const generateFakeRankings = async (concursoId: string, count: number = 10) => {
  try {
    // Get existing users from users_profiles
    const { data: users, error: usersError } = await supabase
      .from('users_profiles')
      .select('id, name, avatar_url')
      .limit(count);

    if (usersError) throw usersError;
    
    if (!users || users.length === 0) {
      console.error('No users found to create rankings');
      return;
    }

    // Check if rankings already exist for this concurso
    const { data: existingRankings, error: rankingsError } = await supabase
      .from('user_rankings')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (rankingsError) throw rankingsError;
    
    if (existingRankings && existingRankings.length > 0) {
      console.log(`Rankings already exist for concurso ${concursoId}`);
      return;
    }

    // Create rankings for each user
    const rankings = users.map(user => ({
      user_id: user.id,
      concurso_id: concursoId,
      score: Math.floor(Math.random() * 100), // Random score between 0-100
      basic_knowledge_score: Math.floor(Math.random() * 40),
      specific_knowledge_score: Math.floor(Math.random() * 60)
    }));

    // Insert rankings into database
    const { error: insertError } = await supabase
      .from('user_rankings')
      .insert(rankings);

    if (insertError) throw insertError;
    
    console.log(`Created ${rankings.length} fake rankings for concurso ${concursoId}`);
    
  } catch (error) {
    console.error('Error generating fake rankings:', error);
  }
};

// Function to get rankings for a concurso with user information
export const getRankingsWithUserInfo = async (concursoId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_rankings')
      .select(`
        id,
        score,
        basic_knowledge_score,
        specific_knowledge_score,
        discursive_score,
        user_id,
        users_profiles!inner(name, avatar_url)
      `)
      .eq('concurso_id', concursoId)
      .order('score', { ascending: false });
      
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return [];
    }
    
    // Format the data with position
    return data.map((item, index) => {
      // Fix: Correctly access nested properties
      const userProfile = item.users_profiles || {};
      
      // Safely access properties with type checking
      const name = typeof userProfile === 'object' && userProfile !== null && 'name' in userProfile 
        ? userProfile.name 
        : 'Unknown User';
        
      const avatarUrl = typeof userProfile === 'object' && userProfile !== null && 'avatar_url' in userProfile 
        ? userProfile.avatar_url 
        : null;
      
      return {
        position: index + 1,
        name: name,
        score: item.score,
        userId: item.user_id,
        avatarUrl: avatarUrl,
        basicKnowledgeScore: item.basic_knowledge_score,
        specificKnowledgeScore: item.specific_knowledge_score,
        discursiveScore: item.discursive_score
      };
    });
    
  } catch (error) {
    console.error('Error fetching rankings with user info:', error);
    return [];
  }
};

// Function to schedule scraper for concursos
export const scheduleScraper = async (): Promise<void> => {
  try {
    console.log('Scheduling scraper for concursos...');
    // This would typically make an API call to schedule scraping
    // For now, we'll just log that it was called
  } catch (error) {
    console.error('Error scheduling scraper:', error);
  }
};

// Function to create a new ranking
export const createRanking = async (rankingData: any) => {
  try {
    console.log('Creating new ranking with data:', rankingData);
    
    // First, check if all required fields are present
    const requiredFields = ['titulo', 'orgao', 'banca'];
    for (const field of requiredFields) {
      if (!rankingData[field]) {
        throw new Error(`Campo obrigatório faltando: ${field}`);
      }
    }
    
    // Insert directly into concursos table instead of using RPC
    const { data, error } = await supabase
      .from('concursos')
      .insert({
        titulo: rankingData.titulo,
        orgao: rankingData.orgao,
        banca: rankingData.banca,
        data_publicacao: rankingData.data_publicacao,
        vagas: rankingData.vagas,
        inscritos: rankingData.inscritos,
        etapa_atual: rankingData.etapa_atual,
        status: rankingData.status,
        exam_type: rankingData.exam_type,
        alternatives_count: rankingData.alternatives_count,
        wrong_answer_penalty: rankingData.wrong_answer_penalty,
        basic_knowledge_weight: rankingData.basic_knowledge_weight,
        specific_knowledge_weight: rankingData.specific_knowledge_weight,
        discursive_weight: rankingData.discursive_weight,
        link: rankingData.link,
        
        // Add new exam structure fields
        has_basic_knowledge: rankingData.has_basic_knowledge,
        has_specific_knowledge_1: rankingData.has_specific_knowledge_1,
        has_specific_knowledge_2: rankingData.has_specific_knowledge_2,
        has_discursive: rankingData.has_discursive,
        basic_knowledge_questions: rankingData.basic_knowledge_questions,
        specific_knowledge_1_questions: rankingData.specific_knowledge_1_questions,
        specific_knowledge_2_questions: rankingData.specific_knowledge_2_questions
      })
      .select();
      
    if (error) {
      console.error('Database error creating ranking:', error);
      throw error;
    }
    
    console.log('Ranking created successfully:', data);
    return data;
  } catch (error) {
    console.error('Error creating ranking:', error);
    throw error;
  }
};

// New function to save user answers and calculate scores
export const saveUserAnswers = async (
  rankingId: string, 
  concursoId: string,
  answers: { questionNumber: number; answer: string; isBasicKnowledge: boolean }[]
) => {
  try {
    // First, save the user's answers
    const answersData = answers.map(a => ({
      user_ranking_id: rankingId,
      question_number: a.questionNumber,
      answer: a.answer,
      is_basic_knowledge: a.isBasicKnowledge
    }));
    
    // Delete existing answers first
    await supabase
      .from('user_answers')
      .delete()
      .eq('user_ranking_id', rankingId);
    
    // Insert new answers
    const { error: insertError } = await supabase
      .from('user_answers')
      .insert(answersData);
      
    if (insertError) throw insertError;
    
    // Get the official answer key
    const { data: answerKey, error: keyError } = await supabase
      .from('answer_keys')
      .select('*')
      .eq('concurso_id', concursoId);
      
    if (keyError) throw keyError;
    
    if (!answerKey || answerKey.length === 0) {
      throw new Error('Gabarito oficial não encontrado para este concurso');
    }
    
    // Calculate score by comparing user answers with official answers
    let basicKnowledgeScore = 0;
    let specificKnowledgeScore = 0;
    
    answers.forEach(userAnswer => {
      const officialAnswer = answerKey.find(
        a => a.question_number === userAnswer.questionNumber
      );
      
      if (officialAnswer && officialAnswer.answer === userAnswer.answer) {
        if (userAnswer.isBasicKnowledge) {
          basicKnowledgeScore += 1;
        } else {
          specificKnowledgeScore += 1;
        }
      }
    });
    
    // Calculate total score
    const totalScore = basicKnowledgeScore + specificKnowledgeScore;
    
    // Update user ranking with scores
    const { error: updateError } = await supabase
      .from('user_rankings')
      .update({
        basic_knowledge_score: basicKnowledgeScore,
        specific_knowledge_score: specificKnowledgeScore,
        score: totalScore,
        updated_at: new Date().toISOString()
      })
      .eq('id', rankingId);
      
    if (updateError) throw updateError;
    
    return { 
      success: true, 
      basicKnowledgeScore, 
      specificKnowledgeScore, 
      totalScore 
    };
  } catch (error: any) {
    console.error('Error saving answers and calculating score:', error);
    throw error;
  }
};
