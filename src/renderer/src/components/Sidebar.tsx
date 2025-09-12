import React from 'react';
import { PlusCircle, List, History, Stethoscope, FileText, LogOut, Bell, BrainCircuit, Users } from 'lucide-react';
import { Notification } from '../../types'; // Assuming types are in this location

interface SidebarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  currentUser: any; // Replace with a proper User type if available
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
    <aside className="w-64 bg-gray-800 text-white flex flex-col p-4 shadow-lg">
      <div className="flex items-center justify-center text-2xl font-orbitron font-bold mb-8 text-blue-400 tracking-wider">
        <BrainCircuit className="mr-3 h-8 w-8 text-white drop-shadow-rose-glow" />
                <span><span className="text-rose-400 text-4xl">S</span>INAPSIS</span>
      </div>

      <nav className="flex-1 space-y-2">
        {navItems.map(({ view, icon: Icon, label }) => (
          <button
            key={view}
            onClick={() => setCurrentView(view)}
            className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentView === view ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}
            title={label}
          >
            <Icon className="mr-3 h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}

        {/* Admin-only User Management Button */}
        {currentUser && currentUser.role === 'admin' && (
          <button
            key="usersAdmin"
            onClick={() => setCurrentView('usersAdmin')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentView === 'usersAdmin' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}
            title="Adm. Usuarios"
          >
            <Users className="mr-3 h-5 w-5" />
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
          className={`flex items-center w-full p-3 rounded-lg transition-colors duration-200 ${currentView === 'notifications' ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-700 text-gray-300'}`}
          title="Notificaciones"
        >
          <div className="relative mx-auto"> {/* Centering the icon */}
            <Bell className={`h-6 w-6 ${unreadNotificationsCount > 0 ? 'text-red-400 animate-pulse' : 'text-gray-400'}`} />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white border-2 border-gray-800">
                {unreadNotificationsCount}
              </span>
            )}
          </div>
        </button>
      </nav>

      <div className="mt-auto border-t border-gray-700 pt-4">
        <div className="flex items-center mb-4 px-2">
          <span className="text-gray-400 text-sm">Usuario: {currentUser ? currentUser.username : 'Invitado'}</span>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors duration-200"
        >
          <LogOut className="mr-3 h-5 w-5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
