
import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'default' | 'full' | 'large';
}

const Logo: React.FC<LogoProps> = ({ className = "h-8 w-auto", variant = 'default' }) => {
  let logoSrc;
  
  switch (variant) {
    case 'full':
      logoSrc = "https://tibizurada.store/logo-01.png";
      break;
    case 'large':
      logoSrc = "https://tibizurada.store/logo-01.png";
      break;
    default:
      logoSrc = "https://tibizurada.store/logo-01.png";
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
