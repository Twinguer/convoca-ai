import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useForceRefresh } from '@/hooks/useForceRefresh';

interface ForceRefreshButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ForceRefreshButton: React.FC<ForceRefreshButtonProps> = ({
  className,
  variant = 'outline',
  size = 'sm'
}) => {
  const { forceRefresh } = useForceRefresh();

  return (
    <Button
      onClick={forceRefresh}
      variant={variant}
      size={size}
      className={className}
      title="Forçar atualização de todos os dados"
    >
      <RefreshCw className="h-4 w-4 mr-2" />
      Atualizar Dados
    </Button>
  );
};
