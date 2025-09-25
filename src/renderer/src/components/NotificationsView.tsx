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
    <div className="container mx-auto rounded-lg bg-white p-6 shadow-lg">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-800">Notificaciones</h1>
        {notifications.length > 0 && (
          <button 
            onClick={onClearNotifications}
            className="rounded-lg bg-red-500 px-4 py-2 font-bold text-white transition-colors duration-200 hover:bg-red-600"
          >
            Limpiar Todas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-12 text-center">
          <Bell size={48} className="mx-auto text-gray-400" />
          <p className="mt-4 text-lg text-gray-600">No tienes notificaciones nuevas.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {notifications.map(notification => (
            <li 
              key={notification._id} // Use _id for the key
              onClick={() => onNotificationClick(notification)}
              className={`flex cursor-pointer items-start space-x-4 rounded-lg p-4 shadow transition-all duration-300 ${notification.read ? 'bg-gray-100 hover:bg-gray-200' : 'bg-blue-100 hover:bg-blue-200'}`}>
              <div className={`mt-1 rounded-full p-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`}>
                <Bell size={20} className={`${notification.read ? 'text-gray-600' : 'text-white'}`} />
              </div>
              <div className="grow">
                <p className={`font-semibold ${notification.read ? 'text-gray-700' : 'text-gray-900'}`}>{notification.message}</p>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock size={14} className="mr-1.5" />
                  <span>Hace {timeSince(notification.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent onNotificationClick from firing
                  onDeleteNotification(notification._id); // Use _id to delete
                }}
                className="ml-4 text-red-500 hover:text-red-700"
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
