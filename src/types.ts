export type DayOfWeek =
  | 'Thứ 2'
  | 'Thứ 3'
  | 'Thứ 4'
  | 'Thứ 5'
  | 'Thứ 6'
  | 'Thứ 7'
  | 'Chủ nhật';

export type ReminderOption = 0 | 5 | 15 | 30 | 60;

export interface ClassItem {
  id: string;
  subjectName: string;
  dayOfWeek: DayOfWeek;
  startTime: string; // HH:mm format, e.g., "07:00"
  endTime: string;   // HH:mm format, e.g., "09:00"
  room: string;
  teacher: string;
  notes?: string;
  reminderMinutes: ReminderOption;
  createdAt: number;
}

export interface AppSettings {
  notificationsEnabled: boolean;
  defaultReminderMinutes: ReminderOption;
  permissionPromptDismissed: boolean;
}

export interface InAppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  classId?: string;
}

export type ActiveTab = 'home' | 'schedule' | 'add' | 'settings';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ nhật',
];

export const REMINDER_OPTIONS: { value: ReminderOption; label: string }[] = [
  { value: 0, label: 'Không nhắc' },
  { value: 5, label: '5 phút' },
  { value: 15, label: '15 phút' },
  { value: 30, label: '30 phút' },
  { value: 60, label: '1 tiếng (60 phút)' },
];
