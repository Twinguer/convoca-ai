import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface NicknameFieldProps {
  nickname: string;
  setNickname: (value: string) => void;
}

export const NicknameField: React.FC<NicknameFieldProps> = ({
  nickname,
  setNickname
}) => {
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Limitar a 15 caracteres
    if (value.length <= 15) {
      setNickname(value);
    }
  };

  return (
    <div>
      <Label htmlFor="nickname">Nome de usuário (máx. 15 caracteres)</Label>
      <Input
        id="nickname"
        type="text"
        value={nickname}
        onChange={handleNicknameChange}
        placeholder="Como você quer aparecer publicamente"
        maxLength={15}
        className="mt-1"
      />
      <p className="text-xs text-muted-foreground mt-1">
        {nickname.length}/15 caracteres
      </p>
    </div>
  );
};