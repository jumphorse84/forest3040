import React from 'react';
import { X, Bell, Heart, Calendar, FileText, CheckCircle2, Baby } from 'lucide-react';

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: string;
  createdAt: string;
  linkId?: string;
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onNotificationClick?: (notif: NotificationItem) => void;
}

export const NotificationModal = ({ isOpen, onClose, notifications, onNotificationClick }: NotificationModalProps) => {
  if (!isOpen) return null;

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'family_news':
        return <Heart className="text-secondary" size={20} />;
      case 'schedule':
        return <Calendar className="text-primary" size={20} />;
      case 'kids_care':
        return <Baby className="text-[#e27351]" size={20} />;
      case 'survey':
        return <FileText className="text-tertiary" size={20} />;
      default:
        return <Bell className="text-on-surface-variant" size={20} />;
    }
  };

  const getBgForCategory = (category: string) => {
    switch (category) {
      case 'family_news':
        return 'bg-secondary/10';
      case 'schedule':
        return 'bg-primary/10';
      case 'kids_care':
        return 'bg-[#ffefeb]';
      case 'survey':
        return 'bg-tertiary/10';
      default:
        return 'bg-surface-container-high';
    }
  };

  function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 7) {
      return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
    }
    if (diffDays > 0) return `${diffDays}일 전`;
    if (diffHours > 0) return `${diffHours}시간 전`;
    if (diffMins > 0) return `${diffMins}분 전`;
    return '방금 전';
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-surface rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-8 duration-300">
        
        {/* Handle Bar */}
        <div className="flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-10 h-1.5 bg-surface-container-high rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-1 shrink-0 border-b border-surface-container">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-headline font-bold text-on-surface">알림</h2>
            {notifications.length > 0 && (
              <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">
                {notifications.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto px-4 py-4 flex-1">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-on-surface-variant/60 py-20">
              <CheckCircle2 size={48} className="mb-4 text-surface-container-highest" />
              <p className="font-bold">최근 알림이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div 
                  key={notif.id} 
                  onClick={() => onNotificationClick && onNotificationClick(notif)}
                  className="flex gap-4 p-4 rounded-2xl bg-surface-container-lowest hover:bg-surface-container-low transition-colors cursor-pointer active:scale-[0.98]"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getBgForCategory(notif.category)}`}>
                    {getIconForCategory(notif.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface line-clamp-1">{notif.title}</p>
                    <p className="text-xs text-on-surface-variant mt-1 line-clamp-2 leading-relaxed">{notif.body || notif.message}</p>
                    <p className="text-[10px] font-medium text-outline mt-2">{formatTimeAgo(notif.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
