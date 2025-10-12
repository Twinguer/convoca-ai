import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = process.env.VITE_SUPABASE_URL || 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabaseAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

async function fixRankingCreation() {
  console.log('🔧 Corrigindo sistema de criação de rankings...');

  try {
    // 1. Verificar se triggers existem
    console.log('\n📊 1. Verificando triggers existentes...');
    
    const { data: triggers, error: triggersError } = await supabaseAdmin
      .from('pg_trigger')
      .select('tgname, tgrelid::regclass as table_name')
      .in('tgname', [
        'trigger_create_ranking_from_concurso',
        'trigger_update_ranking_from_concurso',
        'trigger_delete_ranking_from_concurso'
      ]);

    if (triggersError) {
      console.log('⚠️ Erro ao verificar triggers:', triggersError.message);
    } else {
      console.log(`✅ Triggers encontrados: ${triggers?.length || 0}`);
      triggers?.forEach(t => console.log(`  - ${t.tgname} em ${t.table_name}`));
    }

    // 2. Verificar se funções existem
    console.log('\n📊 2. Verificando funções existentes...');
    
    const { data: functions, error: functionsError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname, prosrc')
      .in('proname', [
        'create_ranking_from_concurso',
        'update_ranking_from_concurso',
        'delete_ranking_from_concurso',
        'ensure_ranking_exists'
      ]);

    if (functionsError) {
      console.log('⚠️ Erro ao verificar funções:', functionsError.message);
    } else {
      console.log(`✅ Funções encontradas: ${functions?.length || 0}`);
      functions?.forEach(f => console.log(`  - ${f.proname}`));
    }

    // 3. Testar função ensure_ranking_exists
    console.log('\n🧪 3. Testando função ensure_ranking_exists...');
    
    try {
      const { data: testResult, error: testError } = await supabaseAdmin
        .rpc('ensure_ranking_exists', { concurso_id_param: 'test-ranking-id' });
        
      if (testError) {
        console.log('⚠️ Erro ao testar função:', testError.message);
      } else {
        console.log('✅ Função ensure_ranking_exists funcionando');
      }
    } catch (err) {
      console.log('⚠️ Erro ao testar função:', err);
    }

    // 4. Verificar concursos sem rankings correspondentes
    console.log('\n📊 4. Verificando concursos sem rankings...');
    
    const { data: concursosWithoutRankings, error: checkError } = await supabaseAdmin
      .from('concursos')
      .select(`
        id,
        titulo,
        status,
        created_at
      `)
      .not('id', 'in', `(SELECT id FROM rankings)`);

    if (checkError) {
      console.log('❌ Erro ao verificar concursos sem rankings:', checkError.message);
    } else {
      console.log(`📊 Concursos sem rankings: ${concursosWithoutRankings?.length || 0}`);
      
      if (concursosWithoutRankings && concursosWithoutRankings.length > 0) {
        console.log('📋 Lista de concursos sem rankings:');
        concursosWithoutRankings.forEach(c => {
          console.log(`  - ${c.titulo} (${c.id}) - ${c.status}`);
        });
        
        // Criar rankings para concursos órfãos
        console.log('\n🔄 Criando rankings para concursos órfãos...');
        
        for (const concurso of concursosWithoutRankings) {
          try {
            const { data: newRanking, error: createError } = await supabaseAdmin
              .from('rankings')
              .insert({
                id: concurso.id,
                titulo: concurso.titulo,
                orgao: 'Não informado',
                banca: 'Não informado',
                status: concurso.status || 'Ativo',
                exam_type: 'Objetiva',
                has_minimum_score: false,
                total_minimum_score: 0,
                wrong_answer_penalty: 0,
                total_participants: 0,
                created_at: concurso.created_at,
                updated_at: concurso.created_at,
                created_by: null,
                descricao: null
              })
              .select('id')
              .single();

            if (createError) {
              console.log(`❌ Erro ao criar ranking para ${concurso.titulo}: ${createError.message}`);
            } else {
              console.log(`✅ Ranking criado para ${concurso.titulo}: ${newRanking.id}`);
            }
          } catch (err) {
            console.log(`❌ Erro ao criar ranking para ${concurso.titulo}:`, err);
          }
        }
      }
    }

    // 5. Verificar participações órfãs
    console.log('\n📊 5. Verificando participações órfãs...');
    
    const { data: orphanParticipations, error: orphanError } = await supabaseAdmin
      .from('user_rankings')
      .select(`
        id,
        user_id,
        ranking_id,
        concurso_id,
        score
      `)
      .is('ranking_id', null)
      .not('concurso_id', 'is', null);

    if (orphanError) {
      console.log('❌ Erro ao verificar participações órfãs:', orphanError.message);
    } else {
      console.log(`📊 Participações órfãs: ${orphanParticipations?.length || 0}`);
      
      if (orphanParticipations && orphanParticipations.length > 0) {
        console.log('🔄 Corrigindo participações órfãs...');
        
        for (const participation of orphanParticipations) {
          try {
            const { error: updateError } = await supabaseAdmin
              .from('user_rankings')
              .update({ ranking_id: participation.concurso_id })
              .eq('id', participation.id);

            if (updateError) {
              console.log(`❌ Erro ao corrigir participação ${participation.id}: ${updateError.message}`);
            } else {
              console.log(`✅ Participação ${participation.id} corrigida`);
            }
          } catch (err) {
            console.log(`❌ Erro ao corrigir participação ${participation.id}:`, err);
          }
        }
      }
    }

    // 6. Verificar estado final
    console.log('\n📊 6. Verificando estado final...');
    
    const { data: finalStats, error: finalError } = await supabaseAdmin
      .from('rankings')
      .select('id, titulo, status, total_participants')
      .order('created_at', { ascending: false })
      .limit(10);

    if (finalError) {
      console.log('❌ Erro ao verificar estado final:', finalError.message);
    } else {
      console.log(`✅ Rankings ativos: ${finalStats?.length || 0}`);
      finalStats?.forEach(r => {
        console.log(`  - ${r.titulo} (${r.status}): ${r.total_participants} participantes`);
      });
    }

    // 7. Testar criação de novo concurso
    console.log('\n🧪 7. Testando criação de novo concurso...');
    
    const testConcursoId = `test-concurso-${Date.now()}`;
    
    try {
      const { data: testConcurso, error: testConcursoError } = await supabaseAdmin
        .from('concursos')
        .insert({
          id: testConcursoId,
          titulo: 'Teste de Criação Automática',
          orgao: 'Teste',
          banca: 'Teste',
          status: 'Ativo',
          exam_type: 'Objetiva',
          has_minimum_score: false,
          total_minimum_score: 0,
          wrong_answer_penalty: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by_user_id: null,
          link: null
        })
        .select('id')
        .single();

      if (testConcursoError) {
        console.log('❌ Erro ao criar concurso de teste:', testConcursoError.message);
      } else {
        console.log(`✅ Concurso de teste criado: ${testConcurso.id}`);
        
        // Verificar se ranking foi criado automaticamente
        const { data: testRanking, error: testRankingError } = await supabaseAdmin
          .from('rankings')
          .select('id, titulo')
          .eq('id', testConcursoId)
          .single();

        if (testRankingError) {
          console.log('❌ Ranking não foi criado automaticamente:', testRankingError.message);
        } else {
          console.log(`✅ Ranking criado automaticamente: ${testRanking.titulo}`);
        }
        
        // Limpar dados de teste
        await supabaseAdmin.from('rankings').delete().eq('id', testConcursoId);
        await supabaseAdmin.from('concursos').delete().eq('id', testConcursoId);
        console.log('🧹 Dados de teste removidos');
      }
    } catch (err) {
      console.log('❌ Erro no teste de criação:', err);
    }

    console.log('\n🎉 Correção do sistema de criação de rankings concluída!');

  } catch (error) {
    console.log('❌ Erro geral na correção:', error);
  }
}

if (import.meta.main) {
  fixRankingCreation().catch(console.error);
}

