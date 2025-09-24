import React, { useState } from 'react';
import { Order } from '../../types';

interface AddNoteModalProps {
  order: Order;
  onClose: () => void;
  onSaveNote: (noteText: string) => Promise<void>;
}

const AddNoteModal: React.FC<AddNoteModalProps> = ({ order, onClose, onSaveNote }) => {
  const [noteText, setNoteText] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!noteText.trim()) {
      // You might want to show a notification here
      return;
    }
    try {
      await onSaveNote(noteText);
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);
      // You might want to show a notification here
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Añadir Nota a Orden: {order._id}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="noteText" className="mb-2 block text-sm font-semibold text-gray-700">
              Nota:
            </label>
            <textarea
              id="noteText"
              className="h-32 w-full resize-none appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-300 px-6 py-2 font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
            >
              Guardar Nota
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddNoteModal;
