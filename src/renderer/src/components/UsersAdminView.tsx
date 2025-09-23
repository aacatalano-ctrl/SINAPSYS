import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types'; // Assuming types are defined here
import { useUI } from '../context/UIContext'; // For showing toasts
import EditUserModal from './EditUserModal'; // Import EditUserModal
import AddUserModal from './AddUserModal'; // Import AddUserModal

interface UsersAdminViewProps {
  authFetch: (url: string, options?: RequestInit) => Promise<Response>;
}

const UsersAdminView: React.FC<UsersAdminViewProps> = ({ authFetch }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useUI(); // Use UIContext for toasts

  // State for editing user
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // New state for Add User modal

  const API_URL = '/api';

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

  const handleUpdateUserStatus = async (userToUpdate: User) => { // Changed parameter to User object
    if (userToUpdate.role === 'admin') {
      const masterCode = window.prompt('Este es un usuario administrador. Por favor, introduce el código maestro para continuar:');
      if (masterCode !== '868686') {
        showToast('Código maestro incorrecto o acción cancelada.', 'error');
        return;
      }
    }

    setError(null);
    const newStatus = userToUpdate.status === 'active' ? 'blocked' : 'active';
    try {
      const response = await authFetch(`${API_URL}/users/${userToUpdate._id}/status`, {
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al actualizar estado del usuario.';
      console.error("Error updating user status:", err);
      setError(message);
      showToast(message, 'error');
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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error al eliminar usuario.';
      console.error("Error deleting user:", err);
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleEditUser = (userToEdit: User) => { // Changed parameter to User object
    if (userToEdit.role === 'admin') {
      const masterCode = window.prompt('Este es un usuario administrador. Por favor, introduce el código maestro para continuar:');
      if (masterCode !== '868686') {
        showToast('Código maestro incorrecto o acción cancelada.', 'error');
        return;
      }
    }
    setEditingUser(userToEdit);
    setIsEditModalOpen(true);
  };

  const handleAddUser = () => {
    setIsAddModalOpen(true);
  };

  if (loading) return <div className="py-4 text-center">Cargando usuarios...</div>;
  if (error) return <div className="py-4 text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-gray-800">Administración de Usuarios</h2>
      <div className="mb-4 flex justify-end">
        <button
          onClick={handleAddUser}
          className="inline-flex items-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
        >
          Crear Usuario
        </button>
      </div>

      

      {/* User List */}
      <h3 className="mb-4 text-xl font-semibold text-gray-700">Lista de Usuarios</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Username
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rol
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {users.map((user) => (
              <tr key={user._id}>
                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                  {user.username}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {user.role === 'admin' ? 'Administrador' : 'Usuario'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                    user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.status === 'active' ? 'Activo' : 'Bloqueado'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                  <button
                    onClick={() => handleEditUser(user)}
                    className="mr-3 rounded bg-blue-100 p-1 text-blue-600 hover:text-blue-900"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleUpdateUserStatus(user)}
                    className={`mr-3 text-indigo-600 hover:text-indigo-900 ${user.status === 'active' ? 'bg-red-100' : 'bg-green-100'} rounded p-1`}
                  >
                    {user.status === 'active' ? 'Bloquear' : 'Activar'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user._id!)}
                    className="rounded bg-red-100 p-1 text-red-600 hover:text-red-900"
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

      {isAddModalOpen && (
        <AddUserModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          authFetch={authFetch}
          onUserAdded={fetchUsers}
        />
      )}
    </>
  );
};

export default UsersAdminView;
