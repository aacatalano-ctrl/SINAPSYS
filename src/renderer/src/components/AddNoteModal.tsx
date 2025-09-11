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
      console.error("Failed to save note:", error);
      // You might want to show a notification here
    }
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Añadir Nota a Orden: {order._id}</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="noteText" className="block text-gray-700 text-sm font-semibold mb-2">Nota:</label>
            <textarea
              id="noteText"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              required
            ></textarea>
          </div>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200"
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