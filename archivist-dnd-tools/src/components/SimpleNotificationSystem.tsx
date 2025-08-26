/**
 * Simple notification system using the simplified store
 */

import React from 'react';
import { useSimpleStore } from '../store/simpleStore';

export const SimpleNotificationSystem: React.FC = () => {
  const notifications = useSimpleStore((state) => state.notifications);
  const removeNotification = useSimpleStore((state) => state.removeNotification);

  if (notifications.length === 0) {
    return null;
  }

  const getNotificationStyles = (type: string) => {
    const baseStyles = 'p-4 rounded-lg shadow-lg flex items-center justify-between max-w-sm w-full';
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border border-yellow-200 text-yellow-800`;
      case 'info':
      default:
        return `${baseStyles} bg-blue-50 border border-blue-200 text-blue-800`;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={getNotificationStyles(notification.type)}
        >
          <div className="flex items-center">
            <span className="mr-2">{getIcon(notification.type)}</span>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
};