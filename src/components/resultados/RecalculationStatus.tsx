
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';

interface RecalculationStatusProps {
  isRecalculating: boolean;
  progressCount?: number;
  totalCount?: number;
}

export const RecalculationStatus: React.FC<RecalculationStatusProps> = ({
  isRecalculating,
  progressCount = 0,
  totalCount = 0
}) => {
  if (!isRecalculating) return null;

  return (
    <Alert className="mb-4 bg-amber-50 border-amber-200 text-amber-800">
      <AlertDescription className="flex items-center">
        <Loader2 className="h-4 w-4 mr-2 text-amber-600 animate-spin" />
        {totalCount > 0 ? (
          `Recalculando pontuações: ${progressCount} de ${totalCount} participantes processados...`
        ) : (
          'Recalculando pontuações de todos os participantes...'
        )}
      </AlertDescription>
    </Alert>
  );
};
