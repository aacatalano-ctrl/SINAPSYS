import React, { useMemo } from 'react';
import { Order } from '../../types';
import { ArrowLeft } from 'lucide-react';

interface ReportResultsViewProps {
  title: string;
  orders: Order[];
  onBack: () => void;
  getDoctorFullNameById: (id: string) => string;
  formatDate: (dateString: string) => string;
  calculateBalance: (order: Order) => number;
}

const ReportResultsView: React.FC<ReportResultsViewProps> = ({
  title,
  orders,
  onBack,
  getDoctorFullNameById,
  formatDate,
  calculateBalance,
}) => {
  const filteredOrders = useMemo(() => {
    switch (title) {
      case 'TOTAL_ORDERS':
        return orders;
      case 'PENDING_BALANCE':
        return orders.filter((o) => calculateBalance(o) > 0);
      default:
        return orders;
    }
  }, [orders, title, calculateBalance]);

  const reportTitle = useMemo(() => {
    switch (title) {
      case 'TOTAL_ORDERS':
        return 'Total de Órdenes';
      case 'PENDING_BALANCE':
        return 'Órdenes con Saldo Pendiente';
      default:
        return title;
    }
  }, [title]);

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center font-semibold text-blue-600 hover:text-blue-800"
      >
        <ArrowLeft className="mr-2" /> Volver a Reportes
      </button>
      <h2 className="mb-6 text-3xl font-bold text-gray-800">{reportTitle}</h2>

      {filteredOrders.length === 0 ? (
        <p className="py-10 text-center text-gray-600">
          No hay órdenes que coincidan con este reporte.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead className="border-b border-gray-300 bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  ID Orden
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Paciente
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Doctor
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Costo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Saldo Pendiente
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">
                  Fecha Creación
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {order.orderNumber}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{order.patientName}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {getDoctorFullNameById(order.doctorId)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">${order.cost.toFixed(2)}</td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <span
                      className={`font-semibold ${calculateBalance(order) > 0 ? 'text-red-600' : 'text-green-600'}`}
                    >
                      ${calculateBalance(order).toFixed(2)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <span
                      className={`rounded-lg p-1 text-xs font-semibold text-white ${
                        order.status === 'Pendiente'
                          ? 'bg-yellow-500'
                          : order.status === 'Procesando'
                            ? 'bg-blue-500'
                            : order.status === 'Completado'
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {formatDate(order.creationDate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportResultsView;
