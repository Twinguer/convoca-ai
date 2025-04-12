
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  avatarUrl, 
  size = 'md' 
}) => {
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const sizeClass = {
    sm: 'h-8 w-8',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  }[size];

  return (
    <Avatar className={sizeClass}>
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt={name} />
      ) : (
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
      )}
    </Avatar>
  );
};
