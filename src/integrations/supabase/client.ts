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

// Function to generate test users and followers
export const generateTestUsers = async (count: number = 20) => {
  try {
    console.log(`Starting generation of ${count} test users...`);
    
    // Check if users already exist
    const { data: existingUsers, error: usersCheckError } = await supabase
      .from('users_profiles')
      .select('id')
      .limit(count);
      
    if (usersCheckError) {
      console.error('Error checking existing users:', usersCheckError);
      return false;
    }
    
    // If we already have enough users, don't create more
    if (existingUsers && existingUsers.length >= count) {
      console.log(`Already have ${existingUsers.length} users. No need to create more.`);
      await generateTestFollowers(existingUsers.map(user => user.id));
      return true;
    }
    
    const remainingCount = count - (existingUsers?.length || 0);
    console.log(`Creating ${remainingCount} more test users...`);
    
    // Sample concursos for the users to have approved
    const concursoNames = [
      'Analista do Banco Central',
      'Técnico do INSS',
      'Auditor Fiscal da Receita Federal',
      'Agente da Polícia Federal',
      'Diplomata do Itamaraty',
      'Analista Tributário da Receita Federal',
      'Técnico do Ministério da Economia',
      'Defensor Público da União',
      'Analista Administrativo da ANS',
      'Especialista em Regulação da ANATEL'
    ];
    
    // Sample organizations for bios
    const organizations = [
      'Banco Central do Brasil',
      'INSS',
      'Receita Federal',
      'Polícia Federal',
      'Ministério das Relações Exteriores',
      'Ministério da Economia',
      'Defensoria Pública da União',
      'Agência Nacional de Saúde Suplementar',
      'Agência Nacional de Telecomunicações'
    ];
    
    // Create test users
    const testUsers = [];
    
    for (let i = 0; i < remainingCount; i++) {
      const firstName = `User${i + 1}`;
      const lastName = `Test`;
      const name = `${firstName} ${lastName}`;
      const email = `test_user_${i + 1}@example.com`;
      
      // Generate random approvals (0-4 approvals per user)
      const approvalCount = Math.floor(Math.random() * 5);
      const shuffledConcursos = [...concursoNames].sort(() => 0.5 - Math.random());
      const approvedConcursos = shuffledConcursos.slice(0, approvalCount).join(',');
      
      // Generate random bio
      const org = organizations[Math.floor(Math.random() * organizations.length)];
      const bio = approvalCount > 0 
        ? `${name} é aprovado em ${approvalCount} concurso${approvalCount > 1 ? 's' : ''} e trabalha no ${org}.`
        : `${name} está estudando para concursos e focando na área de ${org}.`;
        
      // Random avatar (using the initials as a seed for a color)
      const avatarUrl = null; // We'll use the fallback with initials
      
      testUsers.push({
        id: crypto.randomUUID(),
        name,
        email,
        bio,
        avatar_url: avatarUrl,
        concursos_aprovados: approvedConcursos,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    if (testUsers.length > 0) {
      // Insert the test users
      const { error: insertError } = await supabase
        .from('users_profiles')
        .insert(testUsers);
        
      if (insertError) {
        console.error('Error inserting test users:', insertError);
        return false;
      }
      
      console.log(`Successfully created ${testUsers.length} test users`);
    }
    
    // Get all user IDs for generating followers
    const { data: allUsers, error: fetchError } = await supabase
      .from('users_profiles')
      .select('id')
      .limit(count);
      
    if (fetchError) {
      console.error('Error fetching all users for followers:', fetchError);
      return false;
    }
    
    if (allUsers && allUsers.length > 0) {
      const userIds = allUsers.map(user => user.id);
      await generateTestFollowers(userIds);
    }
    
    return true;
  } catch (error) {
    console.error('Error generating test users:', error);
    return false;
  }
};

// Function to generate test followers between users
const generateTestFollowers = async (userIds: string[]) => {
  try {
    console.log(`Generating followers among ${userIds.length} users...`);
    
    // Check if we already have followers
    const { data: existingFollowers, error: followersCheckError } = await supabase
      .from('user_followers')
      .select('id')
      .limit(1);
      
    if (followersCheckError) {
      console.error('Error checking existing followers:', followersCheckError);
      return false;
    }
    
    // If we already have followers, don't create more
    if (existingFollowers && existingFollowers.length > 0) {
      console.log('Followers already exist. Skipping follower generation.');
      return true;
    }
    
    const followers = [];
    
    // For each user, generate some random followers
    for (const userId of userIds) {
      // Each user will follow between 0 and 10 random users
      const followCount = Math.floor(Math.random() * 11);
      
      // Shuffle the userIds array to get random followers
      const shuffledUsers = [...userIds]
        .filter(id => id !== userId) // Can't follow self
        .sort(() => 0.5 - Math.random());
        
      // Take a subset of random users to follow
      const followedUsers = shuffledUsers.slice(0, followCount);
      
      // Generate follower relationships
      for (const followedId of followedUsers) {
        followers.push({
          follower_id: userId,
          followed_id: followedId,
          created_at: new Date().toISOString()
        });
      }
    }
    
    // Insert the followers in batches to avoid exceeding limits
    const batchSize = 100;
    for (let i = 0; i < followers.length; i += batchSize) {
      const batch = followers.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('user_followers')
        .insert(batch);
        
      if (insertError) {
        console.error(`Error inserting followers batch ${i}:`, insertError);
      }
    }
    
    console.log(`Successfully created ${followers.length} follower relationships`);
    return true;
  } catch (error) {
    console.error('Error generating test followers:', error);
    return false;
  }
};
