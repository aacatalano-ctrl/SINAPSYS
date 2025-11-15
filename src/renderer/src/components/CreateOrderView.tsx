import React, { useState, useRef, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Plus } from 'lucide-react';
import DoctorCombobox from './DoctorCombobox';
import { Doctor, Order, JobCategory, JobItem } from '../../types';

interface CreateOrderViewProps {
  doctors: Doctor[];
  jobCategories: JobCategory[];
  jobTypeCosts: { [key: string]: number };
  onAddDoctor: () => Promise<string | null>;
}

function CreateOrderView({
  doctors,
  jobCategories,
  jobTypeCosts,
  onAddDoctor,
}: CreateOrderViewProps) {
  const [jobItems, setJobItems] = useState<JobItem[]>([{ jobCategory: '', jobType: '', cost: 0, units: 1 }]);
  const [jobItemsErrors, setJobItemsErrors] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [newlyAddedDoctorId, setNewlyAddedDoctorId] = useState<string | null>(null);
  const [selectedJobType, setSelectedJobType] = useState<string>('');
  const formRef = useRef<HTMLFormElement>(null);
  const { handleOrderCreated: onOrderCreated, showNotification } = useOrders();

  const categoriesRequiringUnits = ['Flujo Digital', 'Prótesis Fija'];

  useEffect(() => {
    if (newlyAddedDoctorId) {
      const foundDoctor = doctors.find((doc) => doc._id === newlyAddedDoctorId);
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
    const priority = formData.get('priority') as string;
    const caseDescription = formData.get('caseDescription') as string;

    // Client-side validation for jobItems
    const errors: string[] = [];
    if (jobItems.length === 0) {
      errors.push('Debe añadir al menos un tipo de trabajo.');
    } else {
      jobItems.forEach((item, index) => {
        if (!item.jobCategory.trim()) {
          errors.push(`La categoría de trabajo para el ítem ${index + 1} es requerida.`);
        }
        if (!item.jobType.trim()) {
          errors.push(`El tipo de trabajo para el ítem ${index + 1} es requerido.`);
        }
        if (isNaN(item.cost) || item.cost <= 0) {
          errors.push(`El costo para el ítem ${index + 1} debe ser un número positivo.`);
        }
      });
    }

    if (!selectedDoctor) {
      errors.push('Por favor, selecciona un Doctor.');
    }
    if (!patientName.trim()) {
      errors.push('Por favor, ingresa el Nombre del Paciente.');
    }

    if (errors.length > 0) {
      errors.forEach((msg) => showNotification(msg, 'error'));
      setJobItemsErrors(errors);
      return;
    }
    setJobItemsErrors([]); // Clear previous errors

    const totalCost = jobItems.reduce((sum, item) => sum + item.cost * (item.units || 1), 0);

    const newOrder: Order = {
      doctorId,
      patientName,
      jobItems,
      cost: totalCost, // This will be overwritten by backend calculation, but good for type consistency
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
      setJobItems([{ jobCategory: '', jobType: '', cost: 0 }]); // Reset job items
      setSelectedDoctor(null);
      showNotification(`Orden ${addedOrder.orderNumber} creada con éxito.`);
    } catch (error: Error) {
      console.error('Error creating order:', error);
      showNotification('Error al crear orden.', 'error');
    }
  };

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Crear Nueva Orden Dental</h2>
      <form
        onSubmit={handleCreateOrder}
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
        ref={formRef}
      >
        <div>
          <label htmlFor="doctor" className="mb-2 block text-sm font-semibold text-gray-700">
            Doctor:
          </label>
          <DoctorCombobox
            doctors={doctors}
            selectedDoctor={selectedDoctor}
            onSelectDoctor={setSelectedDoctor}
          />
          <input
            type="hidden"
            id="doctor"
            name="doctor"
            value={selectedDoctor?._id || ''}
            required
          />
          <button
            type="button"
            onClick={async () => {
              const newDoctorId = await onAddDoctor();
              if (newDoctorId) {
                const foundDoctor = doctors.find((doc) => doc._id === newDoctorId);
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
          <label htmlFor="patientName" className="mb-2 block text-sm font-semibold text-gray-700">
            Nombre del Paciente:
          </label>
          <input
            type="text"
            id="patientName"
            name="patientName"
            className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="md:col-span-2">
          <h3 className="mb-4 text-lg font-bold text-gray-700">Detalles de los Trabajos (Máx. 5)</h3>
          {jobItems.map((item, index) => (
            <div key={index} className="mb-4 grid grid-cols-1 gap-4 rounded-md border p-4 md:grid-cols-4">
              <div>
                <label
                  htmlFor={`jobCategory-${index}`}
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Categoría de Trabajo:
                </label>
                <select
                  id={`jobCategory-${index}`}
                  name={`jobCategory-${index}`}
                  className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={item.jobCategory}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    const newJobItems = [...jobItems];
                    newJobItems[index].jobCategory = e.target.value;
                    newJobItems[index].jobType = ''; // Reset jobType when category changes
                    newJobItems[index].cost = 0; // Reset cost when category changes
                    newJobItems[index].units = 1; // Reset units when category changes
                    setJobItems(newJobItems);
                  }}
                  required
                >
                  <option value="">Selecciona una categoría</option>
                  {jobCategories.map((category) => (
                    <option key={category.category} value={category.category}>
                      {category.category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`jobType-${index}`}
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Tipo de Trabajo:
                </label>
                <select
                  id={`jobType-${index}`}
                  name={`jobType-${index}`}
                  className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={!item.jobCategory}
                  value={item.jobType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                    console.log(`[JobType Change] Item ${index} - Current jobCategory: "${item.jobCategory}"`);
                    console.log(`[JobType Change] Item ${index} - Selected jobType: "${e.target.value}"`);
                    const newJobItems = [...jobItems];
                    newJobItems[index].jobType = e.target.value;
                    newJobItems[index].cost =
                      jobTypeCosts[e.target.value] !== undefined ? jobTypeCosts[e.target.value] : 0;
                    setJobItems(newJobItems);
                  }}
                >
                  <option value="">Selecciona tipo de trabajo</option>
                  {item.jobCategory &&
                    jobCategories
                      .find((cat) => cat.category === item.jobCategory)
                      ?.services.map((service) => (
                        <option
                          key={`${item.jobCategory} - ${service.name}`}
                          value={`${item.jobCategory} - ${service.name}`}
                        >
                          {service.name}
                        </option>
                      ))}
                </select>
              </div>

              {/* Conditional rendering for Units field */}
              {categoriesRequiringUnits.includes(item.jobCategory) && (
                <div>
                  <label
                    htmlFor={`units-${index}`}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Unidades:
                  </label>
                  <input
                    type="number"
                    id={`units-${index}`}
                    name={`units-${index}`}
                    className="w-full max-w-[100px] appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="1"
                    value={item.units || 1}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const newJobItems = [...jobItems];
                      let value = parseInt(e.target.value);
                      if (isNaN(value) || value < 1) value = 1;
                      newJobItems[index].units = value;
                      setJobItems(newJobItems);
                    }}
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor={`cost-${index}`}
                  className="mb-2 block text-sm font-semibold text-gray-700"
                >
                  Costo ($):
                </label>
                <input
                  type="number"
                  id={`cost-${index}`}
                  name={`cost-${index}`}
                  className="w-full max-w-[120px] appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                  min="0"
                  value={item.cost}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    const newJobItems = [...jobItems];
                    let value = parseFloat(e.target.value);
                    if (isNaN(value)) value = 0;
                    newJobItems[index].cost = value;
                    setJobItems(newJobItems);
                  }}
                />
              </div>
              {jobItems.length > 1 && (
                <div className="md:col-span-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const newJobItems = jobItems.filter((_, i) => i !== index);
                      setJobItems(newJobItems);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm font-semibold"
                  >
                    Eliminar Trabajo
                  </button>
                </div>
              )}
            </div>
          ))}
          {jobItems.length < 5 && (
            <button
              type="button"
              onClick={() => setJobItems([...jobItems, { jobCategory: '', jobType: '', cost: 0 }])}
              className="mt-2 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
            >
              <Plus className="mr-1 size-4" /> Añadir Otro Trabajo
            </button>
          )}
          {jobItemsErrors.length > 0 && (
            <div className="mt-2 text-red-500">
              {jobItemsErrors.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="priority" className="mb-2 block text-sm font-semibold text-gray-700">
            Prioridad:
          </label>
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
          <label
            htmlFor="caseDescription"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Descripción del Caso:
          </label>
          <textarea
            id="caseDescription"
            name="caseDescription"
            rows="4"
            className="w-full resize-y appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detalles sobre el caso dental, como material, color, etc."
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
