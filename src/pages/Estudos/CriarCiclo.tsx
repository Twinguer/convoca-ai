import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateId } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  X, 
  Edit, 
  Clock, 
  BookOpen, 
  Target,
  CheckCircle,
  FileText,
  Video,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Discipline {
  id: string;
  name: string;
  studyTime: number;
  questionsResolved: number;
  correctAnswers: number;
  wrongAnswers: number;
  courseProgress: string;
  studyType: 'pdf' | 'video';
  currentPage?: number;
  currentVideo?: string;
  isCompleted: boolean;
  notes: string;
}

interface Block {
  id: string;
  name: string;
  disciplines: Discipline[];
}

const CriarCiclo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  
  // Form data
  const [cycleName, setCycleName] = useState('');
  const [organ, setOrgan] = useState('');
  const [position, setPosition] = useState('');
  const [examDate, setExamDate] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);
  
  // Dialog states
  const [editingDiscipline, setEditingDiscipline] = useState<{blockId: string, discipline?: Discipline} | null>(null);
  const [disciplineForm, setDisciplineForm] = useState<Partial<Discipline>>({
    name: '',
    studyTime: 0,
    questionsResolved: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    courseProgress: '',
    studyType: 'pdf',
    currentPage: 0,
    currentVideo: '',
    isCompleted: false,
    notes: ''
  });

  const addBlock = () => {
    const newBlock: Block = {
      id: generateId(),
      name: `Bloco ${blocks.length + 1}`,
      disciplines: []
    };
    setBlocks([...blocks, newBlock]);
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
  };

  const updateBlockName = (blockId: string, name: string) => {
    setBlocks(blocks.map(block => 
      block.id === blockId ? { ...block, name } : block
    ));
  };

  const openDisciplineDialog = (blockId: string, discipline?: Discipline) => {
    setEditingDiscipline({ blockId, discipline });
    if (discipline) {
      setDisciplineForm(discipline);
    } else {
      setDisciplineForm({
        name: '',
        studyTime: 0,
        questionsResolved: 0,
        correctAnswers: 0,
        wrongAnswers: 0,
        courseProgress: '',
        studyType: 'pdf',
        currentPage: 0,
        currentVideo: '',
        isCompleted: false,
        notes: ''
      });
    }
  };

  const saveDiscipline = () => {
    if (!editingDiscipline || !disciplineForm.name) return;

    const discipline: Discipline = {
      id: editingDiscipline.discipline?.id || generateId(),
      name: disciplineForm.name!,
      studyTime: disciplineForm.studyTime || 0,
      questionsResolved: disciplineForm.questionsResolved || 0,
      correctAnswers: disciplineForm.correctAnswers || 0,
      wrongAnswers: disciplineForm.wrongAnswers || 0,
      courseProgress: disciplineForm.courseProgress || '',
      studyType: disciplineForm.studyType || 'pdf',
      currentPage: disciplineForm.currentPage,
      currentVideo: disciplineForm.currentVideo,
      isCompleted: disciplineForm.isCompleted || false,
      notes: disciplineForm.notes || ''
    };

    setBlocks(blocks.map(block => {
      if (block.id === editingDiscipline.blockId) {
        if (editingDiscipline.discipline) {
          // Edit existing
          return {
            ...block,
            disciplines: block.disciplines.map(d => 
              d.id === discipline.id ? discipline : d
            )
          };
        } else {
          // Add new
          return {
            ...block,
            disciplines: [...block.disciplines, discipline]
          };
        }
      }
      return block;
    }));

    setEditingDiscipline(null);
  };

  const removeDiscipline = (blockId: string, disciplineId: string) => {
    setBlocks(blocks.map(block => 
      block.id === blockId 
        ? { ...block, disciplines: block.disciplines.filter(d => d.id !== disciplineId) }
        : block
    ));
  };

  const calculateDaysUntilExam = () => {
    if (!examDate) return null;
    const today = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleSubmit = async () => {
    if (!user || !cycleName || !organ || !position || !examDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('study_cycles')
        .insert({
          user_id: user.id,
          name: cycleName,
          organ,
          position,
          exam_date: examDate,
          blocks: blocks
        });

      if (error) throw error;

      toast.success('Ciclo de estudos criado com sucesso!');
      navigate('/estudos');
    } catch (error) {
      console.error('Error creating study cycle:', error);
      toast.error('Erro ao criar ciclo de estudos');
    } finally {
      setLoading(false);
    }
  };

  const daysUntilExam = calculateDaysUntilExam();

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Criar Ciclo de Estudos</h1>
          <p className="text-muted-foreground">Organize seus estudos em blocos e disciplinas</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/estudos')}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Criando...' : 'Criar Ciclo'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Básicas</CardTitle>
            <CardDescription>
              Dados principais do seu ciclo de estudos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="cycleName">Nome do Ciclo *</Label>
                <Input
                  id="cycleName"
                  value={cycleName}
                  onChange={(e) => setCycleName(e.target.value)}
                  placeholder="Ex: Concurso TJDFT 2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organ">Nome do Órgão *</Label>
                <Input
                  id="organ"
                  value={organ}
                  onChange={(e) => setOrgan(e.target.value)}
                  placeholder="Ex: Tribunal de Justiça do DF"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Nome do Cargo *</Label>
                <Input
                  id="position"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="Ex: Analista Judiciário"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Data da Prova *</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
            </div>
            {daysUntilExam !== null && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {daysUntilExam > 0 
                    ? `${daysUntilExam} dias até a prova`
                    : daysUntilExam === 0 
                    ? 'Prova é hoje!'
                    : 'Prova já passou'
                  }
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blocos de Estudos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Blocos de Estudos</CardTitle>
                <CardDescription>
                  Organize suas disciplinas em blocos temáticos
                </CardDescription>
              </div>
              <Button onClick={addBlock}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Bloco
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {blocks.length === 0 ? (
              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhum bloco criado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie seu primeiro bloco para organizar suas disciplinas
                </p>
                <Button onClick={addBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Bloco
                </Button>
              </div>
            ) : (
              blocks.map((block) => (
                <BlockCard
                  key={block.id}
                  block={block}
                  onRemove={() => removeBlock(block.id)}
                  onUpdateName={(name) => updateBlockName(block.id, name)}
                  onAddDiscipline={() => openDisciplineDialog(block.id)}
                  onEditDiscipline={(discipline) => openDisciplineDialog(block.id, discipline)}
                  onRemoveDiscipline={(disciplineId) => removeDiscipline(block.id, disciplineId)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Disciplina */}
      <Dialog 
        open={!!editingDiscipline} 
        onOpenChange={(open) => !open && setEditingDiscipline(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingDiscipline?.discipline ? 'Editar' : 'Adicionar'} Disciplina
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disciplineName">Nome da Disciplina *</Label>
              <Input
                id="disciplineName"
                value={disciplineForm.name}
                onChange={(e) => setDisciplineForm({...disciplineForm, name: e.target.value})}
                placeholder="Ex: Direito Constitucional"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="studyTime">Tempo Estudado (horas)</Label>
                <Input
                  id="studyTime"
                  type="number"
                  min="0"
                  step="0.5"
                  value={disciplineForm.studyTime}
                  onChange={(e) => setDisciplineForm({...disciplineForm, studyTime: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="questionsResolved">Questões Resolvidas</Label>
                <Input
                  id="questionsResolved"
                  type="number"
                  min="0"
                  value={disciplineForm.questionsResolved}
                  onChange={(e) => setDisciplineForm({...disciplineForm, questionsResolved: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="correctAnswers">Acertos</Label>
                <Input
                  id="correctAnswers"
                  type="number"
                  min="0"
                  value={disciplineForm.correctAnswers}
                  onChange={(e) => setDisciplineForm({...disciplineForm, correctAnswers: Number(e.target.value)})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="wrongAnswers">Erros</Label>
                <Input
                  id="wrongAnswers"
                  type="number"
                  min="0"
                  value={disciplineForm.wrongAnswers}
                  onChange={(e) => setDisciplineForm({...disciplineForm, wrongAnswers: Number(e.target.value)})}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseProgress">Progresso no Curso</Label>
              <Input
                id="courseProgress"
                value={disciplineForm.courseProgress}
                onChange={(e) => setDisciplineForm({...disciplineForm, courseProgress: e.target.value})}
                placeholder="Ex: Capítulo 5 - Direitos Fundamentais"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="studyType">Tipo de Estudo</Label>
              <Select 
                value={disciplineForm.studyType} 
                onValueChange={(value: 'pdf' | 'video') => setDisciplineForm({...disciplineForm, studyType: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="video">Vídeo Aula</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {disciplineForm.studyType === 'pdf' && (
              <div className="space-y-2">
                <Label htmlFor="currentPage">Página Atual</Label>
                <Input
                  id="currentPage"
                  type="number"
                  min="0"
                  value={disciplineForm.currentPage}
                  onChange={(e) => setDisciplineForm({...disciplineForm, currentPage: Number(e.target.value)})}
                />
              </div>
            )}

            {disciplineForm.studyType === 'video' && (
              <div className="space-y-2">
                <Label htmlFor="currentVideo">Vídeo Atual</Label>
                <Input
                  id="currentVideo"
                  value={disciplineForm.currentVideo}
                  onChange={(e) => setDisciplineForm({...disciplineForm, currentVideo: e.target.value})}
                  placeholder="Ex: Aula 05 - Princípios Constitucionais"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={disciplineForm.notes}
                onChange={(e) => setDisciplineForm({...disciplineForm, notes: e.target.value})}
                placeholder="Observações gerais sobre o estudo desta disciplina..."
                rows={3}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isCompleted"
                checked={disciplineForm.isCompleted}
                onCheckedChange={(checked) => setDisciplineForm({...disciplineForm, isCompleted: checked})}
              />
              <Label htmlFor="isCompleted">Disciplina finalizada</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingDiscipline(null)}>
                Cancelar
              </Button>
              <Button onClick={saveDiscipline} disabled={!disciplineForm.name}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface BlockCardProps {
  block: Block;
  onRemove: () => void;
  onUpdateName: (name: string) => void;
  onAddDiscipline: () => void;
  onEditDiscipline: (discipline: Discipline) => void;
  onRemoveDiscipline: (disciplineId: string) => void;
}

const BlockCard: React.FC<BlockCardProps> = ({
  block,
  onRemove,
  onUpdateName,
  onAddDiscipline,
  onEditDiscipline,
  onRemoveDiscipline
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(block.name);

  const handleSaveName = () => {
    onUpdateName(nameValue);
    setIsEditing(false);
  };

  const calculateBlockProgress = () => {
    if (block.disciplines.length === 0) return 0;
    const completed = block.disciplines.filter(d => d.isCompleted).length;
    return (completed / block.disciplines.length) * 100;
  };

  const totalStudyTime = block.disciplines.reduce((sum, d) => sum + d.studyTime, 0);
  const totalQuestions = block.disciplines.reduce((sum, d) => sum + d.questionsResolved, 0);
  const totalCorrect = block.disciplines.reduce((sum, d) => sum + d.correctAnswers, 0);
  const accuracy = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="w-48"
                />
                <Button size="sm" onClick={handleSaveName}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{block.name}</h3>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {block.disciplines.length} disciplina(s)
            </Badge>
            <Button size="sm" variant="outline" onClick={onAddDiscipline}>
              <Plus className="h-4 w-4 mr-1" />
              Disciplina
            </Button>
            <Button size="sm" variant="destructive" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {block.disciplines.length > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do Bloco</span>
              <span>{calculateBlockProgress().toFixed(1)}%</span>
            </div>
            <Progress value={calculateBlockProgress()} />
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {totalStudyTime}h estudadas
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {totalQuestions} questões
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                {accuracy.toFixed(1)}% acertos
              </span>
            </div>
          </div>
        )}
      </CardHeader>
      
      {block.disciplines.length > 0 && (
        <CardContent>
          <div className="space-y-2">
            {block.disciplines.map((discipline) => (
              <DisciplineItem
                key={discipline.id}
                discipline={discipline}
                onEdit={() => onEditDiscipline(discipline)}
                onRemove={() => onRemoveDiscipline(discipline.id)}
              />
            ))}
          </div>
        </CardContent>
      )}
    </Card>
  );
};

interface DisciplineItemProps {
  discipline: Discipline;
  onEdit: () => void;
  onRemove: () => void;
}

const DisciplineItem: React.FC<DisciplineItemProps> = ({ discipline, onEdit, onRemove }) => {
  const accuracy = discipline.questionsResolved > 0 
    ? (discipline.correctAnswers / discipline.questionsResolved) * 100 
    : 0;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {discipline.studyType === 'pdf' ? (
            <FileText className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Video className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium">{discipline.name}</span>
          {discipline.isCompleted && (
            <Badge variant="secondary" className="text-xs">
              Finalizada
            </Badge>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="text-xs text-muted-foreground space-x-3">
          <span>{discipline.studyTime}h</span>
          <span>{discipline.questionsResolved} questões</span>
          <span>{accuracy.toFixed(1)}% acertos</span>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={onRemove}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CriarCiclo;