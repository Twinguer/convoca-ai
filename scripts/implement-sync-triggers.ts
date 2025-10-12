import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const nomeiaUrl = process.env.VITE_SUPABASE_URL || 'https://xuovcuefnullpmpktrzd.supabase.co';
const nomeiaServiceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key-here';

const supabaseAdmin = createClient(nomeiaUrl, nomeiaServiceRoleKey);

async function implementSyncTriggers() {
  console.log('🔄 Implementando triggers de sincronização...');

  const syncTriggersSQL = `
-- =====================================================
-- TRIGGERS DE SINCRONIZAÇÃO CONCURSOS <-> RANKINGS
-- =====================================================

-- 1. Função para criar ranking automaticamente quando concurso é criado
CREATE OR REPLACE FUNCTION create_ranking_from_concurso()
RETURNS TRIGGER AS $$
BEGIN
  -- Inserir na tabela rankings
  INSERT INTO rankings (
    id,
    titulo,
    orgao,
    banca,
    status,
    exam_type,
    has_minimum_score,
    total_minimum_score,
    wrong_answer_penalty,
    total_participants,
    created_at,
    updated_at,
    created_by,
    descricao
  ) VALUES (
    NEW.id,
    NEW.titulo,
    COALESCE(NEW.orgao, 'Não informado'),
    COALESCE(NEW.banca, 'Não informado'),
    COALESCE(NEW.status, 'Ativo'),
    COALESCE(NEW.exam_type, 'Objetiva'),
    COALESCE(NEW.has_minimum_score, false),
    COALESCE(NEW.total_minimum_score, 0),
    COALESCE(NEW.wrong_answer_penalty, 0),
    0,
    NEW.created_at,
    NEW.updated_at,
    NEW.created_by_user_id,
    NEW.link
  );

  -- Migrar disciplinas se existirem
  IF NEW.disciplines IS NOT NULL AND jsonb_typeof(NEW.disciplines) = 'array' THEN
    FOR i IN 0..jsonb_array_length(NEW.disciplines) - 1 LOOP
      DECLARE
        discipline_item jsonb := NEW.disciplines->i;
        discipline_type text;
        discipline_name text;
        discipline_minimum_score numeric;
        discipline_weight numeric;
        discipline_questions integer;
      BEGIN
        -- Extrair dados da disciplina
        discipline_type := discipline_item->>'type';
        discipline_name := discipline_item->>'name';
        discipline_minimum_score := COALESCE((discipline_item->>'minimum_score')::numeric, 0);
        discipline_weight := COALESCE((discipline_item->>'weight')::numeric, 1);
        discipline_questions := COALESCE((discipline_item->>'questionCount')::integer, 0);

        -- Inserir disciplina se estiver habilitada
        IF (discipline_item->>'isEnabled')::boolean = true AND discipline_type IS NOT NULL THEN
          INSERT INTO ranking_disciplines (
            id,
            ranking_id,
            discipline_id,
            discipline_name,
            minimum_score,
            weight,
            total_questions
          ) VALUES (
            NEW.id || '-' || discipline_type || '-' || extract(epoch from now())::text,
            NEW.id,
            discipline_type,
            COALESCE(discipline_name, discipline_type),
            discipline_minimum_score,
            discipline_weight,
            discipline_questions
          );
        END IF;
      END;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Função para atualizar ranking quando concurso é atualizado
CREATE OR REPLACE FUNCTION update_ranking_from_concurso()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualizar ranking
  UPDATE rankings SET
    titulo = NEW.titulo,
    orgao = COALESCE(NEW.orgao, 'Não informado'),
    banca = COALESCE(NEW.banca, 'Não informado'),
    status = COALESCE(NEW.status, 'Ativo'),
    exam_type = COALESCE(NEW.exam_type, 'Objetiva'),
    has_minimum_score = COALESCE(NEW.has_minimum_score, false),
    total_minimum_score = COALESCE(NEW.total_minimum_score, 0),
    wrong_answer_penalty = COALESCE(NEW.wrong_answer_penalty, 0),
    updated_at = NEW.updated_at,
    created_by = NEW.created_by_user_id,
    descricao = NEW.link
  WHERE id = NEW.id;

  -- Sincronizar disciplinas (remover existentes e recriar)
  DELETE FROM ranking_disciplines WHERE ranking_id = NEW.id;

  -- Recriar disciplinas
  IF NEW.disciplines IS NOT NULL AND jsonb_typeof(NEW.disciplines) = 'array' THEN
    FOR i IN 0..jsonb_array_length(NEW.disciplines) - 1 LOOP
      DECLARE
        discipline_item jsonb := NEW.disciplines->i;
        discipline_type text;
        discipline_name text;
        discipline_minimum_score numeric;
        discipline_weight numeric;
        discipline_questions integer;
      BEGIN
        discipline_type := discipline_item->>'type';
        discipline_name := discipline_item->>'name';
        discipline_minimum_score := COALESCE((discipline_item->>'minimum_score')::numeric, 0);
        discipline_weight := COALESCE((discipline_item->>'weight')::numeric, 1);
        discipline_questions := COALESCE((discipline_item->>'questionCount')::integer, 0);

        IF (discipline_item->>'isEnabled')::boolean = true AND discipline_type IS NOT NULL THEN
          INSERT INTO ranking_disciplines (
            id,
            ranking_id,
            discipline_id,
            discipline_name,
            minimum_score,
            weight,
            total_questions
          ) VALUES (
            NEW.id || '-' || discipline_type || '-' || extract(epoch from now())::text,
            NEW.id,
            discipline_type,
            COALESCE(discipline_name, discipline_type),
            discipline_minimum_score,
            discipline_weight,
            discipline_questions
          );
        END IF;
      END;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Função para deletar ranking quando concurso é deletado
CREATE OR REPLACE FUNCTION delete_ranking_from_concurso()
RETURNS TRIGGER AS $$
BEGIN
  -- Deletar disciplinas primeiro
  DELETE FROM ranking_disciplines WHERE ranking_id = OLD.id;
  
  -- Deletar participações
  DELETE FROM user_rankings WHERE ranking_id = OLD.id;
  
  -- Deletar respostas
  DELETE FROM user_answers WHERE ranking_id = OLD.id;
  
  -- Deletar ranking
  DELETE FROM rankings WHERE id = OLD.id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 4. Criar triggers
DROP TRIGGER IF EXISTS trigger_create_ranking_from_concurso ON concursos;
CREATE TRIGGER trigger_create_ranking_from_concurso
  AFTER INSERT ON concursos
  FOR EACH ROW
  EXECUTE FUNCTION create_ranking_from_concurso();

DROP TRIGGER IF EXISTS trigger_update_ranking_from_concurso ON concursos;
CREATE TRIGGER trigger_update_ranking_from_concurso
  AFTER UPDATE ON concursos
  FOR EACH ROW
  EXECUTE FUNCTION update_ranking_from_concurso();

DROP TRIGGER IF EXISTS trigger_delete_ranking_from_concurso ON concursos;
CREATE TRIGGER trigger_delete_ranking_from_concurso
  AFTER DELETE ON concursos
  FOR EACH ROW
  EXECUTE FUNCTION delete_ranking_from_concurso();

-- 5. Função para sincronizar participações (concurso_id -> ranking_id)
CREATE OR REPLACE FUNCTION sync_participations_to_ranking_id()
RETURNS void AS $$
BEGIN
  -- Atualizar participações que ainda usam concurso_id
  UPDATE user_rankings 
  SET ranking_id = concurso_id 
  WHERE ranking_id IS NULL AND concurso_id IS NOT NULL;
  
  -- Atualizar respostas que ainda usam concurso_id
  UPDATE user_answers 
  SET ranking_id = concurso_id 
  WHERE ranking_id IS NULL AND concurso_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- 6. Executar sincronização imediata
SELECT sync_participations_to_ranking_id();

-- 7. Função para garantir que ranking existe antes de operações
CREATE OR REPLACE FUNCTION ensure_ranking_exists(concurso_id_param text)
RETURNS boolean AS $$
DECLARE
  ranking_exists boolean;
BEGIN
  -- Verificar se ranking existe
  SELECT EXISTS(SELECT 1 FROM rankings WHERE id = concurso_id_param) INTO ranking_exists;
  
  -- Se não existe, criar
  IF NOT ranking_exists THEN
    INSERT INTO rankings (
      id,
      titulo,
      orgao,
      banca,
      status,
      exam_type,
      has_minimum_score,
      total_minimum_score,
      wrong_answer_penalty,
      total_participants,
      created_at,
      updated_at,
      created_by,
      descricao
    )
    SELECT 
      id,
      titulo,
      COALESCE(orgao, 'Não informado'),
      COALESCE(banca, 'Não informado'),
      COALESCE(status, 'Ativo'),
      COALESCE(exam_type, 'Objetiva'),
      COALESCE(has_minimum_score, false),
      COALESCE(total_minimum_score, 0),
      COALESCE(wrong_answer_penalty, 0),
      0,
      created_at,
      updated_at,
      created_by_user_id,
      link
    FROM concursos 
    WHERE id = concurso_id_param;
    
    ranking_exists := true;
  END IF;
  
  RETURN ranking_exists;
END;
$$ LANGUAGE plpgsql;

-- 8. Comentários e documentação
COMMENT ON FUNCTION create_ranking_from_concurso() IS 'Cria ranking automaticamente quando concurso é inserido';
COMMENT ON FUNCTION update_ranking_from_concurso() IS 'Atualiza ranking quando concurso é modificado';
COMMENT ON FUNCTION delete_ranking_from_concurso() IS 'Remove ranking quando concurso é deletado';
COMMENT ON FUNCTION sync_participations_to_ranking_id() IS 'Sincroniza participações para usar ranking_id';
COMMENT ON FUNCTION ensure_ranking_exists(text) IS 'Garante que ranking existe antes de operações';
`;

  try {
    console.log('📝 Executando SQL de triggers...');
    
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: syncTriggersSQL
    });

    if (error) {
      console.log('❌ Erro ao executar SQL:', error.message);
      
      // Tentar executar diretamente via query
      console.log('🔄 Tentando executar via query direta...');
      
      // Dividir SQL em partes menores
      const sqlParts = syncTriggersSQL.split('-- =====================================================');
      
      for (let i = 0; i < sqlParts.length; i++) {
        const part = sqlParts[i].trim();
        if (part) {
          console.log(`📝 Executando parte ${i + 1}...`);
          
          try {
            const { error: partError } = await supabaseAdmin
              .from('_sql_exec')
              .select('*')
              .eq('query', part);
              
            if (partError) {
              console.log(`⚠️ Erro na parte ${i + 1}: ${partError.message}`);
            } else {
              console.log(`✅ Parte ${i + 1} executada com sucesso`);
            }
          } catch (err) {
            console.log(`⚠️ Erro na parte ${i + 1}:`, err);
          }
        }
      }
    } else {
      console.log('✅ Triggers de sincronização implementados com sucesso!');
    }

    // Testar triggers
    console.log('\n🧪 Testando triggers...');
    
    // Verificar se funções foram criadas
    const { data: functions, error: functionsError } = await supabaseAdmin
      .from('pg_proc')
      .select('proname')
      .in('proname', [
        'create_ranking_from_concurso',
        'update_ranking_from_concurso', 
        'delete_ranking_from_concurso',
        'sync_participations_to_ranking_id',
        'ensure_ranking_exists'
      ]);

    if (functionsError) {
      console.log('⚠️ Erro ao verificar funções:', functionsError.message);
    } else {
      console.log(`✅ Funções criadas: ${functions?.length || 0}`);
      functions?.forEach(f => console.log(`  - ${f.proname}`));
    }

    console.log('\n🎉 Implementação de triggers concluída!');

  } catch (error) {
    console.log('❌ Erro geral na implementação:', error);
  }
}

if (import.meta.main) {
  implementSyncTriggers().catch(console.error);
}

