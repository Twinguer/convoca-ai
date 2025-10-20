import { Concurso } from '@/types/concursos';
import { getDisciplines } from '@/integrations/supabase/rankings/examStructure';

/**
 * Mapeia object_scores da estrutura antiga para a nova estrutura baseada em disciplinas JSONB
 */
export const mapObjectScoresToNewStructure = (
  oldObjectScores: Record<string, number>,
  concurso: Concurso
): Record<string, number> => {
  console.log('[mapObjectScoresToNewStructure] Input oldObjectScores:', oldObjectScores);
  console.log('[mapObjectScoresToNewStructure] Concurso disciplines:', concurso.disciplines);
  
  const newObjectScores: Record<string, number> = {};
  
  // Obter disciplinas da nova estrutura
  const disciplines = getDisciplines(concurso);
  console.log('[mapObjectScoresToNewStructure] Disciplines from getDisciplines:', disciplines);
  
  // Mapear pontuações existentes para os novos tipos
  for (const discipline of disciplines) {
    if (discipline.isEnabled && discipline.type) {
      // Verificar se existe pontuação na estrutura antiga
      const oldScore = oldObjectScores[discipline.type];
      if (oldScore !== undefined) {
        newObjectScores[discipline.type] = oldScore;
        console.log(`[mapObjectScoresToNewStructure] Mapped ${discipline.type}: ${oldScore}`);
      } else {
        // Inicializar com 0 se não existir
        newObjectScores[discipline.type] = 0;
        console.log(`[mapObjectScoresToNewStructure] Initialized ${discipline.type}: 0`);
      }
    }
  }
  
  console.log('[mapObjectScoresToNewStructure] Final newObjectScores:', newObjectScores);
  return newObjectScores;
};

/**
 * Mapeia object_scores da nova estrutura para a estrutura antiga (compatibilidade)
 */
export const mapObjectScoresToOldStructure = (
  newObjectScores: Record<string, number>,
  concurso: Concurso
): Record<string, number> => {
  console.log('[mapObjectScoresToOldStructure] Input newObjectScores:', newObjectScores);
  
  const oldObjectScores: Record<string, number> = {};
  
  // Mapear pontuações para tipos antigos conhecidos
  const legacyMappings: Record<string, string[]> = {
    'basic': ['basic'],
    'specific1': ['specific1'],
    'specific2': ['specific2'],
    'specific3': ['specific3'],
    'discursive': ['discursive'],
    'case_study_1': ['case_study_1'],
    'case_study_2': ['case_study_2'],
    'case_study_3': ['case_study_3'],
    'other_subjective': ['other_subjective']
  };
  
  // Mapear pontuações existentes
  for (const [newType, score] of Object.entries(newObjectScores)) {
    // Se for um tipo antigo conhecido, manter como está
    if (legacyMappings[newType]) {
      oldObjectScores[newType] = score;
    }
    // Se for um tipo customizado, adicionar como custom_
    else if (newType.startsWith('custom_')) {
      oldObjectScores[newType] = score;
    }
  }
  
  console.log('[mapObjectScoresToOldStructure] Final oldObjectScores:', oldObjectScores);
  return oldObjectScores;
};

/**
 * Cria object_scores inicial baseado na estrutura de disciplinas do concurso
 */
export const createInitialObjectScores = (concurso: Concurso): Record<string, number> => {
  console.log('[createInitialObjectScores] Creating initial scores for concurso:', concurso.id);
  
  const objectScores: Record<string, number> = {};
  
  // Obter disciplinas da nova estrutura
  const disciplines = getDisciplines(concurso);
  console.log('[createInitialObjectScores] Disciplines:', disciplines);
  
  // Inicializar pontuações para todas as disciplinas habilitadas
  for (const discipline of disciplines) {
    if (discipline.isEnabled && discipline.type) {
      objectScores[discipline.type] = 0;
      console.log(`[createInitialObjectScores] Initialized ${discipline.type}: 0`);
    }
  }
  
  console.log('[createInitialObjectScores] Final objectScores:', objectScores);
  return objectScores;
};

/**
 * Verifica se object_scores precisa ser migrado para a nova estrutura
 */
export const needsObjectScoresMigration = (
  objectScores: Record<string, number>,
  concurso: Concurso
): boolean => {
  const disciplines = getDisciplines(concurso);
  const disciplineTypes = disciplines.map(d => d.type).filter(Boolean);
  
  // Verificar se há tipos de disciplina que não existem no object_scores
  const missingTypes = disciplineTypes.filter(type => !(type in objectScores));
  
  console.log('[needsObjectScoresMigration] Discipline types:', disciplineTypes);
  console.log('[needsObjectScoresMigration] Object scores keys:', Object.keys(objectScores));
  console.log('[needsObjectScoresMigration] Missing types:', missingTypes);
  
  return missingTypes.length > 0;
};

/**
 * Migra object_scores para a nova estrutura se necessário
 */
export const migrateObjectScores = (
  objectScores: Record<string, number>,
  concurso: Concurso
): Record<string, number> => {
  console.log('[migrateObjectScores] Starting migration for concurso:', concurso.id);
  
  if (!needsObjectScoresMigration(objectScores, concurso)) {
    console.log('[migrateObjectScores] No migration needed');
    return objectScores;
  }
  
  console.log('[migrateObjectScores] Migration needed, creating new structure');
  return mapObjectScoresToNewStructure(objectScores, concurso);
};

