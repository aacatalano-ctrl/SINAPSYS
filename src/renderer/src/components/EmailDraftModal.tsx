// src/components/EmailDraftModal.jsx

import React from 'react';

const EmailDraftModal = ({ content, onClose, showNotification }: { content: string; onClose: () => void; showNotification: (message: string, type?: string) => void; }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Correo Electrónico Generado</h2>
        <p className="mb-4 text-sm text-gray-600">
          Este es un borrador del correo electrónico. Por favor, cópialo y pégalo en tu cliente de correo para enviarlo.
          (La función de envío directo de correos no está disponible en este entorno de demostración).
        </p>
        <textarea
          className="mb-4 h-48 w-full resize-y rounded-lg border border-gray-300 bg-gray-100 p-3 text-gray-800"
          value={content}
          readOnly
        ></textarea>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-300 px-6 py-2 font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400"
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
            className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
          >
            Copiar al Portapapeles
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailDraftModal;