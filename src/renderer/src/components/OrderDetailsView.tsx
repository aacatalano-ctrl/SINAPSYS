import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { ArrowLeft, ClipboardList, User, Calendar, DollarSign, MessageSquare, Plus } from 'lucide-react';
import { Order, User as UserType } from '../../types';

interface OrderDetailsViewProps {
    order: Order;
    onBack: () => void;
    getDoctorFullNameById: (id: string) => string;
    formatDate: (dateString: string) => string;
    formatDateTime: (dateString: string) => string;
    currentUser: UserType | null;
    onAddNote: () => void;
}

const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ order, onBack, getDoctorFullNameById, formatDate, formatDateTime, currentUser, onAddNote }) => {
  const [isAbonando, setIsAbonando] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState('');
  const { calculateBalance, handleUpdateOrderStatus, addPaymentToOrder, generateReceiptPDF, showNotification } = useOrders();

  if (!order) return null;

  const handleAbonoSubmit = () => {
    const normalizedAmount = String(abonoAmount).replace(',', '.');
    const amount = parseFloat(normalizedAmount);

    if (isNaN(amount) || amount <= 0) {
      showNotification('Por favor, ingresa un monto válido y mayor a cero.', 'error');
      return;
    }

    const pendingBalance = calculateBalance(order);
    if (amount > pendingBalance) {
      showNotification(`El monto no puede ser mayor al saldo pendiente de ${pendingBalance.toFixed(2)}.`, 'error');
      return;
    }

    addPaymentToOrder(order._id, amount, 'Abono manual desde detalles');
    setAbonoAmount('');
    setIsAbonando(false);
  };

  const pendingBalance = calculateBalance(order);

  const getLastPaymentDate = () => {
    if (order.payments.length === 0) return null;
    const sortedPayments = [...order.payments].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return formatDate(sortedPayments[0].date);
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <button
        onClick={onBack}
        className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
      >
        <ArrowLeft className="mr-2" /> Volver a la Lista
      </button>
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
        <ClipboardList className="mr-3 text-blue-600" size={30} /> Detalles de la Orden: {order._id}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><User className="mr-2" /> Información del Paciente y Doctor</h3>
          <p className="mb-2"><span className="font-medium text-gray-700">Paciente:</span> {order.patientName}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Doctor:</span> {getDoctorFullNameById(order.doctorId)}</p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><ClipboardList className="mr-2" /> Detalles del Trabajo</h3>
          <p className="mb-2"><span className="font-medium text-gray-700">Tipo de Trabajo:</span> {order.jobType}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Descripción del Caso:</span> {order.caseDescription || 'N/A'}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Prioridad:</span> <span className={`font-bold ${
            order.priority === 'Urgente' ? 'text-red-600' :
              order.priority === 'Alta' ? 'text-orange-500' :
                'text-green-600'
            }`}>{order.priority}</span></p>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><Calendar className="mr-2" /> Fechas y Estado</h3>
          <p className="mb-2"><span className="font-medium text-gray-700">Fecha de Creación:</span> {formatDateTime(order.creationDate)}</p>
          {order.completionDate && <p className="mb-2"><span className="font-medium text-gray-700">Fecha de Finalización:</span> {formatDateTime(order.completionDate)}</p>}
          <div className="flex items-center mb-2">
            <span className="font-medium text-gray-700 mr-2">Estado:</span>
            <select
              value={order.status}
              onChange={(e) => handleUpdateOrderStatus(order._id, e.target.value as 'Pendiente' | 'Procesando' | 'Completado')}
              className={`p-2 rounded-lg text-white font-semibold ${
                order.status === 'Pendiente' ? 'bg-yellow-500' :
                order.status === 'Procesando' ? 'bg-blue-500' :
                order.status === 'Completado' ? 'bg-green-500' : 'bg-gray-500'
              }`}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Procesando">Procesando</option>
              <option value="Completado">Completado</option>
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg shadow-inner">
          <h3 className="text-xl font-semibold text-gray-700 mb-4 flex items-center"><DollarSign className="mr-2" /> Información Financiera</h3>
          <p className="mb-2 text-lg"><span className="font-medium text-gray-700">Costo Total:</span> <span className="font-bold text-blue-600">${order.cost.toFixed(2)}</span></p>
          <p className="mb-4 text-lg"><span className="font-medium text-gray-700">Saldo Pendiente:</span> <span className={`font-bold ${pendingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>${pendingBalance.toFixed(2)}</span></p>
          
          {pendingBalance <= 0 ? (
            <div className="mt-4 text-green-600 font-bold">
              <p>Pagado</p>
              <p className="text-sm">Fecha de pago: {getLastPaymentDate()}</p>
            </div>
          ) : (
            <>
              {!isAbonando && (
                <button
                  onClick={() => setIsAbonando(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200"
                >
                  Abonar
                </button>
              )}

              {isAbonando && (
                <div className="mt-4">
                  <label className="block text-gray-700 text-sm font-semibold mb-2">Monto a Abonar:</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      value={abonoAmount}
                      onChange={(e) => setAbonoAmount(e.target.value)}
                      step="10"
                      max={pendingBalance.toFixed(2)}
                      className="shadow border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Máx: ${pendingBalance.toFixed(2)}`}
                      autoFocus
                    />
                    <button onClick={handleAbonoSubmit} className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg shadow-md">Guardar Abono</button>
                    <button onClick={() => setIsAbonando(false)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => generateReceiptPDF(order, currentUser)}
            disabled={pendingBalance > 0}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <ClipboardList className="mr-2" /> Generar Recibo
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-xl mb-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><DollarSign className="mr-2" /> Historial de Pagos</h3>
        {order.payments.length === 0 ? (
          <p className="text-gray-600">No hay pagos registrados para esta orden.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-200 border-b border-gray-300">
                <tr>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Fecha</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Monto</th>
                  <th className="py-2 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {order.payments.map((payment, index) => (
                  <tr key={payment.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="py-2 px-4 text-sm text-gray-800">{formatDate(payment.date)}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">${payment.amount.toFixed(2)}</td>
                    <td className="py-2 px-4 text-sm text-gray-800">{payment.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-xl">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center"><MessageSquare className="mr-2" /> Notas Internas</h3>
        {order.notes.length === 0 ? (
          <p className="text-gray-600">No hay notas para esta orden.</p>
        ) : (
          <div className="space-y-4 mb-4">
            {order.notes.map((note) => (
              <div key={note.id || note.timestamp} className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-800">{note.text}</p>
                <p className="text-xs text-gray-500 mt-2 text-right">
                  <span className="font-semibold">{note.author}</span> el {formatDateTime(note.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onAddNote}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-colors duration-200 flex items-center"
        >
          <Plus className="mr-2" /> Añadir Nota
        </button>
      </div>
    </div>
  );
};

export default OrderDetailsView;
