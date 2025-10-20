import { DisciplinesStructure, DisciplineBlockStructure, NestedDisciplineStructure, DisciplineBlock, NestedDiscipline, Concurso } from '../types/concursos';

/**
 * TypeGuards para detectar diferentes estruturas de disciplines
 */

// Detectar nova estrutura JSONB completa
export const isNewDisciplinesStructure = (disciplines: any): disciplines is DisciplinesStructure => {
  const result = disciplines && 
         typeof disciplines === 'object' && 
         'minimum_total_score' in disciplines &&
         'minimum_total_score_cotas' in disciplines &&
         'blocks' in disciplines &&
         Array.isArray(disciplines.blocks);
  
  console.log('[isNewDisciplinesStructure] Checking structure:', {
    hasDisciplines: !!disciplines,
    isObject: typeof disciplines === 'object',
    hasMinTotalScore: 'minimum_total_score' in disciplines,
    hasMinTotalScoreCotas: 'minimum_total_score_cotas' in disciplines,
    hasBlocks: 'blocks' in disciplines,
    isBlocksArray: Array.isArray(disciplines?.blocks),
    result
  });
  
  return result;
};

// Detectar estrutura antiga de blocos
export const isOldBlocksStructure = (disciplines: any): disciplines is DisciplineBlock[] => {
  const result = Array.isArray(disciplines) && 
         disciplines.length > 0 &&
         'disciplines' in disciplines[0];
  
  console.log('[isOldBlocksStructure] Checking structure:', {
    isArray: Array.isArray(disciplines),
    hasLength: disciplines?.length > 0,
    hasDisciplinesInFirst: disciplines?.[0] && 'disciplines' in disciplines[0],
    result
  });
  
  return result;
};

// Detectar estrutura plana
export const isFlatStructure = (disciplines: any): disciplines is NestedDiscipline[] => {
  const result = Array.isArray(disciplines) && 
         disciplines.length > 0 &&
         'isEnabled' in disciplines[0] &&
         !('disciplines' in disciplines[0]);
  
  console.log('[isFlatStructure] Checking structure:', {
    isArray: Array.isArray(disciplines),
    hasLength: disciplines?.length > 0,
    hasIsEnabled: disciplines?.[0] && 'isEnabled' in disciplines[0],
    notHasDisciplines: disciplines?.[0] && !('disciplines' in disciplines[0]),
    result
  });
  
  return result;
};

/**
 * Função para migrar estrutura antiga para nova estrutura
 */
export const migrateDisciplinesStructure = (concurso: Concurso): Concurso => {
  if (!concurso.disciplines) return concurso;
  
  // Se já é a nova estrutura, retornar como está
  if (isNewDisciplinesStructure(concurso.disciplines)) {
    console.log('[migrateDisciplinesStructure] Already using new structure');
    return concurso;
  }
  
  // Migrar estrutura antiga de blocos para nova
  if (isOldBlocksStructure(concurso.disciplines)) {
    console.log('[migrateDisciplinesStructure] Migrating old blocks structure to new structure');
    
    const newStructure: DisciplinesStructure = {
      minimum_total_score: 0, // Valor padrão - pode ser configurado posteriormente
      minimum_total_score_cotas: 0, // Valor padrão - pode ser configurado posteriormente
      blocks: concurso.disciplines.map(block => ({
        blockId: block.id,
        blockName: block.name,
        blockMinimumScore: block.minimum_score || 0,
        blockMinimumCotas: block.minimum_score_cotas || 0,
        disciplines: block.disciplines.map(discipline => ({
          id: discipline.id || '',
          name: discipline.name,
          type: discipline.type,
          weight: discipline.weight || 1,
          isEnabled: discipline.isEnabled !== false,
          minimum_score: discipline.minimum_score || 0,
          minimum_score_cotas: discipline.minimum_score_cotas || 0,
          questionCount: discipline.questionCount || 0
        }))
      }))
    };
    
    return {
      ...concurso,
      disciplines: newStructure
    };
  }
  
  // Estrutura plana - converter para nova estrutura com um bloco único
  if (isFlatStructure(concurso.disciplines)) {
    console.log('[migrateDisciplinesStructure] Migrating flat structure to new structure');
    
    const newStructure: DisciplinesStructure = {
      minimum_total_score: 0,
      minimum_total_score_cotas: 0,
      blocks: [{
        blockId: 'default-block',
        blockName: 'Disciplinas',
        blockMinimumScore: 0,
        blockMinimumCotas: 0,
        disciplines: concurso.disciplines.map(discipline => ({
          id: discipline.id || '',
          name: discipline.name,
          type: discipline.type,
          weight: discipline.weight || 1,
          isEnabled: discipline.isEnabled !== false,
          minimum_score: discipline.minimum_score || 0,
          minimum_score_cotas: discipline.minimum_score_cotas || 0,
          questionCount: discipline.questionCount || 0
        }))
      }]
    };
    
    return {
      ...concurso,
      disciplines: newStructure
    };
  }
  
  console.warn('[migrateDisciplinesStructure] Unknown structure, returning as is');
  return concurso;
};

