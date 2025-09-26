// CecatLogo.tsx
import React from 'react';

interface LogoProps {
  className?: string;
}

const CecatLogo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 500 125" // Ajustado para el aspect ratio del logo
      className={className}    // La prop className se aplica aquí
    >
      {/* NOTA: La salpicadura de colores se ha mantenido con colores fijos 
        porque es una parte integral de la identidad de la marca. 
        El texto y el círculo principal usan 'currentColor' para ser personalizables, 
        cumpliendo con los requisitos.
      */}
      <g id="paint-splatter">
        <path d="M125.2,8.1c-14.3,1.3-32.2,6.9-45.3,15.1c-13,8.2-22.1,19-27,31.7c-4.9,12.7-5.7,27.1-2.4,40.1c2.1,8.2,5.9,15.7,11,22.1c-10.4-3.3-19.9-9.2-27.4-17.1c-7.5-7.9-12.9-17.9-15.7-28.7c-2.8-10.8-3-22.3-0.7-33.1c3.2-15.1,12.3-28.3,25.3-37.4c5.1-3.6,11.2-6.5,17.7-8.4c-8,4.1-15.1,9.9-20.6,16.9c-5.6,7-9.4,15.4-11.1,24.3c-0.6,3.1-1.2,6.3-1.7,9.4c-11.7-10.8-16-26.6-11.6-40.8c3-9.7,10-17.9,19.2-23.2c9.2-5.3,20.4-7.4,31.5-5.9" fill="#7E57C2" />
        <path d="M115.8,10.6c-9.1,1.5-19.9,5.7-28.9,11.5c-9,5.8-16.1,13.6-20.7,22.6c-4.6,9-6.6,19.4-5.8,29.9c0.8,10.5,4.4,20.8,10.3,29.3c5.9,8.5,14.2,15.1,23.9,19.1c-7.3-6.2-12.8-14.8-15.7-24.3c-2.9-9.5-3.3-19.8-1-29.6c2.3-9.8,7.2-18.9,14.1-26.2c6.9-7.3,15.9-12.8,25.9-16.1c-0.6,4.6-1.5,9.1-2.8,13.5c-2.6,8.8-6.9,16.9-12.6,23.7c-5.7,6.8-12.8,12.2-20.7,15.9c-2-10.3,0.3-21.3,5.9-29.9c5.6-8.6,14.4-14.8,24.5-17.9" fill="#26A69A" />
        <path d="M141.2,23.3c-12.2-0.6-25.5,2.1-36.3,7.5c-10.8,5.4-19,13.5-24.1,23.1c-5.1,9.6-7,20.7-5.5,31.7c1.5,11,6.4,21.6,14.1,29.9c4,4.3,8.6,8,13.7,11.1c-10.3-1.6-20-7-27.4-14.8c-7.4-7.8-12.4-17.9-14.4-28.7c-2-10.8-1.5-22.3,1.6-32.4c4.4-14.1,14.4-25.9,27.7-33.1c13.3-7.2,29.1-9.5,43.5-6.6c-0.8,5.4-1.6,10.8-2.4,16.2c-1.6,10.8-3.4,21.6-5.5,32.4c-2.1,10.8-4.4,21.6-6.9,32.4c-4.9-12.7-4.2-27.4,2.1-39.4c6.2-12,17.4-21,30.9-25.6" fill="#42A5F5" />
        <path d="M140.5,37.3c-5.1-5.8-12.2-10.2-20.1-12.9c-7.9-2.7-16.6-3.5-24.9-2.1c-8.3,1.4-16,4.8-22.5,9.7c-6.5,4.9-11.7,11.3-15.1,18.5c-3.4,7.2-4.9,15.3-4.3,23.4c0.6,8.1,3.2,16,7.5,22.8c-3.4-6.4-5-13.6-4.6-20.9c0.4-7.3,2.6-14.4,6.6-20.6c4-6.2,9.6-11.4,16.4-15.1c6.8-3.7,14.6-5.8,22.5-6.2c7.9-0.4,15.7,1.1,22.8,4.3c7.1,3.2,13.3,8,18.2,14.1" fill="#FFCA28" />
        <path d="M136.1,18.7c-5.5-2.2-11.5-3.4-17.6-3.5c-6.1-0.1-12.1,0.8-17.9,2.7c-5.8,1.9-11.3,4.8-16.2,8.5c-5,3.7-9.3,8.2-12.9,13.2c-3.6,5-6.3,10.6-8.1,16.5c2.9-14.3,11.5-26.6,23.6-34.5c12.1-7.9,27.3-11.2,42.2-9.2c14.9,2,28.8,9,38.5,19.7c-7.7-5.9-16.8-9.8-26.4-11.2c-9.6-1.4-19.4-0.5-28.8,2.4" fill="#EF5350" />
      </g>
      
      {/* Grupo principal del logo (texto y círculo) */}
      <g id="logo-text-and-circle">
        {/* Círculo que contiene la 'C' */}
        <circle cx="65" cy="62" r="45" fill="currentColor" />
        
        {/* Letra 'C' dentro del círculo */}
        <text 
          x="44" 
          y="85" 
          fontFamily="serif" 
          fontSize="60" 
          fontWeight="bold"
          fill="#FFFFFF"
        >
          C
        </text>

        {/* Resto del texto "ECAT" */}
        <text 
          x="118" 
          y="85" 
          fontFamily="serif" 
          fontSize="60" 
          fontWeight="bold"
          fill="currentColor"
        >
          ECAT
        </text>

        {/* Subtítulo */}
        <text 
          x="120" 
          y="105" 
          fontFamily="sans-serif" 
          fontSize="14"
          fill="currentColor"
        >
          Centro de Capacitación Tecnológico
        </text>
      </g>
    </svg>
  );
};

export default CecatLogo;
