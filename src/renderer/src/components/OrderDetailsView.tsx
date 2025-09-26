import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { ArrowLeft, ClipboardList, User, Calendar, DollarSign, MessageSquare, Plus, Edit, Trash2, Save } from 'lucide-react';
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
    onConfirmPayment: (order: Order) => void;
}

const OrderDetailsView: React.FC<OrderDetailsViewProps> = ({ order, onBack, onEditOrder, getDoctorFullNameById, formatDate, formatDateTime, currentUser, onAddNote, generatePaymentHistoryPDF, onConfirmPayment }) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [currentOrderForModal, setCurrentOrderForModal] = useState<Order | null>(null);
  const { calculateBalance, handleUpdateOrderStatus, addPaymentToOrder, generateReceiptPDF, showNotification, handleUpdateNote, handleDeleteNote, handleDeleteOrder } = useOrders();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  if (!order) return null;

  const handleDeleteClick = () => {
    handleDeleteOrder(order._id).then(() => {
      onBack(); // Navigate back after successful deletion
    });
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => onEditOrder(order)}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 font-bold text-white shadow-lg transition-colors duration-200 hover:bg-green-700"
          >
            <Edit className="mr-2" size={20} /> Editar Orden
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex items-center rounded-lg bg-red-600 px-4 py-2 font-bold text-white shadow-lg transition-colors duration-200 hover:bg-red-700"
          >
            <Trash2 className="mr-2" size={20} /> Eliminar Orden
          </button>
        </div>
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
            <button
              onClick={() => onConfirmPayment(order)} // Use the new prop to open the modal
              className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
            >
              Abonar
            </button>
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
            disabled={order.payments.length === 0}
            className="flex items-center rounded-lg bg-indigo-600 px-4 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-400"
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
              <div key={note._id} className="rounded-lg border border-gray-200 bg-gray-100 p-4">
                {editingNoteId === note._id ? (
                  <>
                    <textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className="w-full resize-y appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="mt-2 flex items-center justify-end space-x-2">
                      <button
                        onClick={() => {
                          handleUpdateNote(order._id, editingNoteId, editingNoteText);
                          setEditingNoteId(null);
                          setEditingNoteText('');
                        }}
                        className="flex items-center rounded-lg bg-green-600 px-3 py-1 text-sm font-bold text-white shadow-md transition-colors duration-200 hover:bg-green-700"
                      >
                        <Save size={16} className="mr-1" /> Guardar
                      </button>
                      <button
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteText('');
                        }}
                        className="rounded-lg bg-gray-300 px-3 py-1 text-sm font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400"
                      >
                        Cancelar
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-800">{note.text}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <p className="text-xs text-gray-500">
                        <span className="font-semibold">{note.author}</span> el {formatDateTime(note.timestamp)}
                      </p>
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => {
                            setEditingNoteId(note._id);
                            setEditingNoteText(note.text);
                          }}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar Nota"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(order._id, note._id)}
                          className="text-red-600 hover:text-red-800"
                          title="Eliminar Nota"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </>
                )}
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
