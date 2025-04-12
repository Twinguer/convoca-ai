import React from 'react';
const Logo: React.FC<{
  className?: string;
}> = ({
  className = "h-12 w-auto"
}) => {
  return <div className={`flex items-center ${className}`}>
      
    </div>;
};
export default Logo;