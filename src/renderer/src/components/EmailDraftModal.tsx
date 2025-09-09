// src/components/EmailDraftModal.jsx

import React from 'react';

const EmailDraftModal = ({ content, onClose, showNotification }: { content: string; onClose: () => void; showNotification: (message: string, type?: string) => void; }) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Correo Electrónico Generado</h2>
        <p className="text-sm text-gray-600 mb-4">
          Este es un borrador del correo electrónico. Por favor, cópialo y pégalo en tu cliente de correo para enviarlo.
          (La función de envío directo de correos no está disponible en este entorno de demostración).
        </p>
        <textarea
          className="w-full h-48 p-3 bg-gray-100 border border-gray-300 rounded-lg text-gray-800 resize-y mb-4"
          value={content}
          readOnly
        ></textarea>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              const textarea = document.createElement('textarea');
              textarea.value = content;
              document.body.appendChild(textarea);
              textarea.select();
              document.execCommand('copy');
              document.body.removeChild(textarea);
              showNotification('Contenido del correo copiado al portapapeles.', 'success');
              onClose();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
          >
            Copiar al Portapapeles
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailDraftModal;