import React from 'react';
import { User } from '../../types';

import { Eye, EyeOff } from 'lucide-react'; // Import eye icons

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
  onUserAdded: () => void; // Callback to refresh user list
  currentUser: User | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ isOpen, onClose, authFetch, onUserAdded, currentUser, showToast }) => {
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
  const [newUserRole, setNewUserRole] = useState<'admin' | 'cliente' | 'operador'>('cliente');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility

  const API_URL = '/api';

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
      setNewUserRole('cliente');
      onUserAdded(); // Refresh user list in parent
      onClose();
    } catch (err: unknown) {
      console.error("Error creating user:", err);
      let message = 'Error al crear usuario.';
      if (err instanceof Error) {
        message = err.message;
      }
      setError(message);
      showToast(message, 'error');
    }
  };

  if (!isOpen) return null;

  const availableRoles = [
    { value: 'cliente', label: 'Cliente' },
    { value: 'operador', label: 'Operador' },
  ];

  if (currentUser?.role === 'master') {
    availableRoles.push({ value: 'admin', label: 'Administrador' });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/75">
      <div className="w-full max-w-lg scale-100 rounded-lg bg-white p-8 opacity-100 shadow-2xl transition-all duration-300">
        <h2 className="mb-6 text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h2>

        {error && <p className="mb-4 text-center text-sm text-red-500">{error}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
          <div className="relative">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              className="mt-1 block w-full rounded-md border-gray-300 pr-10 shadow-sm focus:border-blue-500 focus:ring-blue-500" // Added pr-10 for icon spacing
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <span
              className="absolute inset-y-0 right-0 top-6 flex cursor-pointer items-center pr-3" // Adjusted top for alignment
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="size-5 text-gray-400" />
              ) : (
                <Eye className="size-5 text-gray-400" />
              )}
            </span>
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
              onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'cliente' | 'operador')}
            >
              {availableRoles.map(role => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div className="mt-4 flex justify-end space-x-3 md:col-span-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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