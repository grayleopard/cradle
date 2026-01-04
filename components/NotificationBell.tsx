import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import NotificationItem from './NotificationItem';

interface NotificationBellProps {
  isMobile?: boolean;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ isMobile = false }) => {
  const { notifications, unreadNotificationCount, markAllNotificationsAsRead } = useStore();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Mobile: just render a link to notifications page
  if (isMobile) {
    return (
      <Link to="/notifications" className="flex flex-col items-center gap-0.5 py-2">
        <div className="relative">
          <Bell className="w-6 h-6 text-[#B8A395]" />
          {unreadNotificationCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-[#E8725C] text-white text-[9px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
              {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
            </span>
          )}
        </div>
        <span className="text-[10px] text-[#B8A395]">Alerts</span>
      </Link>
    );
  }

  // Desktop: render bell with dropdown
  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 rounded-full transition-colors hover:bg-[#E8DDD4]"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-[#6B5D52]" />
        {unreadNotificationCount > 0 && (
          <span className="absolute top-0.5 right-0.5 bg-[#E8725C] text-white text-[10px] font-bold h-4 min-w-[16px] px-1 flex items-center justify-center rounded-full">
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] rounded-xl shadow-warm-lg border bg-white border-[#E8DDD4] overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DDD4]">
            <h3 className="font-serif font-semibold text-[#4A3F37]">Notifications</h3>
            {unreadNotificationCount > 0 && (
              <button
                onClick={() => markAllNotificationsAsRead()}
                className="text-xs text-[#2D9B8C] hover:text-[#247A6F] flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[50vh] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#F5EDE6] flex items-center justify-center">
                  <Bell className="w-6 h-6 text-[#B8A395]" />
                </div>
                <p className="text-[#9A8578] text-sm">No notifications yet</p>
                <p className="text-[#B8A395] text-xs mt-1">
                  We'll let you know when something happens
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#F5EDE6]">
                {notifications.slice(0, 10).map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClose={() => setShowDropdown(false)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer - See All */}
          {notifications.length > 0 && (
            <div className="border-t border-[#E8DDD4] p-2">
              <Link
                to="/notifications"
                onClick={() => setShowDropdown(false)}
                className="block w-full text-center py-2 text-sm text-[#2D9B8C] font-medium hover:bg-[#F5EDE6] rounded-lg transition-colors"
              >
                See all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
