import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, Plus, Edit2, Trash2, Trophy, Flame } from 'lucide-react';
import { useStudyGoals } from '@/hooks/useStudyGoals';

export const StudyGoals = () => {
  const { goals, loading, createGoal, updateGoal, deleteGoal } = useStudyGoals();
  const [showForm, setShowForm] = useState(false);
  const [newGoalType, setNewGoalType] = useState<'daily' | 'weekly'>('daily');
  const [newTargetHours, setNewTargetHours] = useState('2');
  const [editingGoal, setEditingGoal] = useState<string | null>(null);
  const [editHours, setEditHours] = useState('');

  const handleCreateGoal = async () => {
    await createGoal(newGoalType, parseFloat(newTargetHours));
    setShowForm(false);
    setNewTargetHours('2');
  };

  const handleUpdateGoal = async (goalId: string) => {
    await updateGoal(goalId, parseFloat(editHours));
    setEditingGoal(null);
    setEditHours('');
  };

  const getGoalTypeLabel = (type: 'daily' | 'weekly') => {
    return type === 'daily' ? 'Diária' : 'Semanal';
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'text-purple-600';
    if (streak >= 14) return 'text-orange-600';
    if (streak >= 7) return 'text-green-600';
    if (streak >= 3) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (loading) {
    return <div className="animate-pulse space-y-4">
      <div className="h-6 bg-muted rounded w-32"></div>
      <div className="grid gap-4">
        <div className="h-24 bg-muted rounded"></div>
        <div className="h-24 bg-muted rounded"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Target className="h-5 w-5" />
          Metas de Estudo
        </h3>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nova Meta
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Criar Nova Meta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Tipo</label>
                <Select value={newGoalType} onValueChange={(value: 'daily' | 'weekly') => setNewGoalType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Horas</label>
                <Input
                  type="number"
                  value={newTargetHours}
                  onChange={(e) => setNewTargetHours(e.target.value)}
                  step="0.5"
                  min="0.5"
                  max="24"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreateGoal} size="sm">Criar Meta</Button>
              <Button onClick={() => setShowForm(false)} variant="outline" size="sm">Cancelar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3">
        {goals.map(goal => (
          <Card key={goal.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{getGoalTypeLabel(goal.goal_type)}</Badge>
                    {editingGoal === goal.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editHours}
                          onChange={(e) => setEditHours(e.target.value)}
                          step="0.5"
                          min="0.5"
                          max="24"
                          className="w-20 h-8"
                        />
                        <span className="text-sm">horas</span>
                        <Button onClick={() => handleUpdateGoal(goal.id)} size="sm" variant="ghost">
                          Salvar
                        </Button>
                        <Button onClick={() => setEditingGoal(null)} size="sm" variant="ghost">
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <span className="font-medium">{goal.target_hours}h</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Flame className={`h-4 w-4 ${getStreakColor(goal.current_streak)}`} />
                      <span className={getStreakColor(goal.current_streak)}>
                        Sequência: {goal.current_streak} {goal.goal_type === 'daily' ? 'dias' : 'semanas'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Trophy className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-600">
                        Recorde: {goal.longest_streak}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => {
                      setEditingGoal(goal.id);
                      setEditHours(goal.target_hours.toString());
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => deleteGoal(goal.id)}
                    size="sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {goals.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhuma meta criada</p>
              <p className="text-sm">Crie metas diárias ou semanais para manter o foco</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};