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
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X, Edit, BookOpen, Calendar, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useStudyCyclesV2 } from '@/hooks/useStudyCyclesV2';
import { toast } from 'sonner';
import { ProFeatureGuard } from '@/components/Subscription/ProFeatureGuard';
import { useSubscription } from '@/hooks/useSubscription';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';
interface Discipline {
  id: string;
  name: string;
  status: 'em-andamento' | 'finalizada' | 'em-revisao';
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

// Interface simplificada para compatibilidade com createStudyCycleV2
interface SimpleDiscipline {
  id: string;
  name: string;
}
interface Block {
  id: string;
  name: string;
  disciplines: Discipline[];
}

interface CriarCicloProps {
  coachMode?: boolean;
  targetStudentId?: string;
  onSuccess?: () => void;
}

const CriarCiclo = ({ coachMode, targetStudentId, onSuccess }: CriarCicloProps = {}) => {
  const { user } = useAuth();
  const { createCycle } = useStudyCyclesV2();
  const { isPro, isLoading: isLoadingSubscription } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Form data
  const [cycleName, setCycleName] = useState('');
  const [organ, setOrgan] = useState('');
  const [position, setPosition] = useState('');
  const [examDate, setExamDate] = useState('');
  const [blocks, setBlocks] = useState<Block[]>([]);

  // Dialog states
  const [editingDiscipline, setEditingDiscipline] = useState<{
    blockId: string;
    discipline?: Discipline;
  } | null>(null);
  const [disciplineForm, setDisciplineForm] = useState<Partial<Discipline>>({
    name: '',
    status: 'em-andamento',
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
      name: `Matéria ${blocks.length + 1}`,
      disciplines: []
    };
    setBlocks([...blocks, newBlock]);
  };
  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(block => block.id !== blockId));
  };
  const updateBlockName = (blockId: string, name: string) => {
    setBlocks(blocks.map(block => block.id === blockId ? {
      ...block,
      name
    } : block));
  };
  const openDisciplineDialog = (blockId: string, discipline?: Discipline) => {
    setEditingDiscipline({
      blockId,
      discipline
    });
    if (discipline) {
      setDisciplineForm({ name: discipline.name, status: discipline.status });
    } else {
      setDisciplineForm({
        name: '',
        status: 'em-andamento'
      });
    }
  };
  const saveDiscipline = () => {
    if (!editingDiscipline || !disciplineForm.name) return;
    const discipline: Discipline = {
      id: editingDiscipline.discipline?.id || generateId(),
      name: disciplineForm.name!,
      status: disciplineForm.status || 'em-andamento',
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
    };
    setBlocks(blocks.map(block => {
      if (block.id === editingDiscipline.blockId) {
        if (editingDiscipline.discipline) {
          // Edit existing
          return {
            ...block,
            disciplines: block.disciplines.map(d => d.id === discipline.id ? discipline : d)
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
    setBlocks(blocks.map(block => block.id === blockId ? {
      ...block,
      disciplines: block.disciplines.filter(d => d.id !== disciplineId)
    } : block));
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
    const userId = coachMode ? targetStudentId : user?.id;
    
    if (!userId || !cycleName || !organ || !position || !examDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    // Nota: Verificação de plano Pro já é feita pelo ProFeatureGuard no render
    // Se chegou aqui, o usuário já é Pro
    
    // Debug: Verificar blocos antes de enviar
    
    // Converter blocos para formato simplificado compatível com createStudyCycleV2
    const simplifiedBlocks = blocks.map(block => ({
      id: block.id,
      name: block.name,
      disciplines: block.disciplines.map(discipline => ({
        id: discipline.id,
        name: discipline.name
      }))
    }));
    
    
    setLoading(true);
    try {
      const newCycle = await createCycle({
        cycle_name: cycleName,
        exam_date: examDate,
        organ,
        position,
        edital_link: '',
        curso_link: '',
        video_link: '',
        blocks: simplifiedBlocks,
        userId: userId // Passar userId do aluno quando for coach
      });

      if (newCycle) {
        devLog.log('✅ Ciclo criado com sucesso:', newCycle);
        toast.success('Ciclo de estudos criado com sucesso!');
        
        // Usar callback ou navegação padrão
        if (onSuccess) {
          onSuccess();
        } else if (coachMode) {
          navigate(`/coach/student/${targetStudentId}`);
        } else {
          navigate('/estudos');
        }
      }
    } catch (error) {
      devLog.error('Error creating study cycle:', error);
      toast.error('Erro ao criar ciclo de estudos');
    } finally {
      setLoading(false);
    }
  };
  const daysUntilExam = calculateDaysUntilExam();

  // Redirecionar usuários Free imediatamente
  React.useEffect(() => {
    if (!isLoadingSubscription && !isPro) {
      toast.error('O recurso "Criar Ciclo de Estudos" está disponível apenas no plano Pro.');
      navigate('/planos');
    }
  }, [isPro, isLoadingSubscription, navigate]);

  // Mostrar loading enquanto carrega ou redireciona
  if (isLoadingSubscription || !isPro) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex justify-center items-center py-8">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">
              {isLoadingSubscription ? 'Carregando...' : 'Redirecionando...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {coachMode ? 'Criar Ciclo para Aluno' : 'Criar Ciclo de Estudos'}
          </h1>
          <p className="text-muted-foreground">Organize seus estudos em blocos e disciplinas</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => {
              if (coachMode && targetStudentId) {
                navigate(`/coach/student/${targetStudentId}`);
              } else {
                navigate('/estudos');
              }
            }}
          >
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Ciclo'}
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
                <Input id="cycleName" value={cycleName} onChange={e => setCycleName(e.target.value)} placeholder="Ex: Concurso TJDFT 2024" maxLength={30} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organ">Nome do Órgão *</Label>
                <Input id="organ" value={organ} onChange={e => setOrgan(e.target.value)} placeholder="Ex: Tribunal de Justiça do DF" maxLength={30} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="position">Nome do Cargo *</Label>
                <Input id="position" value={position} onChange={e => setPosition(e.target.value)} placeholder="Ex: Analista Judiciário" maxLength={30} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Data da Prova *</Label>
                <Input id="examDate" type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
              </div>
            </div>
            {daysUntilExam !== null && <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">
                  {daysUntilExam > 0 ? `${daysUntilExam} dias até a prova` : daysUntilExam === 0 ? 'Prova é hoje!' : 'Prova já passou'}
                </span>
              </div>}
          </CardContent>
        </Card>

        {/* Blocos de Estudos */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Edital Verticalizado</CardTitle>
              </div>
              <Button onClick={addBlock}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Matéria
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {blocks.length === 0 ? <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Nenhuma matéria criada</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira matéria para organizar seus tópicos
                </p>
                <Button onClick={addBlock}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Matéria
                </Button>
              </div> : blocks.map(block => <BlockCard key={block.id} block={block} onRemove={() => removeBlock(block.id)} onUpdateName={name => updateBlockName(block.id, name)} onAddDiscipline={() => openDisciplineDialog(block.id)} onEditDiscipline={discipline => openDisciplineDialog(block.id, discipline)} onRemoveDiscipline={disciplineId => removeDiscipline(block.id, disciplineId)} />)}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Disciplina */}
      <Dialog open={!!editingDiscipline} onOpenChange={open => !open && setEditingDiscipline(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Adicionar Tópico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input 
                id="disciplineName" 
                value={disciplineForm.name} 
                onChange={e => setDisciplineForm({
                  ...disciplineForm,
                  name: e.target.value
                })} 
                placeholder="Ex: Art. 5º" 
                maxLength={30}
              />
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
    </div>;
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
  
  // Sincronizar nameValue com block.name quando mudar
  React.useEffect(() => {
    setNameValue(block.name);
  }, [block.name]);
  
  const handleSaveName = () => {
    onUpdateName(nameValue);
    setIsEditing(false);
  };
  return <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            {isEditing ? <div className="flex items-center gap-2">
                <Input value={nameValue} onChange={e => setNameValue(e.target.value)} className="w-48" maxLength={15} />
                <Button size="sm" onClick={handleSaveName}>
                  <CheckCircle className="h-4 w-4" />
                </Button>
              </div> : <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{block.name}</h3>
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4" />
                </Button>
              </div>}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {block.disciplines.length} tópico(s)
            </Badge>
            <Button size="sm" variant="outline" onClick={onAddDiscipline}>
              <Plus className="h-4 w-4 mr-1" />
              Tópico
            </Button>
            <Button size="sm" variant="destructive" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
      </CardHeader>
      
      {block.disciplines.length > 0 && <CardContent>
          <div className="space-y-2">
            {block.disciplines.map(discipline => <DisciplineItem key={discipline.id} discipline={discipline} onEdit={() => onEditDiscipline(discipline)} onRemove={() => onRemoveDiscipline(discipline.id)} />)}
          </div>
        </CardContent>}
    </Card>;
};
interface DisciplineItemProps {
  discipline: Discipline;
  onEdit: () => void;
  onRemove: () => void;
}
const DisciplineItem: React.FC<DisciplineItemProps> = ({
  discipline,
  onEdit,
  onRemove
}) => {
  return (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <span className="font-medium">{discipline.name}</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={onEdit}>
          <Edit className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={onRemove}>
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};
export default CriarCiclo;