import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order, Doctor, JobCategory, JobItem } from '../../types';
import DoctorCombobox from './DoctorCombobox';
import { Plus, X } from 'lucide-react'; // Import icons for add/remove buttons

interface EditOrderModalProps {
  order: Order;
  doctors: Doctor[];
  jobCategories: JobCategory[];
  jobTypeCosts: { [key: string]: number };
  onClose: () => void;
  onUpdateOrder: (id: string, updatedFields: Partial<Order>) => Promise<void>;
}

const EditOrderModal: React.FC<EditOrderModalProps> = ({
  order,
  doctors,
  jobCategories,
  jobTypeCosts,
  onClose,
  onUpdateOrder,
}) => {
  const { showNotification } = useOrders();

  const categoriesRequiringUnits = ['FLUJO DIGITAL', 'PRÓTESIS FIJA'];

  const jobTypesRequiringUnits = new Set([
    'DPR METAL ACRÍLICO - DPR METAL ACRÍLICO - Respaldo Metálico',
    'ACRÍLICO - ACRÍLICO - Ganchos Estéticos',
    'ACRÍLICO - ACRÍLICO - Ganchos Metálicos',
    'ACRÍLICO - ACRÍLICO - Rejilla Colada',
    'ACRÍLICO - ACRÍLICO - Rejilla Prefabricada',
    'ACRÍLICO - ACRÍLICO - Prótesis Totales',
    'ACRÍLICO - ACRÍLICO - Rebase Acrílico',
  ]);

  // State for form fields
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [patientName, setPatientName] = useState('');
  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [jobItemsErrors, setJobItemsErrors] = useState<string[]>([]);
  const [priority, setPriority] = useState<'Baja' | 'Normal' | 'Alta' | 'Urgente'>('Normal');
  const [caseDescription, setCaseDescription] = useState('');

  // Effect to initialize form state when the order prop is available
  useEffect(() => {
    if (order && doctors.length > 0) {
      const currentDoctorId = typeof order.doctorId === 'object' && order.doctorId !== null
        ? (order.doctorId as Doctor)._id
        : order.doctorId;

      const doctor = doctors.find((d) => d._id === currentDoctorId) || null;
      setSelectedDoctor(doctor);
      setPatientName(order.patientName);
      setJobItems(order.jobItems.map(item => ({ ...item, units: item.units || 1 })) || [{ jobCategory: '', jobType: '', cost: 0, units: 1 }]); // Initialize with existing jobItems or a default
      setPriority(order.priority);
      setCaseDescription(order.caseDescription);
    }
  }, [order, doctors]);

  // Effect to handle Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDoctor) {
      showNotification('Por favor, selecciona un doctor.', 'error');
      return;
    }

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

    if (errors.length > 0) {
      errors.forEach((msg) => showNotification(msg, 'error'));
      setJobItemsErrors(errors);
      return;
    }
    setJobItemsErrors([]); // Clear previous errors

    const updatedOrderData: Partial<Omit<Order, '_id'>> = {
      doctorId: selectedDoctor._id,
      patientName,
      jobItems,
      priority,
      caseDescription,
    };

    try {
      await onUpdateOrder(order._id, updatedOrderData);
    } catch {
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
            <label htmlFor="doctor" className="mb-2 block text-sm font-semibold text-gray-700">
              Doctor:
            </label>
            <DoctorCombobox
              doctors={doctors}
              selectedDoctor={selectedDoctor}
              onSelectDoctor={setSelectedDoctor}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="patientName" className="mb-2 block text-sm font-semibold text-gray-700">
              Nombre del Paciente:
            </label>
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
            <h3 className="mb-2 text-lg font-bold text-gray-700">Detalles de los Trabajos (Máx. 5)</h3>
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
                {(categoriesRequiringUnits.includes(item.jobCategory) || jobTypesRequiringUnits.has(`${item.jobCategory} - ${item.jobType}`)) && (
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
                    Costo Total ($):
                  </label>
                  <input
                    type="text" // Changed to text as it's now a calculated display
                    id={`cost-${index}`}
                    name={`cost-${index}`}
                    className="w-full max-w-[120px] appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                    value={(item.cost * (item.units || 1)).toFixed(2)}
                    readOnly // Make it read-only
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

          <div className="mb-4">
            <label htmlFor="priority" className="mb-2 block text-sm font-semibold text-gray-700">
              Prioridad:
            </label>
            <select
              id="priority"
              name="priority"
              value={priority}
              onChange={(e) =>
                setPriority(e.target.value as 'Baja' | 'Normal' | 'Alta' | 'Urgente')
              }
              className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Baja">Baja</option>
              <option value="Normal">Normal</option>
              <option value="Alta">Alta</option>
              <option value="Urgente">Urgente</option>
            </select>
          </div>

          <div className="mb-6">
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
              value={caseDescription}
              onChange={(e) => setCaseDescription(e.target.value)}
              className="w-full resize-y appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Detalles sobre el caso dental, como material, color, etc."
            ></textarea>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-gray-300 px-6 py-2 font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditOrderModal;
