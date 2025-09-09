// src/components/Toast.jsx

import React from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[type];

  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-300 flex items-center justify-between`}>
      {message}
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;