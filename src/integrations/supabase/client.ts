
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
        avatarUrl: avatarUrl
      };
    });
    
  } catch (error) {
    console.error('Error fetching rankings with user info:', error);
    return [];
  }
};

// Function to generate test users for the community
export const generateTestUsers = async (count: number = 30) => {
  try {
    // Check if test users already exist
    const { data: existingUsers, error: checkError } = await supabase
      .from('users_profiles')
      .select('id')
      .ilike('email', 'test%@example.com')
      .limit(1);
      
    if (checkError) throw checkError;
    
    if (existingUsers && existingUsers.length > 0) {
      console.log('Test users already exist. Skipping generation.');
      return { success: true, message: 'Test users already exist' };
    }

    // Array of names for the test users
    const firstNames = ['Maria', 'João', 'Ana', 'Pedro', 'Luiza', 'Carlos', 'Beatriz', 'Rafael', 
                      'Juliana', 'Fernando', 'Amanda', 'Lucas', 'Mariana', 'Guilherme', 'Camila'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Ferreira', 'Pereira', 'Costa', 
                      'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araújo', 'Ribeiro', 'Gomes'];
    
    // Array to store all the test users
    const testUsers = [];
    
    // Generate the specified number of test users
    for (let i = 1; i <= count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const userId = crypto.randomUUID();
      
      testUsers.push({
        id: userId,
        name: `${firstName} ${lastName}`,
        email: `test${i}@example.com`,
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${firstName}${i}`,
        bio: `Olá! Sou ${firstName}, estou estudando para concursos públicos há ${Math.floor(Math.random() * 5) + 1} anos.`,
        concursos_aprovados: Math.random() > 0.7 ? 'INSS,Receita Federal' : (Math.random() > 0.5 ? 'INSS' : null)
      });
    }
    
    // Insert test users into the database
    const { error: insertError } = await supabase
      .from('users_profiles')
      .insert(testUsers);
      
    if (insertError) throw insertError;
    
    // Create follower relationships between users
    const followerRelationships = [];
    
    testUsers.forEach(user => {
      // Each user will follow 1-10 random users
      const followCount = Math.floor(Math.random() * 10) + 1;
      
      for (let i = 0; i < followCount; i++) {
        // Select a random user to follow (different from self)
        const randomIndex = Math.floor(Math.random() * testUsers.length);
        const userToFollow = testUsers[randomIndex];
        
        if (user.id !== userToFollow.id) {
          followerRelationships.push({
            follower_id: user.id,
            followed_id: userToFollow.id
          });
        }
      }
    });
    
    // Remove potential duplicates in follower relationships
    const uniqueRelationships = Array.from(new Set(
      followerRelationships.map(rel => `${rel.follower_id}-${rel.followed_id}`)
    )).map(rel => {
      const [follower_id, followed_id] = rel.split('-');
      return { follower_id, followed_id };
    });
    
    // Insert follower relationships into the database
    if (uniqueRelationships.length > 0) {
      const { error: followError } = await supabase
        .from('user_followers')
        .insert(uniqueRelationships);
        
      if (followError) throw followError;
    }
    
    console.log(`Created ${testUsers.length} test users with ${uniqueRelationships.length} follower relationships`);
    return { success: true, message: `Criados ${testUsers.length} usuários de teste` };
    
  } catch (error) {
    console.error('Error generating test users:', error);
    return { success: false, message: 'Erro ao gerar usuários de teste' };
  }
};
