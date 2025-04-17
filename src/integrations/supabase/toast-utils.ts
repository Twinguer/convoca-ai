
import { toast } from '@/hooks/use-toast';

// Common toast function with consistent styling and duration
export const showSuccessToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    duration: 1500,
  });
};

export const showErrorToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'destructive',
    duration: 1500,
  });
};

export const showWarningToast = (title: string, description?: string) => {
  toast({
    title,
    description,
    variant: 'default',
    duration: 1500,
    className: 'bg-yellow-50 border-yellow-200',
  });
};
