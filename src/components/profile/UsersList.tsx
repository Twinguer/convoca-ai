
import React from 'react';
import { Button } from '@/components/ui/button';
import { UserCard } from './UserCard';

export interface User {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface UsersListProps {
  title: string;
  users: User[];
  isLoading: boolean;
  emptyMessage: string;
  icon: React.ReactNode;
  onViewProfile: (id: string) => void;
  onViewAll?: () => void;
  showNamesInCards?: boolean;
}

export const UsersList: React.FC<UsersListProps> = ({
  title,
  users,
  isLoading,
  emptyMessage,
  icon,
  onViewProfile,
  onViewAll,
  showNamesInCards = true
}) => {
  return (
    <>
      <div className="flex items-center">
        {icon}
        <span className="text-lg ml-2">{title} ({users.length})</span>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-5 w-5 border-2 border-emerald-600 rounded-full border-t-transparent"></div>
        </div>
      ) : users.length > 0 ? (
        <div className="grid grid-cols-3 gap-1">
          {users.map((user) => (
            <UserCard
              key={user.id}
              id={user.id}
              name={user.name}
              avatarUrl={user.avatar_url}
              onClick={onViewProfile}
              showName={showNamesInCards}
            />
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-muted-foreground py-2">
          {emptyMessage}
        </p>
      )}
      
      {users.length > 0 && onViewAll && (
        <Button variant="link" size="sm" className="w-full mt-2 text-xs" onClick={onViewAll}>
          Ver todos
        </Button>
      )}
    </>
  );
};
