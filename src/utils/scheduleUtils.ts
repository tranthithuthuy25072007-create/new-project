import { ClassItem, DayOfWeek, DAYS_OF_WEEK, ReminderOption } from '../types';

/**
 * Returns contextual subject emoji based on course name keywords.
 */
export function getSubjectEmoji(subjectName: string): string {
  const lower = subjectName.toLowerCase();
  if (lower.includes('hàn') || lower.includes('korea')) return '🇰🇷';
  if (lower.includes('anh') || lower.includes('english') || lower.includes('ielts') || lower.includes('toeic')) return '🇬🇧';
  if (lower.includes('nhật') || lower.includes('japan')) return '🇯🇵';
  if (lower.includes('trung') || lower.includes('hán') || lower.includes('china')) return '🇨🇳';
  if (lower.includes('pháp') || lower.includes('french')) return '🇫🇷';
  if (
    lower.includes('tin') ||
    lower.includes('lập trình') ||
    lower.includes('máy tính') ||
    lower.includes('code') ||
    lower.includes('web') ||
    lower.includes('cntt') ||
    lower.includes('it') ||
    lower.includes('phần mềm')
  ) {
    return '💻';
  }
  if (lower.includes('toán') || lower.includes('đại số') || lower.includes('giải tích') || lower.includes('xác suất')) return '📐';
  if (lower.includes('lý') || lower.includes('vật lý') || lower.includes('cơ học') || lower.includes('điện')) return '⚡';
  if (lower.includes('hóa') || lower.includes('sinh') || lower.includes('khoa học')) return '🧪';
  if (lower.includes('văn') || lower.includes('ngữ văn') || lower.includes('triết') || lower.includes('luật')) return '📖';
  if (lower.includes('sử') || lower.includes('địa')) return '🌍';
  if (lower.includes('kinh tế') || lower.includes('tài chính') || lower.includes('kế toán') || lower.includes('quản trị') || lower.includes('marketing')) return '📊';
  if (lower.includes('nhạc') || lower.includes('hát') || lower.includes('đàn') || lower.includes('piano') || lower.includes('guitar')) return '🎵';
  if (lower.includes('vẽ') || lower.includes('mỹ thuật') || lower.includes('thiết kế') || lower.includes('design')) return '🎨';
  if (lower.includes('thể dục') || lower.includes('thể thao') || lower.includes('bơi') || lower.includes('võ') || lower.includes('bóng')) return '🏃';
  return '📚';
}

/**
 * Maps JavaScript Date.getDay() (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
 * to our DayOfWeek type ('Thứ 2' ... 'Chủ nhật')
 */
export function getDayOfWeekFromDate(date: Date): DayOfWeek {
  const jsDay = date.getDay(); // 0 is Sunday
  if (jsDay === 0) return 'Chủ nhật';
  return DAYS_OF_WEEK[jsDay - 1];
}

/**
 * Formats full Vietnamese day name for header display:
 * e.g. 'Thứ 2' -> 'Thứ Hai', 'Thứ 3' -> 'Thứ Ba', etc.
 */
export function getFullDayLabel(day: DayOfWeek): string {
  switch (day) {
    case 'Thứ 2':
      return 'Thứ Hai';
    case 'Thứ 3':
      return 'Thứ Ba';
    case 'Thứ 4':
      return 'Thứ Tư';
    case 'Thứ 5':
      return 'Thứ Năm';
    case 'Thứ 6':
      return 'Thứ Sáu';
    case 'Thứ 7':
      return 'Thứ Bảy';
    case 'Chủ nhật':
      return 'Chủ Nhật';
  }
}

/**
 * Formats Date to DD/MM/YYYY
 */
export function formatDateVN(date: Date): string {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Converts "HH:mm" string to minutes since midnight (0 - 1439)
 */
export function timeToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return 0;
  return hours * 60 + minutes;
}

/**
 * Formats reminder minutes into Vietnamese display string
 */
export function formatReminderLabel(minutes: ReminderOption): string {
  if (!minutes || minutes === 0) return 'Không nhắc';
  if (minutes === 60) return 'Nhắc trước 1 tiếng (60 phút)';
  return `Nhắc trước ${minutes} phút`;
}

