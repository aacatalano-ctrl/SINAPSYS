// CecatLogo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
}

const CecatLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 100" // Ajustado para la 'C' más grande
      className={className}
    >
      <text 
        fontFamily="serif" 
        fontWeight="bold"
        fill="currentColor"
      >
        {/* 'C' en sans-serif y tamaño aumentado */}
        <tspan 
          y="90" 
          fontSize="110"
          fill="#42A5F5"
          fontFamily="sans-serif"
        >
          C
        </tspan>
        
        {/* 'ECAT' alineado con la nueva 'C' */}
        <tspan 
          dx="5"
          y="78"
          fontSize="60"
        >
          ECAT
        </tspan>
      </text>
    </svg>
  );
};

export default CecatLogo;