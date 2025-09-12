import React, { useState } from 'react';
import { useUI } from '../context/UIContext';
import { User } from '../../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onUserAdded: () => void; // Callback to refresh user list
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, authFetch, onUserAdded }) => {
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newSecurityQuestion, setNewSecurityQuestion] = useState('');
  const [newSecurityAnswer, setNewSecurityAnswer] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newApellido, setNewApellido] = useState('');
  const [newCedula, setNewCedula] = useState('');
  const [newDireccion, setNewDireccion] = useState('');
  const [newRazonSocial, setNewRazonSocial] = useState('');
  const [newRif, setNewRif] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'user'>('user');
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useUI();

  const API_URL = import.meta.env.VITE_API_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await authFetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          securityQuestion: newSecurityQuestion,
          securityAnswer: newSecurityAnswer,
          nombre: newNombre,
          apellido: newApellido,
          cedula: newCedula,
          direccion: newDireccion,
          razonSocial: newRazonSocial,
          rif: newRif,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      showToast('Usuario creado con éxito.', 'success');
      setNewUsername('');
      setNewPassword('');
      setNewSecurityQuestion('');
      setNewSecurityAnswer('');
      setNewNombre('');
      setNewApellido('');
      setNewCedula('');
      setNewDireccion('');
      setNewRazonSocial('');
      setNewRif('');
      setNewUserRole('user');
      onUserAdded(); // Refresh user list in parent
      onClose();
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || 'Error al crear usuario.');
      showToast(err.message || 'Error al crear usuario.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-[100]">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-lg transform transition-all duration-300 scale-100 opacity-100">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Crear Nuevo Usuario</h2>

        {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="newUsername" className="block text-sm font-medium text-gray-700">Nombre de Usuario</label>
            <input
              type="text"
              id="newUsername"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              id="newPassword"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newSecurityQuestion" className="block text-sm font-medium text-gray-700">Pregunta de Seguridad</label>
            <input
              type="text"
              id="newSecurityQuestion"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newSecurityQuestion}
              onChange={(e) => setNewSecurityQuestion(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newSecurityAnswer" className="block text-sm font-medium text-gray-700">Respuesta de Seguridad</label>
            <input
              type="text"
              id="newSecurityAnswer"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newSecurityAnswer}
              onChange={(e) => setNewSecurityAnswer(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newNombre" className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              id="newNombre"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newNombre}
              onChange={(e) => setNewNombre(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newApellido" className="block text-sm font-medium text-gray-700">Apellido</label>
            <input
              type="text"
              id="newApellido"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newApellido}
              onChange={(e) => setNewApellido(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newCedula" className="block text-sm font-medium text-gray-700">Cédula</label>
            <input
              type="text"
              id="newCedula"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newCedula}
              onChange={(e) => setNewCedula(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newDireccion" className="block text-sm font-medium text-gray-700">Dirección</label>
            <input
              type="text"
              id="newDireccion"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newDireccion}
              onChange={(e) => setNewDireccion(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newRazonSocial" className="block text-sm font-medium text-gray-700">Razón Social</label>
            <input
              type="text"
              id="newRazonSocial"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newRazonSocial}
              onChange={(e) => setNewRazonSocial(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newRif" className="block text-sm font-medium text-gray-700">RIF</label>
            <input
              type="text"
              id="newRif"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newRif}
              onChange={(e) => setNewRif(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="newUserRole" className="block text-sm font-medium text-gray-700">Rol</label>
            <select
              id="newUserRole"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              value={newUserRole}
              onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'user')}
            >
              <option value="user">Usuario</option>
              <option value="admin">Administrador</option>
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
              Crear Usuario
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUserModal;