
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSubjectScores } from '@/services/rankingService';

interface ScoreDetailsProps {
  rankingId: string;
  hasMinimumScore?: boolean;
  isClassified?: boolean;
}

interface SubjectScore {
  subject_name: string;
  score: number;
  question_count: number;
  minimum_required: number;
  is_passing: boolean;
  knowledge_section: string;
}

export const ScoreDetails: React.FC<ScoreDetailsProps> = ({
  rankingId,
  hasMinimumScore = false,
  isClassified = true
}) => {
  const [subjectScores, setSubjectScores] = useState<SubjectScore[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubjectScores() {
      try {
        setIsLoading(true);
        const data = await getSubjectScores(rankingId);
        setSubjectScores(data);
      } catch (err) {
        console.error('Error loading subject scores:', err);
        setError('Não foi possível carregar as pontuações por matéria.');
      } finally {
        setIsLoading(false);
      }
    }

    if (rankingId) {
      loadSubjectScores();
    }
  }, [rankingId]);

  // Group by knowledge section
  const scoresBySection = subjectScores.reduce((acc, score) => {
    const section = score.knowledge_section || 'unknown';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(score);
    return acc;
  }, {} as Record<string, SubjectScore[]>);

  // Sections for tabs
  const sections = Object.keys(scoresBySection).sort((a, b) => {
    const order: Record<string, number> = { basic: 1, specific1: 2, specific2: 3, specific3: 4, unknown: 5 };
    return (order[a] || 5) - (order[b] || 5);
  });

  if (isLoading) {
    return <div className="animate-pulse p-4">
      <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-16 bg-gray-200 rounded mb-2"></div>
      <div className="h-16 bg-gray-200 rounded mb-2"></div>
    </div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  if (subjectScores.length === 0) {
    return null; // If no subject scores available, don't render anything
  }

  const getSectionName = (sectionKey: string): string => {
    const sectionNames: Record<string, string> = {
      basic: 'Conhecimentos Básicos',
      specific1: 'Conhecimentos Específicos 1',
      specific2: 'Conhecimentos Específicos 2',
      specific3: 'Conhecimentos Específicos 3',
      unknown: 'Outros'
    };
    return sectionNames[sectionKey] || 'Desconhecido';
  };

  return (
    <Card>
      <CardHeader className="bg-gray-50">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Pontuações por Disciplina</span>
          {hasMinimumScore && (
            <Badge className={isClassified ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}>
              {isClassified ? 'Classificado' : 'Não Classificado'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        {hasMinimumScore && !isClassified && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-2">
            <AlertTriangle className="text-yellow-500 h-5 w-5 mt-0.5" />
            <p className="text-sm text-yellow-700">
              Este candidato não atingiu a pontuação mínima necessária em uma ou mais disciplinas.
            </p>
          </div>
        )}

        {sections.length > 1 ? (
          <Tabs defaultValue={sections[0]} className="w-full">
            <TabsList className="mb-4">
              {sections.map(section => (
                <TabsTrigger key={section} value={section}>
                  {getSectionName(section)}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {sections.map(section => (
              <TabsContent key={section} value={section}>
                <SubjectScoreTable 
                  scores={scoresBySection[section]} 
                  hasMinimumRequirements={hasMinimumScore}
                />
              </TabsContent>
            ))}
          </Tabs>
        ) : (
          <SubjectScoreTable 
            scores={subjectScores} 
            hasMinimumRequirements={hasMinimumScore}
          />
        )}
      </CardContent>
    </Card>
  );
};

interface SubjectScoreTableProps {
  scores: SubjectScore[];
  hasMinimumRequirements: boolean;
}

const SubjectScoreTable: React.FC<SubjectScoreTableProps> = ({ scores, hasMinimumRequirements }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Disciplina</TableHead>
          <TableHead className="text-right">Pontuação</TableHead>
          <TableHead className="text-right">Total Questões</TableHead>
          {hasMinimumRequirements && (
            <>
              <TableHead className="text-right">Mínimo Exigido</TableHead>
              <TableHead className="text-center w-24">Status</TableHead>
            </>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {scores.map((score, index) => (
          <TableRow key={index} className={!score.is_passing ? 'bg-red-50' : undefined}>
            <TableCell>{score.subject_name}</TableCell>
            <TableCell className="text-right font-medium">{score.score}</TableCell>
            <TableCell className="text-right">{score.question_count}</TableCell>
            {hasMinimumRequirements && (
              <>
                <TableCell className="text-right">{score.minimum_required}</TableCell>
                <TableCell className="text-center">
                  {score.is_passing ? (
                    <div className="flex items-center justify-center text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center text-red-500">
                      <XCircle className="h-4 w-4" />
                    </div>
                  )}
                </TableCell>
              </>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
