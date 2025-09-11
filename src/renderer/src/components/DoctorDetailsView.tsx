import React from 'react';
import { useOrders } from '../context/OrderContext';
import { ArrowLeft, User, Briefcase, DollarSign, ClipboardList } from 'lucide-react';
import { Doctor, Order, Payment } from '../../types'; // Import Doctor, Order, Payment types

interface DoctorDetailsViewProps {
             doctor: Doctor;
             onBack: () => void;
           }

           const DoctorDetailsView: React.FC<DoctorDetailsViewProps> = ({ doctor, onBack }) => {
  const { orders, calculateBalance } = useOrders(); // Use useOrders hook directly
  if (!doctor) return null;

  const doctorOrders = orders.filter(order => order.doctorId === doctor.id);
  const activeDoctorOrders = doctorOrders.filter(order => order.status !== 'Completado');

  const totalCostActive = activeDoctorOrders.reduce((sum: number, order: Order) => sum + order.cost, 0);
  const totalPaidActive = activeDoctorOrders.reduce((sum: number, order: Order) => sum + order.payments.reduce((pSum: number, p: Payment) => pSum + p.amount, 0), 0);
  const totalBalanceActive = totalCostActive - totalPaidActive;

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
      >
        <ArrowLeft className="mr-2" /> Volver a Gestión de Doctores
      </button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <User className="mr-3 text-blue-600" size={30} /> Ficha del Doctor: {doctor.title} {doctor.name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Briefcase className="mr-2" /> Información de Contacto</h3>
          <p className="mb-2"><span className="font-medium text-gray-700">Email:</span> {doctor.email || 'N/A'}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Teléfono:</span> {doctor.phone || 'N/A'}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Dirección:</span> {doctor.address || 'N/A'}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><DollarSign className="mr-2" /> Resumen Financiero de Órdenes Activas</h3>
          <p className="mb-2 text-lg"><span className="font-medium text-gray-700">Costo Total Órdenes Activas:</span> <span className="font-bold text-blue-600">${totalCostActive.toFixed(2)}</span></p>
          <p className="mb-2 text-lg"><span className="font-medium text-gray-700">Monto Abonado Órdenes Activas:</span> <span className="font-bold text-green-600">${totalPaidActive.toFixed(2)}</span></p>
          <p className="mb-2 text-lg"><span className="font-medium text-gray-700">Saldo Pendiente Órdenes Activas:</span> <span className={`font-bold ${totalBalanceActive > 0 ? 'text-red-600' : 'text-green-600'}`}>${totalBalanceActive.toFixed(2)}</span>
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><ClipboardList className="mr-2" /> Casos Activos ({activeDoctorOrders.length})</h3>
        {activeDoctorOrders.length === 0 ? (
          <p className="text-gray-600">No hay casos activos para este doctor.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200 border-b border-gray-300">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Orden ID</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Paciente</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Tipo de Trabajo</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Costo</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Saldo Pendiente</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {activeDoctorOrders.map(order => (
                  <tr key={order._id} className="border-b border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => { /* setFullClientView(order) */ }}>
                    <td className="py-2 px-4 text-sm text-gray-800 font-medium">{order._id}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">{order.patientName}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">{order.jobType}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">${order.cost.toFixed(2)}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">
                      <span className={`font-semibold ${calculateBalance(order) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${calculateBalance(order).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-800">
                      <span className={`p-1 rounded-lg text-white text-xs font-semibold ${
                        order.status === 'Pendiente' ? 'bg-yellow-500' :
                        order.status === 'Procesando' ? 'bg-blue-500' :
                        'bg-gray-500'
                      }`}>{order.status}</span>
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

export default DoctorDetailsView;