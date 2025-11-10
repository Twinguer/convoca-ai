import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useCreateGroup } from '@/hooks/useStudyGroups';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import type { PrivacyLevel } from '@/types/studyGroups';

interface CreateGroupModalProps {
  onSuccess?: (groupId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  onSuccess,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const createGroup = useCreateGroup();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    privacy_level: 'public' as PrivacyLevel,
    max_members: 50,
    focus_area: '',
    post_retention_days: 90,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      navigate('/auth');
      return;
    }

    if (!formData.name.trim()) {
      return;
    }

    try {
      const newGroup = await createGroup.mutateAsync({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        focus_area: formData.focus_area.trim() || undefined,
      });
      
      if (newGroup) {
        setOpen(false);
        setFormData({
          name: '',
          description: '',
          privacy_level: 'public',
          max_members: 50,
          focus_area: '',
          post_retention_days: 90,
        });

        if (onSuccess) {
          onSuccess(newGroup.id);
        }
      }
    } catch (error: any) {
      // O erro já é tratado no hook useCreateGroup - erro silencioso
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Criar Grupo
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Grupo de Estudos</DialogTitle>
          <DialogDescription>
            Crie um grupo para estudar junto com outros concurseiros.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Grupo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: TJ-SP 2025"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva o objetivo do grupo..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="privacy">Privacidade</Label>
              <Select
                value={formData.privacy_level}
                onValueChange={(value: PrivacyLevel) =>
                  setFormData({ ...formData, privacy_level: value })
                }
              >
                <SelectTrigger id="privacy">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Público</SelectItem>
                  <SelectItem value="private">Privado</SelectItem>
                  <SelectItem value="invite_only">Apenas convite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_members">Máx. Membros</Label>
              <Input
                id="max_members"
                type="number"
                min="5"
                max="200"
                value={formData.max_members}
                onChange={(e) =>
                  setFormData({ ...formData, max_members: parseInt(e.target.value) || 50 })
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus_area">Área de Foco (opcional)</Label>
            <Input
              id="focus_area"
              value={formData.focus_area}
              onChange={(e) => setFormData({ ...formData, focus_area: e.target.value })}
              placeholder="Ex: TJ-SP, Receita Federal..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createGroup.isPending}>
              {createGroup.isPending ? 'Criando...' : 'Criar Grupo'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

