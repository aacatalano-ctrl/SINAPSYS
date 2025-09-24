// src/components/Toast.jsx

import React from 'react';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
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
      className={`fixed bottom-4 right-4 ${bgColor} z-50 flex items-center justify-between rounded-lg px-6 py-3 text-white shadow-lg transition-opacity duration-300`}
    >
      {message}
      <button onClick={onClose} className="ml-4 text-white hover:text-gray-200">
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
