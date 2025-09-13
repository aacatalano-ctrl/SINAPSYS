import React, { useState, useRef, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Plus } from 'lucide-react';
import DoctorCombobox from './DoctorCombobox';
import { jobCategories, jobTypeCosts, generateCaseCode } from '../utils/helpers';
import { Doctor, Order } from '../../types';

interface CreateOrderViewProps {
    doctors: Doctor[];
    onAddDoctor: () => Promise<string | null>;
}

function CreateOrderView({ doctors, onAddDoctor }: CreateOrderViewProps) {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cost, setCost] = useState<number>(0);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [newlyAddedDoctorId, setNewlyAddedDoctorId] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const { handleOrderCreated: onOrderCreated, showNotification } = useOrders();

  useEffect(() => {
    if (newlyAddedDoctorId) {
      const foundDoctor = doctors.find(doc => doc._id === newlyAddedDoctorId);
      if (foundDoctor) {
        setSelectedDoctor(foundDoctor);
        setNewlyAddedDoctorId(null); // Clear temporary state
      }
    }
  }, [doctors, newlyAddedDoctorId, setSelectedDoctor]);

  const handleCreateOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const doctorId = selectedDoctor?._id;
    const patientName = formData.get('patientName') as string;
    const jobType = selectedJobType;
    const priority = formData.get('priority') as string;
    const caseDescription = formData.get('caseDescription') as string;

    if (!selectedDoctor) {
      showNotification('Por favor, selecciona un Doctor.', 'error');
      return;
    }
    if (!patientName.trim()) {
      showNotification('Por favor, ingresa el Nombre del Paciente.', 'error');
      return;
    }
    if (!jobType) {
      showNotification('Por favor, selecciona un Tipo de Trabajo.', 'error');
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      showNotification('Por favor, ingresa un Costo válido (mayor que 0).', 'error');
      return;
    }
    if (!caseDescription.trim()) {
      showNotification('Por favor, ingresa la Descripción del Caso.', 'error');
      return;
    }

    const newOrder: Order = {
      doctorId,
      patientName,
      jobType,
      cost,
      status: 'Pendiente',
      creationDate: new Date().toISOString(),
      priority: priority as 'Baja' | 'Normal' | 'Alta' | 'Urgente',
      caseDescription,
      payments: [],
      notes: [],
    };

    try {
      const addedOrder = await onOrderCreated(newOrder);
      if (formRef.current) {
        formRef.current.reset();
      }
      setSelectedCategory('');
      setSelectedJobType(''); // <--- Add this
      setCost(0);
      showNotification(`Orden ${addedOrder.orderNumber} creada con éxito.`);
    } catch (error: Error) {
      console.error("Error creating order:", error);
      showNotification('Error al crear orden.', 'error');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl mb-8">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Crear Nueva Orden Dental</h2>
      <form onSubmit={handleCreateOrder} className="grid grid-cols-1 md:grid-cols-2 gap-6" ref={formRef}>
        <div>
          <label htmlFor="doctor" className="block text-gray-700 text-sm font-semibold mb-2">Doctor:</label>
          <DoctorCombobox
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            onSelectDoctor={setSelectedDoctor}
          />
          <input type="hidden" id="doctor" name="doctor" value={selectedDoctor?._id || ''} required />
          <button
            type="button"
            onClick={async () => {
              const newDoctorId = await onAddDoctor();
              if (newDoctorId) {
                const foundDoctor = doctors.find(doc => doc._id === newDoctorId);
                if (foundDoctor) {
                  setSelectedDoctor(foundDoctor);
                }
              }
            }}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-semibold flex items-center"
          >
            <Plus className="w-4 h-4 mr-1" /> Añadir Nuevo Doctor
          </button>
        </div>

        <div>
          <label htmlFor="patientName" className="block text-gray-700 text-sm font-semibold mb-2">Nombre del Paciente:</label>
          <input
            type="text"
            id="patientName"
            name="patientName"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="jobCategory" className="block text-gray-700 text-sm font-semibold mb-2">Categoría de Trabajo:</label>
          <select
            id="jobCategory"
            name="jobCategory"
            className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedCategory}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedCategory(e.target.value);
              setSelectedJobType(''); // Reset selectedJobType when category changes
              setCost(0);
            }}
            required
          >
            <option key="create-order-select-category" value="">Selecciona una categoría</option>
            {jobCategories.map(category => (
              <option key={category.category} value={category.category}>
                {category.category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="jobType" className="block text-gray-700 text-sm font-semibold mb-2">Tipo de Trabajo:</label>
          <select
            id="jobType"
            name="jobType"
            className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={!selectedCategory} // Disable until a category is selected
            value={selectedJobType} // <--- Add this
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setSelectedJobType(e.target.value);
              setCost(jobTypeCosts[e.target.value] !== undefined ? jobTypeCosts[e.target.value] : 0);
            }}
          >
            <option key="create-order-select-job-type" value="">Selecciona tipo de trabajo</option>
            {selectedCategory && jobCategories.find(cat => cat.category === selectedCategory)?.services.map(service => (
              <option key={`${selectedCategory} - ${service.name}`} value={`${selectedCategory} - ${service.name}`}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cost" className="block text-gray-700 text-sm font-semibold mb-2">Costo ($):</label>
          <input
            type="number"
            id="cost"
            name="cost"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 max-w-[120px]"
            step="10"
            min="0"
            value={cost}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              let value = parseFloat(e.target.value);
              if (isNaN(value)) value = 0;
              setCost(value);
            }}
          />
        </div>

        <div>
          <label htmlFor="priority" className="block text-gray-700 text-sm font-semibold mb-2">Prioridad:</label>
          <select
            id="priority"
            name="priority"
            className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="Normal"
          >
            <option value="Baja">Baja</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="caseDescription" className="block text-gray-700 text-sm font-semibold mb-2">Descripción del Caso:</label>
          <textarea
            id="caseDescription"
            name="caseDescription"
            rows="4"
            className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            placeholder="Detalles sobre el caso dental, como material, color, etc."
            required
          ></textarea>
        </div>

        <div className="md:col-span-2 flex justify-end mt-4">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-colors duration-200 flex items-center"
          >
            <Plus className="mr-2" /> Registrar Orden
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateOrderView;