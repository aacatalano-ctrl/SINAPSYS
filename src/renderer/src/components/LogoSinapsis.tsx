import { BrainCircuit } from 'lucide-react';
import React from 'react';

interface LogoSinapsisProps {
  isAnimating?: boolean;
}

export const LogoSinapsis: React.FC<LogoSinapsisProps> = ({ isAnimating = false }) => {
  return (
    // Contenedor principal (Asegúrate de tener un fondo oscuro en tu app para que brille)
    <div className="flex items-center font-orbitron tracking-wider select-none">
      
      {/* --- EL ICONO CON EFECTO NEÓN --- */}
      <div className="relative mr-3 flex items-center justify-center">
        {/* Capa de resplandor detrás del cerebro */}
        <div className="absolute inset-0 bg-rose-500 blur-xl opacity-40 rounded-full"></div>
        
        {/* El Icono BrainCircuit */}
        <BrainCircuit 
          className={`relative z-10 size-10 text-white ${isAnimating ? 'animate-pulse-shadow' : ''}`}
          strokeWidth={1.5} // Líneas un poco más finas para elegancia
          // Esto crea el brillo blanco/rosado pegado a las líneas
          style={{ filter: 'drop-shadow(0 0 8px rgba(251, 113, 133, 0.9))' }} 
        />
      </div>

      {/* --- EL TEXTO --- */}
      <div className="flex items-baseline leading-none">
        
        {/* La "S" Gigante y Rosa */}
        <span className="text-5xl font-black text-rose-500 drop-shadow-[0_0_10px_rgba(244,63,94,0.5)]">
          S
        </span>
        
        {/* El resto de la palabra en Azul Cielo */}
        <span className="text-3xl font-bold text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.3)]">
          INAPSIS
        </span>

        {/* --- LA VERSIÓN V1.1 --- */}
        {/* Ajustado para quedar pegado abajo a la derecha */}
        <div className="ml-1 flex flex-col justify-end h-full">
           <span className="font-sans text-[0.65rem] font-medium text-white/80 tracking-normal mb-1">
             <span className="text-[0.75rem] font-bold text-rose-300">V</span>1.1
           </span>
        </div>
      </div>
      
    </div>
  );
};