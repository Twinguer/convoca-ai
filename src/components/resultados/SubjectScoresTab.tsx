import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Concurso } from '@/types/concursos';

interface SubjectScoresTabProps {
  concurso: Concurso;
  subjectScores: Record<string, number>;
  onSubjectScoreChange: (key: string, value: number) => void;
  canEdit: boolean;
}

export const SubjectScoresTab: React.FC<SubjectScoresTabProps> = ({
  concurso,
  subjectScores,
  onSubjectScoreChange,
  canEdit
}) => {
  console.log('[SubjectScoresTab] DEBUG - Props received:', {
    concurso_id: concurso?.id,
    subjectScores,
    canEdit,
    concurso_has_discursive: concurso?.has_discursive,
    concurso_has_case_study_1: concurso?.has_case_study_1,
    concurso_has_case_study_2: concurso?.has_case_study_2,
    concurso_has_case_study_3: concurso?.has_case_study_3
  });
  
  const [localScores, setLocalScores] = useState<Record<string, number>>(subjectScores);

  // Atualizar scores locais quando subjectScores mudar
  useEffect(() => {
    console.log('[SubjectScoresTab] DEBUG - subjectScores changed:', subjectScores);
    setLocalScores(subjectScores);
  }, [subjectScores]);

  const handleScoreChange = (key: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setLocalScores(prev => ({ ...prev, [key]: numericValue }));
    onSubjectScoreChange(key, numericValue);
  };

  const getScoreLabel = (key: string): string => {
    switch (key) {
      case 'discursive':
        return 'Prova Discursiva';
      case 'case1':
        return 'Estudo de Caso 1';
      case 'case2':
        return 'Estudo de Caso 2';
      case 'case3':
        return 'Estudo de Caso 3';
      default:
        if (key.startsWith('custom_')) {
          // Buscar nome da disciplina customizada
          const disciplineId = key.replace('custom_', '');
          const discipline = concurso.disciplines?.find(d => d.id === disciplineId);
          return discipline?.name || `Disciplina ${disciplineId}`;
        }
        return key;
    }
  };

  const getScoreWeight = (key: string): number => {
    switch (key) {
      case 'discursive':
        return concurso.discursive_weight || 1;
      case 'case1':
        return concurso.case_study_1_weight || 1;
      case 'case2':
        return concurso.case_study_2_weight || 1;
      case 'case3':
        return concurso.case_study_3_weight || 1;
      default:
        if (key.startsWith('custom_')) {
          const disciplineId = key.replace('custom_', '');
          const discipline = concurso.disciplines?.find(d => d.id === disciplineId);
          return discipline?.weight || 1;
        }
        return 1;
    }
  };

  const getWeightedScore = (key: string): number => {
    const score = localScores[key] || 0;
    const weight = getScoreWeight(key);
    return score * weight;
  };

  // Verificar se o concurso tem seções subjetivas habilitadas
  const hasSubjectiveSections = concurso.has_discursive || 
                                concurso.has_case_study_1 || 
                                concurso.has_case_study_2 || 
                                concurso.has_case_study_3;

  if (!hasSubjectiveSections) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pontuações Subjetivas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Este concurso não possui seções subjetivas habilitadas.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Filtrar apenas as seções habilitadas no concurso
  const enabledSections = Object.keys(localScores).filter(key => {
    switch (key) {
      case 'discursive':
        return concurso.has_discursive;
      case 'case1':
        return concurso.has_case_study_1;
      case 'case2':
        return concurso.has_case_study_2;
      case 'case3':
        return concurso.has_case_study_3;
      default:
        return key.startsWith('custom_');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pontuações Subjetivas</CardTitle>
        <p className="text-sm text-muted-foreground">
          Preencha suas notas para as seções subjetivas do concurso.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {enabledSections.map(key => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor={`score-${key}`} className="font-medium">
                {getScoreLabel(key)}:
              </Label>
              <div className="text-sm text-muted-foreground">
                Peso: {getScoreWeight(key)}x
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Input
                id={`score-${key}`}
                type="number"
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                value={localScores[key] || 0}
                onChange={(e) => handleScoreChange(key, e.target.value)}
                disabled={!canEdit}
                className="w-32"
              />
              
              <div className="text-sm text-muted-foreground">
                Pontuação ponderada: <span className="font-medium">{getWeightedScore(key).toFixed(2)}</span>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Ponderado:</span>
            <span className="text-lg font-bold">
              {enabledSections.reduce((total, key) => total + getWeightedScore(key), 0).toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
