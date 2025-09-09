import React, { useState } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order, Doctor } from '../../types';

interface OrderFormData {
  id: string;
  doctorId: string;
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
  const [formData, setFormData] = useState<OrderFormData>({
    id: order.id,
    doctorId: order.doctorId,
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
    if (!formData.doctorId || !formData.patientName || !formData.jobType || isNaN(formData.cost)) {
      showNotification('Por favor, completa todos los campos obligatorios.', 'error');
      return;
    }

    const updatedOrderData: Partial<Order> = {
      ...formData,
      payments: order.payments ? [...order.payments] : [],
    };

    if (updatedOrderData.payments && updatedOrderData.payments.length > 0) {
      updatedOrderData.payments[0].amount = parseFloat(formData.initialPaymentAmount);
    }

    onSaveOrder(formData.id, updatedOrderData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Editar Orden: {order.id}</h3>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="doctor" className="block text-gray-700 text-sm font-semibold mb-2">Doctor:</label>
            <select
              id="doctor"
              name="doctorId"
              value={formData.doctorId}
              onChange={handleChange}
              className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled // Make doctor non-editable
            >
              <option value="">Selecciona un doctor</option>
              {doctors.map((doc: Doctor) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title} {doc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="patientName" className="block text-gray-700 text-sm font-semibold mb-2">Nombre del Paciente:</label>
            <input
              type="text"
              id="patientName"
              name="patientName"
              value={formData.patientName}
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="jobType" className="block text-gray-700 text-sm font-semibold mb-2">Tipo de Trabajo:</label>
            <select
              id="jobType"
              name="jobType"
              value={formData.jobType}
              onChange={handleChange}
              className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona tipo de trabajo</option>
              {Object.keys(jobTypePrefixMap).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="cost" className="block text-gray-700 text-sm font-semibold mb-2">Costo ($):</label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={String(formData.cost)} // Convert number to string for input value
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[120px]"
              step="10"
              min="0"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="priority" className="block text-gray-700 text-sm font-semibold mb-2">Prioridad:</label>
            <select
              id="priority"
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Baja">Baja</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="initialPaymentAmount" className="block text-gray-700 text-sm font-semibold mb-2">Abono Inicial:</label>
            <input
              type="number"
              id="initialPaymentAmount"
              name="initialPaymentAmount"
              value={String(formData.initialPaymentAmount)} // Convert number to string for input value
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[120px]"
              step="10"
              min="0"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="caseDescription" className="block text-gray-700 text-sm font-semibold mb-2">Descripción del Caso:</label>
            <textarea
              id="caseDescription"
              name="caseDescription"
              rows="4"
              value={formData.caseDescription}
              onChange={handleChange}
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder="Detalles sobre el caso dental, como material, color, etc."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors duration-200">Cancelar</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200">Guardar Cambios</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrderModal;