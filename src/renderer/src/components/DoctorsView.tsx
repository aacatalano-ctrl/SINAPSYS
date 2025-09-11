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
  const { openAddDoctorModal } = useUI();
     
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
    <div className="bg-white p-8 rounded-lg shadow-xl mb-8">
      {!editingDoctor ? (
        <>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Gestión de Doctores</h2>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-600">Filtro:</span>
              {prefixes.map(p => (
                <button 
                  key={p}
                  onClick={() => setPrefixFilter(p)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm ${prefixFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
                >
                  {p === 'all' ? 'Todos' : p}
                </button>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={onExportDoctors}
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition-colors duration-200 flex items-center"
              >
                <Download className="mr-2" /> Exportar a CSV
              </button>
              <button
                onClick={() => openAddDoctorModal()}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-5 rounded-lg shadow-md transition-colors duration-200 flex items-center"
              >
                <Plus className="mr-2" /> Añadir
              </button>
            </div>
          </div>
           <div className="mb-6 flex items-center space-x-4">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar por nombre..."
                className="shadow border rounded-lg w-full py-3 pl-10 pr-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchDoctorTerm}
                onChange={(e) => setSearchDoctorTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            </div>
          </div>

          {sortedDoctors.length === 0 ? (
            <p className="text-gray-600 text-center py-10">No hay doctores registrados que coincidan con la búsqueda.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full bg-white">
                <thead className="bg-gray-200 border-b border-gray-300">
                  <tr>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase cursor-pointer" onClick={() => handleSortDoctors('name')}>
                      Nombre {sortDoctorsColumn === 'name' && (sortDoctorsDirection === 'asc' ? <ArrowUp size={16} className="inline ml-1" /> : <ArrowDown size={16} className="inline ml-1" />)}
                    </th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Email</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Teléfono</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Dirección</th>
                    <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedDoctors.map((doctor, index) => (
                    <tr key={doctor.id || doctor._id || `${doctor.firstName}-${doctor.lastName}-${index}`} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-800 font-medium cursor-pointer text-blue-600 hover:underline" onClick={() => setFullDoctorView(doctor)}>{doctor.title} {doctor.firstName} {doctor.lastName}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{doctor.email}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{doctor.phone}</td>
                      <td className="py-3 px-4 text-sm text-gray-800">{doctor.address}</td>
                      <td className="py-3 px-4 text-sm text-gray-800 flex items-center space-x-2">
                        <button onClick={(e) => {e.stopPropagation(); setEditingDoctor(doctor);}} className="text-blue-600 hover:text-blue-800" title="Editar Doctor">
                          <Pencil size={20} />
                        </button>
                        <button onClick={(e) => {e.stopPropagation(); handleDeleteDoctor(doctor._id);}} className="text-red-600 hover:text-red-800" title="Eliminar Doctor">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white p-8 rounded-lg shadow-xl">
          <button
            onClick={() => setEditingDoctor(null)}
            className="mb-6 flex items-center text-blue-600 hover:text-blue-800 font-semibold"
          >
            <ArrowLeft className="mr-2" /> Volver a Gestión de Doctores
          </button>
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Editar Doctor: {editingDoctor.title} {editingDoctor.name}</h2>
          <form onSubmit={handleEditDoctorSubmit}>
            <div className="mb-4">
              <label htmlFor="editDoctorTitle" className="block text-gray-700 text-sm font-semibold mb-2">Título:</label>
              <select
                name="editDoctorTitle"
                id="editDoctorTitle"
                defaultValue={editingDoctor.title}
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Dr.">Dr.</option>
                <option value="Dra.">Dra.</option>
                <option value="Est.">Est.</option>
              </select>
            </div>
            <div className="mb-4">
              <label htmlFor="editDoctorName" className="block text-gray-700 text-sm font-semibold mb-2">Nombre Completo:</label>
              <input type="text" name="editDoctorName" id="editDoctorName" defaultValue={`${editingDoctor.firstName} ${editingDoctor.lastName}`} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" required />
            </div>
            <div className="mb-4">
              <label htmlFor="editDoctorEmail" className="block text-gray-700 text-sm font-semibold mb-2">Email:</label>
              <input type="email" name="editDoctorEmail" id="editDoctorEmail" defaultValue={editingDoctor.email} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="mb-4">
              <label htmlFor="editDoctorPhone" className="block text-gray-700 text-sm font-semibold mb-2">Teléfono:</label>
              <input
                type="tel"
                name="editDoctorPhone"
                id="editDoctorPhone"
                defaultValue={editingDoctor.phone}
                placeholder="Ej: 04141234567, +58 567 3412"
                className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title="Formato de teléfono válido: solo números, +, espacios o guiones. Mínimo 7 dígitos."
                pattern="[0-9+\- ]{7,}"
              />
            </div>
            <div className="mb-6">
              <label htmlFor="editDoctorAddress" className="block text-gray-700 text-sm font-semibold mb-2">Dirección:</label>
              <input type="text" name="editDoctorAddress" id="editDoctorAddress" defaultValue={editingDoctor.address} className="shadow appearance-none border rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex justify-end space-x-4">
              <button type="button" onClick={() => setEditingDoctor(null)} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-6 rounded-lg transition-colors duration-200">Cancelar</button>
              <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-colors duration-200">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default DoctorsView;