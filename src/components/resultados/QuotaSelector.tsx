import React from 'react';
import { Concurso } from '@/types/concursos';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useQuotaCache } from '@/hooks/useQuotaCache';
export type QuotaType = 'Ampla Concorrência' | 'PPP' | 'PCD' | 'Hipossuficientes' | 'Indígenas' | 'Pessoas Trans';
interface QuotaSelectorProps {
  concurso: Concurso;
  selectedQuota: QuotaType;
  onQuotaChange: (quota: QuotaType) => void;
}
export const QuotaSelector: React.FC<QuotaSelectorProps> = ({
  concurso,
  selectedQuota,
  onQuotaChange
}) => {
  // Usar cache de cotas para otimizar performance
  const { data: quotaConfig, isLoading } = useQuotaCache(concurso.id);
  
  // Usar dados do cache se disponível, senão usar dados do concurso
  const config = quotaConfig || {
    has_ampla_concorrencia: concurso.has_ampla_concorrencia,
    has_ppp: concurso.has_ppp,
    has_pcd: concurso.has_pcd,
    has_hipossuficientes: concurso.has_hipossuficientes,
    has_indigenas: concurso.has_indigenas,
    has_transsexuais: concurso.has_transsexuais,
  };

  // Build available quotas based on cached config
  const availableQuotas = [{
    value: 'Ampla Concorrência',
    label: 'Ampla Concorrência',
    enabled: config.has_ampla_concorrencia !== false
  },
  // Ampla is default
  {
    value: 'PPP',
    label: 'Pessoas Pretas e Pardas (PPP)',
    enabled: config.has_ppp === true
  }, {
    value: 'PCD',
    label: 'Pessoas com Deficiência (PCD)',
    enabled: config.has_pcd === true
  }, {
    value: 'Hipossuficientes',
    label: 'Hipossuficientes',
    enabled: config.has_hipossuficientes === true
  }, {
    value: 'Indígenas',
    label: 'Indígenas',
    enabled: config.has_indigenas === true
  }, {
    value: 'Pessoas Trans',
    label: 'Pessoas Trans',
    enabled: config.has_transsexuais === true
  }].filter(quota => quota.enabled);

  // Log removido para reduzir overhead em produção

  // If there are no quotas available, default to Ampla Concorrência only
  if (availableQuotas.length <= 1) {
    return null;
  }
  return <div className="mb-6">
      <h3 className="text-md font-medium mb-2">Selecione a reserva de vagas</h3>
      
      
      <RadioGroup value={selectedQuota} onValueChange={value => {
      onQuotaChange(value as QuotaType);
    }} className="flex flex-col space-y-2">
        {availableQuotas.map(quota => <div key={quota.value} className="flex items-center space-x-2 border border-border p-3 rounded-md hover:bg-muted/50 bg-card">
            <RadioGroupItem value={quota.value} id={`quota-${quota.value}`} />
            <Label htmlFor={`quota-${quota.value}`} className="cursor-pointer">{quota.label}</Label>
          </div>)}
      </RadioGroup>
      
      
    </div>;
};