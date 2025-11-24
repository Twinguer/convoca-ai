import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Edit3, Save, X, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserStudyService } from '@/services/userStudyService';
import { StudyCycleV2 } from '@/types/userStudy';
import { toast } from 'sonner';
import { useToast } from '@/hooks/use-toast';
import { EditalVerticalizado } from '@/components/study/EditalVerticalizado';
import { devLog, sanitizeForLog } from '@/utils/productionLogger';

interface CicloDetalhesProps {
  cycleId?: string;
  secureToken?: string;
  coachMode?: boolean;
  targetStudentId?: string;
}

const CicloDetalhes: React.FC<CicloDetalhesProps> = ({ cycleId, secureToken, coachMode, targetStudentId }) => {
  const { id: urlId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast: toastHook } = useToast();
  const [cycle, setCycle] = useState<StudyCycleV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingDiscipline, setEditingDiscipline] = useState<string | null>(null);
  const [tempStudyTime, setTempStudyTime] = useState<number>(0);
  const [expandedBlocks, setExpandedBlocks] = useState<Set<string>>(new Set());
  const [disciplineDialog, setDisciplineDialog] = useState<{ blockId: string; disciplineId?: string } | null>(null);
  const [newDisciplineName, setNewDisciplineName] = useState('');

  // Usar cycleId da prop ou do URL
  const id = cycleId || urlId;
  // Em modo coach, usar targetStudentId; caso contrário, usar user.id
  const userId = coachMode && targetStudentId ? targetStudentId : user?.id;

  useEffect(() => {
    if (userId && id) {
      fetchCycle();
    }
  }, [userId, id, coachMode, targetStudentId]);

  const fetchCycle = async () => {
    if (!userId) return;
    
    try {
      const userStudyData = await UserStudyService.getUserStudyData(userId);
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
      devLog.error('Error fetching cycle:', error);
      toast.error('Erro ao carregar ciclo de estudos');
    } finally {
      setLoading(false);
    }
  };

  const updateCycle = async (updatedCycle: StudyCycleV2) => {
    if (!userId) return;
    
    try {
      const success = await UserStudyService.updateCycle(userId, updatedCycle.id, {
        schedule_data: updatedCycle.schedule_data
      });

      if (success) {
        setCycle(updatedCycle);
        toast.success('Ciclo atualizado com sucesso!');
      } else {
        toast.error('Erro ao atualizar ciclo');
      }
    } catch (error) {
      devLog.error('Error updating cycle:', error);
      toast.error('Erro ao atualizar ciclo');
    }
  };

  const handleToggleDiscipline = (blockId: string, disciplineId: string) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    const block = updatedCycle.schedule_data.available_blocks.find(b => b.id === blockId);
    if (block) {
      const discipline = block.disciplines.find(d => d.id === disciplineId);
      if (discipline) {
        // Toggle completion status (property may not exist in type, but we add it dynamically)
        (discipline as any).isCompleted = !(discipline as any).isCompleted;
        updateCycle(updatedCycle);
      }
    }
  };

  const handleStatusChange = (blockId: string, disciplineId: string, status: 'em_andamento' | 'finalizada' | 'em_revisao' | null) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    const block = updatedCycle.schedule_data.available_blocks.find(b => b.id === blockId);
    if (block) {
      const discipline = block.disciplines.find(d => d.id === disciplineId);
      if (discipline) {
        // ✅ Atualizar status da disciplina (mutuamente exclusivo)
        // Se um status está sendo marcado, os outros são automaticamente desmarcados
        (discipline as any).status = status;
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

  const handleAddDiscipline = (blockId: string) => {
    setNewDisciplineName('');
    setDisciplineDialog({ blockId });
  };

  const handleEditDiscipline = (blockId: string, disciplineId: string) => {
    if (!cycle) return;

    const block = cycle.schedule_data.available_blocks.find(b => b.id === blockId);
    if (block) {
      const discipline = block.disciplines.find(d => d.id === disciplineId);
      if (discipline) {
        setNewDisciplineName(discipline.name);
        setDisciplineDialog({ blockId, disciplineId });
      }
    }
  };

  const handleRemoveDiscipline = (blockId: string, disciplineId: string) => {
    if (!cycle) return;

    const updatedCycle = { ...cycle };
    const block = updatedCycle.schedule_data.available_blocks.find(b => b.id === blockId);
    if (block) {
      block.disciplines = block.disciplines.filter(d => d.id !== disciplineId);
      updateCycle(updatedCycle);
    }
  };

  const handleSaveDiscipline = () => {
    if (!cycle || !disciplineDialog || !newDisciplineName.trim()) return;

    const updatedCycle = { ...cycle };
    const block = updatedCycle.schedule_data.available_blocks.find(b => b.id === disciplineDialog.blockId);
    if (block) {
      if (disciplineDialog.disciplineId) {
        // Editar disciplina existente
        const discipline = block.disciplines.find(d => d.id === disciplineDialog.disciplineId);
        if (discipline) {
          discipline.name = newDisciplineName.trim();
        }
      } else {
        // Adicionar nova disciplina
        const newDiscipline = {
          id: `discipline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: newDisciplineName.trim(),
          isCompleted: false,
          status: null as 'em_andamento' | 'finalizada' | 'em_revisao' | null
        };
        block.disciplines.push(newDiscipline);
      }
      updateCycle(updatedCycle);
    }

    setDisciplineDialog(null);
    setNewDisciplineName('');
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
      {/* Header - só mostrar se não estiver em modo coach (coach já tem header próprio) */}
      {!coachMode && (
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
      )}

      {/* Edital Verticalizado */}
      <div className="space-y-6">
        <EditalVerticalizado
          blocks={cycle.schedule_data?.available_blocks || []}
          onToggleDiscipline={handleToggleDiscipline}
          onToggleBlock={handleToggleBlock}
          onStatusChange={handleStatusChange}
          onAddDiscipline={coachMode ? handleAddDiscipline : undefined}
          onEditDiscipline={coachMode ? handleEditDiscipline : undefined}
          onRemoveDiscipline={coachMode ? handleRemoveDiscipline : undefined}
          expandedBlocks={expandedBlocks}
          showProgress={true}
          allowEdit={coachMode || false}
        />
      </div>

      {/* Dialog para adicionar/editar disciplina */}
      <Dialog open={!!disciplineDialog} onOpenChange={(open) => !open && setDisciplineDialog(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>
              {disciplineDialog?.disciplineId ? 'Editar' : 'Adicionar'} Disciplina
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="disciplineName">Nome da Disciplina *</Label>
              <Input 
                id="disciplineName" 
                value={newDisciplineName} 
                onChange={e => {
                  const value = e.target.value;
                  if (value.length <= 20) {
                    setNewDisciplineName(value);
                  }
                }} 
                placeholder="Ex: Direito Constitucional"
                maxLength={20}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDisciplineName.trim()) {
                    handleSaveDiscipline();
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {newDisciplineName.length}/20 caracteres
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setDisciplineDialog(null)}>
                Cancelar
              </Button>
              <Button onClick={handleSaveDiscipline} disabled={!newDisciplineName.trim()}>
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CicloDetalhes;