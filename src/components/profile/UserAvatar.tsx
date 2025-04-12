
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
    sm: 'h-6 w-6 sm:h-8 sm:w-8',
    md: 'h-10 w-10 sm:h-12 sm:w-12',
    lg: 'h-14 w-14 sm:h-16 sm:w-16'
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
