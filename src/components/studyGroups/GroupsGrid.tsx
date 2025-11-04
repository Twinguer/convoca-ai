import React from 'react';
import { GroupCard } from './GroupCard';
import type { StudyGroup } from '@/types/studyGroups';

interface GroupsGridProps {
  groups: StudyGroup[];
  onClick?: (groupId: string) => void;
  onJoin?: (groupId: string) => void;
  userMemberGroupIds?: string[];
}

export const GroupsGrid: React.FC<GroupsGridProps> = ({
  groups,
  onClick,
  onJoin,
  userMemberGroupIds = [],
}) => {
  if (groups.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum grupo encontrado.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {groups.map((group) => (
        <GroupCard
          key={group.id}
          group={group}
          onClick={onClick}
          showJoinButton={!!onJoin}
          isMember={userMemberGroupIds.includes(group.id)}
          onJoin={onJoin}
        />
      ))}
    </div>
  );
};

