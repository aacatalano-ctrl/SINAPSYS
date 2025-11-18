import React from 'react';
import { useUI } from '../context/UIContext';

const SessionExpiredModal: React.FC = () => {
  const { resetSessionExpired } = useUI();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[200]">
      <div className="bg-white rounded-lg p-8 shadow-2xl text-center max-w-sm w-full">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Sesión Finalizada</h2>
        <p className="mb-6 text-gray-600">
          Tu sesión ha expirado por inactividad. Por favor, haz clic en Aceptar para volver a la
          pantalla de inicio de sesión.
        </p>
        <button
          onClick={resetSessionExpired}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-300"
        >
          Aceptar
        </button>
      </div>
    </div>
  );
};

export default SessionExpiredModal;
