import React from 'react';
import { PlusCircle, List, History, Stethoscope, FileText, LogOut, Bell, Users } from 'lucide-react';
import { Notification, User } from '../../types'; // Assuming types are in this location
import CecatLogo from './CecatLogo';

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: User | null;
  handleLogout: () => void;
  notifications: Notification[];
  markNotificationsAsRead: () => Promise<void>;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setCurrentView, currentUser, handleLogout, notifications, markNotificationsAsRead }) => {
  const unreadNotificationsCount = notifications.filter((n) => !n.read).length;

  const navItems = [
    { view: 'createOrder', icon: PlusCircle, label: 'Crear Orden' },
    { view: 'existingOrders', icon: List, label: 'Órdenes Existentes' },
    { view: 'historyOrders', icon: History, label: 'Historial de Órdenes' },
    { view: 'doctors', icon: Stethoscope, label: 'Doctores' },
    { view: 'reports', icon: FileText, label: 'Reportes' },
  ];

  return (
    <aside className="flex w-64 flex-col bg-gray-800 p-4 text-white shadow-lg">
      <div className="mb-8 flex items-center justify-center">
        <CecatLogo className="h-auto w-40 text-white" />
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex w-full items-center rounded-lg p-3 transition-colors duration-200 ${currentView === view ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
            title={label}
          >
            <Icon className="mr-3 size-5" />
            <span>{label}</span>
          </button>
        ))}

        {/* Admin-only User Management Button */}
        {currentUser && currentUser.role === 'admin' && (
          <button
            key="usersAdmin"
            onClick={() => setCurrentView('usersAdmin')}
            className={`flex w-full items-center rounded-lg p-3 transition-colors duration-200 ${currentView === 'usersAdmin' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
            title="Adm. Usuarios"
          >
            <Users className="mr-3 size-5" />
            <span>Adm. Usuarios</span>
          </button>
        )}
        
        {/* Notifications Button - Standalone */}
        <button
          onClick={() => {
            setCurrentView('notifications');
            if (unreadNotificationsCount > 0) {
              markNotificationsAsRead();
            }
          }}
          className={`flex w-full items-center rounded-lg p-3 transition-colors duration-200 ${currentView === 'notifications' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700'}`}
          title="Notificaciones"
        >
          <div className="relative mx-auto"> {/* Centering the icon */}
            <Bell className={`size-6 ${unreadNotificationsCount > 0 ? 'animate-pulse text-red-400' : 'text-gray-400'}`} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -right-2 -top-1 flex size-5 items-center justify-center rounded-full border-2 border-gray-800 bg-red-600 text-xs font-bold text-white">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
        </button>
      </nav>

      <div className="mt-auto border-t border-gray-700 pt-4">
        <div className="mb-4 flex items-center px-2">
          <span className="text-sm text-gray-400">Usuario: {currentUser ? currentUser.username : 'Invitado'}</span>
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
