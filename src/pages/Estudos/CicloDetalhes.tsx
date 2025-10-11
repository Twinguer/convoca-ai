import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { StudyCycleV2 } from '@/types/userStudy';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { EditalVerticalizado } from '@/components/study/EditalVerticalizado';

interface CicloDetalhesProps {
  cycleId?: string;
  secureToken?: string;
}

const CicloDetalhes: React.FC<CicloDetalhesProps> = ({ cycleId, secureToken }) => {
  const { id: urlId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast: toastHook } = useToast();
  const [cycle, setCycle] = useState<StudyCycleV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDiscipline, setEditingDiscipline] = useState<string | null>(null);
  const [tempStudyTime, setTempStudyTime] = useState<number>(0);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());

  // Usar cycleId da prop ou do URL
  const id = cycleId || urlId;

  useEffect(() => {
    if (user && id) {
      fetchCycle();
    }
  }, [user, id]);

  const fetchCycle = async () => {
    try {
      const userStudyData = await UserStudyService.getUserStudyData(user?.id);
      if (userStudyData) {
        const cycleData = userStudyData.study_cycles.find(cycle => cycle.id === id);
        if (cycleData) {
          setCycle(cycleData);
        } else {
          toast.error('Ciclo não encontrado');
        }
      } else {
        toast.error('Dados de estudo não encontrados');
      }
    } catch (error) {
      console.error('Error fetching cycle:', error);
      toast.error('Erro ao carregar ciclo de estudos');
    } finally {
      setLoading(false);
    }
  };

  const updateCycle = async (updatedCycle: StudyCycleV2) => {
    try {
      const success = await UserStudyService.updateCycle(user?.id, updatedCycle.id, {
        schedule_data: updatedCycle.schedule_data
      });

      if (success) {
        setCycle(updatedCycle);
        toast.success('Ciclo atualizado com sucesso!');
      } else {
        toast.error('Erro ao atualizar ciclo');
      }
    } catch (error) {
      console.error('Error updating cycle:', error);
      toast.error('Erro ao atualizar ciclo');
    }
  };

  const toggleDisciplineCompletion = (blockIndex: number, disciplineIndex: number) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    const discipline = updatedCycle.schedule_data.available_blocks[blockIndex].disciplines[disciplineIndex];
    discipline.isCompleted = !discipline.isCompleted;

    updateCycle(updatedCycle);
  };

  const handleToggleDiscipline = (blockId: string, disciplineId: string) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    const block = updatedCycle.schedule_data.available_blocks.find(b => b.id === blockId);
    if (block) {
      const discipline = block.disciplines.find(d => d.id === disciplineId);
      if (discipline) {
        discipline.isCompleted = !discipline.isCompleted;
        updateCycle(updatedCycle);
      }
    }
  };

  const handleToggleBlock = (blockId: string) => {
    const newExpanded = new Set(expandedBlocks);
    if (newExpanded.has(blockId)) {
      newExpanded.delete(blockId);
    } else {
      newExpanded.add(blockId);
    }
    setExpandedBlocks(newExpanded);
  };

  const updateStudyTime = (blockIndex: number, disciplineIndex: number, newTime: number) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    updatedCycle.blocks[blockIndex].disciplines[disciplineIndex].studyTime = newTime;

    updateCycle(updatedCycle);
    setEditingDiscipline(null);
  };

  const deleteBlock = (blockIndex: number) => {
    if (!cycle) return;

    toastHook({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir este bloco e todas as suas disciplinas?',
      action: (
        <Button
          onClick={() => {
            const updatedCycle = { ...cycle };
            updatedCycle.blocks.splice(blockIndex, 1);
            updateCycle(updatedCycle);
          }}
          variant="destructive"
          size="sm"
        >
          Excluir
        </Button>
      ),
    });
  };

  const deleteDiscipline = (blockIndex: number, disciplineIndex: number) => {
    if (!cycle) return;

    toastHook({
      title: 'Confirmar exclusão',
      description: 'Tem certeza que deseja excluir esta disciplina?',
      action: (
        <Button
          onClick={() => {
            const updatedCycle = { ...cycle };
            updatedCycle.blocks[blockIndex].disciplines.splice(disciplineIndex, 1);
            updateCycle(updatedCycle);
          }}
          variant="destructive"
          size="sm"
        >
          Excluir
        </Button>
      ),
    });
  };


  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!cycle) {
    return (
      <div className="min-h-screen p-6 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-4">Ciclo não encontrado</h1>
        <Link to="/estudos">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar aos Estudos
          </Button>
        </Link>
      </div>
    );
  }


  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/estudos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">{cycle.cycle_name}</h1>
          <p className="text-muted-foreground">{cycle.organ} - {cycle.position}</p>
        </div>
      </div>


      {/* Edital Verticalizado */}
      <div className="space-y-6">
        <EditalVerticalizado
          blocks={cycle.schedule_data?.available_blocks || []}
          onToggleDiscipline={handleToggleDiscipline}
          onToggleBlock={handleToggleBlock}
          expandedBlocks={expandedBlocks}
          showProgress={true}
        />
      </div>
    </div>
  );
};

export default CicloDetalhes;