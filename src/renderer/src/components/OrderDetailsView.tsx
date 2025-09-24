import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { ArrowLeft, ClipboardList, User, Calendar, DollarSign, MessageSquare, Plus, Edit } from 'lucide-react';
import { Order, User as UserType } from '../../types';
import ConfirmCompletionModal from './ConfirmCompletionModal';

interface OrderDetailsViewProps {
    order: Order;
    onBack: () => void;
    onEditOrder: (order: Order) => void;
    getDoctorFullNameById: (id: string) => string;
    formatDate: (dateString: string) => string;
    formatDateTime: (dateString: string) => string;
    currentUser: UserType | null;
    onAddNote: () => void;
    generatePaymentHistoryPDF: (order: Order, currentUser: UserType) => void;
}

const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ order, onBack, onEditOrder, getDoctorFullNameById, formatDate, formatDateTime, currentUser, onAddNote, generatePaymentHistoryPDF }) => {
  const [isAbonando, setIsAbonando] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentOrderForModal, setCurrentOrderForModal] = useState<Order | null>(null);
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
    <div className="rounded-lg bg-white p-8 shadow-xl">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center font-semibold text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="mr-2" /> Volver a la Lista
        </button>
        <button
          onClick={() => onEditOrder(order)}
          className="flex items-center rounded-lg bg-green-600 px-4 py-2 font-bold text-white shadow-lg transition-colors duration-200 hover:bg-green-700"
        >
          <Edit className="mr-2" size={20} /> Editar Orden
        </button>
      </div>
      <h2 className="mb-6 flex items-center text-3xl font-bold text-gray-800">
        <ClipboardList className="mr-3 text-blue-600" size={30} /> Detalles de la Orden: {order.orderNumber}
      </h2>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-gray-50 p-6 shadow-inner">
          <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-700"><User className="mr-2" /> Información del Paciente y Doctor</h3>
          <p className="mb-2"><span className="font-medium text-gray-700">Paciente:</span> {order.patientName}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Doctor:</span> {getDoctorFullNameById(order.doctorId)}</p>
        </div>

        <div className="rounded-lg bg-gray-50 p-6 shadow-inner">
          <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-700"><ClipboardList className="mr-2" /> Detalles del Trabajo</h3>
          <p className="mb-2"><span className="font-medium text-gray-700">Tipo de Trabajo:</span> {order.jobType}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Descripción del Caso:</span> {order.caseDescription || 'N/A'}</p>
          <p className="mb-2"><span className="font-medium text-gray-700">Prioridad:</span> <span className={`font-bold ${
            order.priority === 'Urgente' ? 'text-red-600' :
              order.priority === 'Alta' ? 'text-orange-500' :
                'text-green-600'
            }`}>{order.priority}</span></p>
        </div>

        <div className="rounded-lg bg-gray-50 p-6 shadow-inner">
          <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-700"><Calendar className="mr-2" /> Fechas y Estado</h3>
          <p className="mb-2"><span className="font-medium text-gray-700">Fecha de Creación:</span> {formatDateTime(order.creationDate)}</p>
          {order.completionDate && <p className="mb-2"><span className="font-medium text-gray-700">Fecha de Finalización:</span> {formatDateTime(order.completionDate)}</p>}
          <div className="mb-2 flex items-center">
            <span className="mr-2 font-medium text-gray-700">Estado:</span>
            <select
              value={order.status}
              onChange={(e) => {
                const newStatus = e.target.value as 'Pendiente' | 'Procesando' | 'Completado';
                if (newStatus === 'Completado' && pendingBalance > 0) {
                  setCurrentOrderForModal(order);
                  setShowCompletionModal(true);
                } else {
                  handleUpdateOrderStatus(order._id, newStatus);
                }
              }}
              className={`rounded-lg p-2 font-semibold text-white ${
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

        <div className="rounded-lg bg-gray-50 p-6 shadow-inner">
          <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-700"><DollarSign className="mr-2" /> Información Financiera</h3>
          <p className="mb-2 text-lg"><span className="font-medium text-gray-700">Costo Total:</span> <span className="font-bold text-blue-600">${order.cost.toFixed(2)}</span></p>
          <p className="mb-4 text-lg"><span className="font-medium text-gray-700">Saldo Pendiente:</span> <span className={`font-bold ${pendingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>${pendingBalance.toFixed(2)}</span></p>
          
          {pendingBalance <= 0 ? (
            <div className="mt-4 font-bold text-green-600">
              <p>Pagado</p>
              <p className="text-sm">Fecha de pago: {getLastPaymentDate()}</p>
            </div>
          ) : (
            <>
              {!isAbonando && (
                <button
                  onClick={() => setIsAbonando(true)}
                  className="rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
                >
                  Abonar
                </button>
              )}

              {isAbonando && (
                <div className="mt-4">
                  <label className="mb-2 block text-sm font-semibold text-gray-700">Monto a Abonar:</label>
                  <div className="flex items-center space-x-2">
                    <input 
                      type="number"
                      value={abonoAmount}
                      onChange={(e) => setAbonoAmount(e.target.value)}
                      step="1"
                      max={pendingBalance.toFixed(2)}
                      className="w-full rounded-lg border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Máx: ${pendingBalance.toFixed(2)}`}
                      autoFocus
                    />
                    <button onClick={handleAbonoSubmit} className="rounded-lg bg-green-500 px-4 py-2 font-bold text-white shadow-md hover:bg-green-600">Guardar Abono</button>
                    <button onClick={() => setIsAbonando(false)} className="rounded-lg bg-gray-300 px-4 py-2 font-bold text-gray-800 hover:bg-gray-400">Cancelar</button>
                  </div>
                </div>
              )}
            </>
          )}

          <button
            onClick={() => generateReceiptPDF(order, currentUser)}
            disabled={pendingBalance > 0}
            className="mt-4 flex items-center rounded-lg bg-purple-600 px-4 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-purple-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            <ClipboardList className="mr-2" /> Generar Recibo
          </button>
        </div>
      </div>

      <div className="mb-8 rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center text-xl font-semibold text-gray-800"><DollarSign className="mr-2" /> Historial de Pagos</h3>
          <button
            onClick={() => generatePaymentHistoryPDF(order, currentUser)}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-green-700"
          >
            <ClipboardList className="mr-2" /> Generar PDF de Abonos
          </button>
        </div>
        {order.payments.length === 0 ? (
          <p className="text-gray-600">No hay pagos registrados para esta orden.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow">
            <table className="min-w-full bg-white">
              <thead className="border-b border-gray-300 bg-gray-200">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-gray-700">Fecha</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-gray-700">Monto</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold uppercase text-gray-700">Descripción</th>
                </tr>
              </thead>
              <tbody>
                {order.payments.map((payment, index) => (
                  <tr key={payment.id || index} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-800">{formatDate(payment.date)}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">${payment.amount.toFixed(2)}</td>
                    <td className="px-4 py-2 text-sm text-gray-800">{payment.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg bg-white p-6 shadow-xl">
        <h3 className="mb-4 flex items-center text-xl font-semibold text-gray-800"><MessageSquare className="mr-2" /> Notas Internas</h3>
        {order.notes.length === 0 ? (
          <p className="text-gray-600">No hay notas para esta orden.</p>
        ) : (
          <div className="mb-4 space-y-4">
            {order.notes.map((note) => (
              <div key={note.id || note.timestamp} className="rounded-lg border border-gray-200 bg-gray-100 p-4">
                <p className="text-gray-800">{note.text}</p>
                <p className="mt-2 text-right text-xs text-gray-500">
                  <span className="font-semibold">{note.author}</span> el {formatDateTime(note.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={onAddNote}
          className="mt-4 flex items-center rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
        >
          <Plus className="mr-2" /> Añadir Nota
        </button>
      </div>
      <ConfirmCompletionModal
        isOpen={showCompletionModal}
        order={currentOrderForModal}
        onClose={() => {
          setShowCompletionModal(false);
          setCurrentOrderForModal(null);
          // No need to fetchOrders here, as handleUpdateOrderStatus (called by confirmCompletion) already does it.
        }}
      />
    </div>
  );
};

export default OrderDetailsView;
