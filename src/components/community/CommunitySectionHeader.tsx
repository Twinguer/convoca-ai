import React from 'react';
export interface CommunitySectionHeaderProps {
  title?: string;
  description?: string;
  showDemoUsers?: boolean;
  icon?: React.ReactNode;
}
export const CommunitySectionHeader: React.FC<CommunitySectionHeaderProps> = ({
  title = "Comunidade",
  description = "Conecte-se com outros concurseiros e acompanhe seus progressos",
  showDemoUsers = false,
  icon
}) => {
  return;
};