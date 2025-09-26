// CecatLogo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
}

const CecatLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 285 90"
      className={className}
    >
      <text 
        fontFamily="serif" 
        fontWeight="bold" // Grosor normal para 'ECAT'
        fill="currentColor"
      >
        {/* 'C' con grosor "Heavy" (900) para que resalte */}
        <tspan 
          y="80" 
          fontSize="100"
          fill="#42A5F5"
          fontWeight="900"
        >
          C
        </tspan>
        
        {/* 'ECAT' con espaciado ajustado */}
        <tspan 
          dx="-25"
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
