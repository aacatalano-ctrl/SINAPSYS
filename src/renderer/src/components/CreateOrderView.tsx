import React, { useState, useRef, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Plus } from 'lucide-react';
import DoctorCombobox from './DoctorCombobox';
import { Doctor, Order, JobCategory } from '../../types';

interface CreateOrderViewProps {
    doctors: Doctor[];
    jobCategories: JobCategory[];
    jobTypeCosts: { [key: string]: number };
    onAddDoctor: () => Promise<string | null>;
}

function CreateOrderView({ doctors, jobCategories, jobTypeCosts, onAddDoctor }: CreateOrderViewProps) {
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
      setSelectedDoctor(null); // <-- AÑADIR ESTA LÍNEA
      showNotification(`Orden ${addedOrder.orderNumber} creada con éxito.`);
    } catch (error: Error) {
      console.error("Error creating order:", error);
      showNotification('Error al crear orden.', 'error');
    }
  };

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Crear Nueva Orden Dental</h2>
      <form onSubmit={handleCreateOrder} className="grid grid-cols-1 gap-6 md:grid-cols-2" ref={formRef} noValidate>
        <div>
          <label htmlFor="doctor" className="mb-2 block text-sm font-semibold text-gray-700">Doctor:</label>
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
            className="mt-2 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            <Plus className="mr-1 size-4" /> Añadir Nuevo Doctor
          </button>
        </div>

        <div>
          <label htmlFor="patientName" className="mb-2 block text-sm font-semibold text-gray-700">Nombre del Paciente:</label>
          <input
            type="text"
            id="patientName"
            name="patientName"
            className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label htmlFor="jobCategory" className="mb-2 block text-sm font-semibold text-gray-700">Categoría de Trabajo:</label>
          <select
            id="jobCategory"
            name="jobCategory"
            className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="jobType" className="mb-2 block text-sm font-semibold text-gray-700">Tipo de Trabajo:</label>
          <select
            id="jobType"
            name="jobType"
            className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <label htmlFor="cost" className="mb-2 block text-sm font-semibold text-gray-700">Costo ($):</label>
          <input
            type="number"
            id="cost"
            name="cost"
            className="w-full max-w-[120px] appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            step="0.01"
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
          <label htmlFor="priority" className="mb-2 block text-sm font-semibold text-gray-700">Prioridad:</label>
          <select
            id="priority"
            name="priority"
            className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="Normal"
          >
            <option value="Baja">Baja</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Urgente">Urgente</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label htmlFor="caseDescription" className="mb-2 block text-sm font-semibold text-gray-700">Descripción del Caso:</label>
          <textarea
            id="caseDescription"
            name="caseDescription"
            rows="4"
            className="w-full resize-y appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detalles sobre el caso dental, como material, color, etc."
            required
          ></textarea>
        </div>

        <div className="mt-4 flex justify-end md:col-span-2">
          <button
            type="submit"
            className="flex items-center rounded-lg bg-green-600 px-8 py-3 font-bold text-white shadow-lg transition-colors duration-200 hover:bg-green-700"
          >
            <Plus className="mr-2" /> Registrar Orden
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateOrderView;