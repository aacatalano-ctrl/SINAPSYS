import React from 'react';
import { Search, ArrowUp, ArrowDown, Plus, Pencil, Trash2, ArrowLeft, Download } from 'lucide-react';
import { useUI } from '../context/UIContext';

interface DoctorsViewProps {
         doctors: Doctor[];
         editingDoctor: Doctor | null;
         setEditingDoctor: React.Dispatch<React.SetStateAction<Doctor | null>>;
         handleEditDoctor: (id: string, updatedFields: Partial<Doctor>) => Promise<void>;
         handleDeleteDoctor: (id: string) => Promise<void>;
         searchDoctorTerm: string;
         setSearchDoctorTerm: React.Dispatch<React.SetStateAction<string>>;
         prefixFilter: string;
        setPrefixFilter: React.Dispatch<React.SetStateAction<string>>;
        sortDoctorsColumn: string;
        sortDoctorsDirection: 'asc' | 'desc';
        handleSortDoctors: (column: string) => void;
        setFullDoctorView: (doctor: Doctor) => void;
        onExportDoctors: () => Promise<void>;
      }


      const DoctorsView: React.FC<DoctorsViewProps> = ({
               doctors, editingDoctor, setEditingDoctor, handleEditDoctor, handleDeleteDoctor, searchDoctorTerm, setSearchDoctorTerm,
               prefixFilter, setPrefixFilter, sortDoctorsColumn, sortDoctorsDirection, handleSortDoctors, setFullDoctorView,
          onExportDoctors
             }) => {
  const { openAddDoctorModal, currentUser } = useUI();
     
  const filteredDoctors = doctors
    .filter((doctor: Doctor) => {
      if (prefixFilter === 'all') {
        return true;
      }
      return doctor.title === prefixFilter;
    })
    .filter((doctor: Doctor) => 
      (doctor.firstName + ' ' + doctor.lastName).toLowerCase().includes(searchDoctorTerm.toLowerCase())
    );

  const sortedDoctors = [...filteredDoctors].sort((a: Doctor, b: Doctor) => {
    if (!sortDoctorsColumn) return 0;

    let aValue = a[sortDoctorsColumn as keyof Doctor];
    let bValue = b[sortDoctorsColumn as keyof Doctor];

    if (sortDoctorsColumn === 'name') {
      aValue = a.firstName + ' ' + a.lastName;
      bValue = b.firstName + ' ' + b.lastName;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDoctorsDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    }
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDoctorsDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    return 0;
  });

  const handleEditDoctorSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const fullName = formData.get('editDoctorName') as string;
    const nameParts = fullName.split(' ');
    const updatedFields: Partial<Doctor> = {
      title: formData.get('editDoctorTitle') as string,
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      email: formData.get('editDoctorEmail') as string,
      phone: formData.get('editDoctorPhone') as string,
      address: formData.get('editDoctorAddress') as string,
    };
    if (editingDoctor) {
      await handleEditDoctor(editingDoctor._id, updatedFields);
      setEditingDoctor(null); // Close the edit form after saving
    }
  };

  const prefixes = ['all', 'Est.', 'Dra.', 'Dr.'];

  return (
    <div className="mb-8 rounded-lg bg-white p-8 shadow-xl">
      {!editingDoctor ? (
        <>
          <h2 className="mb-6 text-3xl font-bold text-gray-800">Gestión de Doctores</h2>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-600">Filtro:</span>
              {prefixes.map(p => (
                <button 
                  key={p}
                  onClick={() => setPrefixFilter(p)}
                  className={`rounded-lg px-4 py-2 text-sm font-semibold ${prefixFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  {p === 'all' ? 'Todos' : p}
                </button>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onExportDoctors}
                className="flex items-center rounded-lg bg-green-600 px-5 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-green-700"
              >
                <Download className="mr-2" /> Exportar a CSV
              </button>
              <button
                onClick={() => openAddDoctorModal()}
                className="flex items-center rounded-lg bg-blue-600 px-5 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700"
              >
                <Plus className="mr-2" /> Añadir
              </button>
            </div>
          </div>
           <div className="mb-6 flex items-center space-x-4">
            <div className="relative grow">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="w-full rounded-lg border py-3 pl-10 pr-4 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchDoctorTerm}
                onChange={(e) => setSearchDoctorTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          {sortedDoctors.length === 0 ? (
            <p className="py-10 text-center text-gray-600">No hay doctores registrados que coincidan con la búsqueda.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full bg-white">
                <thead className="border-b border-gray-300 bg-gray-200">
                  <tr>
                    <th className="cursor-pointer px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700" onClick={() => handleSortDoctors('name')}>
                      Nombre {sortDoctorsColumn === 'name' && (sortDoctorsDirection === 'asc' ? <ArrowUp size={16} className="ml-1 inline" /> : <ArrowDown size={16} className="ml-1 inline" />)}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">Email</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">Teléfono</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">Dirección</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold uppercase text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDoctors.map((doctor, index) => (
                    <tr key={doctor.id || doctor._id || `${doctor.firstName}-${doctor.lastName}-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="cursor-pointer px-4 py-3 text-sm font-medium text-blue-600 hover:underline" onClick={() => setFullDoctorView(doctor)}>{doctor.title} {doctor.firstName} {doctor.lastName}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{doctor.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{doctor.phone}</td>
                      <td className="px-4 py-3 text-sm text-gray-800">{doctor.address}</td>
                      <td className="flex items-center space-x-2 px-4 py-3 text-sm text-gray-800">
                        <button onClick={(e) => {e.stopPropagation(); setEditingDoctor(doctor);}} className="text-blue-600 hover:text-blue-800" title="Editar Doctor">
                          <Pencil size={20} />
                        </button>
                                                {currentUser?.role !== 'operador' && (
                          <button onClick={(e) => {e.stopPropagation(); handleDeleteDoctor(doctor._id);}} className="text-red-600 hover:text-red-800" title="Eliminar Doctor">
                            <Trash2 size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-lg bg-white p-8 shadow-xl">
          <button
            onClick={() => setEditingDoctor(null)}
            className="mb-6 flex items-center font-semibold text-blue-600 hover:text-blue-800"
          >
            <ArrowLeft className="mr-2" /> Volver a Gestión de Doctores
          </button>
          <h2 className="mb-6 text-3xl font-bold text-gray-800">Editar Doctor: {editingDoctor.title} {editingDoctor.name}</h2>
          <form onSubmit={handleEditDoctorSubmit}>
            <div className="mb-4">
              <label htmlFor="editDoctorTitle" className="mb-2 block text-sm font-semibold text-gray-700">Título:</label>
              <select
                name="editDoctorTitle"
                id="editDoctorTitle"
                defaultValue={editingDoctor.title}
                className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Dr.">Dr.</option>
                <option value="Dra.">Dra.</option>
                <option value="Est.">Est.</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="editDoctorName" className="mb-2 block text-sm font-semibold text-gray-700">Nombre Completo:</label>
              <input type="text" name="editDoctorName" id="editDoctorName" defaultValue={`${editingDoctor.firstName} ${editingDoctor.lastName}`} className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="mb-4">
              <label htmlFor="editDoctorEmail" className="mb-2 block text-sm font-semibold text-gray-700">Email:</label>
              <input type="email" name="editDoctorEmail" id="editDoctorEmail" defaultValue={editingDoctor.email} className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="editDoctorPhone" className="mb-2 block text-sm font-semibold text-gray-700">Teléfono:</label>
              <input
                type="tel"
                name="editDoctorPhone"
                id="editDoctorPhone"
                defaultValue={editingDoctor.phone}
                placeholder="Ej: 04141234567, +58 567 3412"
                className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Formato de teléfono válido: solo números, +, espacios o guiones. Mínimo 7 dígitos."
                pattern="[0-9+\- ]{7,}"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="editDoctorAddress" className="mb-2 block text-sm font-semibold text-gray-700">Dirección:</label>
              <input type="text" name="editDoctorAddress" id="editDoctorAddress" defaultValue={editingDoctor.address} className="w-full appearance-none rounded-lg border px-4 py-3 leading-tight text-gray-700 shadow focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => setEditingDoctor(null)} className="rounded-lg bg-gray-300 px-6 py-2 font-bold text-gray-800 transition-colors duration-200 hover:bg-gray-400">Cancelar</button>
              <button type="submit" className="rounded-lg bg-blue-600 px-6 py-2 font-bold text-white shadow-md transition-colors duration-200 hover:bg-blue-700">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorsView;