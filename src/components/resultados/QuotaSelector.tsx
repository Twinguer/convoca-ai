
import React from 'react';
import { Button } from '@/components/ui/button';
import { Users, UserCheck, Accessibility, Heart, Feather, User } from 'lucide-react';

export type QuotaType = 'Ampla Concorrência' | 'PPP' | 'PCD' | 'Hipossuficientes' | 'Indígenas' | 'Transsexuais';

interface QuotaSelectorProps {
  selectedQuota: QuotaType;
  onSelectQuota: (quota: QuotaType) => void;
  hasAmpla: boolean;
  hasPPP: boolean;
  hasPCD: boolean;
  hasHipossuficientes: boolean;
  hasIndigenas: boolean;
  hasTranssexuais: boolean;
}

const QuotaSelector: React.FC<QuotaSelectorProps> = ({
  selectedQuota,
  onSelectQuota,
  hasAmpla,
  hasPPP,
  hasPCD,
  hasHipossuficientes,
  hasIndigenas,
  hasTranssexuais
}) => {
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {hasAmpla && (
        <Button
          variant={selectedQuota === 'Ampla Concorrência' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectQuota('Ampla Concorrência')}
          className="flex items-center gap-1"
        >
          <Users className="h-4 w-4" />
          <span>Ampla</span>
        </Button>
      )}
      
      {hasPPP && (
        <Button
          variant={selectedQuota === 'PPP' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectQuota('PPP')}
          className="flex items-center gap-1"
        >
          <UserCheck className="h-4 w-4" />
          <span>PPP</span>
        </Button>
      )}
      
      {hasPCD && (
        <Button
          variant={selectedQuota === 'PCD' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectQuota('PCD')}
          className="flex items-center gap-1"
        >
          <Accessibility className="h-4 w-4" />
          <span>PCD</span>
        </Button>
      )}
      
      {hasHipossuficientes && (
        <Button
          variant={selectedQuota === 'Hipossuficientes' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectQuota('Hipossuficientes')}
          className="flex items-center gap-1"
        >
          <Heart className="h-4 w-4" />
          <span>Hipossuficientes</span>
        </Button>
      )}
      
      {hasIndigenas && (
        <Button
          variant={selectedQuota === 'Indígenas' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectQuota('Indígenas')}
          className="flex items-center gap-1"
        >
          <Feather className="h-4 w-4" />
          <span>Indígenas</span>
        </Button>
      )}
      
      {hasTranssexuais && (
        <Button
          variant={selectedQuota === 'Transsexuais' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelectQuota('Transsexuais')}
          className="flex items-center gap-1"
        >
          <User className="h-4 w-4" />
          <span>Transsexuais</span>
        </Button>
      )}
    </div>
  );
};

export default QuotaSelector;