/**
 * Formats the exact reminder notification body required:
 * e.g. "🔔 Sắp đến giờ học! 1 tiếng nữa bạn có môn Tiếng Hàn 3 tại phòng B203."
 */
export function buildClassReminderMessage(
  subjectName: string,
  room: string,
  reminderMinutes: number
): { title: string; body: string; fullText: string } {
  const timeText =
    reminderMinutes === 60 ? '1 tiếng' : `${reminderMinutes} phút`;
  const cleanRoom = room ? room.trim().replace(/^phòng\s+/i, '') : '';
  const roomClause = cleanRoom ? ` tại phòng ${cleanRoom}` : '';
  const title = '🔔 Sắp đến giờ học!';
  const body = `${timeText} nữa bạn có môn ${subjectName}${roomClause}.`;
  return {
    title,
    body,
    fullText: `${title} ${body}`,
  };
}

/**
 * Sorts classes chronologically by start time
 */
export function sortClassesByTime(classes: ClassItem[]): ClassItem[] {
  return [...classes].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
}

/**
 * Finds the next upcoming class starting from `now`, looking at today first,
 * and if all of today's classes have already started/passed, looking ahead across the week.
 */
export function getNextUpcomingClassInfo(
  classes: ClassItem[],
  now: Date
): {
  nextClass: ClassItem;
  minutesUntil: number;
  isToday: boolean;
  dayDifference: number;
} | null {
  if (classes.length === 0) return null;

  const currentDay = getDayOfWeekFromDate(now);
  const currentDayIndex = DAYS_OF_WEEK.indexOf(currentDay);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  let bestCandidate: {
    nextClass: ClassItem;
    minutesUntil: number;
    isToday: boolean;
    dayDifference: number;
  } | null = null;

  for (const item of classes) {
    const itemDayIndex = DAYS_OF_WEEK.indexOf(item.dayOfWeek);
    const startMinutes = timeToMinutes(item.startTime);

    let dayDiff = itemDayIndex - currentDayIndex;
    let totalMinutesUntil = 0;

    if (dayDiff === 0) {
      if (startMinutes >= currentMinutes) {
        totalMinutesUntil = startMinutes - currentMinutes;
      } else {
        // Already started today, wraps to next week
        dayDiff = 7;
        totalMinutesUntil = 7 * 24 * 60 - (currentMinutes - startMinutes);
      }
    } else {
      if (dayDiff < 0) dayDiff += 7;
      totalMinutesUntil = dayDiff * 24 * 60 - currentMinutes + startMinutes;
    }

    if (!bestCandidate || totalMinutesUntil < bestCandidate.minutesUntil) {
      bestCandidate = {
        nextClass: item,
        minutesUntil: totalMinutesUntil,
        isToday: dayDiff === 0,
        dayDifference: dayDiff,
      };
    }
  }

  return bestCandidate;
}

/**
 * Formats remaining minutes into a human-friendly Vietnamese string
 */
export function formatRemainingTime(minutesUntil: number, dayDifference: number): string {
  if (minutesUntil === 0) {
    return 'Đang bắt đầu ngay bây giờ';
  }
  if (minutesUntil < 60) {
    return `Còn ${minutesUntil} phút`;
  }
  const hours = Math.floor(minutesUntil / 60);
  const mins = minutesUntil % 60;

  if (dayDifference === 0) {
    return mins > 0 ? `Còn ${hours} giờ ${mins} phút` : `Còn ${hours} giờ`;
  }

  const days = Math.floor(minutesUntil / (24 * 60));
  const remHours = Math.floor((minutesUntil % (24 * 60)) / 60);
  if (days === 1) {
    return remHours > 0 ? `Ngày mai (còn ${remHours} giờ)` : 'Ngày mai';
  }
  if (days > 1) {
    return `Còn ${days} ngày ${remHours > 0 ? `${remHours} giờ` : ''}`.trim();
  }
  return mins > 0 ? `Còn ${hours} giờ ${mins} phút` : `Còn ${hours} giờ`;
}
