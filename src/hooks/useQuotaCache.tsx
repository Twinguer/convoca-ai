import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface QuotaConfig {
  has_ampla_concorrencia: boolean;
  has_ppp: boolean;
  has_pcd: boolean;
  has_hipossuficientes: boolean;
  has_indigenas: boolean;
  has_transsexuais: boolean;
}

const fetchQuotaConfig = async (concursoId: string): Promise<QuotaConfig> => {
    // console.log('[useQuotaCache] Fetching quota config for concurso:', concursoId);
  
  const { data, error } = await supabase
    .from('concursos')
    .select(`
      has_ampla_concorrencia,
      has_ppp,
      has_pcd,
      has_hipossuficientes,
      has_indigenas,
      has_transsexuais
    `)
    .eq('id', concursoId)
    .single();
    
  if (error) {
    console.error('[useQuotaCache] Error fetching quota config:', error);
    return {
      has_ampla_concorrencia: true,
      has_ppp: false,
      has_pcd: false,
      has_hipossuficientes: false,
      has_indigenas: false,
      has_transsexuais: false,
    };
  }
  
    // console.log('[useQuotaCache] Quota config fetched:', data);
  return data;
};

export const useQuotaCache = (concursoId: string) => {
  return useQuery({
    queryKey: ['quota-config', concursoId],
    queryFn: () => fetchQuotaConfig(concursoId),
    staleTime: 10 * 60 * 1000, // 10 minutos - cotas raramente mudam
    gcTime: 30 * 60 * 1000, // 30 minutos
    enabled: !!concursoId,
  });
};
