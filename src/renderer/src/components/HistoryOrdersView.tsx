import React from 'react';
import { Order } from '../../types';
import { ArrowUp, ArrowDown, MessageSquare, DollarSign, Trash2 } from 'lucide-react';
import { getJobTypeCategory } from '../utils/helpers';

interface HistoryOrdersViewProps {
  orders: Order[];
  searchHistoryTerm: string;
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
  orders,
  searchHistoryTerm,
  setFullClientView,
  getDoctorFullNameById,
  formatDate,
  sortOrdersColumn,
  sortOrdersDirection,
  handleSortOrders,
  calculateBalance,
  handleDeleteOrder,
}) => {
  const completedOrders = orders; // Orders are already filtered in MainAppWrapper
  const unpaidCompletedOrders = completedOrders.filter(
    (order: Order) => calculateBalance(order) > 0,
  );
  const paidCompletedOrders = completedOrders.filter(
    (order: Order) => calculateBalance(order) <= 0,
  );

  const filteredPaidOrders = paidCompletedOrders.filter((order: Order) => {
    if (!order) return false;
    const searchTerm = searchHistoryTerm.toLowerCase();
    const doctorFullName = getDoctorFullNameById(order.doctorId)?.toLowerCase() || '';
    const patientName = order.patientName?.toLowerCase() || '';
    const jobItemsDescription = order.jobItems
      .map((item) => item.jobType)
      .join(' ')
      .toLowerCase();
    const orderId = order.orderNumber?.toLowerCase() || '';

    return (
      doctorFullName.includes(searchTerm) ||
      patientName.includes(searchTerm) ||
      jobItemsDescription.includes(searchTerm) ||
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
    if (sortOrdersColumn === 'jobType') {
      aValue = a.jobItems[0]?.jobType ? getJobTypeCategory(a.jobItems[0].jobType) : '';
      bValue = b.jobItems[0]?.jobType ? getJobTypeCategory(b.jobItems[0].jobType) : '';
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrdersDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrdersDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Historial de Órdenes Completadas</h2>

      {unpaidCompletedOrders.length > 0 && (
        <div className="mb-8 rounded-lg border border-red-200 bg-red-50 p-6 shadow-md">
          <h3 className="mb-4 flex items-center text-2xl font-bold text-red-800">
            <DollarSign className="mr-2" /> Órdenes Completadas con Saldo Pendiente
          </h3>
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="border-b border-red-200 bg-red-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-red-700">
                    Orden ID
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-red-700">
                    Paciente
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-red-700">
                    Doctor
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-red-700">
                    Saldo Pendiente
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-red-700">
                    Fecha Finalización
                  </th>
                </tr>
              </thead>
              <tbody>
                {unpaidCompletedOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="cursor-pointer border-b border-red-100 hover:bg-red-50"
                    onClick={() => setFullClientView(order)}
                  >
                    <td className="px-4 py-2 text-sm font-medium text-gray-800">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">{order.patientName}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {getDoctorFullNameById(order.doctorId)}
                    </td>
                    <td className="px-4 py-2 text-sm font-bold text-red-600">
                      ${calculateBalance(order).toFixed(2)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-800">
                      {order.completionDate ? formatDate(order.completionDate) : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mb-6 flex items-center space-x-4">{/* Search bar remains here */}</div>

      <div className="mb-8">
        <h3 className="mb-4 text-2xl font-bold text-gray-800">Órdenes Completadas y Pagadas</h3>
        {sortedPaidOrders.length === 0 ? (
          <p className="py-10 text-center text-gray-600">
            No hay órdenes completadas y pagadas que coincidan con la búsqueda.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="border-b border-gray-300 bg-gray-200">
                <tr>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                    onClick={() => handleSortOrders('id')}
                  >
                    Orden ID{' '}
                    {sortOrdersColumn === 'id' &&
                      (sortOrdersDirection === 'asc' ? (
                        <ArrowUp size={16} className="ml-1 inline" />
                      ) : (
                        <ArrowDown size={16} className="ml-1 inline" />
                      ))}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                    onClick={() => handleSortOrders('patientName')}
                  >
                    Paciente{' '}
                    {sortOrdersColumn === 'patientName' &&
                      (sortOrdersDirection === 'asc' ? (
                        <ArrowUp size={16} className="ml-1 inline" />
                      ) : (
                        <ArrowDown size={16} className="ml-1 inline" />
                      ))}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                    onClick={() => handleSortOrders('doctorId')}
                  >
                    Doctor{' '}
                    {sortOrdersColumn === 'doctorId' &&
                      (sortOrdersDirection === 'asc' ? (
                        <ArrowUp size={16} className="ml-1 inline" />
                      ) : (
                        <ArrowDown size={16} className="ml-1 inline" />
                      ))}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                    onClick={() => handleSortOrders('jobType')}
                  >
                    Tipo(s) de Trabajo{' '}
                    {sortOrdersColumn === 'jobType' &&
                      (sortOrdersDirection === 'asc' ? (
                        <ArrowUp size={16} className="ml-1 inline" />
                      ) : (
                        <ArrowDown size={16} className="ml-1 inline" />
                      ))}
                  </th>
                  <th
                    className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                    onClick={() => handleSortOrders('completionDate')}
                  >
                    Fecha Finalización{' '}
                    {sortOrdersColumn === 'completionDate' &&
                      (sortOrdersDirection === 'asc' ? (
                        <ArrowUp size={16} className="ml-1 inline" />
                      ) : (
                        <ArrowDown size={16} className="ml-1 inline" />
                      ))}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedPaidOrders.map((order) => (
                  <tr
                    key={order._id}
                    className="cursor-pointer border-b border-gray-200 hover:bg-gray-50"
                    onClick={() => setFullClientView(order)}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {order.orderNumber}
                      {order.notes.length > 0 && (
                        <MessageSquare
                          size={16}
                          className="ml-2 inline text-blue-500"
                          title="Esta orden tiene notas"
                        />
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">{order.patientName}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {getDoctorFullNameById(order.doctorId)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {order.jobItems.length > 0
                        ? `${order.jobItems[0].jobType}${
                            order.jobItems.length > 1
                              ? ` (+${order.jobItems.length - 1} más)`
                              : ''
                          }`
                        : 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      {formatDate(order.completionDate || '')}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-800">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteOrder(order._id);
                        }}
                        className="text-red-600 hover:text-red-800"
                        title="Eliminar Orden"
                      >
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
