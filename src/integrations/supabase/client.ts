
import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
export const supabase = createClient(
  'https://ppsymqrdtjyaguftracc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwc3ltcXJkdGp5YWd1ZnRyYWNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDM4NzEwNzIsImV4cCI6MjA1OTQ0NzA3Mn0.7ijkFzxTGirmC0R958v0Tr7p4TghM9A9J4BLI10OMgs'
);

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
      score: Math.floor(Math.random() * 100) // Random score between 0-100
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
      return {
        position: index + 1,
        name: userProfile.name || 'Unknown User',
        score: item.score,
        userId: item.user_id,
        avatarUrl: userProfile.avatar_url || null
      };
    });
    
  } catch (error) {
    console.error('Error fetching rankings with user info:', error);
    return [];
  }
};
