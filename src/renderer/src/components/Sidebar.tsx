import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  PlusCircle,
  List,
  History,
  Stethoscope,
  FileText,
  LogOut,
  Bell,
  Users,
  BrainCircuit,
} from 'lucide-react';
import { Notification, User } from '../../types';
import CecatLogo from './CecatLogo';

interface SidebarProps {
  currentUser: User | null;
  handleLogout: () => void;
  notifications: Notification[];
  markNotificationsAsRead: () => Promise<void>;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  handleLogout,
  notifications,
  markNotificationsAsRead,
  isSidebarOpen,
  toggleSidebar,
}) => {
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { path: '/', icon: PlusCircle, label: 'Crear Orden' },
    { path: '/orders', icon: List, label: 'Órdenes Existentes' },
    { path: '/history', icon: History, label: 'Historial de Órdenes' },
    { path: '/doctors', icon: Stethoscope, label: 'Doctores' },
    { path: '/reports', icon: FileText, label: 'Reportes' },
  ].filter((item) => {
    if (item.path === '/reports' && currentUser?.role === 'operador') {
      return false;
    }
    return true;
  });

  const getNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex w-full items-center rounded-lg p-3 transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`;

  return (
    <aside
      className={`flex flex-col bg-gray-800 p-4 text-white shadow-lg
        md:w-64 md:relative md:translate-x-0
        fixed inset-y-0 z-50 h-screen w-64 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="mb-8 flex items-center justify-center">
        <img src="/vite.svg" alt="SINAPSIS Logo" className="h-10 w-auto" />
        {/* Close button for mobile sidebar */}
        <button
          onClick={toggleSidebar}
          className="md:hidden absolute top-4 right-4 p-2 rounded-md text-gray-400 hover:bg-gray-700"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M6 18L18 6M6 6l12 12"
            ></path>
          </svg>
        </button>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink key={path} to={path} className={getNavLinkClass} title={label}>
            <Icon className="mr-3 size-5" />
            <span>{label}</span>
          </NavLink>
        ))}

        {currentUser && (currentUser.role === 'admin' || currentUser.role === 'master') && (
          <NavLink to="/admin/users" className={getNavLinkClass} title="Adm. Usuarios">
            <Users className="mr-3 size-5" />
            <span>Adm. Usuarios</span>
          </NavLink>
        )}

        <NavLink
          to="/notifications"
          onClick={() => {
            if (unreadNotificationsCount > 0) {
              markNotificationsAsRead();
            }
          }}
          className={getNavLinkClass}
          title="Notificaciones"
        >
          <div className="relative mx-auto">
            {' '}
            {/* Centering the icon */}
            <Bell
              className={`size-6 ${unreadNotificationsCount > 0 ? 'animate-pulse text-red-400' : 'text-gray-400'}`}
            />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -right-2 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-gray-800 bg-red-600 text-xs font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
        </NavLink>
      </nav>

      <div className="mt-auto border-t border-gray-700 pt-4">
        <div className="mb-4 flex items-center px-2">
          <span className="text-sm text-gray-400">
            Usuario: {currentUser ? currentUser.username : 'Invitado'}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center rounded-lg p-3 text-gray-300 transition-colors duration-200 hover:bg-gray-700"
        >
          <LogOut className="mr-3 size-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
