// CecatLogo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
}

const CecatLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 280 70" // Ajustado para el nuevo texto
      className={className}
    >
      <text 
        x="0" 
        y="55" 
        fontFamily="serif" 
        fontSize="60" 
        fontWeight="bold"
        fill="currentColor"
      >
        <tspan fill="#42A5F5">C</tspan>
        <tspan>ECAT</tspan>
      </text>
    </svg>
  );
};

export default CecatLogo;