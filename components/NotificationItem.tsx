import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, DollarSign, Package, UserPlus, Bell } from 'lucide-react';
import { Notification, NotificationType } from '../types';
import { useStore } from '../context/StoreContext';

interface NotificationItemProps {
  notification: Notification;
  onClose?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onClose }) => {
  const navigate = useNavigate();
  const { markNotificationAsRead } = useStore();

  // Get icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case NotificationType.NEW_MESSAGE:
        return <MessageCircle className="w-4 h-4" />;
      case NotificationType.OFFER_RECEIVED:
      case NotificationType.OFFER_ACCEPTED:
      case NotificationType.OFFER_DECLINED:
      case NotificationType.OFFER_COUNTERED:
        return <DollarSign className="w-4 h-4" />;
      case NotificationType.TRANSACTION_UPDATE:
        return <Package className="w-4 h-4" />;
      case NotificationType.NEW_FOLLOWER:
        return <UserPlus className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  // Get icon background color
  const getIconBg = () => {
    switch (notification.type) {
      case NotificationType.NEW_MESSAGE:
        return 'bg-blue-100 text-blue-600';
      case NotificationType.OFFER_RECEIVED:
        return 'bg-green-100 text-green-600';
      case NotificationType.OFFER_ACCEPTED:
        return 'bg-green-100 text-green-600';
      case NotificationType.OFFER_DECLINED:
        return 'bg-red-100 text-red-600';
      case NotificationType.OFFER_COUNTERED:
        return 'bg-amber-100 text-amber-600';
      case NotificationType.TRANSACTION_UPDATE:
        return 'bg-[#2D9B8C]/10 text-[#2D9B8C]';
      case NotificationType.NEW_FOLLOWER:
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle click - navigate to relevant page
  const handleClick = async () => {
    // Mark as read
    if (!notification.isRead) {
      await markNotificationAsRead(notification.id);
    }

    // Close dropdown if provided
    if (onClose) onClose();

    // Navigate based on reference type
    if (notification.referenceId && notification.referenceType) {
      switch (notification.referenceType) {
        case 'conversation':
          navigate(`/chat/${notification.referenceId}`);
          break;
        case 'listing':
          navigate(`/listing/${notification.referenceId}`);
          break;
        case 'transaction':
          navigate(`/transaction/${notification.referenceId}`);
          break;
        case 'user':
          navigate(`/user/${notification.referenceId}`);
          break;
        default:
          navigate('/notifications');
      }
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 p-3 text-left transition-colors hover:bg-[#F5EDE6] ${
        !notification.isRead ? 'bg-[#2D9B8C]/5' : ''
      }`}
    >
      {/* Avatar or Icon */}
      {notification.actorAvatarUrl ? (
        <img
          src={notification.actorAvatarUrl}
          alt={notification.actorName || 'User'}
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg()}`}>
          {getIcon()}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm ${!notification.isRead ? 'font-semibold text-[#4A3F37]' : 'text-[#4A3F37]'}`}>
          {notification.title}
        </p>
        <p className="text-xs text-[#9A8578] line-clamp-2 mt-0.5">
          {notification.message}
        </p>
        <p className="text-xs text-[#B8A395] mt-1">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notification.isRead && (
        <div className="w-2 h-2 rounded-full bg-[#2D9B8C] flex-shrink-0 mt-2" />
      )}
    </button>
  );
};

export default NotificationItem;
