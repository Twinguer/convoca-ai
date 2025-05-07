
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface WeightedAnswerInputProps {
  questionNumber: number;
  value: string;
  onChange: (value: string) => void;
  isNullified: boolean;
}

export const WeightedAnswerInput = ({
  questionNumber,
  value,
  onChange,
  isNullified
}: WeightedAnswerInputProps) => {
  const options = ['A', 'B', 'C', 'D', 'E'];
  
  const handleAnswerClick = (answer: string) => {
    onChange(answer);
  };
  
  return (
    <div className={`flex flex-col p-2 rounded-md border ${isNullified ? 'bg-gray-100' : ''}`} style={{ minWidth: '120px' }}>
      <Label className="mb-1 text-sm font-bold">Questão {questionNumber}</Label>
      
      <div className="flex flex-wrap gap-1 mt-1">
        {options.map((option) => (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={value === option ? "default" : "outline"}
            className={`px-2 py-0 h-8 w-8 text-xs ${isNullified ? 'opacity-50' : ''}`}
            onClick={() => handleAnswerClick(option)}
            disabled={isNullified}
          >
            {option}
          </Button>
        ))}
      </div>
    </div>
  );
};
