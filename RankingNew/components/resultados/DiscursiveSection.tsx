
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Concurso } from '@/types/concursos';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DiscursiveSectionProps {
  concurso: Concurso;
  discursiveScore: number | null;
  caseStudy1Score?: number | null;
  caseStudy2Score?: number | null;
  caseStudy3Score?: number | null;
  onDiscursiveScoreChange: (value: number | null) => void;
  onCaseStudy1ScoreChange?: (value: number | null) => void;
  onCaseStudy2ScoreChange?: (value: number | null) => void;
  onCaseStudy3ScoreChange?: (value: number | null) => void;
  disabled?: boolean;
}

export const DiscursiveSection: React.FC<DiscursiveSectionProps> = ({
  concurso,
  discursiveScore,
  caseStudy1Score,
  caseStudy2Score,
  caseStudy3Score,
  onDiscursiveScoreChange,
  onCaseStudy1ScoreChange,
  onCaseStudy2ScoreChange,
  onCaseStudy3ScoreChange,
  disabled = false
}) => {
  const handleScoreChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (value: number | null) => void
  ) => {
    const value = e.target.value;
    if (value === '') {
      setter(null);
      return;
    }
    
    const numberValue = parseFloat(value);
    if (isNaN(numberValue)) return;
    
    if (numberValue < 0 || numberValue > 100) {
      return;
    }
    
    setter(numberValue);
  };

  // Check if any discursive or case study sections are enabled
  const hasAnySection = 
    concurso.has_discursive || 
    concurso.has_case_study_1 || 
    concurso.has_case_study_2 || 
    concurso.has_case_study_3;

  if (!hasAnySection) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Não há seções de discursiva ou estudo de caso para este concurso.
      </div>
    );
  }

  return (
    <div className="p-6 bg-muted/30 space-y-6">
      {/* Discursive Section */}
      {concurso.has_discursive && (
        <div className="border border-border p-4 rounded-md shadow-sm bg-card space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="discursive-score" className="text-base font-medium">
              Nota da Prova Discursiva 
              {concurso.discursive_weight && concurso.discursive_weight > 1 && 
                <span className="ml-1 text-sm text-muted-foreground">(Peso {concurso.discursive_weight})</span>
              }
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Informe sua nota na prova discursiva (0-100).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center">
            <Input 
              id="discursive-score" 
              type="number" 
              min="0" 
              max="100" 
              step="0.01" 
              placeholder="Informe sua nota" 
              value={discursiveScore === null ? '' : discursiveScore} 
              onChange={(e) => handleScoreChange(e, onDiscursiveScoreChange)}
              className="w-64" 
              disabled={disabled}
            />
            <span className="ml-2 text-muted-foreground">/ 100</span>
          </div>
        </div>
      )}

      {/* Case Study 1 */}
      {concurso.has_case_study_1 && onCaseStudy1ScoreChange && (
        <div className="border border-border p-4 rounded-md shadow-sm bg-card space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="case-study-1-score" className="text-base font-medium">
              Nota do Estudo de Caso 1
              {concurso.case_study_1_weight && concurso.case_study_1_weight > 1 && 
                <span className="ml-1 text-sm text-muted-foreground">(Peso {concurso.case_study_1_weight})</span>
              }
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Informe sua nota no estudo de caso 1 (0-100).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center">
            <Input 
              id="case-study-1-score" 
              type="number" 
              min="0" 
              max="100" 
              step="0.01" 
              placeholder="Informe sua nota" 
              value={caseStudy1Score === null ? '' : caseStudy1Score} 
              onChange={(e) => handleScoreChange(e, onCaseStudy1ScoreChange)}
              className="w-64" 
              disabled={disabled}
            />
            <span className="ml-2 text-muted-foreground">/ 100</span>
          </div>
        </div>
      )}

      {/* Case Study 2 */}
      {concurso.has_case_study_2 && onCaseStudy2ScoreChange && (
        <div className="border border-border p-4 rounded-md shadow-sm bg-card space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="case-study-2-score" className="text-base font-medium">
              Nota do Estudo de Caso 2
              {concurso.case_study_2_weight && concurso.case_study_2_weight > 1 && 
                <span className="ml-1 text-sm text-muted-foreground">(Peso {concurso.case_study_2_weight})</span>
              }
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Informe sua nota no estudo de caso 2 (0-100).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center">
            <Input 
              id="case-study-2-score" 
              type="number" 
              min="0" 
              max="100" 
              step="0.01" 
              placeholder="Informe sua nota" 
              value={caseStudy2Score === null ? '' : caseStudy2Score} 
              onChange={(e) => handleScoreChange(e, onCaseStudy2ScoreChange)}
              className="w-64" 
              disabled={disabled}
            />
            <span className="ml-2 text-muted-foreground">/ 100</span>
          </div>
        </div>
      )}

      {/* Case Study 3 */}
      {concurso.has_case_study_3 && onCaseStudy3ScoreChange && (
        <div className="border border-border p-4 rounded-md shadow-sm bg-card space-y-3">
          <div className="flex justify-between items-center">
            <Label htmlFor="case-study-3-score" className="text-base font-medium">
              Nota do Estudo de Caso 3
              {concurso.case_study_3_weight && concurso.case_study_3_weight > 1 && 
                <span className="ml-1 text-sm text-muted-foreground">(Peso {concurso.case_study_3_weight})</span>
              }
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">Informe sua nota no estudo de caso 3 (0-100).</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex items-center">
            <Input 
              id="case-study-3-score" 
              type="number" 
              min="0" 
              max="100" 
              step="0.01" 
              placeholder="Informe sua nota" 
              value={caseStudy3Score === null ? '' : caseStudy3Score} 
              onChange={(e) => handleScoreChange(e, onCaseStudy3ScoreChange)}
              className="w-64" 
              disabled={disabled}
            />
            <span className="ml-2 text-muted-foreground">/ 100</span>
          </div>
        </div>
      )}
    </div>
  );
};
