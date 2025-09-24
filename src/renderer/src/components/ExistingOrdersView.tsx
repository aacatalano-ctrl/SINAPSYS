import React, { useState } from 'react';

import {
  Edit,
  CheckCircle,
  DollarSign,
  MessageSquare,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import OrderSearchCombobox from './OrderSearchCombobox';
import { Order } from '../../types';
import { formatDate, getJobTypeCategory } from '../utils/helpers';

interface ExistingOrdersViewProps {
  orders: Order[];
  onViewDetails: (order: Order) => void;
  onEditOrder: (order: Order) => void;
  onConfirmCompletion: (order: Order) => void; // Changed from orderId to order
  onConfirmPayment: (order: Order) => void; // Changed from orderId to order
  onAddNote: (orderId: string) => void;
  getDoctorFullNameById: (id: string) => string;
  onDeleteOrder: (id: string) => void; // Add this
}

const ExistingOrdersView: React.FC<ExistingOrdersViewProps> = ({
  orders,
  onViewDetails,
  onEditOrder,
  onConfirmCompletion,
  onConfirmPayment,
  onAddNote,
  getDoctorFullNameById,
  onDeleteOrder,
}) => {
  const [selectedOrderFromSearch, setSelectedOrderFromSearch] = useState<Order | null>(null);
  const [sortColumn, setSortColumn] = useState<string>('creationDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const sortedOrders = [
    ...orders.filter((order) => {
      if (selectedOrderFromSearch) {
        return order._id === selectedOrderFromSearch._id;
      }
      // If no order is selected from combobox, apply existing filters
      // Note: searchTerm, filterStatus, filterDoctor, prefixFilter are no longer used directly for filtering
      // as the combobox handles the primary search. This section is kept for potential future complex filtering.
      return true; // All orders are passed to the combobox for filtering
    }),
  ].sort((a, b) => {
    let aValue: string | number;
    let bValue: string | number;

    switch (sortColumn) {
      case 'orderNumber':
        aValue = a.orderNumber;
        bValue = b.orderNumber;
        break;
      case 'patientName':
        aValue = a.patientName;
        bValue = b.patientName;
        break;
      case 'doctorId':
        aValue = getDoctorFullNameById(a.doctorId);
        bValue = getDoctorFullNameById(b.doctorId);
        break;
      case 'jobType':
        aValue = a.jobType;
        bValue = b.jobType;
        break;
      case 'cost':
        aValue = a.cost;
        bValue = b.cost;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'creationDate':
        aValue = new Date(a.creationDate).getTime();
        bValue = new Date(b.creationDate).getTime();
        break;
      default:
        return 0;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    } else if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    } else if (aValue instanceof Date && bValue instanceof Date) {
      return sortDirection === 'asc'
        ? aValue.getTime() - bValue.getTime()
        : bValue.getTime() - aValue.getTime();
    }
    return 0;
  });

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Órdenes Existentes</h2>

      <div className="mb-6">
        <OrderSearchCombobox
          orders={orders}
          onSelectOrder={setSelectedOrderFromSearch}
          getDoctorFullNameById={getDoctorFullNameById}
        />
      </div>

      <div className="overflow-x-auto rounded-lg shadow">
        <table className="min-w-full bg-white">
          <thead className="border-b border-gray-300 bg-gray-200">
            <tr>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                onClick={() => handleSort('orderNumber')}
              >
                ID Orden{' '}
                {sortColumn === 'orderNumber' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp size={16} className="ml-1 inline" />
                  ) : (
                    <ArrowDown size={16} className="ml-1 inline" />
                  ))}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                onClick={() => handleSort('patientName')}
              >
                Paciente{' '}
                {sortColumn === 'patientName' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp size={16} className="ml-1 inline" />
                  ) : (
                    <ArrowDown size={16} className="ml-1 inline" />
                  ))}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                onClick={() => handleSort('doctorId')}
              >
                Doctor{' '}
                {sortColumn === 'doctorId' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp size={16} className="ml-1 inline" />
                  ) : (
                    <ArrowDown size={16} className="ml-1 inline" />
                  ))}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                onClick={() => handleSort('jobType')}
              >
                Tipo Trabajo{' '}
                {sortColumn === 'jobType' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp size={16} className="ml-1 inline" />
                  ) : (
                    <ArrowDown size={16} className="ml-1 inline" />
                  ))}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                onClick={() => handleSort('cost')}
              >
                Costo{' '}
                {sortColumn === 'cost' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp size={16} className="ml-1 inline" />
                  ) : (
                    <ArrowDown size={16} className="ml-1 inline" />
                  ))}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                onClick={() => handleSort('status')}
              >
                Estado{' '}
                {sortColumn === 'status' &&
                  (sortDirection === 'asc' ? (
                    <ArrowUp size={16} className="ml-1 inline" />
                  ) : (
                    <ArrowDown size={16} className="ml-1 inline" />
                  ))}
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700"
                onClick={() => handleSort('creationDate')}
              >
                Fecha Creación{' '}
                {sortColumn === 'creationDate' &&
                  (sortDirection === 'asc' ? (
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
            {sortedOrders.map((order) => (
              <tr
                key={order._id}
                className="cursor-pointer border-b border-gray-200 hover:bg-gray-50"
                onClick={() => onViewDetails(order)}
              >
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{order.orderNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-800">{order.patientName}</td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {getDoctorFullNameById(order.doctorId)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {getJobTypeCategory(order.jobType)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">${order.cost.toFixed(2)}</td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  <span
                    className={`rounded-lg p-1 text-xs font-semibold text-white ${
                      order.status === 'Pendiente'
                        ? 'bg-yellow-500'
                        : order.status === 'Procesando'
                          ? 'bg-blue-500'
                          : 'bg-green-500'
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-800">
                  {formatDate(order.creationDate)}
                </td>
                <td className="flex items-center space-x-2 px-4 py-3 text-sm font-medium text-gray-800">
                  <button
                    onClick={() => onEditOrder(order)}
                    className="text-green-600 hover:text-green-800"
                    title="Editar Orden"
                  >
                    <Edit size={20} />
                  </button>
                  <button
                    onClick={() => onConfirmCompletion(order)}
                    className="text-purple-600 hover:text-purple-800"
                    title="Marcar como Completado"
                  >
                    <CheckCircle size={20} />
                  </button>
                  <button
                    onClick={() => onConfirmPayment(order)}
                    className="text-indigo-600 hover:text-indigo-800"
                    title="Registrar Pago"
                  >
                    <DollarSign size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAddNote(order._id);
                    }}
                    className="text-orange-600 hover:text-orange-800"
                    title="Añadir Nota"
                  >
                    <MessageSquare size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent row's onClick from firing
                      onDeleteOrder(order._id);
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
    </div>
  );
};

export default ExistingOrdersView;
