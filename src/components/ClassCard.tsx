import React from 'react';
import { ClassItem } from '../types';
import { formatReminderLabel, getSubjectEmoji } from '../utils/scheduleUtils';
import { PawPrintIcon } from './CatIllustrations';

interface ClassCardProps {
  item: ClassItem;
  onSelect?: (item: ClassItem) => void;
  onEdit: (item: ClassItem) => void;
  onDelete: (item: ClassItem) => void;
  showDayLabel?: boolean;
}

const PASTEL_ACCENTS = [
  {
    bg: 'bg-[#FFFDF9]',
    border: 'border-[#BCE3F5]',
    stripe: 'bg-[#D6F0FE]',
    paw: 'text-[#89C9E8]',
  },
  {
    bg: 'bg-[#FFFDF9]',
    border: 'border-[#C5E8D5]',
    stripe: 'bg-[#D8F5E5]',
    paw: 'text-[#82CFA9]',
  },
  {
    bg: 'bg-[#FFFDF9]',
    border: 'border-[#D8CEF8]',
    stripe: 'bg-[#EBE5FF]',
    paw: 'text-[#A996F0]',
  },
  {
    bg: 'bg-[#FFFDF9]',
    border: 'border-[#FAD2DC]',
    stripe: 'bg-[#FFE5EC]',
    paw: 'text-[#F29CB3]',
  },
];

export const ClassCard: React.FC<ClassCardProps> = ({
  item,
  onSelect,
  onEdit,
  onDelete,
  showDayLabel = false,
}) => {
  const emoji = getSubjectEmoji(item.subjectName);
  const colorIndex =
    item.subjectName
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
    PASTEL_ACCENTS.length;
  const theme = PASTEL_ACCENTS[colorIndex];

  return (
    <div
      onClick={() => onSelect && onSelect(item)}
      className={`relative overflow-hidden ${theme.bg} border-2 ${theme.border} hover:border-[#4A4453] rounded-[28px] p-4 sm:p-5 cozy-card transition-all ${
        onSelect ? 'cursor-pointer' : ''
      }`}
    >
      {/* Cute decorative top pastel bar */}
      <div className={`h-2 w-16 rounded-full ${theme.stripe} mb-3`} />

      {/* Subtle corner paw print */}
      <div className={`absolute top-4 right-4 opacity-35 ${theme.paw} pointer-events-none`}>
        <PawPrintIcon className="w-6 h-6 rotate-12" />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3.5">
        {/* Left Info Column */}
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2 text-xs font-bold text-[#7A7284]">
            <span className="font-mono tabular-nums text-[#4A4453] font-bold text-sm">
              ⏰ {item.startTime} – {item.endTime}
            </span>
            {showDayLabel && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#6E6678] font-bold">{item.dayOfWeek}</span>
              </>
            )}
          </div>

          <h3 className="text-lg sm:text-xl font-bold text-[#4A4453] leading-snug break-words">
            <span className="mr-2" aria-hidden="true">
              {emoji}
            </span>
            {item.subjectName}
          </h3>

          <div className="pt-1 space-y-1 text-sm font-semibold text-[#5E5668]">
            {item.room && (
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true">📍</span>
                <span>
                  {item.room.toLowerCase().startsWith('phòng')
                    ? item.room
                    : `Phòng ${item.room}`}
                </span>
              </p>
            )}
            {item.teacher && (
              <p className="flex items-center gap-1.5">
                <span aria-hidden="true">👩‍🏫</span>
                <span>{item.teacher}</span>
              </p>
            )}
            <p className="flex items-center gap-1.5 text-xs font-bold text-[#7A7284] pt-0.5">
              <span aria-hidden="true">🔔</span>
              <span>{formatReminderLabel(item.reminderMinutes)}</span>
            </p>
          </div>

          {item.notes && item.notes.trim() !== '' && (
            <p className="text-xs font-semibold text-[#6E6678] pt-2.5 border-t-2 border-dashed border-[#F2E6E8] mt-2 line-clamp-2">
              📝 Ghi chú: {item.notes}
            </p>
          )}
        </div>

        {/* Right Action Buttons */}
        <div
          className="flex items-center gap-2 pt-2.5 sm:pt-0 border-t-2 border-dashed sm:border-t-0 border-[#F2E6E8] shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#D6F0FE] hover:bg-[#BCE4FA] border-2 border-[#4A4453] text-[#4A4453] text-xs font-bold cozy-btn whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span aria-hidden="true">✏️</span>
            <span>Sửa</span>
          </button>
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="min-h-[44px] px-4 py-2 rounded-2xl bg-[#FFE0E6] hover:bg-[#FFCCD6] border-2 border-[#4A4453] text-[#4A4453] text-xs font-bold cozy-btn whitespace-nowrap cursor-pointer flex items-center gap-1.5"
          >
            <span aria-hidden="true">🗑️</span>
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  );
};