/**
 * Função para extrair disciplinas de qualquer estrutura
 */
export const extractDisciplines = (concurso: Concurso): NestedDiscipline[] => {
  if (!concurso.disciplines) {
    console.log('[extractDisciplines] No disciplines found in concurso');
    return [];
  }
  
  console.log('[extractDisciplines] Concurso disciplines type:', typeof concurso.disciplines);
  console.log('[extractDisciplines] Concurso disciplines keys:', Object.keys(concurso.disciplines));
  console.log('[extractDisciplines] Concurso disciplines value:', concurso.disciplines);
  
  // ✅ CORREÇÃO: Verificar se é array vazio primeiro
  if (Array.isArray(concurso.disciplines) && concurso.disciplines.length === 0) {
    console.log('[extractDisciplines] Empty array detected, returning empty array');
    return [];
  }
  
  // Nova estrutura hierárquica completa
  if (isNewDisciplinesStructure(concurso.disciplines)) {
    console.log('[extractDisciplines] Using new hierarchical structure');
    const disciplines: NestedDiscipline[] = [];
    
    for (const block of concurso.disciplines.blocks) {
      for (const discipline of block.disciplines) {
        if (discipline.isEnabled) {
          disciplines.push({
            ...discipline,
            blockName: block.blockName,
            blockId: block.blockId,
            blockWeight: 1, // Pode ser adicionado se necessário
            blockMinimumScore: block.blockMinimumScore,
            blockMinimumCotas: block.blockMinimumCotas
          } as any);
        }
      }
    }
    
    return disciplines;
  }
  
  // Estrutura antiga de blocos (compatibilidade)
  if (isOldBlocksStructure(concurso.disciplines)) {
    console.log('[extractDisciplines] Using old blocks structure');
    const disciplines: NestedDiscipline[] = [];
    
    for (const block of concurso.disciplines) {
      for (const discipline of block.disciplines) {
        if (discipline.isEnabled) {
          disciplines.push({
            ...discipline,
            blockName: block.name,
            blockId: block.id,
            blockWeight: block.weight,
            blockMinimumScore: block.minimum_score,
            blockMinimumCotas: block.minimum_score_cotas
          } as any);
        }
      }
    }
    
    return disciplines;
  }
  
  // Estrutura plana (compatibilidade)
  if (isFlatStructure(concurso.disciplines)) {
    console.log('[extractDisciplines] Using flat structure');
    return concurso.disciplines.filter(d => d.isEnabled);
  }
  
  // Tentar detectar estrutura com campos diferentes
  if (Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0) {
    console.log('[extractDisciplines] Attempting to process as array with first item:', concurso.disciplines[0]);
    
    // Verificar se é um array de blocos com estrutura diferente
    if (concurso.disciplines[0] && typeof concurso.disciplines[0] === 'object') {
      const firstItem = concurso.disciplines[0];
      
      // Se tem 'disciplines' mas não tem 'blockId', pode ser estrutura antiga
      if ('disciplines' in firstItem && !('blockId' in firstItem)) {
        console.log('[extractDisciplines] Detected old block structure without blockId');
        const disciplines: NestedDiscipline[] = [];
        
        for (const block of concurso.disciplines) {
          for (const discipline of block.disciplines) {
            if (discipline.isEnabled) {
              disciplines.push({
                ...discipline,
                blockName: block.name,
                blockId: block.id,
                blockWeight: block.weight,
                blockMinimumScore: block.minimum_score,
                blockMinimumCotas: block.minimum_score_cotas
              } as any);
            }
          }
        }
        
        return disciplines;
      }
    }
  }
  
  console.warn('[extractDisciplines] Unknown structure, returning empty array');
  console.warn('[extractDisciplines] Structure details:', {
    type: typeof concurso.disciplines,
    isArray: Array.isArray(concurso.disciplines),
    length: Array.isArray(concurso.disciplines) ? concurso.disciplines.length : 'N/A',
    keys: typeof concurso.disciplines === 'object' ? Object.keys(concurso.disciplines) : 'N/A',
    firstItem: Array.isArray(concurso.disciplines) && concurso.disciplines.length > 0 ? concurso.disciplines[0] : 'N/A'
  });
  
  return [];
};

