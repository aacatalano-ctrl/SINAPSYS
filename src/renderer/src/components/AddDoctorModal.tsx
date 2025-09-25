// src/components/AddDoctorModal.jsx

import React, { useRef } from 'react';

const AddDoctorModal = ({ onClose, onAddDoctor, showToast, onDoctorAdded }: { onClose: () => void; onAddDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>; showToast: (message: string, type?: string) => void; onDoctorAdded: (doctor: Doctor) => void; }) => {
  const newDoctorFormRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = (formData.get('doctorName') as string).trim();
    const nameParts = fullName.split(' ');
    const firstName = (nameParts[0] || '').trim();
    const lastName = (nameParts.slice(1).join(' ') || '').trim();

    const newDoctorData: Omit<Doctor, 'id'> = {
      title: formData.get('doctorTitle') as string,
      firstName: firstName,
      lastName: lastName,
      email: (formData.get('doctorEmail') as string).trim(),
      phone: (formData.get('doctorPhone') as string).trim(),
      address: (formData.get('doctorAddress') as string).trim(),
    };
    console.log('New Doctor object being sent:', newDoctorData);
    try {
      const addedDoctor = await onAddDoctor(newDoctorData);
      onDoctorAdded(addedDoctor);
      onClose();
      newDoctorFormRef.current?.reset();
      showToast(`Doctor ${addedDoctor.title} ${addedDoctor.firstName} ${addedDoctor.lastName} añadido con éxito.`);
    } catch (error) {
      console.error("Error adding doctor:", error);
      showToast('Error al añadir doctor.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-600/50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-xl">
        <h3 className="mb-6 text-2xl font-bold text-gray-800">Añadir Nuevo Doctor</h3>
        <form onSubmit={handleSubmit} ref={newDoctorFormRef}>
          <div className="mb-4">
            <label htmlFor="doctorTitle" className="mb-2 block text-sm font-semibold text-gray-700">Título:</label>
            <select
              name="doctorTitle"
              id="doctorTitle"
              className="w-full rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona</option>
              <option value="Dr.">Dr.</option>
              <option value="Dra.">Dra.</option>
              <option value="Est.">Est.</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="doctorName" className="mb-2 block text-sm font-semibold text-gray-700">Nombre Completo:</label>
            <input type="text" name="doctorName" id="doctorName" placeholder="Juan Pérez" className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="mb-4">
            <label htmlFor="doctorEmail" className="mb-2 block text-sm font-semibold text-gray-700">Email:</label>
            <input type="email" name="doctorEmail" id="doctorEmail" placeholder="juan.perez@example.com" className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="mb-4">
            <label htmlFor="doctorPhone" className="mb-2 block text-sm font-semibold text-gray-700">Teléfono:</label>
            <input
              type="tel"
              name="doctorPhone"
              id="doctorPhone"
              placeholder="Ej: 04141234567, +58 567 3412"
              className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Formato de teléfono válido: solo números, +, espacios o guiones. Mínimo 7 dígitos."
              pattern="[0-9+\- ]{7,}"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="doctorAddress" className="mb-2 block text-sm font-semibold text-gray-700">Dirección:</label>
            <input type="text" name="doctorAddress" id="doctorAddress" placeholder="Calle Falsa 123" className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="rounded-lg bg-gray-300 px-6 py-2 font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400">Cancelar</button>
            <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700">Añadir Doctor</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctorModal;