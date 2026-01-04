import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Check, Trash2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import NotificationItem from '../components/NotificationItem';

// Group notifications by date
const groupNotificationsByDate = (notifications: any[]) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: { [key: string]: any[] } = {
    'Today': [],
    'Yesterday': [],
    'Earlier': []
  };

  notifications.forEach(notification => {
    const notifDate = new Date(notification.createdAt);
    notifDate.setHours(0, 0, 0, 0);

    if (notifDate.getTime() === today.getTime()) {
      groups['Today'].push(notification);
    } else if (notifDate.getTime() === yesterday.getTime()) {
      groups['Yesterday'].push(notification);
    } else {
      groups['Earlier'].push(notification);
    }
  });

  return groups;
};

const Notifications: React.FC = () => {
  const {
    notifications,
    unreadNotificationCount,
    markAllNotificationsAsRead,
    deleteNotification
  } = useStore();

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="min-h-screen bg-[#FFFCF9]">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#FFFCF9] border-b border-[#E8DDD4]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="p-2 -ml-2 rounded-full hover:bg-[#F5EDE6] transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-[#4A3F37]" />
            </Link>
            <h1 className="font-serif text-xl font-semibold text-[#4A3F37]">
              Notifications
            </h1>
            {unreadNotificationCount > 0 && (
              <span className="bg-[#E8725C] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unreadNotificationCount}
              </span>
            )}
          </div>

          {unreadNotificationCount > 0 && (
            <button
              onClick={() => markAllNotificationsAsRead()}
              className="text-sm text-[#2D9B8C] hover:text-[#247A6F] flex items-center gap-1.5 font-medium"
            >
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Mark all read</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto">
        {notifications.length === 0 ? (
          /* Empty State */
          <div className="py-20 px-4 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#F5EDE6] flex items-center justify-center">
              <Bell className="w-10 h-10 text-[#B8A395]" />
            </div>
            <h2 className="font-serif text-xl font-semibold text-[#4A3F37] mb-2">
              No notifications yet
            </h2>
            <p className="text-[#9A8578] max-w-xs mx-auto">
              When you get messages, offers, or updates about your transactions, they'll appear here.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-[#2D9B8C] text-white font-semibold rounded-full hover:bg-[#247A6F] transition-colors"
            >
              Browse Listings
            </Link>
          </div>
        ) : (
          /* Grouped Notifications */
          <div className="pb-24 lg:pb-8">
            {Object.entries(groupedNotifications).map(([group, items]) => {
              if (items.length === 0) return null;

              return (
                <div key={group}>
                  <div className="px-4 py-2 bg-[#F5EDE6]/50 sticky top-[73px] z-10">
                    <h2 className="text-xs font-semibold text-[#9A8578] uppercase tracking-wide">
                      {group}
                    </h2>
                  </div>
                  <div className="divide-y divide-[#F5EDE6]">
                    {items.map(notification => (
                      <div key={notification.id} className="relative group">
                        <NotificationItem notification={notification} />
                        {/* Delete button on hover */}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white shadow-sm border border-[#E8DDD4] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:border-red-200"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4 text-[#9A8578] hover:text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
