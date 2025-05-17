
import React from 'react';

interface LogoProps {
  className?: string;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({
  className = "h-12 w-auto",
  height = 40
}) => {
  return (
    <div className={className} style={{ height: height }}>
      {/* Conteúdo do logo aqui */}
      <span className="font-bold text-emerald-600">Convoca</span>
    </div>
  );
};

export default Logo;
