import React, { useState, useEffect, useCallback } from 'react';
import { User } from '../../types';
import { Shield, Trash2 } from 'lucide-react';
import { useUI } from '../context/UIContext'; // Importar el hook de UI

const API_URL = import.meta.env.VITE_API_URL;

const UsersAdminView: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { showToast, authFetch } = useUI(); // Obtener la función para mostrar notificaciones y authFetch

  const fetchUsers = useCallback(async () => {
    try {
      const response = await authFetch(`${API_URL}/users`);
      if (!response.ok) {
        throw new Error('No se pudo obtener la lista de usuarios.');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    }
  }, [authFetch, showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleBlock = async (user: User) => {
    const newStatus = user.status === 'active' ? 'blocked' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'bloquear';

    if (window.confirm(`¿Estás seguro de que quieres ${actionText} a ${user.username}?`)) {
      try {
        const response = await authFetch(`${API_URL}/users/${user._id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error('No se pudo actualizar el estado del usuario.');
        }

        const updatedUser = await response.json();
        setUsers(users.map(u => u._id === updatedUser._id ? updatedUser : u));
        showToast(`Usuario ${updatedUser.username} ha sido ${actionText === 'activar' ? 'activado' : 'bloqueado'}.`, 'success');
      } catch (err: any) {
        setError(err.message);
        showToast(err.message, 'error');
      }
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const userToDelete = users.find(u => u._id === userId);
    if (!userToDelete) return;

    if (window.confirm(`¿Estás seguro de que quieres eliminar permanentemente a ${userToDelete.username}? Esta acción no se puede deshacer.`)) {
      try {
        const response = await authFetch(`${API_URL}/users/${userId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('No se pudo eliminar el usuario.');
        }

        setUsers(users.filter(u => u._id !== userId));
        showToast(`Usuario ${userToDelete.username} eliminado con éxito.`, 'success');
      } catch (err: any) {
        setError(err.message);
        showToast(err.message, 'error');
      }
    }
  };

  if (error && users.length === 0) {
    return <div className="text-red-500 text-center p-4">Error: {error}</div>;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl">
      <h2 className="text-3xl font-bold text-gray-800 mb-6">Administración de Usuarios</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-800 text-white">
            <tr>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Username</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Rol</th>
              <th className="text-left py-3 px-4 uppercase font-semibold text-sm">Estado</th>
              <th className="text-center py-3 px-4 uppercase font-semibold text-sm">Acciones</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {users.map((user) => (
              <tr key={user._id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-4">{user.username}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.role === 'admin' ? 'bg-purple-200 text-purple-800' : 'bg-blue-200 text-blue-800'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${user.status === 'active' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                    {user.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  <button 
                    onClick={() => handleToggleBlock(user)}
                    className="text-yellow-500 hover:text-yellow-700 p-2 rounded-full transition-colors duration-200 mr-2"
                    title={user.status === 'active' ? 'Bloquear Usuario' : 'Activar Usuario'}
                    disabled={user.role === 'admin'} // Deshabilitar para el admin
                  >
                    <Shield size={18} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user._id!)}
                    className="text-red-500 hover:text-red-700 p-2 rounded-full transition-colors duration-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                    title="Eliminar Usuario"
                    disabled={user.role === 'admin'} // Deshabilitar para el admin
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersAdminView;