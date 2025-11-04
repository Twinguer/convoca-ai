import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, GraduationCap, Lock, Globe, UserPlus } from 'lucide-react';
import type { StudyGroup } from '@/types/studyGroups';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface GroupCardProps {
  group: StudyGroup;
  onClick?: (groupId: string) => void;
  showJoinButton?: boolean;
  isMember?: boolean;
  onJoin?: (groupId: string) => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onClick,
  showJoinButton = true,
  isMember = false,
  onJoin,
}) => {
  const handleCardClick = () => {
    if (onClick) {
      onClick(group.id);
    }
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoin) {
      onJoin(group.id);
    }
  };

  const privacyIcon = group.privacy_level === 'public' ? (
    <Globe className="h-4 w-4" />
  ) : (
    <Lock className="h-4 w-4" />
  );

  const timeAgo = group.created_at && !isNaN(new Date(group.created_at).getTime())
    ? formatDistanceToNow(new Date(group.created_at), {
        addSuffix: true,
        locale: ptBR,
      })
    : 'Data não disponível';

  return (
    <Card 
      className="cursor-pointer hover:shadow-lg transition-all duration-300 h-full flex flex-col"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <GraduationCap className="h-5 w-5 text-primary flex-shrink-0" />
              <h3 className="font-bold text-lg truncate">{group.name}</h3>
            </div>
            {group.coach_id && (
              <Badge variant="secondary" className="mb-2">
                <UserPlus className="h-3 w-3 mr-1" />
                Com Coach
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            {privacyIcon}
            <span className="text-xs">{group.privacy_level === 'public' ? 'Público' : 'Privado'}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col pt-0">
        {group.description && (
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {group.description}
          </p>
        )}

        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{group.current_members} membros</span>
          </div>
          <span className="text-xs">{timeAgo}</span>
        </div>

        {group.focus_area && (
          <Badge variant="outline" className="mb-4 w-fit">
            {group.focus_area}
          </Badge>
        )}

        {showJoinButton && !isMember && (
          <Button
            variant="default"
            size="sm"
            className="w-full mt-auto"
            onClick={handleJoinClick}
          >
            Solicitar Entrada
          </Button>
        )}

        {isMember && (
          <Button
            variant="outline"
            size="sm"
            className="w-full mt-auto"
            onClick={handleCardClick}
          >
            Ver Grupo
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

