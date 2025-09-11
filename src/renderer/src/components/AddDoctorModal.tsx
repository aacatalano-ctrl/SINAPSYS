// src/components/AddDoctorModal.jsx

import React, { useRef } from 'react';

const AddDoctorModal = ({ onClose, onAddDoctor, showToast, onDoctorAdded }: { onClose: () => void; onAddDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>; showToast: (message: string, type?: string) => void; onDoctorAdded: (doctor: Doctor) => void; }) => {
  const newDoctorFormRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('doctorName') as string;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || ' '; // Ensure lastName is not empty // Ensure lastName is not empty

    const newDoctorData: Omit<Doctor, 'id'> = {
      title: formData.get('doctorTitle') as string,
      firstName: firstName,
      lastName: lastName,
      email: formData.get('doctorEmail') as string,
      phone: formData.get('doctorPhone') as string,
      address: formData.get('doctorAddress') as string,
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-2xl font-bold mb-6 text-gray-800">Añadir Nuevo Doctor</h3>
        <form onSubmit={handleSubmit} ref={newDoctorFormRef}>
          <div className="mb-4">
            <label htmlFor="doctorTitle" className="block text-gray-700 text-sm font-semibold mb-2">Título:</label>
            <select
              name="doctorTitle"
              id="doctorTitle"
              className="shadow border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Selecciona</option>
              <option value="Dr.">Dr.</option>
              <option value="Dra.">Dra.</option>
              <option value="Est.">Est.</option>
            </select>
          </div>
          <div className="mb-4">
            <label htmlFor="doctorName" className="block text-gray-700 text-sm font-semibold mb-2">Nombre Completo:</label>
            <input type="text" name="doctorName" id="doctorName" placeholder="Juan Pérez" className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="mb-4">
            <label htmlFor="doctorEmail" className="block text-gray-700 text-sm font-semibold mb-2">Email:</label>
            <input type="email" name="doctorEmail" id="doctorEmail" placeholder="juan.perez@example.com" className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" required />
          </div>
          <div className="mb-4">
            <label htmlFor="doctorPhone" className="block text-gray-700 text-sm font-semibold mb-2">Teléfono:</label>
            <input
              type="tel"
              name="doctorPhone"
              id="doctorPhone"
              placeholder="Ej: 04141234567, +58 567 3412"
              className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
              title="Formato de teléfono válido: solo números, +, espacios o guiones. Mínimo 7 dígitos."
              pattern="[0-9+\- ]{7,}"
            />
          </div>
          <div className="mb-6">
            <label htmlFor="doctorAddress" className="block text-gray-700 text-sm font-semibold mb-2">Dirección:</label>
            <input type="text" name="doctorAddress" id="doctorAddress" placeholder="Calle Falsa 123" className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors duration-200">Cancelar</button>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200">Añadir Doctor</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddDoctorModal;