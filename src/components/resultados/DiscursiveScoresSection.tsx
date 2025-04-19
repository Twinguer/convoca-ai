
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Concurso } from '@/types/concursos';

interface DiscursiveScoresSectionProps {
  concurso: Concurso;
  discursiveScore: number | null;
  caseStudy1Score: number | null;
  caseStudy2Score: number | null;
  caseStudy3Score: number | null;
  handleScoreChange: (value: string, setter: React.Dispatch<React.SetStateAction<number | null>>, scoreName: string) => void;
  setDiscursiveScore: React.Dispatch<React.SetStateAction<number | null>>;
  setCaseStudy1Score: React.Dispatch<React.SetStateAction<number | null>>;
  setCaseStudy2Score: React.Dispatch<React.SetStateAction<number | null>>;
  setCaseStudy3Score: React.Dispatch<React.SetStateAction<number | null>>;
  canEdit: boolean;
}

export const DiscursiveScoresSection: React.FC<DiscursiveScoresSectionProps> = ({
  concurso,
  discursiveScore,
  caseStudy1Score,
  caseStudy2Score,
  caseStudy3Score,
  handleScoreChange,
  setDiscursiveScore,
  setCaseStudy1Score,
  setCaseStudy2Score,
  setCaseStudy3Score,
  canEdit
}) => {
  return (
    <div className="space-y-4 p-6 bg-gray-50 border rounded-md mt-6">
      <h3 className="text-lg font-medium mb-4">Notas Subjetivas</h3>
      
      {concurso.has_discursive && (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="discursive-score" className="font-medium">
            Nota da Prova Discursiva:
          </Label>
          <div className="flex items-center">
            <Input
              id="discursive-score"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Informe sua nota (0-100)"
              value={discursiveScore === null ? '' : discursiveScore}
              onChange={(e) => handleScoreChange(e.target.value, setDiscursiveScore, 'discursiva')}
              className="w-32"
              disabled={!canEdit}
            />
            <span className="ml-2 text-gray-500">/ 100</span>
          </div>
        </div>
      )}
      
      {concurso.has_case_study_1 && (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="case-study-1-score" className="font-medium">
            Nota do Estudo de Caso 1:
          </Label>
          <div className="flex items-center">
            <Input
              id="case-study-1-score"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Informe sua nota (0-100)"
              value={caseStudy1Score === null ? '' : caseStudy1Score}
              onChange={(e) => handleScoreChange(e.target.value, setCaseStudy1Score, 'estudo de caso 1')}
              className="w-32"
              disabled={!canEdit}
            />
            <span className="ml-2 text-gray-500">/ 100</span>
          </div>
        </div>
      )}
      
      {concurso.has_case_study_2 && (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="case-study-2-score" className="font-medium">
            Nota do Estudo de Caso 2:
          </Label>
          <div className="flex items-center">
            <Input
              id="case-study-2-score"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Informe sua nota (0-100)"
              value={caseStudy2Score === null ? '' : caseStudy2Score}
              onChange={(e) => handleScoreChange(e.target.value, setCaseStudy2Score, 'estudo de caso 2')}
              className="w-32"
              disabled={!canEdit}
            />
            <span className="ml-2 text-gray-500">/ 100</span>
          </div>
        </div>
      )}
      
      {concurso.has_case_study_3 && (
        <div className="flex flex-col space-y-2">
          <Label htmlFor="case-study-3-score" className="font-medium">
            Nota do Estudo de Caso 3:
          </Label>
          <div className="flex items-center">
            <Input
              id="case-study-3-score"
              type="number"
              min="0"
              max="100"
              step="0.01"
              placeholder="Informe sua nota (0-100)"
              value={caseStudy3Score === null ? '' : caseStudy3Score}
              onChange={(e) => handleScoreChange(e.target.value, setCaseStudy3Score, 'estudo de caso 3')}
              className="w-32"
              disabled={!canEdit}
            />
            <span className="ml-2 text-gray-500">/ 100</span>
          </div>
        </div>
      )}
    </div>
  );
};
