import React from 'react';

const LoadingOverlay: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/75">
      <div className="flex flex-col items-center">
        <div className="size-16 animate-spin rounded-full border-y-4 border-blue-500"></div>
        <p className="mt-4 text-lg text-white">Cargando...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
