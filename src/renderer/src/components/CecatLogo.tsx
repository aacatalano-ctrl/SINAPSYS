// CecatLogo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
}

const CecatLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 285 90" // Ajustado para el nuevo layout
      className={className}
    >
      <text 
        fontFamily="serif" 
        fontWeight="bold"
        fill="currentColor"
      >
        {/* 'C' mucho más grande, con color y misma fuente */}
        <tspan 
          y="80" 
          fontSize="100"
          fill="#42A5F5"
        >
          C
        </tspan>
        
        {/* 'ECAT' más pequeño y movido hacia la izquierda para superponerse */}
        <tspan 
          dx="-35"
          y="70"
          fontSize="60"
        >
          ECAT
        </tspan>
      </text>
    </svg>
  );
};

export default CecatLogo;