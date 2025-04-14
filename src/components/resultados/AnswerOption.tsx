
import React from 'react';

interface AnswerOptionProps {
  option: string;
  isSelected: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const AnswerOption: React.FC<AnswerOptionProps> = ({ 
  option, 
  isSelected, 
  onClick,
  disabled = false
}) => {
  return (
    <div 
      className={`
        w-10 h-10 flex items-center justify-center rounded-full cursor-pointer shadow-sm
        ${isSelected 
          ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-300 ring-offset-2' 
          : disabled 
            ? 'bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed'
            : 'bg-white hover:bg-gray-100 text-gray-800 border border-gray-300 hover:border-emerald-300'
        }
        ${disabled ? 'opacity-70 cursor-not-allowed' : 'transition-all duration-150 ease-in-out'}
        text-base font-medium
      `}
      onClick={disabled ? undefined : onClick}
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
