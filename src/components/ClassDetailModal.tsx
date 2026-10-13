import React from 'react';
import { X } from 'lucide-react';
import { ClassItem } from '../types';
import { formatReminderLabel, getSubjectEmoji } from '../utils/scheduleUtils';
import { CuteCatBadge } from './CatIllustrations';

interface ClassDetailModalProps {
  item: ClassItem | null;
  onClose: () => void;
  onEdit: (item: ClassItem) => void;
  onDelete: (item: ClassItem) => void;
  onTestReminder?: (item: ClassItem) => void;
}

export const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
  item,
  onClose,
  onEdit,
  onDelete,
  onTestReminder,
}) => {
  if (!item) return null;

  const emoji = getSubjectEmoji(item.subjectName);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#4A4453]/40 backdrop-blur-xs p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-subject-title"
        className="w-full max-w-lg bg-[#FFFDF9] rounded-t-[32px] sm:rounded-[32px] p-6 cozy-card border-2 border-[#4A4453] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile grab handle */}
        <div className="w-12 h-1.5 bg-[#E6D5D8] rounded-full mx-auto mb-4 sm:hidden" />

        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <CuteCatBadge className="w-11 h-11 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#7A7284]">
                {item.dayOfWeek} ·{' '}
                <span className="font-mono tabular-nums text-[#4A4453]">
                  {item.startTime} – {item.endTime}
                </span>
              </p>
              <h2
                id="modal-subject-title"
                className="text-xl font-bold text-[#4A4453] mt-0.5"
              >
                <span className="mr-2" aria-hidden="true">
                  {emoji}
                </span>
                {item.subjectName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng chi tiết"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-2 flex items-center justify-center rounded-2xl text-[#7A7284] hover:text-[#4A4453] hover:bg-[#FFF0F3] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3 border-t-2 border-b-2 border-dashed border-[#EFE2E4] py-4 text-sm font-semibold text-[#5E5668]">
          <div className="flex items-center justify-between py-1">
            <span className="text-[#7A7284]">⏰ Thời gian học</span>
            <span className="font-mono tabular-nums font-bold text-[#4A4453]">
              {item.startTime} – {item.endTime} ({item.dayOfWeek})
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[#7A7284]">📍 Phòng học</span>
            <span className="font-bold text-[#4A4453]">
              {item.room || 'Chưa cập nhật'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[#7A7284]">👩‍🏫 Giảng viên</span>
            <span className="font-bold text-[#4A4453]">
              {item.teacher || 'Chưa cập nhật'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1">
            <span className="text-[#7A7284]">🔔 Nhắc giờ học</span>
            <span className="font-bold text-[#4A4453]">
              {formatReminderLabel(item.reminderMinutes)}
            </span>
          </div>

          {item.notes && item.notes.trim() !== '' && (
            <div className="pt-2 border-t-2 border-dashed border-[#EFE2E4]">
              <span className="text-xs font-bold text-[#7A7284] block mb-1.5">
                📝 Ghi chú môn học:
              </span>
              <p className="text-[#4A4453] bg-[#FFF5F5] border-2 border-[#F5E1E4] rounded-2xl p-3.5 text-sm whitespace-pre-wrap">
                {item.notes}
              </p>
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2.5">
          {onTestReminder && item.reminderMinutes > 0 ? (
            <button
              type="button"
              onClick={() => onTestReminder(item)}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#E5DEFF] hover:bg-[#D6CCFF] border-2 border-[#4A4453] text-[#4A4453] text-xs font-bold cozy-btn cursor-pointer whitespace-nowrap"
            >
              🔔 Nhắc thử môn này
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(item);
              }}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#D6F0FE] hover:bg-[#BCE4FA] border-2 border-[#4A4453] text-[#4A4453] text-sm font-bold cozy-btn cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <span aria-hidden="true">✏️</span>
              <span>Sửa</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onDelete(item);
              }}
              className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#FFE0E6] hover:bg-[#FFCCD6] border-2 border-[#4A4453] text-[#4A4453] text-sm font-bold cozy-btn cursor-pointer whitespace-nowrap flex items-center gap-1.5"
            >
              <span aria-hidden="true">🗑️</span>
              <span>Xóa</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

