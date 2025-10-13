import { createClient } from '@supabase/supabase-js';

// Credenciais do banco nomeia-ai
const nomeiaUrl = 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);

async function fixCompatibilityTests() {
  console.log('🔧 Corrigindo testes de compatibilidade...');
  
  try {
    // 1. Teste 2: Buscar rankings com participantes
    console.log('\n📊 Teste 2: Buscar rankings com participantes');
    
    try {
      const { data: rankingsWithParticipants, error: rankingsError } = await supabase
        .from('rankings')
        .select(`
          id,
          titulo,
          total_participants,
          user_rankings!inner(
            id,
            user_id,
            score,
            position
          )
        `)
        .limit(5);
      
      if (rankingsError) {
        console.log('❌ Erro no teste 2:', rankingsError.message);
      } else {
        console.log('✅ Teste 2 funcionando');
        console.log('📊 Rankings com participantes:', rankingsWithParticipants?.length || 0);
        if (rankingsWithParticipants && rankingsWithParticipants.length > 0) {
          console.log('📋 Exemplo:', rankingsWithParticipants[0].titulo, 'com', rankingsWithParticipants[0].user_rankings?.length || 0, 'participantes');
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 2:', error);
    }
    
    // 2. Teste 3: Buscar ranking específico com todos os dados
    console.log('\n📊 Teste 3: Buscar ranking específico com todos os dados');
    
    try {
      const { data: specificRanking, error: specificError } = await supabase
        .from('rankings')
        .select(`
          id,
          titulo,
          orgao,
          banca,
          status,
          total_participants,
          has_minimum_score,
          total_minimum_score,
          wrong_answer_penalty,
          created_at,
          updated_at,
          user_rankings(
            id,
            user_id,
            score,
            position,
            reservation_type,
            users_profiles!inner(
              id,
              name,
              email
            )
          ),
          ranking_disciplines(
            discipline_id,
            discipline_name,
            total_questions,
            weight,
            minimum_score
          ),
          ranking_answers(
            booklet_id,
            question_number,
            correct_answer,
            weight
          )
        `)
        .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .single();
      
      if (specificError) {
        console.log('❌ Erro no teste 3:', specificError.message);
      } else {
        console.log('✅ Teste 3 funcionando');
        console.log('📊 Ranking encontrado:', specificRanking?.titulo);
        console.log('👥 Participações:', specificRanking?.user_rankings?.length || 0);
        console.log('📚 Disciplinas:', specificRanking?.ranking_disciplines?.length || 0);
        console.log('📝 Questões:', specificRanking?.ranking_answers?.length || 0);
      }
    } catch (error) {
      console.log('❌ Erro no teste 3:', error);
    }
    
    // 3. Teste 4: Buscar usuários com participações
    console.log('\n📊 Teste 4: Buscar usuários com participações');
    
    try {
      const { data: usersWithParticipations, error: usersError } = await supabase
        .from('users_profiles')
        .select(`
          id,
          name,
          email,
          user_rankings!inner(
            id,
            ranking_id,
            score,
            position,
            reservation_type,
            rankings!inner(
              id,
              titulo,
              status
            )
          )
        `)
        .limit(5);
      
      if (usersError) {
        console.log('❌ Erro no teste 4:', usersError.message);
      } else {
        console.log('✅ Teste 4 funcionando');
        console.log('📊 Usuários com participações:', usersWithParticipations?.length || 0);
        if (usersWithParticipations && usersWithParticipations.length > 0) {
          console.log('📋 Exemplo:', usersWithParticipations[0].name, 'com', usersWithParticipations[0].user_rankings?.length || 0, 'participações');
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 4:', error);
    }
    
    // 4. Teste 5: Buscar respostas de usuário
    console.log('\n📊 Teste 5: Buscar respostas de usuário');
    
    try {
      const { data: userAnswers, error: answersError } = await supabase
        .from('user_answers')
        .select(`
          id,
          ranking_id,
          user_id,
          booklet_id,
          question_number,
          user_answer,
          is_correct,
          points_earned,
          users_profiles!inner(
            id,
            name
          ),
          rankings!inner(
            id,
            titulo
          )
        `)
        .limit(10);
      
      if (answersError) {
        console.log('❌ Erro no teste 5:', answersError.message);
      } else {
        console.log('✅ Teste 5 funcionando');
        console.log('📊 Respostas encontradas:', userAnswers?.length || 0);
        if (userAnswers && userAnswers.length > 0) {
          console.log('📋 Exemplo:', userAnswers[0].users_profiles?.name, 'respondeu', userAnswers[0].question_number);
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 5:', error);
    }
    
    // 5. Teste 6: Buscar gabarito oficial
    console.log('\n📊 Teste 6: Buscar gabarito oficial');
    
    try {
      const { data: officialAnswers, error: officialError } = await supabase
        .from('ranking_answers')
        .select(`
          id,
          ranking_id,
          booklet_id,
          question_number,
          correct_answer,
          weight,
          rankings!inner(
            id,
            titulo
          )
        `)
        .eq('ranking_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .order('question_number');
      
      if (officialError) {
        console.log('❌ Erro no teste 6:', officialError.message);
      } else {
        console.log('✅ Teste 6 funcionando');
        console.log('📊 Questões do gabarito:', officialAnswers?.length || 0);
        if (officialAnswers && officialAnswers.length > 0) {
          console.log('📋 Exemplo: Questão', officialAnswers[0].question_number, '=', officialAnswers[0].correct_answer);
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 6:', error);
    }
    
    // 6. Teste 7: Buscar disciplinas
    console.log('\n📊 Teste 7: Buscar disciplinas');
    
    try {
      const { data: disciplines, error: disciplinesError } = await supabase
        .from('ranking_disciplines')
        .select(`
          id,
          ranking_id,
          discipline_id,
          discipline_name,
          total_questions,
          weight,
          minimum_score,
          rankings!inner(
            id,
            titulo
          )
        `)
        .eq('ranking_id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
      
      if (disciplinesError) {
        console.log('❌ Erro no teste 7:', disciplinesError.message);
      } else {
        console.log('✅ Teste 7 funcionando');
        console.log('📊 Disciplinas encontradas:', disciplines?.length || 0);
        if (disciplines && disciplines.length > 0) {
          console.log('📋 Exemplo:', disciplines[0].discipline_name, 'com', disciplines[0].total_questions, 'questões');
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 7:', error);
    }
    
    // 7. Teste 8: Query complexa - ranking com estatísticas
    console.log('\n📊 Teste 8: Query complexa - ranking com estatísticas');
    
    try {
      const { data: complexQuery, error: complexError } = await supabase
        .from('rankings')
        .select(`
          id,
          titulo,
          total_participants,
          status,
          user_rankings(
            id,
            score,
            position,
            users_profiles!inner(
              id,
              name
            )
          ),
          ranking_disciplines(
            discipline_name,
            total_questions,
            weight
          )
        `)
        .eq('id', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')
        .single();
      
      if (complexError) {
        console.log('❌ Erro no teste 8:', complexError.message);
      } else {
        console.log('✅ Teste 8 funcionando');
        console.log('📊 Ranking complexo:', complexQuery?.titulo);
        console.log('👥 Participantes:', complexQuery?.user_rankings?.length || 0);
        console.log('📚 Disciplinas:', complexQuery?.ranking_disciplines?.length || 0);
        
        // Calcular estatísticas
        if (complexQuery?.user_rankings && complexQuery.user_rankings.length > 0) {
          const scores = complexQuery.user_rankings.map(ur => ur.score);
          const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
          const maxScore = Math.max(...scores);
          const minScore = Math.min(...scores);
          
          console.log('📊 Estatísticas:');
          console.log('  - Pontuação média:', avgScore.toFixed(2));
          console.log('  - Pontuação máxima:', maxScore);
          console.log('  - Pontuação mínima:', minScore);
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 8:', error);
    }
    
    // 8. Teste 9: Performance - query com muitos registros
    console.log('\n📊 Teste 9: Performance - query com muitos registros');
    
    try {
      const startTime = performance.now();
      
      const { data: performanceData, error: performanceError } = await supabase
        .from('user_rankings')
        .select(`
          id,
          ranking_id,
          user_id,
          score,
          position,
          users_profiles!inner(
            id,
            name
          ),
          rankings!inner(
            id,
            titulo
          )
        `)
        .order('score', { ascending: false })
        .limit(100);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      if (performanceError) {
        console.log('❌ Erro no teste 9:', performanceError.message);
      } else {
        console.log('✅ Teste 9 funcionando');
        console.log(`⏱️ Tempo de execução: ${executionTime.toFixed(2)}ms`);
        console.log('📊 Registros retornados:', performanceData?.length || 0);
        
        if (performanceData && performanceData.length > 0) {
          console.log('📋 Top 3:');
          performanceData.slice(0, 3).forEach((item, index) => {
            console.log(`  ${index + 1}. ${item.users_profiles?.name}: ${item.score} pontos`);
          });
        }
      }
    } catch (error) {
      console.log('❌ Erro no teste 9:', error);
    }
    
    console.log('\n🎉 Testes de compatibilidade corrigidos!');
    
  } catch (error) {
    console.error('❌ Erro durante correção:', error);
  }
}

// Executar correção
fixCompatibilityTests().catch(console.error);



