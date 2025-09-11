// src/components/JobTypeDetailsView.jsx

import React from 'react';
import { Order } from '../../types';
import { ArrowLeft, ClipboardList } from 'lucide-react';

interface JobTypeDetailsViewProps {
  jobType: string | null;
  orders: Order[];
  onBack: () => void;
  getDoctorFullNameById: (id: string) => string;
  formatDate: (dateString: string) => string;
  onViewOrderDetails: (order: Order) => void; // Corrected prop name
  calculateBalance: (order: Order) => number;
}

const JobTypeDetailsView: React.FC<JobTypeDetailsViewProps> = ({ jobType, orders, onBack, getDoctorFullNameById, formatDate, onViewOrderDetails, calculateBalance }) => {
  const filteredOrdersByJobType = jobType ? orders.filter((order: Order) => order.jobType === jobType) : [];

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl mb-8">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
      >
        <ArrowLeft className="mr-2" /> Volver a Reportes
      </button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <ClipboardList className="mr-3 text-blue-600" size={30} /> Órdenes para Tipo de Trabajo: {jobType}
      </h2>

      {filteredOrdersByJobType.length === 0 ? (
        <p className="text-gray-600 text-center py-10">No hay órdenes para este tipo de trabajo.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-200 border-b border-gray-300">
              <tr>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Orden ID</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Paciente</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Doctor</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Costo</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Saldo Pendiente</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Estado</th>
                <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Fecha Creación</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrdersByJobType.map(order => (
                <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onViewOrderDetails(order)}>
                  <td className="py-3 px-4 text-sm text-gray-800 font-medium">{order._id}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{order.patientName}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">{getDoctorFullNameById(order.doctorId)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">${order.cost.toFixed(2)}</td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <span className={`font-semibold ${calculateBalance(order) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${calculateBalance(order).toFixed(2)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">
                    <span className={`p-1 rounded-lg text-white text-xs font-semibold ${
                      order.status === 'Pendiente' ? 'bg-yellow-500' :
                      order.status === 'Procesando' ? 'bg-blue-500' :
                      order.status === 'Completado' ? 'bg-green-500' : 'bg-gray-500'
                    }`}>{order.status}</span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-800">{formatDate(order.creationDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default JobTypeDetailsView;
