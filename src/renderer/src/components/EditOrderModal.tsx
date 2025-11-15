import React, { useState, useEffect } from 'react';
import { useOrders } from '../context/OrderContext';
import { Order, Doctor, JobCategory, JobItem as JobItemType } from '../../types';
import DoctorCombobox from './DoctorCombobox';
import { Plus, X, Minus } from 'lucide-react';

interface EditOrderModalProps {
  order: Order;
  doctors: Doctor[];
  jobCategories: JobCategory[];
  jobTypeCosts: { [key: string]: number };
  onClose: () => void;
  onUpdateOrder: (id: string, updatedFields: Partial<Order>) => Promise<void>;
}

// Local state interface for editable fields
interface EditableJobItem {
  jobCategory: string;
  jobType: string;
  cost: string;
  units: string;
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
  const [jobItems, setJobItems] = useState<EditableJobItem[]>([]);
  const [jobItemsErrors, setJobItemsErrors] = useState<string[]>([]);
  const [priority, setPriority] = useState<'Baja' | 'Normal' | 'Alta' | 'Urgente'>('Normal');
  const [caseDescription, setCaseDescription] = useState('');
  const [editingCost, setEditingCost] = useState<{ index: number; value: string } | null>(null);

  // Effect to initialize form state when the order prop is available
  useEffect(() => {
    if (order && doctors.length > 0) {
      const currentDoctorId =
        typeof order.doctorId === 'object' && order.doctorId !== null
          ? (order.doctorId as Doctor)._id
          : order.doctorId;

      const doctor = doctors.find((d) => d._id === currentDoctorId) || null;
      setSelectedDoctor(doctor);
      setPatientName(order.patientName);
      setJobItems(
        order.jobItems.map((item) => ({
          ...item,
          cost: String(item.cost),
          units: String(item.units || 1),
        })) || [{ jobCategory: '', jobType: '', cost: '', units: '1' }],
      );
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

  const handleCostStepper = (index: number, increment: boolean) => {
    const newJobItems = [...jobItems];
    const item = newJobItems[index];
    const units = parseInt(item.units, 10) || 1;
    const currentBaseCost = parseFloat(item.cost) || 0;
    let currentTotal = currentBaseCost * units;

    const step = 10;
    let newTotal = currentTotal + (increment ? step : -step);
    if (newTotal < 0) newTotal = 0;

    item.cost = (newTotal / units).toFixed(2);
    setJobItems(newJobItems);
    setEditingCost(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedDoctor) {
      showNotification('Por favor, selecciona un doctor.', 'error');
      return;
    }

    const finalJobItems: JobItemType[] = jobItems.map((item) => ({
      jobCategory: item.jobCategory,
      jobType: item.jobType,
      cost: parseFloat(item.cost) || 0,
      units: parseInt(item.units, 10) || 1,
    }));

    // Client-side validation for jobItems
    const errors: string[] = [];
    if (finalJobItems.length === 0) {
      errors.push('Debe añadir al menos un tipo de trabajo.');
    } else {
      finalJobItems.forEach((item, index) => {
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
      jobItems: finalJobItems,
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
                    htmlFor={`edit-jobCategory-${index}`}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Categoría:
                  </label>
                  <select
                    id={`edit-jobCategory-${index}`}
                    name={`edit-jobCategory-${index}`}
                    className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={item.jobCategory}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const newJobItems = [...jobItems];
                      newJobItems[index].jobCategory = e.target.value;
                      newJobItems[index].jobType = ''; // Reset jobType when category changes
                      newJobItems[index].cost = ''; // Reset cost when category changes
                      newJobItems[index].units = '1'; // Reset units when category changes
                      setJobItems(newJobItems);
                      setEditingCost(null);
                    }}
                    required
                  >
                    <option value="">Selecciona</option>
                    {jobCategories.map((category) => (
                      <option key={category.category} value={category.category}>
                        {category.category}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`edit-jobType-${index}`}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Tipo:
                  </label>
                  <select
                    id={`edit-jobType-${index}`}
                    name={`edit-jobType-${index}`}
                    className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!item.jobCategory}
                    value={item.jobType}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      const newJobItems = [...jobItems];
                      const newJobType = e.target.value;
                      newJobItems[index].jobType = newJobType;
                      const cost = jobTypeCosts[newJobType];
                      newJobItems[index].cost = cost !== undefined ? String(cost) : '';
                      setJobItems(newJobItems);
                      setEditingCost(null);
                    }}
                  >
                    <option value="">Selecciona</option>
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

                {(categoriesRequiringUnits.includes(item.jobCategory) ||
                  jobTypesRequiringUnits.has(`${item.jobCategory} - ${item.jobType}`)) && (
                  <div>
                    <label
                      htmlFor={`edit-units-${index}`}
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Unidades:
                    </label>
                    <input
                      type="number"
                      id={`edit-units-${index}`}
                      name={`edit-units-${index}`}
                      className="w-full max-w-[100px] appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                      value={item.units}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const newJobItems = [...jobItems];
                        const value = parseInt(e.target.value, 10);
                        if (isNaN(value) || value < 1) {
                          newJobItems[index].units = '1';
                        } else {
                          newJobItems[index].units = String(value);
                        }
                        setJobItems(newJobItems);
                        setEditingCost(null);
                      }}
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor={`edit-cost-${index}`}
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Costo ($):
                  </label>
                  <div className="flex w-full max-w-[160px] items-center overflow-hidden rounded-lg border border-gray-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
                    <span className="pl-3 text-gray-500">$</span>
                    <input
                      type="number"
                      id={`edit-cost-${index}`}
                      name={`edit-cost-${index}`}
                      className="grow px-1 py-3 leading-tight text-gray-700 [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      value={
                        editingCost?.index === index
                          ? editingCost.value
                          : (
                              (parseFloat(item.cost) || 0) * (parseInt(item.units, 10) || 1)
                            ).toFixed(2)
                      }
                      onFocus={() =>
                        setEditingCost({
                          index,
                          value: (
                            (parseFloat(item.cost) || 0) * (parseInt(item.units, 10) || 1)
                          ).toFixed(2),
                        })
                      }
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        if (editingCost?.index === index) {
                          setEditingCost({ ...editingCost, value: e.target.value });
                        }
                      }}
                      onBlur={() => {
                        if (editingCost) {
                          const newJobItems = [...jobItems];
                          const units = parseInt(newJobItems[editingCost.index].units, 10) || 1;
                          const newTotal = parseFloat(editingCost.value);
                          if (!isNaN(newTotal) && newTotal >= 0) {
                            newJobItems[editingCost.index].cost = (newTotal / units).toFixed(2);
                          }
                          setJobItems(newJobItems);
                          setEditingCost(null);
                        }
                      }}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                    />
                    <div className="flex flex-col border-l border-gray-200">
                      <button
                        type="button"
                        onClick={() => handleCostStepper(index, true)}
                        className="flex h-1/2 w-8 items-center justify-center rounded-tr-lg bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none"
                        title="Incrementar en $10"
                      >
                        <Plus size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCostStepper(index, false)}
                        className="flex h-1/2 w-8 items-center justify-center rounded-br-lg border-t border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 focus:outline-none"
                        title="Decrementar en $10"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  </div>
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
                      <X className="mr-1 size-4" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            ))}
            {jobItems.length < 5 && (
              <button
                type="button"
                onClick={() =>
                  setJobItems([...jobItems, { jobCategory: '', jobType: '', cost: '', units: '1' }])
                }
                className="mt-2 flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800"
              >
                <Plus className="mr-1 size-4" /> Añadir Trabajo
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