/**
 * Função para obter pontuações mínimas globais
 */
export const getGlobalMinimumScores = (concurso: Concurso): { total: number; cotas: number } => {
  if (!concurso.disciplines) return { total: 0, cotas: 0 };
  
  if (isNewDisciplinesStructure(concurso.disciplines)) {
    return {
      total: concurso.disciplines.minimum_total_score || 0,
      cotas: concurso.disciplines.minimum_total_score_cotas || 0
    };
  }
  
  // Para estruturas antigas, retornar valores padrão
  return { total: 0, cotas: 0 };
};

/**
 * Função temporária para debug
 */
export const debugDisciplinesStructure = (concurso: Concurso) => {
  console.log('=== DEBUG DISCIPLINES STRUCTURE ===');
  console.log('Concurso ID:', concurso.id);
  console.log('Concurso disciplines:', concurso.disciplines);
  console.log('Type of disciplines:', typeof concurso.disciplines);
  console.log('Is Array:', Array.isArray(concurso.disciplines));
  
  if (concurso.disciplines) {
    console.log('Disciplines keys:', Object.keys(concurso.disciplines));
    
    if (Array.isArray(concurso.disciplines)) {
      console.log('Array length:', concurso.disciplines.length);
      if (concurso.disciplines.length > 0) {
        console.log('First item:', concurso.disciplines[0]);
        console.log('First item keys:', Object.keys(concurso.disciplines[0]));
      }
    }
  }
  console.log('=== END DEBUG ===');
};

/**
 * Função para mapear dados do formulário para nova estrutura
 */
export const mapFormDataToDisciplinesStructure = (formValues: any): DisciplinesStructure => {
  console.log('[mapFormDataToDisciplinesStructure] Input formValues:', formValues);
  console.log('[mapFormDataToDisciplinesStructure] formValues.disciplines:', formValues.disciplines);
  
  // Extrair minimum scores do form
  const totalScore = formValues.minimum_total_score ? Number(formValues.minimum_total_score) : 0;
  const quotaScore = formValues.minimum_total_score_cotas ? Number(formValues.minimum_total_score_cotas) : 0;
  
  console.log('[mapFormDataToDisciplinesStructure] totalScore:', totalScore);
  console.log('[mapFormDataToDisciplinesStructure] quotaScore:', quotaScore);
  
  // Mapear blocos de disciplinas
  const blocks = (formValues.disciplines || []).map((block: any) => {
    console.log('[mapFormDataToDisciplinesStructure] Processing block:', block);
    return {
      blockId: block.id,
      blockName: block.name,
      blockMinimumScore: Number(block.minimum_score) || 0,
      blockMinimumCotas: Number(block.minimum_score_cotas) || 0,
      disciplines: (block.disciplines || []).map((discipline: any) => {
        console.log('[mapFormDataToDisciplinesStructure] Processing discipline:', discipline);
        return {
          id: discipline.id,
          name: discipline.name,
          type: discipline.type,
          weight: Number(discipline.weight) || 1,
          isEnabled: discipline.isEnabled !== false,
          minimum_score: Number(discipline.minimum_score) || 0,
          minimum_score_cotas: Number(discipline.minimum_score_cotas) || 0,
          questionCount: Number(discipline.questionCount) || 0
        };
      })
    };
  });
  
  const result = {
    minimum_total_score: totalScore,
    minimum_total_score_cotas: quotaScore,
    blocks
  };
  
  console.log('[mapFormDataToDisciplinesStructure] Final result:', JSON.stringify(result, null, 2));
  console.log('[mapFormDataToDisciplinesStructure] Blocks count:', result.blocks.length);
  
  return result;
};
