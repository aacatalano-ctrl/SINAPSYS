import React, { useEffect } from 'react';
import { LogoSinapsis } from './LogoSinapsis'; // Import the new LogoSinapsis component

interface SplashScreenProps {
  onAnimationEnd: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationEnd }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onAnimationEnd();
    }, 3000); // 3 seconds as requested

    return () => clearTimeout(timer); // Cleanup the timer
  }, [onAnimationEnd]);

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-blue-900 transition-opacity duration-500"
         style={{ background: 'radial-gradient(circle at center, #2563eb 0%, #1e3a8a 100%)' }}>
      <LogoSinapsis isAnimating={true} />
    </div>
  );
};

export default SplashScreen;