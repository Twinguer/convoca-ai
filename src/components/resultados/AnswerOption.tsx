
import React from 'react';

interface AnswerOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
  examType?: 'Alternativas' | 'Certo ou Errado';
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({ 
  option, 
  isSelected, 
  onClick,
  disabled = false,
  examType = 'Alternativas'
}) => {
  const isCertoErrado = examType === 'Certo ou Errado';
  
  return (
    <div 
      className={`
        ${isCertoErrado 
          ? 'w-12 h-12 text-base font-medium'
          : 'w-10 h-10 text-base font-medium'
        }
        flex items-center justify-center rounded-full cursor-pointer shadow-sm
        ${isSelected 
          ? 'bg-primary text-primary-foreground font-bold ring-2 ring-primary/30 ring-offset-2' 
          : disabled 
            ? 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
            : 'bg-background hover:bg-primary/10 text-foreground border border-border hover:border-primary/30'
        }
        ${disabled ? 'opacity-70 cursor-not-allowed' : 'transition-all duration-150 ease-in-out'}
      `}
      onClick={disabled ? undefined : () => {
        console.log(`[AnswerOption] Clicked option: ${option}`);
        onClick();
      }}
      role="button"
      aria-pressed={isSelected}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      {option}
    </div>
  );
};
