
import React, { useEffect } from 'react';
import { Concurso } from '@/types/concursos';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
  // Log for debugging
  useEffect(() => {
    console.log('QuotaSelector rendered with concurso:', {
      id: concurso.id,
      title: concurso.titulo,
      hasAmpla: concurso.has_ampla_concorrencia,
      hasPPP: concurso.has_ppp,
      hasPCD: concurso.has_pcd,
      hasHipossuficientes: concurso.has_hipossuficientes,
      hasIndigenas: concurso.has_indigenas,
      hasTranssexuais: concurso.has_transsexuais,
      hasQuotaMinimumScore: concurso.has_quota_minimum_score,
      quotaMinimumScore: concurso.quota_minimum_score,
      quotaMinimumScoreUnitType: concurso.quota_minimum_score_unit_type
    });
  }, [concurso]);

  // Build available quotas based on concurso settings
  const availableQuotas = [
    { value: 'Ampla Concorrência', label: 'Ampla Concorrência', enabled: concurso.has_ampla_concorrencia !== false }, // Ampla is default
    { value: 'PPP', label: 'Pessoas Pretas e Pardas (PPP)', enabled: concurso.has_ppp === true },
    { value: 'PCD', label: 'Pessoas com Deficiência (PCD)', enabled: concurso.has_pcd === true },
    { value: 'Hipossuficientes', label: 'Hipossuficientes', enabled: concurso.has_hipossuficientes === true },
    { value: 'Indígenas', label: 'Indígenas', enabled: concurso.has_indigenas === true },
    { value: 'Pessoas Trans', label: 'Pessoas Trans', enabled: concurso.has_transsexuais === true },
  ].filter(quota => quota.enabled);

  // Log filtered quotas for debugging
  useEffect(() => {
    console.log('Available quotas for selection:', availableQuotas);
  }, [availableQuotas]);

  // If there are no quotas available, default to Ampla Concorrência only
  if (availableQuotas.length <= 1) {
    console.log('No additional quotas available, defaulting to Ampla Concorrência only');
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-md font-medium mb-2">Selecione a reserva de vagas</h3>
      <p className="text-sm text-gray-500 mb-3">
        Você pode participar da Ampla Concorrência e de uma lista de vagas reservadas, se aplicável.
      </p>
      
      {concurso.has_quota_minimum_score && concurso.quota_minimum_score && concurso.quota_minimum_score > 0 && (
        <Alert className="mb-4 bg-amber-50">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>
            Atenção: Essa seleção possui nota mínima específica para cotistas de 
            {concurso.quota_minimum_score_unit_type === 'percentage' 
              ? ` ${concurso.quota_minimum_score}%` 
              : ` ${concurso.quota_minimum_score} pontos`}.
          </AlertDescription>
        </Alert>
      )}
      
      <RadioGroup 
        value={selectedQuota} 
        onValueChange={(value) => {
          console.log('Selected quota changed to:', value);
          onQuotaChange(value as QuotaType);
        }}
        className="flex flex-col space-y-2"
      >
        {availableQuotas.map((quota) => (
          <div key={quota.value} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50">
            <RadioGroupItem value={quota.value} id={`quota-${quota.value}`} />
            <Label htmlFor={`quota-${quota.value}`} className="cursor-pointer">{quota.label}</Label>
          </div>
        ))}
      </RadioGroup>
      
      <p className="text-xs text-gray-500 mt-2">
        Ao selecionar uma reserva de vagas, você participará dessa lista específica e também da Ampla Concorrência.
      </p>
    </div>
  );
};
