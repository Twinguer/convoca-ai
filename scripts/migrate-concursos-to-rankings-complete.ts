import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = process.env.VITE_SUPABASE_URL || 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1b3ZjdWVmbnVsbHBtcGt0cnpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAxMzIyNjMsImV4cCI6MjA3NTcwODI2M30.420ffZ_xUHt9IefywsLiOeEoehWQqBa9lcfXJUdGGUg';
const nomeiaServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabase = createClient(nomeiaUrl, nomeiaAnonKey);
const supabaseAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

async function migrateConcursosToRankings() {
  console.log('🔄 Iniciando migração completa de concursos para rankings...');

  try {
    // 1. Buscar todos os concursos
    console.log('\n📊 1. Buscando concursos existentes...');
    const { data: concursos, error: concursosError } = await supabaseAdmin
      .from('concursos')
      .select('*')
      .order('created_at', { ascending: false });

    if (concursosError) {
      console.log('❌ Erro ao buscar concursos:', concursosError.message);
      return;
    }

    if (!concursos || concursos.length === 0) {
      console.log('⚠️ Nenhum concurso encontrado para migrar.');
      return;
    }

    console.log(`✅ Encontrados ${concursos.length} concursos para migrar`);

    // 2. Para cada concurso, criar ranking correspondente
    console.log('\n🔄 2. Migrando concursos para rankings...');
    let successCount = 0;
    let errorCount = 0;

    for (const concurso of concursos) {
      try {
        console.log(`\n📝 Migrando: ${concurso.titulo} (${concurso.id})`);

        // Verificar se ranking já existe
        const { data: existingRanking, error: checkError } = await supabaseAdmin
          .from('rankings')
          .select('id')
          .eq('id', concurso.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.log(`❌ Erro ao verificar ranking existente: ${checkError.message}`);
          errorCount++;
          continue;
        }

        if (existingRanking) {
          console.log(`⚠️ Ranking já existe para ${concurso.titulo}, pulando...`);
          successCount++;
          continue;
        }

        // Criar ranking baseado no concurso
        const rankingData = {
          id: concurso.id, // Usar mesmo ID para manter compatibilidade
          titulo: concurso.titulo,
          orgao: concurso.orgao || 'Não informado',
          banca: concurso.banca || 'Não informado',
          status: concurso.status || 'Ativo',
          exam_type: concurso.exam_type || 'Objetiva',
          has_minimum_score: concurso.has_minimum_score || false,
          total_minimum_score: concurso.total_minimum_score || 0,
          wrong_answer_penalty: concurso.wrong_answer_penalty || 0,
          total_participants: 0, // Será atualizado automaticamente
          created_at: concurso.created_at,
          updated_at: concurso.updated_at,
          created_by: concurso.created_by_user_id || null,
          descricao: concurso.link || null
        };

        const { data: newRanking, error: insertError } = await supabaseAdmin
          .from('rankings')
          .insert(rankingData)
          .select('id')
          .single();

        if (insertError) {
          console.log(`❌ Erro ao criar ranking: ${insertError.message}`);
          errorCount++;
          continue;
        }

        console.log(`✅ Ranking criado: ${newRanking.id}`);

        // 3. Migrar disciplinas se existirem
        if (concurso.disciplines && Array.isArray(concurso.disciplines)) {
          console.log(`📚 Migrando disciplinas para ${concurso.titulo}...`);
          
          for (const discipline of concurso.disciplines) {
            if (discipline.isEnabled && discipline.type) {
              const disciplineData = {
                id: `${concurso.id}-${discipline.type}-${Date.now()}`,
                ranking_id: concurso.id,
                discipline_id: discipline.type,
                discipline_name: discipline.name || discipline.type,
                minimum_score: discipline.minimum_score || 0,
                weight: discipline.weight || 1,
                total_questions: discipline.questionCount || 0
              };

              const { error: disciplineError } = await supabaseAdmin
                .from('ranking_disciplines')
                .insert(disciplineData);

              if (disciplineError) {
                console.log(`⚠️ Erro ao migrar disciplina ${discipline.name}: ${disciplineError.message}`);
              } else {
                console.log(`✅ Disciplina migrada: ${discipline.name}`);
              }
            }
          }
        }

        // 4. Migrar participações existentes
        console.log(`👥 Migrando participações para ${concurso.titulo}...`);
        
        const { data: participations, error: participationsError } = await supabaseAdmin
          .from('user_rankings')
          .select('*')
          .eq('concurso_id', concurso.id);

        if (participationsError) {
          console.log(`⚠️ Erro ao buscar participações: ${participationsError.message}`);
        } else if (participations && participations.length > 0) {
          // Atualizar participações para usar ranking_id
          for (const participation of participations) {
            const { error: updateError } = await supabaseAdmin
              .from('user_rankings')
              .update({ ranking_id: concurso.id })
              .eq('id', participation.id);

            if (updateError) {
              console.log(`⚠️ Erro ao atualizar participação: ${updateError.message}`);
            }
          }
          console.log(`✅ ${participations.length} participações atualizadas`);
        }

        successCount++;

      } catch (error) {
        console.log(`❌ Erro ao migrar ${concurso.titulo}:`, error);
        errorCount++;
      }
    }

    console.log(`\n🎉 Migração concluída!`);
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);

    // 5. Verificar resultado final
    console.log('\n📊 5. Verificando resultado final...');
    const { data: finalRankings, error: finalError } = await supabaseAdmin
      .from('rankings')
      .select('id, titulo, status, total_participants')
      .order('created_at', { ascending: false });

    if (finalError) {
      console.log('❌ Erro ao verificar rankings finais:', finalError.message);
    } else {
      console.log(`✅ Total de rankings: ${finalRankings?.length || 0}`);
      finalRankings?.forEach(r => {
        console.log(`  - ${r.titulo} (${r.status}): ${r.total_participants} participantes`);
      });
    }

  } catch (error) {
    console.log('❌ Erro geral na migração:', error);
  }
}

if (import.meta.main) {
  migrateConcursosToRankings().catch(console.error);
}



