import React, { useState } from 'react';
import { X, Trash2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;

interface DeleteReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  loadData: () => Promise<void>; // Assuming loadData is an async function
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void; // Assuming showNotification has an optional type
}

const DeleteReportModal: React.FC<DeleteReportModalProps> = ({ isOpen, onClose, loadData, showNotification }) => {
  const [deleteType, setDeleteType] = useState<'week' | 'month'>('week'); // 'week' or 'month'
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  if (!isOpen) return null;

  const handleDelete = async () => {
    let startDate: Date, endDate: Date;

    if (deleteType === 'week') {
      const date = new Date(selectedDate);
      const dayOfWeek = date.getDay();
      startDate = new Date(date);
      startDate.setDate(date.getDate() - dayOfWeek);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
    } else { // month
      startDate = new Date(selectedYear, selectedMonth - 1, 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(selectedYear, selectedMonth, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    if (window.confirm(`¿Estás seguro de que quieres borrar los reportes para el período seleccionado? Esta acción es irreversible.`)) {
      try {
        const response = await fetch(`${API_URL}/orders/by-date`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          })
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al eliminar órdenes por fecha.');
        }
        const result = await response.json();
        const numDeleted: number = result.deletedCount;
        showNotification(`${numDeleted} registros de órdenes eliminados con éxito.`, 'success');
        await loadData();
        onClose();
      } catch (error: Error) {
        console.error("Error deleting reports:", error);
        showNotification(`Error al eliminar los reportes: ${error.message || 'Unknown error'}`, 'error');
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Borrar Reportes</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={28} />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setDeleteType('week')}
              className={`flex-1 py-3 text-center font-semibold ${deleteType === 'week' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Por Semana
            </button>
            <button
              onClick={() => setDeleteType('month')}
              className={`flex-1 py-3 text-center font-semibold ${deleteType === 'month' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
            >
              Por Mes
            </button>
          </div>
        </div>

        {deleteType === 'week' && (
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">Selecciona una fecha en la semana que deseas borrar:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {deleteType === 'month' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Mes:</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('es-ES', { month: 'long' })}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-semibold mb-2">Año:</label>
              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-end">
          <button
            onClick={handleDelete}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg shadow-lg transition-colors duration-200 flex items-center"
          >
            <Trash2 className="mr-2" /> Borrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteReportModal;
