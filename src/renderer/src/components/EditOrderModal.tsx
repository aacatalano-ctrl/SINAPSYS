import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order, Doctor } from '../../types';
import DoctorCombobox from './DoctorCombobox';

interface OrderFormData {
  id: string;
  patientName: string;
  jobType: string;
  cost: number;
  priority: 'Baja' | 'Normal' | 'Alta' | 'Urgente';
  caseDescription: string;
  initialPaymentAmount: string; // Changed to string for input binding
}

interface EditOrderModalProps {
    order: Order;
    doctors: Doctor[];
    onClose: () => void;
    jobTypePrefixMap: { [key: string]: string };
    jobTypeCosts: { [key: string]: number };
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, doctors, onClose, jobTypePrefixMap, jobTypeCosts }) => {
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(
    () => doctors.find(d => d._id === order.doctorId) || null
  );
  const [formData, setFormData] = useState<OrderFormData>({
    id: order._id,
    patientName: order.patientName,
    jobType: order.jobType,
    cost: order.cost,
    priority: order.priority,
    caseDescription: order.caseDescription,
    initialPaymentAmount: String(order.payments && order.payments.length > 0 ? order.payments[0].amount : 0),
  });
  const { handleUpdateOrder: onSaveOrder, showNotification } = useOrders();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
        if (name === 'jobType') {
            return {
                ...prev,
                [name]: value,
                cost: jobTypeCosts[value as string] !== undefined ? jobTypeCosts[value as string] : 0
            };
        }
        if (name === 'cost' || name === 'initialPaymentAmount') {
          let newValue: string | number = value;
          if (typeof newValue === 'string') {
            if (newValue.length > 8) {
              newValue = newValue.slice(0, 8);
            }
            newValue = parseFloat(newValue);
            if (isNaN(newValue)) newValue = 0;
          }
          return { ...prev, [name]: newValue };
        }
        return { ...prev, [name]: value };
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDoctor) {
      showNotification('Por favor, selecciona un doctor.', 'error');
      return;
    }

    // Construct the payload manually to avoid sending extraneous fields.
    const updatedOrderData: Partial<Omit<Order, '_id'>> = {
      patientName: formData.patientName,
      jobType: formData.jobType,
      cost: formData.cost,
      priority: formData.priority,
      caseDescription: formData.caseDescription,
      doctorId: selectedDoctor._id,
    };

    // Handle payment update logic separately.
    const payments = order.payments ? [...order.payments] : [];
    const initialPaymentAmount = parseFloat(formData.initialPaymentAmount);

    if (!isNaN(initialPaymentAmount)) {
      if (payments.length > 0) {
        payments[0].amount = initialPaymentAmount;
      }
    }
    updatedOrderData.payments = payments;

    // onSaveOrder is handleUpdateOrder from the context, which is async.
    // We chain .then() to ensure the modal only closes on successful update.
    onSaveOrder(order._id, updatedOrderData)
      .then(() => {
        onClose();
      })
      .catch((error) => {
        // The context's handleUpdateOrder already shows a toast on error.
        console.error("Failed to update order:", error);
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-8 shadow-xl">
        <h3 className="mb-6 text-2xl font-bold text-gray-800">Editar Orden: {order.orderNumber}</h3>
        <form onSubmit={handleSubmit} noValidate>
          <div className="mb-4">
            <label htmlFor="doctor" className="mb-2 block text-sm font-semibold text-gray-700">Doctor:</label>
            <DoctorCombobox
              doctors={doctors}
              selectedDoctor={selectedDoctor}
              onSelectDoctor={setSelectedDoctor}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="patientName" className="mb-2 block text-sm font-semibold text-gray-700">Nombre del Paciente:</label>
            <input
              type="text"
              id="patientName"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="jobType" className="mb-2 block text-sm font-semibold text-gray-700">Tipo de Trabajo:</label>
            <select
              id="jobType"
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona tipo de trabajo</option>
              {Object.keys(jobTypePrefixMap).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="cost" className="mb-2 block text-sm font-semibold text-gray-700">Costo ($):</label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={String(formData.cost)} // Convert number to string for input value
              onChange={handleChange}
              className="w-full max-w-[120px] appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="10"
              min="0"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="priority" className="mb-2 block text-sm font-semibold text-gray-700">Prioridad:</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Baja">Baja</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="initialPaymentAmount" className="mb-2 block text-sm font-semibold text-gray-700">Abono Inicial:</label>
            <input
              type="number"
              id="initialPaymentAmount"
              name="initialPaymentAmount"
              value={String(formData.initialPaymentAmount)} // Convert number to string for input value
              onChange={handleChange}
              className="w-full max-w-[120px] appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              step="10"
              min="0"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="caseDescription" className="mb-2 block text-sm font-semibold text-gray-700">Descripción del Caso:</label>
            <textarea
              id="caseDescription"
              name="caseDescription"
              rows="4"
              value={formData.caseDescription}
              onChange={handleChange}
              className="w-full resize-y appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalles sobre el caso dental, como material, color, etc."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="rounded-lg bg-gray-300 px-6 py-2 font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400">Cancelar</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrderModal;