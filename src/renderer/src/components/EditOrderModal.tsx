import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order, Doctor, JobCategory } from '../../types';
import DoctorCombobox from './DoctorCombobox';

interface EditOrderModalProps {
    order: Order;
    doctors: Doctor[];
    jobCategories: JobCategory[];
    jobTypeCosts: { [key: string]: number };
    onClose: () => void;
    onUpdateOrder: (id: string, updatedFields: Partial<Order>) => Promise<void>;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({ order, doctors, jobCategories, jobTypeCosts, onClose, onUpdateOrder }) => {
  const { showNotification } = useOrders();

  // State for form fields
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patientName, setPatientName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedJobType, setSelectedJobType] = useState('');
  const [cost, setCost] = useState(0);
  const [priority, setPriority] = useState<'Baja' | 'Normal' | 'Alta' | 'Urgente'>('Normal');
  const [caseDescription, setCaseDescription] = useState('');

  // Effect to initialize form state when the order prop is available
  useEffect(() => {
    if (order) {
      const doctor = doctors.find(d => d._id === order.doctorId) || null;
      setSelectedDoctor(doctor);
      setPatientName(order.patientName);
      setCost(order.cost);
      setPriority(order.priority);
      setCaseDescription(order.caseDescription);

      // Initialize category and job type
      const [category] = order.jobType.split(' - ');
      if (category && jobCategories.some(c => c.category === category)) {
        setSelectedCategory(category);
        setSelectedJobType(order.jobType);
      }
    }
  }, [order, doctors, jobCategories]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDoctor) {
      showNotification('Por favor, selecciona un doctor.', 'error');
      return;
    }

    const updatedOrderData: Partial<Omit<Order, '_id'>> = {
      doctorId: selectedDoctor._id,
      patientName,
      jobType: selectedJobType,
      cost,
      priority,
      caseDescription,
    };

    try {
      await onUpdateOrder(order._id, updatedOrderData);
      showNotification('Orden actualizada con éxito', 'success');
    } catch (error) {
      console.error("Failed to update order:", error);
      // Notification is already shown in the context
    } finally {
      onClose();
    }
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
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="jobCategory" className="mb-2 block text-sm font-semibold text-gray-700">Categoría de Trabajo:</label>
            <select
              id="jobCategory"
              name="jobCategory"
              className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setSelectedJobType('');
                setCost(0);
              }}
              required
            >
              <option value="">Selecciona una categoría</option>
              {jobCategories.map(cat => (
                <option key={cat.category} value={cat.category}>
                  {cat.category}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="jobType" className="mb-2 block text-sm font-semibold text-gray-700">Tipo de Trabajo:</label>
            <select
              id="jobType"
              name="jobType"
              className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!selectedCategory}
              value={selectedJobType}
              onChange={(e) => {
                const newJobType = e.target.value;
                setSelectedJobType(newJobType);
                setCost(jobTypeCosts[newJobType] !== undefined ? jobTypeCosts[newJobType] : 0);
              }}
            >
              <option value="">Selecciona tipo de trabajo</option>
              {selectedCategory &&
                jobCategories.find(cat => cat.category === selectedCategory)?.services.map(service => {
                  const fullJobName = `${selectedCategory} - ${service.name}`;
                  return (
                    <option key={fullJobName} value={fullJobName}>
                      {service.name}
                    </option>
                  );
                })}
            </select>
          </div>

          <div className="mb-4">
            <label htmlFor="cost" className="mb-2 block text-sm font-semibold text-gray-700">Costo ($):</label>
            <input
              type="number"
              id="cost"
              name="cost"
              value={cost}
              onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
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
              value={priority}
              onChange={(e) => setPriority(e.target.value as 'Baja' | 'Normal' | 'Alta' | 'Urgente')}
              className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Baja">Baja</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="caseDescription" className="mb-2 block text-sm font-semibold text-gray-700">Descripción del Caso:</label>
            <textarea
              id="caseDescription"
              name="caseDescription"
              rows="4"
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
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