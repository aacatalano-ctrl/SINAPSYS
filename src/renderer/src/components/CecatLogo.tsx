// CecatLogo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
}

const CecatLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 320 80" // Ampliado para dar espacio al nuevo diseño
      className={className}
    >
      <text 
        // Fuente por defecto para 'ECAT'
        fontFamily="serif" 
        fontSize="60" 
        fontWeight="bold"
        fill="currentColor"
      >
        {/* La 'C' es más grande, con fuente Orbitron y color azul */}
        <tspan 
          y="65" 
          fontFamily="Orbitron, sans-serif"
          fontSize="80"
          fill="#42A5F5"
        >
          C
        </tspan>
        
        {/* 'ECAT' se ajusta para alinearse con la 'C' más grande */}
        <tspan dx="10">
          ECAT
        </tspan>
      </text>
    </svg>
  );
};

export default CecatLogo;
