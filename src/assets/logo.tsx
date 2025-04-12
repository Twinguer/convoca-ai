
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8 w-auto" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src="https://tibizurada.store/logo-02.png" 
        alt="Convoca Aí Logo" 
        className="h-full w-auto object-contain"
      />
    </div>
  );
};

export default Logo;
