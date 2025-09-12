import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { useUI } from '../context/UIContext';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onUserUpdated: () => void; // Callback to refresh user list
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, authFetch, onUserUpdated }) => {
  const [username, setUsername] = useState(user.username);
  const [nombre, setNombre] = useState(user.nombre);
  const [apellido, setApellido] = useState(user.apellido);
  const [cedula, setCedula] = useState(user.cedula);
  const [direccion, setDireccion] = useState(user.direccion);
  const [razonSocial, setRazonSocial] = useState(user.razonSocial);
  const [rif, setRif] = useState(user.rif);
  const [role, setRole] = useState<'admin' | 'user'>(user.role);
  const [status, setStatus] = useState<'active' | 'blocked'>(user.status);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useUI();

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setNombre(user.nombre);
      setApellido(user.apellido);
      setCedula(user.cedula);
      setDireccion(user.direccion);
      setRazonSocial(user.razonSocial);
      setRif(user.rif);
      setRole(user.role);
      setStatus(user.status);
    }
  }, [user]);

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await authFetch(`${API_URL}/users/${user._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          nombre,
          apellido,
          cedula,
          direccion,
          razonSocial,
          rif,
          role,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      showToast('Usuario actualizado con éxito.', 'success');
      onUserUpdated(); // Refresh user list in parent
      onClose();
    } catch (err: any) {
      console.error("Error updating user:", err);
      setError(err.message || 'Error al actualizar usuario.');
      showToast(err.message || 'Error al actualizar usuario.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Editar Usuario: {user.username}</h2>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
            <input
              type="text"
              id="username"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              id="nombre"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              id="apellido"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="cedula" className="block text-sm font-medium text-gray-700">Cédula</label>
            <input
              type="text"
              id="cedula"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="direccion" className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              id="direccion"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="razonSocial" className="block text-sm font-medium text-gray-700">Razón Social</label>
            <input
              type="text"
              id="razonSocial"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={razonSocial}
              onChange={(e) => setRazonSocial(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="rif" className="block text-sm font-medium text-gray-700">RIF</label>
            <input
              type="text"
              id="rif"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={rif}
              onChange={(e) => setRif(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              id="role"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              id="status"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'active' | 'blocked')}
            >
              <option value="active">Activo</option>
              <option value="blocked">Bloqueado</option>
            </select>
          </div>

          <div className="md:col-span-2 flex justify-end space-x-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditUserModal;