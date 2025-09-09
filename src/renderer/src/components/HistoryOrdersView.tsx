import React from 'react';
import { Order } from '../../types';
import { Search, ArrowUp, ArrowDown, MessageSquare, DollarSign, Trash2 } from 'lucide-react';
import { getJobTypeCategory } from '../utils/helpers';

interface HistoryOrdersViewProps {
  orders: Order[];
  searchHistoryTerm: string;
  setSearchHistoryTerm: React.Dispatch<React.SetStateAction<string>>;
  setFullClientView: (order: Order) => void;
  getDoctorFullNameById: (id: string) => string;
  formatDate: (dateString: string) => string;
  sortOrdersColumn: string;
  sortOrdersDirection: 'asc' | 'desc';
  handleSortOrders: (column: string) => void;
  calculateBalance: (order: Order) => number;
  handleDeleteOrder: (id: string) => void;
}

const HistoryOrdersView: React.FC<HistoryOrdersViewProps> = ({
  orders, searchHistoryTerm, setSearchHistoryTerm, setFullClientView, getDoctorFullNameById, formatDate, sortOrdersColumn, sortOrdersDirection, handleSortOrders, calculateBalance, handleDeleteOrder
}) => {
  const completedOrders = orders; // Orders are already filtered in MainAppWrapper
  const unpaidCompletedOrders = completedOrders.filter((order: Order) => calculateBalance(order) > 0);
  const paidCompletedOrders = completedOrders.filter((order: Order) => calculateBalance(order) <= 0);

  const filteredPaidOrders = paidCompletedOrders.filter((order: Order) => {
    if (!order) return false;
    const searchTerm = searchHistoryTerm.toLowerCase();
    const doctorFullName = getDoctorFullNameById(order.doctorId)?.toLowerCase() || '';
    const patientName = order.patientName?.toLowerCase() || '';
    const jobType = order.jobType?.toLowerCase() || '';
    const orderId = order.id?.toLowerCase() || '';

    return (
      doctorFullName.includes(searchTerm) ||
      patientName.includes(searchTerm) ||
      jobType.includes(searchTerm) ||
      orderId.includes(searchTerm)
    );
  });

  const sortedPaidOrders = [...filteredPaidOrders].sort((a: Order, b: Order) => {
    if (!sortOrdersColumn) return 0;

    let aValue = a[sortOrdersColumn as keyof Order];
    let bValue = b[sortOrdersColumn as keyof Order];

    if (sortOrdersColumn === 'doctorId') {
      aValue = getDoctorFullNameById(a.doctorId);
      bValue = getDoctorFullNameById(b.doctorId);
    }
    if (sortOrdersColumn === 'creationDate' || sortOrdersColumn === 'completionDate') {
        aValue = new Date(a.creationDate).getTime();
        bValue = new Date(b.creationDate).getTime();
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrdersDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrdersDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl mb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Historial de Órdenes Completadas</h2>

      {unpaidCompletedOrders.length > 0 && (
        <div className="mb-8 p-6 bg-red-50 rounded-lg shadow-md border border-red-200">
          <h3 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
            <DollarSign className="mr-2" /> Órdenes Completadas con Saldo Pendiente
          </h3>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="bg-red-100 border-b border-red-200">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-red-700 uppercase">Orden ID</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-red-700 uppercase">Paciente</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-red-700 uppercase">Doctor</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-red-700 uppercase">Saldo Pendiente</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-red-700 uppercase">Fecha Finalización</th>
                </tr>
              </thead>
              <tbody>
                {unpaidCompletedOrders.map(order => (
                  <tr key={order.id} className="border-b border-red-100 hover:bg-red-50 cursor-pointer" onClick={() => setFullClientView(order)}>
                    <td className="py-2 px-4 text-sm text-gray-800 font-medium">{order.id}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">{order.patientName}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">{getDoctorFullNameById(order.doctorId)}</td>
                    <td className="py-2 px-4 text-sm text-red-600 font-bold">${calculateBalance(order).toFixed(2)}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">{order.completionDate ? formatDate(order.completionDate) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center space-x-4">
        {/* Search bar remains here */}
      </div>

      <div className="mb-8">
        <h3 className="text-2xl font-bold text-gray-800 mb-4">Órdenes Completadas y Pagadas</h3>
        {sortedPaidOrders.length === 0 ? (
          <p className="text-gray-600 text-center py-10">No hay órdenes completadas y pagadas que coincidan con la búsqueda.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200 border-b border-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer" onClick={() => handleSortOrders('id')}>
                    Orden ID {sortOrdersColumn === 'id' && (sortOrdersDirection === 'asc' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />)}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer" onClick={() => handleSortOrders('patientName')}>
                    Paciente {sortOrdersColumn === 'patientName' && (sortOrdersDirection === 'asc' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />)}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer" onClick={() => handleSortOrders('doctorId')}>
                    Doctor {sortOrdersColumn === 'doctorId' && (sortOrdersDirection === 'asc' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />)}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer" onClick={() => handleSortOrders('jobType')}>
                    Tipo de Trabajo {sortOrdersColumn === 'jobType' && (sortOrdersDirection === 'asc' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />)}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer" onClick={() => handleSortOrders('completionDate')}>
                    Fecha Finalización {sortOrdersColumn === 'completionDate' && (sortOrdersDirection === 'asc' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />)}
                  </th>
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedPaidOrders.map(order => (
                  <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => setFullClientView(order)}>
                    <td className="py-3 px-4 text-sm text-gray-800 font-medium">
                      {order.id}
                      {order.notes.length > 0 && <MessageSquare size={16} className="inline ml-2 text-blue-500" title="Esta orden tiene notas" />}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-800">{order.patientName}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{getDoctorFullNameById(order.doctorId)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{getJobTypeCategory(order.jobType)}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">{formatDate(order.completionDate || '')}</td>
                    <td className="py-3 px-4 text-sm text-gray-800">
                      <button onClick={(e) => {e.stopPropagation(); handleDeleteOrder(order.id);}} className="text-red-600 hover:text-red-800" title="Eliminar Orden">
                        <Trash2 size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryOrdersView;