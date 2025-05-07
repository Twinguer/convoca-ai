
import { supabase } from '../client';
import { SectionType, generateSiglaFromName } from '@/hooks/useAnswerSheet/sectionUtils';

// Interface para seção personalizada
interface CustomSection {
  id: string;
  concurso_id: string;
  section_type: SectionType;
  display_name: string;
  sigla: string;
  created_at: string;
}

// Função para salvar seção personalizada
export const saveCustomSection = async (
  concursoId: string,
  sectionType: SectionType,
  displayName: string
): Promise<CustomSection | null> => {
  try {
    // Gerar sigla automaticamente a partir do nome
    const sigla = generateSiglaFromName(displayName);
    
    const { data, error } = await supabase
      .from('custom_sections')
      .insert({
        concurso_id: concursoId,
        section_type: sectionType,
        display_name: displayName,
        sigla: sigla
      })
      .select('*')
      .single();
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error('Erro ao salvar seção personalizada:', error);
    return null;
  }
};

// Função para buscar todas as seções personalizadas de um concurso
export const getCustomSections = async (
  concursoId: string
): Promise<CustomSection[]> => {
  try {
    const { data, error } = await supabase
      .from('custom_sections')
      .select('*')
      .eq('concurso_id', concursoId);
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar seções personalizadas:', error);
    return [];
  }
};
