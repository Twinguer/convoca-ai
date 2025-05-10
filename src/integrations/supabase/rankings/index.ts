
// Export all ranking-related functions
export * from './examStructure';
export * from './rankingQueries';
export * from './rankingMutations';
export * from './sectionUtils';

// Re-export scoreCalculation items one-by-one to resolve ambiguity
import { updateSectionTypeForConcurso } from './scoreCalculation';
export { updateSectionTypeForConcurso };
// We intentionally don't re-export getExamStructure from scoreCalculation since it's already exported from examStructure
