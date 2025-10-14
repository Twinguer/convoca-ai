import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Concurso, DisciplineBlock, NestedDiscipline } from '@/types/concursos';

// Função auxiliar para buscar disciplina por ID na nova estrutura JSONB
const findDisciplineById = (disciplines: (DisciplineBlock | NestedDiscipline)[] | undefined, id: string): NestedDiscipline | undefined => {
  if (!disciplines) return undefined;
  
  for (const discipline of disciplines) {
    if ('disciplines' in discipline) {
      // Estrutura hierárquica (blocos)
      const found = discipline.disciplines?.find(d => d.id === id);
      if (found) return found;
    } else {
      // Estrutura plana
      if (discipline.id === id) return discipline;
    }
  }
  
  return undefined;
};

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
  const [localScores, setLocalScores] = useState<Record<string, number>>(subjectScores);

  // Atualizar scores locais quando subjectScores mudar
  useEffect(() => {
    setLocalScores(subjectScores);
  }, [subjectScores]);

  const handleScoreChange = (key: string, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setLocalScores(prev => ({ ...prev, [key]: numericValue }));
    onSubjectScoreChange(key, numericValue);
  };

  const getScoreLabel = (key: string): string => {
    // Check for other_subjective (campo direto)
    if (key === 'other_subjective' && concurso.other_subjective_name) {
      return concurso.other_subjective_name;
    }
    
    // Check for standard subjective types in JSONB disciplines
    if (['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(key)) {
      const discipline = findDisciplineById(concurso.disciplines, key);
      if (discipline?.name) {
        return discipline.name;
      }
      
      // Fallback labels for standard types
      const fallbackLabels: Record<string, string> = {
        'discursive': 'Prova Discursiva',
        'case_study_1': 'Estudo de Caso 1',
        'case_study_2': 'Estudo de Caso 2',
        'case_study_3': 'Estudo de Caso 3',
        'other_subjective': 'Outro Subjetivo'
      };
      return fallbackLabels[key] || key;
    }
    
    // Check for custom disciplines
    if (key.startsWith('custom_')) {
      const disciplineId = key.replace('custom_', '');
      const discipline = findDisciplineById(concurso.disciplines, disciplineId);
      return discipline?.name || `Disciplina ${disciplineId}`;
    }
    
    return key;
  };

  const getScoreWeight = (key: string): number => {
    // Check for standard subjective types in JSONB disciplines
    if (['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(key)) {
      const discipline = findDisciplineById(concurso.disciplines, key);
      return discipline?.weight || 1;
    }
    
    // Check for other_subjective_name (campo direto)
    if (key === 'other_subjective_name' && concurso.other_subjective_weight) {
      return concurso.other_subjective_weight;
    }
    
    // Check for discursive weight (campo direto)
    if (key === 'discursive' && concurso.discursive_weight) {
      return parseFloat(concurso.discursive_weight);
    }
    
    // Check for custom disciplines
    if (key.startsWith('custom_')) {
      const disciplineId = key.replace('custom_', '');
      const discipline = findDisciplineById(concurso.disciplines, disciplineId);
      return discipline?.weight || 1;
    }
    
    return 1;
  };

  const getWeightedScore = (key: string): number => {
    const score = localScores[key] || 0;
    const weight = getScoreWeight(key);
    return score * weight;
  };

  // Verificar se o concurso tem seções subjetivas habilitadas - JSONB + CAMPOS DIRETOS
  const hasSubjectiveSections = concurso.disciplines?.some(discipline => {
    if ('disciplines' in discipline) {
      // Estrutura hierárquica (blocos)
      return discipline.disciplines?.some(d => 
        d.isEnabled && ['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(d.type)
      );
    } else {
      // Estrutura plana
      return discipline.isEnabled && ['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(discipline.type);
    }
  }) || 
  // Fallback para campos diretos (compatibilidade)
  concurso.has_discursive || 
  concurso.has_case_study_1 || 
  concurso.has_case_study_2 || 
  concurso.has_case_study_3 || 
  concurso.has_other_subjective;

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

  // Filtrar apenas as seções habilitadas no concurso - JSONB + CAMPOS DIRETOS
  const enabledSections = Object.keys(localScores).filter(key => {
    // Primeiro, verificar no JSONB disciplines
    if (concurso.disciplines) {
      const foundInJsonb = concurso.disciplines.some(discipline => {
        if ('disciplines' in discipline) {
          // Estrutura hierárquica (blocos)
          return discipline.disciplines?.some(d => {
            if (!d.isEnabled) return false;
            
            // Check for standard subjective types
            if (['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(key)) {
              return d.type === key;
            }
            
            // Check for custom disciplines - ONLY if they are subjective
            if (key.startsWith('custom_')) {
              // Only include custom disciplines that are explicitly subjective
              return false; // Skip all custom disciplines for now
            }
            
            return false;
          });
        } else {
          // Estrutura plana
          if (!discipline.isEnabled) return false;
          
          // Check for standard subjective types
          if (['discursive', 'case_study_1', 'case_study_2', 'case_study_3', 'other_subjective'].includes(key)) {
            return discipline.type === key;
          }
          
          // Check for custom disciplines - ONLY if they are subjective
          if (key.startsWith('custom_')) {
            // Only include custom disciplines that are explicitly subjective
            return false; // Skip all custom disciplines for now
          }
          
          return false;
        }
      });
      
      if (foundInJsonb) return true;
    }
    
    // Fallback para campos diretos (compatibilidade)
    if (key === 'discursive' && concurso.has_discursive) return true;
    if (key === 'case_study_1' && concurso.has_case_study_1) return true;
    if (key === 'case_study_2' && concurso.has_case_study_2) return true;
    if (key === 'case_study_3' && concurso.has_case_study_3) return true;
    if (key === 'other_subjective' && concurso.has_other_subjective) return true;
    
    return false;
  });

  return (
    <div className="p-6 space-y-6">
        {enabledSections.map(key => (
          <div key={key} className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor={`score-${key}`} className="font-medium">
                {getScoreLabel(key)}
              </Label>
              
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
    </div>
  );
};
