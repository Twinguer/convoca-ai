import React, { useState } from 'react';
import { generateId } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Calendar, BookOpen, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { StudyContest, StudySubject } from '@/types/userStudy';
import { toast } from '@/hooks/use-toast';

interface Discipline {
  id: string;
  name: string;
  blockName: string;
  estimatedHours: number;
}

interface Block {
  name: string;
  disciplines: Discipline[];
}

const CriarConcurso = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [examDate, setExamDate] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [newBlockName, setNewBlockName] = useState('');
  const [loading, setLoading] = useState(false);

  const addBlock = () => {
    if (!newBlockName.trim()) return;
    
    setBlocks([...blocks, { name: newBlockName, disciplines: [] }]);
    setNewBlockName('');
  };

  const removeBlock = (blockIndex: number) => {
    setBlocks(blocks.filter((_, index) => index !== blockIndex));
  };

  const addDiscipline = (blockIndex: number, disciplineName: string, estimatedHours: number) => {
    if (!disciplineName.trim() || estimatedHours <= 0) return;
    
    const newDiscipline: Discipline = {
      id: generateId(),
      name: disciplineName,
      blockName: blocks[blockIndex].name,
      estimatedHours
    };

    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].disciplines.push(newDiscipline);
    setBlocks(updatedBlocks);
  };

  const removeDiscipline = (blockIndex: number, disciplineIndex: number) => {
    const updatedBlocks = [...blocks];
    updatedBlocks[blockIndex].disciplines.splice(disciplineIndex, 1);
    setBlocks(updatedBlocks);
  };

  const calculateDaysUntilExam = () => {
    if (!examDate) return null;
    const today = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um concurso de estudo.",
        variant: "destructive"
      });
      return;
    }

    if (!title.trim() || !examDate || blocks.length === 0) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios e adicione pelo menos um bloco com disciplinas.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      // Create study contest
      const newContest: Omit<StudyContest, 'id' | 'created_at' | 'updated_at'> = {
        concurso_id: crypto.randomUUID(), // Usar como ID temporário
        is_active: true,
        registration_date: new Date().toISOString(),
        exam_date: examDate,
        notes: description
      };

      // Create disciplines for each block
      const newSubjects: Omit<StudySubject, 'id' | 'created_at' | 'updated_at'>[] = blocks.flatMap(block => 
        block.disciplines.map(discipline => ({
          name: discipline.name,
          parent_id: undefined,
          total_hours_studied: discipline.estimatedHours || 0,
          last_studied_date: null
        }))
      );

      // Get current user study data
      const userStudyData = await UserStudyService.getUserStudyData(user.id);
      if (!userStudyData) {
        await UserStudyService.initializeUserStudyData(user.id);
      }

      // Add new contest and subjects
      const success = await UserStudyService.upsertUserStudyData(user.id, {
        study_contests: [...(userStudyData?.study_contests || []), newContest],
        study_subjects: [...(userStudyData?.study_subjects || []), ...newSubjects]
      });

      if (success) {
        toast({
          title: "Sucesso!",
          description: "Concurso de estudo criado com sucesso!"
        });
        navigate('/estudos');
      } else {
        throw new Error('Failed to save data');
      }
    } catch (error) {
      console.error('Error creating study contest:', error);
      toast({
        title: "Erro",
        description: "Erro ao criar concurso de estudo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const daysUntilExam = calculateDaysUntilExam();

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Criar Concurso de Estudo</h1>
        <p className="text-muted-foreground">
          Organize seus estudos criando um cronograma baseado em um concurso real
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
            <CardDescription>
              Defina as informações principais do seu concurso de estudo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Título do Concurso *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Concurso Público TJSP 2024"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição opcional do concurso..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="examDate">Data da Prova *</Label>
              <Input
                id="examDate"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
              />
              {daysUntilExam !== null && (
                <div className="mt-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    {daysUntilExam > 0 
                      ? `${daysUntilExam} dias até a prova`
                      : daysUntilExam === 0 
                        ? 'Prova é hoje!'
                        : 'Data da prova já passou'
                    }
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Blocks and Disciplines */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Blocos e Disciplinas
            </CardTitle>
            <CardDescription>
              Organize suas disciplinas por blocos de conhecimento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Add new block */}
            <div className="flex gap-2">
              <Input
                value={newBlockName}
                onChange={(e) => setNewBlockName(e.target.value)}
                placeholder="Nome do bloco (ex: Conhecimentos Básicos)"
                className="flex-1"
              />
              <Button type="button" onClick={addBlock} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Bloco
              </Button>
            </div>

            {/* Existing blocks */}
            {blocks.map((block, blockIndex) => (
              <BlockCard
                key={blockIndex}
                block={block}
                blockIndex={blockIndex}
                onAddDiscipline={addDiscipline}
                onRemoveDiscipline={removeDiscipline}
                onRemoveBlock={removeBlock}
              />
            ))}

            {blocks.length === 0 && (
              <div className="text-center p-8 text-muted-foreground">
                <Target className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Adicione blocos e disciplinas para organizar seus estudos</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/estudos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Criando...' : 'Criar Concurso'}
          </Button>
        </div>
      </form>
    </div>
  );
};

interface BlockCardProps {
  block: Block;
  blockIndex: number;
  onAddDiscipline: (blockIndex: number, disciplineName: string, estimatedHours: number) => void;
  onRemoveDiscipline: (blockIndex: number, disciplineIndex: number) => void;
  onRemoveBlock: (blockIndex: number) => void;
}

const BlockCard: React.FC<BlockCardProps> = ({
  block,
  blockIndex,
  onAddDiscipline,
  onRemoveDiscipline,
  onRemoveBlock
}) => {
  const [newDisciplineName, setNewDisciplineName] = useState('');
  const [newDisciplineHours, setNewDisciplineHours] = useState<number>(10);

  const handleAddDiscipline = () => {
    onAddDiscipline(blockIndex, newDisciplineName, newDisciplineHours);
    setNewDisciplineName('');
    setNewDisciplineHours(10);
  };

  const totalHours = block.disciplines.reduce((sum, d) => sum + d.estimatedHours, 0);

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{block.name}</CardTitle>
            <CardDescription>
              {block.disciplines.length} disciplinas · {totalHours}h estimadas
            </CardDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onRemoveBlock(blockIndex)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Existing disciplines */}
        {block.disciplines.length > 0 && (
          <div className="space-y-2">
            {block.disciplines.map((discipline, disciplineIndex) => (
              <div
                key={discipline.id}
                className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{discipline.name}</span>
                  <Badge variant="secondary">{discipline.estimatedHours}h</Badge>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveDiscipline(blockIndex, disciplineIndex)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add new discipline */}
        <div className="flex gap-2">
          <Input
            value={newDisciplineName}
            onChange={(e) => setNewDisciplineName(e.target.value)}
            placeholder="Nome da disciplina"
            className="flex-1"
          />
          <Input
            type="number"
            value={newDisciplineHours}
            onChange={(e) => setNewDisciplineHours(Number(e.target.value))}
            placeholder="Horas"
            className="w-20"
            min="1"
          />
          <Button type="button" onClick={handleAddDiscipline} variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CriarConcurso;
