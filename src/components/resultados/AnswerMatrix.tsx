
import React from 'react';
import { QuestionCell } from './QuestionCell';
import { NullifyQuestionButton } from '@/components/Admin/NullifyQuestionButton';

interface AnswerMatrixProps {
  matrix: (number | null)[][];
  answers: { [key: number]: string };
  onAnswerChange: (questionNumber: number, answer: string) => void;
  getOptionsForQuestion: (questionNumber: number) => string[];
  disabled?: boolean;
  examType?: 'Alternativas' | 'Certo ou Errado';
  onClearAnswer?: (questionNumber: number) => void;
  nullifiedQuestions?: Set<number>;
  onNullifyQuestion?: (questionNumber: number) => void;
  isAdminView?: boolean;
}

export const AnswerMatrix: React.FC<AnswerMatrixProps> = ({
  matrix, 
  answers, 
  onAnswerChange,
  getOptionsForQuestion,
  disabled = false,
  examType = 'Alternativas',
  onClearAnswer,
  nullifiedQuestions = new Set(),
  onNullifyQuestion,
  isAdminView = false
}) => {
  console.log('Rendering AnswerMatrix with matrix:', matrix);
  
  if (!matrix || matrix.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        Nenhuma questão disponível para esta seção. Por favor, selecione outra seção.
      </div>
    );
  }

  // Check if there are any non-null question numbers in the matrix
  const hasQuestions = matrix.some(row => row.some(cell => cell !== null));
  
  if (!hasQuestions) {
    return (
      <div className="p-6 text-center text-gray-500">
        Nenhuma questão disponível para esta seção. Por favor, selecione outra seção.
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {matrix.map((row, rowIndex) => 
          row.map((questionNumber, colIndex) => 
            questionNumber !== null ? (
              <div key={`${rowIndex}-${colIndex}`} 
                className={`${
                  nullifiedQuestions.has(questionNumber) ? 'opacity-75' : ''
                }`}
              >
                <QuestionCell
                  questionNumber={questionNumber}
                  selectedAnswer={answers[questionNumber]}
                  onAnswerChange={onAnswerChange}
                  options={getOptionsForQuestion(questionNumber)}
                  disabled={disabled || nullifiedQuestions.has(questionNumber)}
                  examType={examType}
                  onClearAnswer={onClearAnswer}
                  isNullified={nullifiedQuestions.has(questionNumber)}
                />
                {isAdminView && onNullifyQuestion && (
                  <NullifyQuestionButton
                    questionNumber={questionNumber}
                    isNullified={nullifiedQuestions.has(questionNumber)}
                    onNullify={onNullifyQuestion}
                  />
                )}
              </div>
            ) : null
          )
        )}
      </div>
    </div>
  );
};
