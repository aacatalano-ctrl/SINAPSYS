// src/components/Toast.jsx

import React from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: React.ReactNode;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  show: boolean;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, show }) => {
  if (!show) {
    return null;
  }

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[type];

  return (
    <div
      className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${bgColor} z-50 flex flex-col items-center justify-center rounded-lg px-8 py-6 text-white shadow-lg transition-opacity duration-300 min-w-[300px]`}
    >
      <p className="text-xl font-bold text-center mb-2">{message}</p>
      <button onClick={onClose} className="mt-2 text-white hover:text-gray-200">
        <X size={20} />
      </button>
    </div>
  );
};

export default Toast;
