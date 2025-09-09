import React from 'react';
import { Notification } from '../../types';
import { Bell, Clock, Trash2 } from 'lucide-react';

interface NotificationsViewProps {
  notifications: Notification[];
  onNotificationClick: (notification: Notification) => void;
  onClearNotifications: () => void;
  onDeleteNotification: (id: string) => void; // Add this
}

const NotificationsView: React.FC<NotificationsViewProps> = ({ notifications, onNotificationClick, onClearNotifications, onDeleteNotification }) => {

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutos";
    return Math.floor(seconds) + " segundos";
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Notificaciones</h1>
        {notifications.length > 0 && (
          <button 
            onClick={onClearNotifications}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
          >
            Limpiar Todas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell size={48} className="mx-auto text-gray-400" />
          <p className="mt-4 text-lg text-gray-600">No tienes notificaciones nuevas.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map(notification => (
            <li 
              key={notification.id}
              onClick={() => onNotificationClick(notification)}
              className={`p-4 rounded-lg shadow transition-all duration-300 cursor-pointer flex items-start space-x-4 ${notification.read ? 'bg-gray-100 hover:bg-gray-200' : 'bg-blue-100 hover:bg-blue-200'}`}>
              <div className={`mt-1 p-2 rounded-full ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`}>
                <Bell size={20} className={`${notification.read ? 'text-gray-600' : 'text-white'}`} />
              </div>
              <div className="flex-grow">
                <p className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.message}</p>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <Clock size={14} className="mr-1.5" />
                  <span>Hace {timeSince(notification.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent onNotificationClick from firing
                  onDeleteNotification(notification.id);
                }}
                className="text-red-500 hover:text-red-700 ml-4"
                title="Eliminar notificación"
              >
                <Trash2 size={20} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsView;
