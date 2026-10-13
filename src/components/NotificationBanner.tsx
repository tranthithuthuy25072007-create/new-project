import React from 'react';
import { Bell, X } from 'lucide-react';
import { InAppNotification } from '../types';
import { CuteCatBadge } from './CatIllustrations';

interface NotificationBannerProps {
  showPermissionPrompt: boolean;
  onAllowPermission: () => void;
  onDenyPermission: () => void;
  activeNotifications: InAppNotification[];
  onDismissNotification: (id: string) => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  showPermissionPrompt,
  onAllowPermission,
  onDenyPermission,
  activeNotifications,
  onDismissNotification,
}) => {
  return (
    <div className="space-y-3">
      {/* First-time Notification Permission Request Banner */}
      {showPermissionPrompt && (
        <div
          role="region"
          aria-label="Yêu cầu quyền thông báo"
          className="bg-[#FFFDF9] border-2 border-[#D8C8F8] rounded-[28px] p-4 sm:p-5 cozy-card transition-all"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 mt-0.5">
                <CuteCatBadge className="w-11 h-11" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-[#4A4453]">
                  Cho phép MyClass gửi thông báo để nhắc bạn về lịch học?
                </h2>
                <p className="text-xs sm:text-sm text-[#7A7284] mt-0.5 font-medium">
                  Mèo con sẽ nhắc bạn đúng giờ trước mỗi buổi học để không bao giờ trễ lớp nhé! 🐾
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:shrink-0">
              <button
                type="button"
                onClick={onAllowPermission}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#C8F2E0] hover:bg-[#B3EBD4] border-2 border-[#4A4453] text-[#3B3543] text-xs sm:text-sm font-bold cozy-btn whitespace-nowrap cursor-pointer"
              >
                🐾 Cho phép thông báo
              </button>
              <button
                type="button"
                onClick={onDenyPermission}
                className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#FFF5F5] hover:bg-[#FCE8E8] border-2 border-[#E2D4D8] text-[#6E6678] text-xs sm:text-sm font-bold transition-colors whitespace-nowrap cursor-pointer"
              >
                Không cho phép
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active In-App Reminder Alerts */}
      {activeNotifications.map((notif) => (
        <div
          key={notif.id}
          role="alert"
          className="bg-[#E5DEFF] text-[#4A4453] rounded-[26px] p-4 cozy-card border-2 border-[#4A4453] flex items-start justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FFFDF9] border-2 border-[#4A4453] flex items-center justify-center shrink-0 text-lg">
              🔔
            </div>
            <div>
              <p className="text-sm font-bold text-[#4A4453]">{notif.title}</p>
              <p className="text-sm font-semibold text-[#5C5366] mt-0.5">
                {notif.body}
              </p>
              <p className="text-xs text-[#7A7284] mt-1 font-mono tabular-nums">
                🐾 Lúc {notif.timestamp}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onDismissNotification(notif.id)}
            aria-label="Đóng thông báo"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center text-[#6E6678] hover:text-[#4A4453] rounded-2xl transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

