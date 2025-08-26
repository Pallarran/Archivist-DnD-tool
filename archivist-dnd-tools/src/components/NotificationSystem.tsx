import React from 'react';
import { useUIStore } from '../store';

export const NotificationSystem: React.FC = () => {
  const { getNotifications, removeNotification } = useUIStore();
  const notifications = getNotifications();

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`max-w-sm px-4 py-3 rounded-lg shadow-lg ${
            notification.type === 'error'
              ? 'bg-red-600 text-white'
              : notification.type === 'warning'
              ? 'bg-yellow-500 text-white'
              : notification.type === 'success'
              ? 'bg-green-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{notification.message}</p>
            <button
              onClick={() => removeNotification(notification.id)}
              className="ml-2 text-white hover:text-gray-200 focus:outline-none"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};