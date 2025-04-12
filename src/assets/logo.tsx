
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'full' | 'large';
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto", variant = 'default' }) => {
  let logoSrc;
  
  switch (variant) {
    case 'full':
      logoSrc = "/lovable-uploads/f79fabe5-25d9-41f4-bfe6-3a3a22ec192e.png";
      break;
    case 'large':
      logoSrc = "/lovable-uploads/4e59f82e-1362-457d-b622-d06b371a8148.png";
      break;
    default:
      logoSrc = "/lovable-uploads/73f7abd9-6b67-4ead-ba7f-32619c4476b3.png";
  }
    
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
