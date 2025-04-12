
import React from 'react';

const Logo: React.FC<{ className?: string }> = ({ className = "h-8 w-auto" }) => {
  return (
    <div className={`flex items-center ${className}`}>
      <svg 
        viewBox="0 0 200 50" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="h-full"
      >
        <path d="M10 25C10 16.7157 16.7157 10 25 10H40C48.2843 10 55 16.7157 55 25C55 33.2843 48.2843 40 40 40H25C16.7157 40 10 33.2843 10 25Z" fill="#0367D9"/>
        <path d="M50 25C50 20.5817 53.5817 17 58 17H75C79.4183 17 83 20.5817 83 25C83 29.4183 79.4183 33 75 33H58C53.5817 33 50 29.4183 50 25Z" fill="#3AA0F9"/>
        <text x="90" y="32" fontFamily="Inter, sans-serif" fontSize="20" fontWeight="700" fill="#0C3E7A">Convoca Aí</text>
      </svg>
    </div>
  );
};

export default Logo;
