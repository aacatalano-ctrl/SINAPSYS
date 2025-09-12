import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types'; // Assuming types are defined here
import { useUI } from '../context/UIContext'; // For showing toasts
import EditUserModal from './EditUserModal'; // Import EditUserModal

interface UsersAdminViewProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const UsersAdminView: React.FC<UsersAdminViewProps> = ({ authFetch }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useUI(); // Use UIContext for toasts

  // State for new user form
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

  // State for editing user
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const API_URL = import.meta.env.VITE_API_URL;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch(`${API_URL}/users`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError('Error al cargar usuarios.');
      showToast('Error al cargar usuarios.', 'error');
    } finally {
      setLoading(false);
    }
  }, [API_URL, authFetch, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
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
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      console.error("Error creating user:", err);
      setError(err.message || 'Error al crear usuario.');
      showToast(err.message || 'Error al crear usuario.', 'error');
    }
  };

  const handleUpdateUserStatus = async (userId: string, currentStatus: 'active' | 'blocked') => {
    setError(null);
    const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
    try {
      const response = await authFetch(`${API_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      showToast(`Estado de usuario actualizado a ${newStatus}.`, 'success');
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      console.error("Error updating user status:", err);
      setError(err.message || 'Error al actualizar estado del usuario.');
      showToast(err.message || 'Error al actualizar estado del usuario.', 'error');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      return;
    }
    setError(null);
    try {
      const response = await authFetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      showToast('Usuario eliminado con éxito.', 'success');
      fetchUsers(); // Refresh user list
    } catch (err: any) {
      console.error("Error deleting user:", err);
      setError(err.message || 'Error al eliminar usuario.');
      showToast(err.message || 'Error al eliminar usuario.', 'error');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  if (loading) return <div className="text-center py-4">Cargando usuarios...</div>;
  if (error) return <div className="text-center py-4 text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Administración de Usuarios</h2>

      {/* Create New User Form */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Crear Nuevo Usuario</h3>
        <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Crear Usuario
            </button>
          </div>
        </form>
      </div>

      {/* User List */}
      <h3 className="text-xl font-semibold text-gray-700 mb-4">Lista de Usuarios</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="text-blue-600 hover:text-blue-900 mr-3 bg-blue-100 p-1 rounded"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleUpdateUserStatus(user._id!, user.status!)}
                    className={`text-indigo-600 hover:text-indigo-900 mr-3 ${user.status === 'active' ? 'bg-red-100' : 'bg-green-100'} p-1 rounded`}
                  >
                    {user.status === 'active' ? 'Bloquear' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id!)}
                    className="text-red-600 hover:text-red-900 bg-red-100 p-1 rounded"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {isEditModalOpen && editingUser && (
      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={editingUser}
        authFetch={authFetch}
        onUserUpdated={fetchUsers}
      />
    )}
  );
};

export default UsersAdminView;
