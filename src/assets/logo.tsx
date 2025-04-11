
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'full';
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto", variant = 'default' }) => {
  const logoSrc = variant === 'full' 
    ? "/lovable-uploads/f79fabe5-25d9-41f4-bfe6-3a3a22ec192e.png" 
    : "/lovable-uploads/97631d44-f5b6-4e7f-8fb3-92d8bbddb4d5.png";
    
  return (
    <img 
      src={logoSrc} 
      alt="Convoca.ai Logo" 
      className={className}
      style={{ objectFit: 'contain' }}
    />
  );
};

export default Logo;
