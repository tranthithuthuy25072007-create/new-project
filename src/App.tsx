/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Home, Calendar, PlusCircle, Settings, Search, X } from 'lucide-react';
import {
  ActiveTab,
  AppSettings,
  ClassItem,
  DayOfWeek,
  DAYS_OF_WEEK,
  InAppNotification,
  REMINDER_OPTIONS,
  ReminderOption,
} from './types';
import {
  buildClassReminderMessage,
  formatDateVN,
  formatRemainingTime,
  getDayOfWeekFromDate,
  getFullDayLabel,
  getNextUpcomingClassInfo,
  getSubjectEmoji,
  sortClassesByTime,
  timeToMinutes,
} from './utils/scheduleUtils';
import { NotificationBanner } from './components/NotificationBanner';
import { ClassCard } from './components/ClassCard';
import { ClassDetailModal } from './components/ClassDetailModal';
import {
  SleepingCatIllustration,
  StudyCatIllustration,
  PawPrintIcon,
} from './components/CatIllustrations';
import {
  registerFCMAndGetToken,
  subscribeForegroundFCMMessages,
  firebaseConfig,
} from './firebase';

const STORAGE_CLASSES_KEY = 'myclass_schedules_v1';
const STORAGE_SETTINGS_KEY = 'myclass_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  defaultReminderMinutes: 60,
  permissionPromptDismissed: false,
};

export default function App() {
  // 1. Load classes from localStorage (no fake data if user hasn't added any)
  const [classes, setClasses] = useState<ClassItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_CLASSES_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  // 2. Load settings from localStorage
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (!raw) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // 3. Navigation & UI state
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDayFilter, setSelectedDayFilter] = useState<'ALL' | DayOfWeek>('ALL');

  // 4. Form State (Add / Edit)
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [subjectName, setSubjectName] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('Thứ 2');
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('09:00');
  const [room, setRoom] = useState('');
  const [teacher, setTeacher] = useState('');
  const [notes, setNotes] = useState('');
  const [reminderMinutes, setReminderMinutes] = useState<ReminderOption>(60);
  const [formError, setFormError] = useState<string | null>(null);

  // 5. Modals State
  const [detailClass, setDetailClass] = useState<ClassItem | null>(null);
  const [classToDelete, setClassToDelete] = useState<ClassItem | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  // 6. Notifications, Service Worker, Firebase Cloud Messaging (FCM) & Reminder Tracking
  const [activeNotifications, setActiveNotifications] = useState<InAppNotification[]>([]);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [fcmStatusMsg, setFcmStatusMsg] = useState<string>('Đang khởi tạo kết nối Firebase...');
  const [tokenCopied, setTokenCopied] = useState<boolean>(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission | 'unsupported'>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  const firedRemindersRef = useRef<Set<string>>(new Set());

  // Register Firebase Messaging Service Worker (/firebase-messaging-sw.js) & Foreground Listener
  useEffect(() => {
    let unsubForeground: (() => void) | null = null;

    const initFCM = async () => {
      const res = await registerFCMAndGetToken();
      if (res.registration) {
        setSwRegistration(res.registration);
      }
      if (res.token) {
        setFcmToken(res.token);
        setFcmStatusMsg('Đã kết nối Firebase Cloud Messaging (FCM) thành công!');
      } else if (res.error) {
        setFcmStatusMsg(res.error);
      }

      unsubForeground = await subscribeForegroundFCMMessages(({ title, body }) => {
        triggerNotification(title, body);
      });
    };

    initFCM();

    return () => {
      if (unsubForeground) unsubForeground();
    };
  }, []);

  // Persist classes to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CLASSES_KEY, JSON.stringify(classes));
    } catch {
      // Ignore storage quota errors
    }
  }, [classes]);

  // Persist settings to localStorage whenever modified
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore storage quota errors
    }
  }, [settings]);

  // Helper to dispatch Service Worker notification, Browser Notification API, and In-App Notification
  const triggerNotification = (title: string, body: string, classId?: string) => {
    const nowStr = new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const tag = classId || `myclass-${Date.now()}`;

    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      if (swRegistration && 'showNotification' in swRegistration) {
        swRegistration
          .showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            tag,
          })
          .catch(() => {
            try {
              new Notification(title, { body, tag });
            } catch {
              // Fallback below
            }
          });
      } else if (navigator.serviceWorker?.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'SHOW_SW_NOTIFICATION',
          payload: { title, body, tag },
        });
      } else {
        try {
          new Notification(title, { body, tag });
        } catch {
          // Fallback below
        }
      }
    }

    const newNotif: InAppNotification = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      body,
      timestamp: nowStr,
      classId,
    };
    setActiveNotifications((prev) => [newNotif, ...prev.slice(0, 4)]);
  };

  // Clock & Reminder Engine (checks every 15 seconds)
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      setCurrentTime(now);

      if (!settings.notificationsEnabled) return;

      const todayDay = getDayOfWeekFromDate(now);
      const dateStr = formatDateVN(now);
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      classes.forEach((item) => {
        if (item.dayOfWeek !== todayDay) return;
        if (!item.reminderMinutes || item.reminderMinutes === 0) return;

        const startMins = timeToMinutes(item.startTime);
        const diff = startMins - nowMinutes;

        // Trigger when remaining minutes matches reminderMinutes (e.g., 60 mins = 1 hour before class)
        if (diff === item.reminderMinutes) {
          const reminderKey = `${item.id}_${dateStr}_${item.reminderMinutes}`;
          if (!firedRemindersRef.current.has(reminderKey)) {
            firedRemindersRef.current.add(reminderKey);
            const msg = buildClassReminderMessage(
              item.subjectName,
              item.room,
              item.reminderMinutes
            );
            triggerNotification(msg.title, msg.body, item.id);
          }
        }
      });
    };

    checkReminders();
    const timer = setInterval(checkReminders, 15000);
    return () => clearInterval(timer);
  }, [classes, settings.notificationsEnabled, swRegistration]);

  // Request Browser Notification Permission & Fetch FCM Token
  const handleAllowPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const result = await Notification.requestPermission();
        setBrowserPermission(result);
        setSettings((prev) => ({
          ...prev,
          notificationsEnabled: result !== 'denied',
          permissionPromptDismissed: true,
        }));
        if (result === 'granted') {
          const fcmRes = await registerFCMAndGetToken();
          if (fcmRes.registration) setSwRegistration(fcmRes.registration);
          if (fcmRes.token) {
            setFcmToken(fcmRes.token);
            setFcmStatusMsg('Đã kết nối Firebase Cloud Messaging (FCM) thành công!');
          } else if (fcmRes.error) {
            setFcmStatusMsg(fcmRes.error);
          }
        }
      } catch {
        setSettings((prev) => ({
          ...prev,
          permissionPromptDismissed: true,
        }));
      }
    } else {
      setSettings((prev) => ({
        ...prev,
        permissionPromptDismissed: true,
      }));
    }
  };

  const handleDenyPermission = () => {
    setSettings((prev) => ({
      ...prev,
      permissionPromptDismissed: true,
    }));
  };

  // Prepare Form for Adding a New Class
  const openAddForm = (presetDay?: DayOfWeek) => {
    setEditingClass(null);
    setSubjectName('');
    setDayOfWeek(presetDay || 'Thứ 2');
    setStartTime('07:00');
    setEndTime('09:00');
    setRoom('');
    setTeacher('');
    setNotes('');
    setReminderMinutes(settings.defaultReminderMinutes);
    setFormError(null);
    setActiveTab('add');
  };

  // Prepare Form for Editing an Existing Class
  const openEditForm = (item: ClassItem) => {
    setEditingClass(item);
    setSubjectName(item.subjectName);
    setDayOfWeek(item.dayOfWeek);
    setStartTime(item.startTime);
    setEndTime(item.endTime);
    setRoom(item.room);
    setTeacher(item.teacher);
    setNotes(item.notes || '');
    setReminderMinutes(item.reminderMinutes);
    setFormError(null);
    setActiveTab('add');
  };

  // Handle Form Save
  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = subjectName.trim();
    if (!trimmedName) {
      setFormError('Vui lòng nhập tên môn học.');
      return;
    }
    if (!startTime || !endTime) {
      setFormError('Vui lòng nhập giờ bắt đầu và giờ kết thúc.');
      return;
    }
    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setFormError('Giờ kết thúc phải lớn hơn giờ bắt đầu.');
      return;
    }

    if (editingClass) {
      const updatedItem: ClassItem = {
        ...editingClass,
        subjectName: trimmedName,
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim(),
        teacher: teacher.trim(),
        notes: notes.trim(),
        reminderMinutes,
      };
      setClasses((prev) =>
        prev.map((c) => (c.id === editingClass.id ? updatedItem : c))
      );
      setEditingClass(null);
    } else {
      const newItem: ClassItem = {
        id: `class_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        subjectName: trimmedName,
        dayOfWeek,
        startTime,
        endTime,
        room: room.trim(),
        teacher: teacher.trim(),
        notes: notes.trim(),
        reminderMinutes,
        createdAt: Date.now(),
      };
      setClasses((prev) => [...prev, newItem]);
    }

    setActiveTab('schedule');
  };

  // Confirm Single Class Deletion
  const handleConfirmDeleteSingle = () => {
    if (!classToDelete) return;
    setClasses((prev) => prev.filter((c) => c.id !== classToDelete.id));
    if (detailClass?.id === classToDelete.id) {
      setDetailClass(null);
    }
    setClassToDelete(null);
  };

  // Confirm Clear All Classes
  const handleConfirmClearAll = () => {
    setClasses([]);
    setConfirmClearAll(false);
    setDetailClass(null);
  };

  // Derived data for Home & Schedule views
  const todayDayOfWeek = getDayOfWeekFromDate(currentTime);
  const fullDayName = getFullDayLabel(todayDayOfWeek);
  const formattedDate = formatDateVN(currentTime);
  const normalizedQuery = searchQuery.trim().toLowerCase();

  const searchFilteredClasses = normalizedQuery
    ? classes.filter((c) => c.subjectName.toLowerCase().includes(normalizedQuery))
    : classes;

  const todayClasses = sortClassesByTime(
    searchFilteredClasses.filter((c) => c.dayOfWeek === todayDayOfWeek)
  );

  const upcomingInfo = getNextUpcomingClassInfo(classes, currentTime);

  const showPermissionBanner =
    !settings.permissionPromptDismissed &&
    browserPermission === 'default' &&
    settings.notificationsEnabled;

  return (
    <div className="min-h-screen bg-transparent text-[#4A4453] pb-28 flex flex-col">
      {/* Top Navigation Bar following 3-Zone Contract */}
      <header className="sticky top-0 z-30 bg-[#FFFDF9]/95 backdrop-blur-md border-b-2 border-[#EFE2E4] px-4 sm:px-6 h-16 flex items-center justify-between">
        <a
          href="#home"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('home');
          }}
          className="text-xl font-bold tracking-tight text-[#4A4453] font-display"
        >
          🐾 MyClass
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-bold text-[#7A7284]">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`hover:text-[#4A4453] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'home'
                ? 'text-[#4A4453] underline decoration-2 decoration-[#F4A7B9] underline-offset-4'
                : ''
            }`}
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedule')}
            className={`hover:text-[#4A4453] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'schedule'
                ? 'text-[#4A4453] underline decoration-2 decoration-[#F4A7B9] underline-offset-4'
                : ''
            }`}
          >
            Lịch học
          </button>
          <button
            type="button"
            onClick={() => openAddForm()}
            className={`hover:text-[#4A4453] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'add'
                ? 'text-[#4A4453] underline decoration-2 decoration-[#F4A7B9] underline-offset-4'
                : ''
            }`}
          >
            Thêm
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`hover:text-[#4A4453] transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'settings'
                ? 'text-[#4A4453] underline decoration-2 decoration-[#F4A7B9] underline-offset-4'
                : ''
            }`}
          >
            Cài đặt
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => openAddForm()}
            className="min-h-[40px] px-4 py-2 rounded-2xl bg-[#C8F2E0] hover:bg-[#B3EBD4] border-2 border-[#4A4453] text-[#4A4453] text-xs font-bold cozy-btn cursor-pointer whitespace-nowrap"
          >
            + Thêm lịch học
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 pt-6 flex-1 space-y-6">
        {/* Notification Permission & Active Reminders */}
        <NotificationBanner
          showPermissionPrompt={showPermissionBanner}
          onAllowPermission={handleAllowPermission}
          onDenyPermission={handleDenyPermission}
          activeNotifications={activeNotifications}
          onDismissNotification={(id) =>
            setActiveNotifications((prev) => prev.filter((n) => n.id !== id))
          }
        />

        {/* Search Bar (Visible on Home & Schedule views) */}
        {(activeTab === 'home' || activeTab === 'schedule') && (
          <div className="relative">
            <Search className="w-4 h-4 text-[#9B91A6] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="🐾 Tìm kiếm môn học theo tên (ví dụ: Tiếng Hàn)..."
              aria-label="Tìm kiếm môn học theo tên"
              className="w-full min-h-[48px] pl-11 pr-10 py-2.5 bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[24px] text-sm font-semibold text-[#4A4453] placeholder:text-[#A49BAE] focus:outline-none focus:border-[#4A4453] cozy-card transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa tìm kiếm"
                className="min-h-[44px] min-w-[44px] absolute right-1 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#8B8296] hover:text-[#4A4453] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        )}

        {/* ==================== GIAO DIỆN 1: TRANG CHỦ ==================== */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            {/* Current Date & Next Upcoming Class Card with Cute Sleeping Cat */}
            <div className="relative bg-[#FFFDF9] border-2 border-[#4A4453] rounded-[32px] p-5 sm:p-7 cozy-card overflow-hidden">
              {/* Soft Pastel Background Blobs */}
              <div className="w-36 h-36 rounded-full bg-[#FFE5EC]/60 absolute -top-12 -right-10 pointer-events-none" />
              <div className="w-28 h-28 rounded-full bg-[#E5DEFF]/50 absolute -bottom-10 -left-10 pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A7BA8]">
                    <PawPrintIcon className="w-3.5 h-3.5 text-[#F4A7B9]" />
                    <span>Góc học tập của mèo nhỏ</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-[#4A4453] mt-1">
                    Hôm nay – {fullDayName},{' '}
                    <span className="font-mono tabular-nums">{formattedDate}</span>
                  </h1>
                  <p className="text-xs sm:text-sm font-semibold text-[#7A7284]">
                    Giờ hiện tại:{' '}
                    <span className="font-mono tabular-nums font-bold text-[#4A4453]">
                      {String(currentTime.getHours()).padStart(2, '0')}:
                      {String(currentTime.getMinutes()).padStart(2, '0')}
                    </span>
                    {' · '}
                    <span>
                      {todayClasses.length > 0
                        ? `Hôm nay có ${todayClasses.length} môn học nha! ✨`
                        : 'Hôm nay tha hồ nghỉ ngơi hoặc ôn bài nhẹ nhàng~'}
                    </span>
                  </p>
                </div>

                {/* Cute Sleeping Cat Illustration */}
                <div className="self-center sm:self-end shrink-0">
                  <SleepingCatIllustration className="w-32 h-22" />
                </div>
              </div>

              {/* Next Upcoming Class Spotlight */}
              {upcomingInfo && (
                <div className="relative mt-5 pt-4 border-t-2 border-dashed border-[#EFE2E4] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F4F9FC] p-4 rounded-2xl border border-[#CBE6F7]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#6E6678]">
                      <span className="text-[#4A4453]">
                        🌟 Môn học tiếp theo
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {upcomingInfo.isToday
                          ? 'Hôm nay'
                          : upcomingInfo.nextClass.dayOfWeek}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono tabular-nums font-bold text-[#4A4453]">
                        {upcomingInfo.nextClass.startTime} –{' '}
                        {upcomingInfo.nextClass.endTime}
                      </span>
                    </div>
                    <p className="text-base sm:text-lg font-bold text-[#4A4453]">
                      {getSubjectEmoji(upcomingInfo.nextClass.subjectName)}{' '}
                      {upcomingInfo.nextClass.subjectName}
                      {upcomingInfo.nextClass.room
                        ? ` · 📍 Phòng ${upcomingInfo.nextClass.room.replace(/^phòng\s+/i, '')}`
                        : ''}
                    </p>
                  </div>

                  <div className="sm:text-right">
                    <span className="text-xs font-bold text-[#7A7284] block">
                      Thời gian còn lại đến môn tiếp theo
                    </span>
                    <span className="text-sm font-bold text-[#4A4453] font-mono tabular-nums">
                      ⏳{' '}
                      {formatRemainingTime(
                        upcomingInfo.minutesUntil,
                        upcomingInfo.dayDifference
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Empty State when no classes exist at all */}
            {classes.length === 0 ? (
              <div className="bg-[#FFFDF9] border-2 border-[#4A4453] rounded-[32px] p-8 sm:p-12 text-center space-y-4 cozy-card">
                <div className="flex justify-center">
                  <StudyCatIllustration className="w-36 h-36" />
                </div>
                <div className="text-2xl" aria-hidden="true">
                  📅
                </div>
                <h2 className="text-xl font-bold text-[#4A4453]">
                  Bạn chưa có lịch học nào.
                </h2>
                <p className="text-sm font-semibold text-[#7A7284] max-w-md mx-auto">
                  Hôm nay bạn không có lịch học. Cùng mèo con thêm môn học đầu tiên vào sổ tay thời khóa biểu nhé! 🐾
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => openAddForm()}
                    className="min-h-[48px] px-6 py-3 rounded-2xl bg-[#C8F2E0] hover:bg-[#B3EBD4] border-2 border-[#4A4453] text-[#4A4453] text-sm font-bold cozy-btn cursor-pointer whitespace-nowrap"
                  >
                    + Thêm lịch học
                  </button>
                </div>
              </div>
            ) : normalizedQuery ? (
              /* Search results on Home */
              <div className="space-y-3">
                <h2 className="text-base font-bold text-[#4A4453] flex items-center gap-2">
                  <span>🔍 Kết quả tìm kiếm "{searchQuery}" ({searchFilteredClasses.length})</span>
                </h2>
                {searchFilteredClasses.length === 0 ? (
                  <div className="bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[28px] p-8 text-center text-sm font-semibold text-[#7A7284] cozy-card">
                    Không tìm thấy lịch học nào có tên liên quan đến "{searchQuery}". 😿
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sortClassesByTime(searchFilteredClasses).map((item) => (
                      <ClassCard
                        key={item.id}
                        item={item}
                        showDayLabel={true}
                        onSelect={setDetailClass}
                        onEdit={openEditForm}
                        onDelete={setClassToDelete}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Today's Classes */
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-[#4A4453] flex items-center gap-2">
                  <PawPrintIcon className="w-4 h-4 text-[#F4A7B9]" />
                  <span>Lịch học trong ngày ({todayDayOfWeek})</span>
                </h2>

                {todayClasses.length === 0 ? (
                  <div className="bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[32px] p-8 text-center space-y-3 cozy-card">
                    <div className="flex justify-center">
                      <SleepingCatIllustration className="w-28 h-20" />
                    </div>
                    <p className="text-base font-bold text-[#4A4453]">
                      Hôm nay bạn không có lịch học.
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-[#7A7284]">
                      Mèo con chúc bạn một ngày thư giãn thật vui vẻ! 🌸
                    </p>
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => openAddForm(todayDayOfWeek)}
                        className="min-h-[44px] px-5 py-2.5 rounded-2xl bg-[#D6F0FE] hover:bg-[#BCE4FA] border-2 border-[#4A4453] text-[#4A4453] text-xs sm:text-sm font-bold cozy-btn cursor-pointer"
                      >
                        + Thêm lịch học
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {todayClasses.map((item) => (
                      <ClassCard
                        key={item.id}
                        item={item}
                        onSelect={setDetailClass}
                        onEdit={openEditForm}
                        onDelete={setClassToDelete}
                      />
                    ))}
                  </div>
                )}

                {/* Also show all saved classes if today has none, so newly added classes for other days are immediately visible on Home too */}
                {todayClasses.length === 0 && classes.length > 0 && (
                  <div className="pt-4 space-y-4">
                    <h3 className="text-base font-bold text-[#4A4453] flex items-center gap-2">
                      <span>📚 Lịch học trong tuần của bạn ({classes.length})</span>
                    </h3>
                    <div className="space-y-4">
                      {sortClassesByTime(classes).map((item) => (
                        <ClassCard
                          key={item.id}
                          item={item}
                          showDayLabel={true}
                          onSelect={setDetailClass}
                          onEdit={openEditForm}
                          onDelete={setClassToDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== GIAO DIỆN 2: LỊCH HỌC ==================== */}
        {activeTab === 'schedule' && (
          <div className="space-y-5">
            <div className="bg-[#FFFDF9] border-2 border-[#4A4453] rounded-[32px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cozy-card">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#8A7BA8]">
                  <PawPrintIcon className="w-3.5 h-3.5 text-[#F4A7B9]" />
                  <span>Sổ tay tuần của mèo nhỏ</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#4A4453] mt-0.5">
                  📅 Thời khóa biểu cả tuần
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[#7A7284] mt-0.5">
                  Bấm vào một môn học để xem chi tiết, sửa hoặc xóa nhé!
                </p>
              </div>
              <div className="self-center sm:self-end shrink-0">
                <SleepingCatIllustration className="w-28 h-18" />
              </div>
            </div>

            {/* Day of Week Tabs: Thứ 2 | Thứ 3 | Thứ 4 | Thứ 5 | Thứ 6 | Thứ 7 | Chủ nhật */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setSelectedDayFilter('ALL')}
                className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border-2 ${
                  selectedDayFilter === 'ALL'
                    ? 'bg-[#E5DEFF] border-[#4A4453] text-[#4A4453] cozy-btn'
                    : 'bg-[#FFFDF9] border-[#E6D5D8] text-[#6E6678] hover:border-[#4A4453]'
                }`}
              >
                🐾 Cả tuần ({classes.length})
              </button>
              {DAYS_OF_WEEK.map((day) => {
                const count = classes.filter((c) => c.dayOfWeek === day).length;
                const active = selectedDayFilter === day;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => setSelectedDayFilter(day)}
                    className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer border-2 ${
                      active
                        ? 'bg-[#D6F0FE] border-[#4A4453] text-[#4A4453] cozy-btn'
                        : 'bg-[#FFFDF9] border-[#E6D5D8] text-[#6E6678] hover:border-[#4A4453]'
                    }`}
                  >
                    {day} {count > 0 ? `(${count})` : ''}
                  </button>
                );
              })}
            </div>

            {classes.length === 0 ? (
              <div className="bg-[#FFFDF9] border-2 border-[#4A4453] rounded-[32px] p-8 sm:p-12 text-center space-y-4 cozy-card">
                <div className="flex justify-center">
                  <StudyCatIllustration className="w-36 h-36" />
                </div>
                <div className="text-2xl" aria-hidden="true">
                  📅
                </div>
                <h2 className="text-xl font-bold text-[#4A4453]">
                  Bạn chưa có lịch học nào.
                </h2>
                <button
                  type="button"
                  onClick={() => openAddForm()}
                  className="min-h-[48px] px-6 py-2.5 rounded-2xl bg-[#C8F2E0] hover:bg-[#B3EBD4] border-2 border-[#4A4453] text-[#4A4453] text-sm font-bold cozy-btn cursor-pointer"
                >
                  + Thêm lịch học
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {(selectedDayFilter === 'ALL'
                  ? DAYS_OF_WEEK
                  : [selectedDayFilter]
                ).map((day) => {
                  const dayClasses = sortClassesByTime(
                    searchFilteredClasses.filter((c) => c.dayOfWeek === day)
                  );

                  if (normalizedQuery && dayClasses.length === 0) {
                    return null;
                  }

                  return (
                    <section
                      key={day}
                      className="bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[32px] p-5 sm:p-6 space-y-4 cozy-card"
                    >
                      <div className="flex items-center justify-between border-b-2 border-dashed border-[#EFE2E4] pb-3">
                        <h2 className="text-base sm:text-lg font-bold text-[#4A4453] flex items-center gap-2">
                          <PawPrintIcon className="w-4 h-4 text-[#A996F0]" />
                          <span>{day}</span>
                          <span className="text-xs font-semibold text-[#7A7284] font-mono tabular-nums">
                            ({dayClasses.length} môn)
                          </span>
                        </h2>
                        <button
                          type="button"
                          onClick={() => openAddForm(day)}
                          className="min-h-[40px] px-3.5 py-1.5 rounded-2xl bg-[#E5DEFF] hover:bg-[#D6CCFF] border-2 border-[#4A4453] text-xs font-bold text-[#4A4453] cozy-btn cursor-pointer"
                        >
                          + Thêm
                        </button>
                      </div>

                      {dayClasses.length === 0 ? (
                        <p className="text-xs sm:text-sm font-semibold text-[#9B91A6] py-1">
                           Không có môn học nào trong ngày này~ 🐾
                        </p>
                      ) : (
                        <div className="space-y-4">
                          {dayClasses.map((item) => (
                            <ClassCard
                              key={item.id}
                              item={item}
                              onSelect={setDetailClass}
                              onEdit={openEditForm}
                              onDelete={setClassToDelete}
                            />
                          ))}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== GIAO DIỆN 3: THÊM / SỬA LỊCH HỌC ==================== */}
        {activeTab === 'add' && (
          <div className="bg-[#FFFDF9] border-2 border-[#4A4453] rounded-[32px] p-5 sm:p-7 cozy-card">
            <div className="border-b-2 border-dashed border-[#EFE2E4] pb-4 mb-5 flex items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#4A4453]">
                  {editingClass ? '✏️ Sửa lịch học' : '➕ Thêm lịch học'}
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[#7A7284] mt-1">
                  Nhập thông tin môn học bên dưới và bấm Lưu lịch học nhé! 🐾
                </p>
              </div>
              <SleepingCatIllustration className="w-24 h-16 shrink-0 hidden sm:block" />
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-4 p-4 rounded-2xl bg-[#FFE0E6] border-2 border-[#4A4453] text-[#4A4453] text-sm font-bold"
              >
                😿 {formError}
              </div>
            )}

            <form onSubmit={handleSaveClass} className="space-y-4">
              <div>
                <label
                  htmlFor="subjectName"
                  className="block text-sm font-bold text-[#4A4453] mb-1.5"
                >
                  📚 Tên môn học <span className="text-[#E06C88]">*</span>
                </label>
                <input
                  id="subjectName"
                  type="text"
                  required
                  value={subjectName}
                  onChange={(e) => {
                    setSubjectName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  placeholder="Ví dụ: Tiếng Hàn 3"
                  className="w-full min-h-[48px] px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-semibold text-[#4A4453] placeholder:text-[#A49BAE] focus:outline-none focus:border-[#4A4453]"
                />
              </div>

              <div>
                <label
                  htmlFor="dayOfWeekSelect"
                  className="block text-sm font-bold text-[#4A4453] mb-1.5"
                >
                  📅 Ngày/Thứ <span className="text-[#E06C88]">*</span>
                </label>
                <select
                  id="dayOfWeekSelect"
                  value={dayOfWeek}
                  onChange={(e) => setDayOfWeek(e.target.value as DayOfWeek)}
                  className="w-full min-h-[48px] px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-semibold text-[#4A4453] focus:outline-none focus:border-[#4A4453]"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startTime"
                    className="block text-sm font-bold text-[#4A4453] mb-1.5"
                  >
                    ⏰ Giờ bắt đầu <span className="text-[#E06C88]">*</span>
                  </label>
                  <input
                    id="startTime"
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-mono tabular-nums font-bold text-[#4A4453] focus:outline-none focus:border-[#4A4453]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="endTime"
                    className="block text-sm font-bold text-[#4A4453] mb-1.5"
                  >
                    ⏰ Giờ kết thúc <span className="text-[#E06C88]">*</span>
                  </label>
                  <input
                    id="endTime"
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full min-h-[48px] px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-mono tabular-nums font-bold text-[#4A4453] focus:outline-none focus:border-[#4A4453]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="room"
                    className="block text-sm font-bold text-[#4A4453] mb-1.5"
                  >
                    📍 Phòng học
                  </label>
                  <input
                    id="room"
                    type="text"
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="Ví dụ: B203"
                    className="w-full min-h-[48px] px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-semibold text-[#4A4453] placeholder:text-[#A49BAE] focus:outline-none focus:border-[#4A4453]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="teacher"
                    className="block text-sm font-bold text-[#4A4453] mb-1.5"
                  >
                    👩‍🏫 Giảng viên
                  </label>
                  <input
                    id="teacher"
                    type="text"
                    value={teacher}
                    onChange={(e) => setTeacher(e.target.value)}
                    placeholder="Ví dụ: Nguyễn A"
                    className="w-full min-h-[48px] px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-semibold text-[#4A4453] placeholder:text-[#A49BAE] focus:outline-none focus:border-[#4A4453]"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="reminderSelect"
                  className="block text-sm font-bold text-[#4A4453] mb-1.5"
                >
                  🔔 Nhắc trước giờ học
                </label>
                <select
                  id="reminderSelect"
                  value={reminderMinutes}
                  onChange={(e) =>
                    setReminderMinutes(Number(e.target.value) as ReminderOption)
                  }
                  className="w-full min-h-[48px] px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-semibold text-[#4A4453] focus:outline-none focus:border-[#4A4453]"
                >
                  {REMINDER_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-bold text-[#4A4453] mb-1.5"
                >
                  📝 Ghi chú (không bắt buộc)
                </label>
                <textarea
                  id="notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú thêm về môn học..."
                  className="w-full px-4 py-2.5 bg-[#FFF5F5] focus:bg-white border-2 border-[#E2D4D8] rounded-2xl text-sm font-semibold text-[#4A4453] placeholder:text-[#A49BAE] focus:outline-none focus:border-[#4A4453]"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3">
                {editingClass && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClass(null);
                      setActiveTab('schedule');
                    }}
                    className="min-h-[48px] px-5 py-2.5 rounded-2xl bg-[#FFF5F5] hover:bg-[#FCE8E8] border-2 border-[#E2D4D8] text-[#6E6678] text-sm font-bold transition-colors cursor-pointer"
                  >
                    Hủy
                  </button>
                )}
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[48px] px-7 py-2.5 rounded-2xl bg-[#C8F2E0] hover:bg-[#B3EBD4] border-2 border-[#4A4453] text-[#4A4453] text-sm font-bold cozy-btn cursor-pointer"
                >
                  🐾 Lưu lịch học
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==================== GIAO DIỆN 4: CÀI ĐẶT ==================== */}
        {activeTab === 'settings' && (
          <div className="space-y-5">
            <div className="bg-[#FFFDF9] border-2 border-[#4A4453] rounded-[32px] p-5 sm:p-6 flex items-center justify-between gap-4 cozy-card">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#4A4453]">
                  ⚙️ Cài đặt
                </h1>
                <p className="text-xs sm:text-sm font-semibold text-[#7A7284] mt-1">
                  Quản lý thông báo nhắc giờ học và sổ tay thời khóa biểu của bạn
                </p>
              </div>
              <SleepingCatIllustration className="w-24 h-16 shrink-0 hidden sm:block" />
            </div>

            {/* Bật/tắt thông báo */}
            <div className="bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[32px] p-5 sm:p-6 space-y-4 cozy-card">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-[#4A4453]">
                    🔔 Bật/tắt thông báo
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-[#7A7284] mt-0.5">
                    Nhận lời nhắc từ mèo con trước khi môn học bắt đầu
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={settings.notificationsEnabled}
                  onClick={async () => {
                    const nextState = !settings.notificationsEnabled;
                    if (
                      nextState &&
                      typeof window !== 'undefined' &&
                      'Notification' in window &&
                      Notification.permission === 'default'
                    ) {
                      try {
                        const res = await Notification.requestPermission();
                        setBrowserPermission(res);
                      } catch {
                        // ignore
                      }
                    }
                    setSettings((prev) => ({
                      ...prev,
                      notificationsEnabled: nextState,
                    }));
                  }}
                  className={`relative inline-flex h-9 w-16 shrink-0 cursor-pointer rounded-full border-2 border-[#4A4453] transition-colors duration-200 ${
                    settings.notificationsEnabled ? 'bg-[#C8F2E0]' : 'bg-[#EFE2E4]'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-[#FFFDF9] border border-[#4A4453] shadow-xs transition duration-200 mt-0.5 ${
                      settings.notificationsEnabled
                        ? 'translate-x-7'
                        : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-[#EFE2E4] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#7A7284]">
                  Kiểm tra trực tiếp Notification API của trình duyệt (không qua Service Worker / FCM):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    Notification.requestPermission().then((permission) => {
                      setBrowserPermission(permission);
                      if (permission === 'granted') {
                        new Notification('MyClass', {
                          body: 'Thông báo thử nghiệm thành công!',
                        });
                      }
                    });
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-2xl bg-[#C8F2E0] hover:bg-[#B3EBD4] border-2 border-[#4A4453] text-[#4A4453] text-xs font-bold cozy-btn cursor-pointer"
                >
                  🔔 Kiểm tra Notification API
                </button>
              </div>

              <div className="pt-3 border-t-2 border-dashed border-[#EFE2E4] flex flex-wrap items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[#7A7284]">
                  Kiểm tra thử thông báo nhắc trước 1 tiếng (Service Worker):
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const sample = classes[0];
                    const name = sample ? sample.subjectName : 'Tiếng Hàn 3';
                    const rm = sample && sample.room ? sample.room : 'B203';
                    const mins = sample && sample.reminderMinutes > 0 ? sample.reminderMinutes : 60;
                    const msg = buildClassReminderMessage(name, rm, mins);
                    triggerNotification(msg.title, msg.body);
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-2xl bg-[#E5DEFF] hover:bg-[#D6CCFF] border-2 border-[#4A4453] text-[#4A4453] text-xs font-bold cozy-btn cursor-pointer"
                >
                  🔔 Gửi thông báo thử (Trước 1 tiếng)
                </button>
              </div>

              {/* Trạng thái kết nối Firebase Cloud Messaging (FCM) */}
              <div className="pt-3 border-t-2 border-dashed border-[#EFE2E4] space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-[#4A4453]">
                      🔥 Kết nối Firebase Cloud Messaging (Project: {firebaseConfig.projectId})
                    </p>
                    <p className="text-xs font-semibold text-[#7A7284] mt-0.5">
                      Trạng thái: <span className="text-[#4A4453] font-bold">{fcmStatusMsg}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      if (
                        typeof window !== 'undefined' &&
                        'Notification' in window &&
                        Notification.permission !== 'granted'
                      ) {
                        const perm = await Notification.requestPermission();
                        setBrowserPermission(perm);
                      }
                      const res = await registerFCMAndGetToken();
                      if (res.registration) setSwRegistration(res.registration);
                      if (res.token) {
                        setFcmToken(res.token);
                        setFcmStatusMsg('Đã kết nối Firebase Cloud Messaging (FCM) thành công!');
                      } else if (res.error) {
                        setFcmStatusMsg(res.error);
                      }
                    }}
                    className="min-h-[40px] px-3.5 py-1.5 rounded-2xl bg-[#D6F0FE] hover:bg-[#BCE4FA] border-2 border-[#4A4453] text-[#4A4453] text-xs font-bold cozy-btn cursor-pointer whitespace-nowrap"
                  >
                    🔄 Làm mới FCM Token
                  </button>
                </div>

                {fcmToken && (
                  <div className="bg-[#FFF5F5] border-2 border-[#E2D4D8] rounded-2xl p-3 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#4A4453]">
                        🔑 Mã FCM Registration Token của thiết bị này:
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(fcmToken);
                          setTokenCopied(true);
                          setTimeout(() => setTokenCopied(false), 2500);
                        }}
                        className="min-h-[34px] px-3 py-1 rounded-xl bg-[#C8F2E0] hover:bg-[#B3EBD4] border border-[#4A4453] text-[#4A4453] text-xs font-bold cursor-pointer whitespace-nowrap"
                      >
                        {tokenCopied ? '✅ Đã sao chép' : '📋 Sao chép Token'}
                      </button>
                    </div>
                    <p className="text-[11px] font-mono break-all text-[#6E6678] select-all">
                      {fcmToken}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Thời gian nhắc mặc định */}
            <div className="bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[32px] p-5 sm:p-6 space-y-3 cozy-card">
              <h2 className="text-base font-bold text-[#4A4453]">
                ⏰ Thời gian nhắc mặc định
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {REMINDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      setSettings((prev) => ({
                        ...prev,
                        defaultReminderMinutes: opt.value,
                      }))
                    }
                    className={`min-h-[44px] px-3 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer border-2 ${
                      settings.defaultReminderMinutes === opt.value
                        ? 'bg-[#D6F0FE] border-[#4A4453] text-[#4A4453] cozy-btn'
                        : 'bg-[#FFF5F5] border-[#E2D4D8] text-[#6E6678] hover:border-[#4A4453]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Xóa toàn bộ lịch học */}
            <div className="bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[32px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cozy-card">
              <div>
                <h2 className="text-base font-bold text-[#4A4453]">
                  🗑️ Xóa toàn bộ lịch học
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-[#7A7284] mt-0.5">
                  Đang lưu {classes.length} môn học trên thiết bị của bạn
                </p>
              </div>
              <button
                type="button"
                disabled={classes.length === 0}
                onClick={() => setConfirmClearAll(true)}
                className={`min-h-[44px] px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold transition-all border-2 ${
                  classes.length === 0
                    ? 'bg-[#F5ECEE] border-[#E2D4D8] text-[#B3A8BC] cursor-not-allowed'
                    : 'bg-[#FFE0E6] hover:bg-[#FFCCD6] border-[#4A4453] text-[#4A4453] cozy-btn cursor-pointer'
                }`}
              >
                🗑️ Xóa toàn bộ lịch học
              </button>
            </div>

            {/* Thông tin ứng dụng */}
            <div className="bg-[#FFFDF9] border-2 border-[#E6D5D8] rounded-[32px] p-5 sm:p-6 space-y-2 cozy-card">
              <h2 className="text-base font-bold text-[#4A4453]">
                ℹ️ Thông tin ứng dụng
              </h2>
              <p className="text-sm font-semibold text-[#6E6678] leading-relaxed">
                <strong>MyClass 🐾</strong> — Sổ tay quản lý thời khóa biểu và lịch học cá nhân phong cách mèo con dễ thương dành cho học sinh, sinh viên. Dữ liệu được lưu trữ tự động trên trình duyệt (localStorage).
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Class Detail Modal */}
      <ClassDetailModal
        item={detailClass}
        onClose={() => setDetailClass(null)}
        onEdit={openEditForm}
        onDelete={setClassToDelete}
        onTestReminder={(item) => {
          const mins = item.reminderMinutes || 60;
          const msg = buildClassReminderMessage(
            item.subjectName,
            item.room || 'B203',
            mins
          );
          triggerNotification(msg.title, msg.body, item.id);
        }}
      />

      {/* Delete Confirmation Modal (Single Class or Clear All) */}
      {(classToDelete || confirmClearAll) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#4A4453]/40 backdrop-blur-xs p-4"
          onClick={() => {
            setClassToDelete(null);
            setConfirmClearAll(false);
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            className="w-full max-w-md bg-[#FFFDF9] rounded-[32px] p-6 cozy-card border-2 border-[#4A4453]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold text-[#4A4453]">
              {confirmClearAll
                ? 'Bạn có chắc muốn xóa toàn bộ lịch học không?'
                : 'Bạn có chắc muốn xóa lịch học này không?'}
            </h2>
            {classToDelete && !confirmClearAll && (
              <p className="mt-2 text-sm font-semibold text-[#6E6678]">
                {getSubjectEmoji(classToDelete.subjectName)}{' '}
                <strong className="text-[#4A4453]">{classToDelete.subjectName}</strong> ({classToDelete.dayOfWeek},{' '}
                {classToDelete.startTime} – {classToDelete.endTime})
              </p>
            )}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setClassToDelete(null);
                  setConfirmClearAll(false);
                }}
                className="min-h-[44px] px-5 py-2 rounded-2xl bg-[#FFF5F5] hover:bg-[#FCE8E8] border-2 border-[#E2D4D8] text-[#6E6678] text-sm font-bold cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={
                  confirmClearAll
                    ? handleConfirmClearAll
                    : handleConfirmDeleteSingle
                }
                className="min-h-[44px] px-5 py-2 rounded-2xl bg-[#FFE0E6] hover:bg-[#FFCCD6] border-2 border-[#4A4453] text-[#4A4453] text-sm font-bold cozy-btn cursor-pointer"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar: 🏠 Trang chủ | 📅 Lịch học | ➕ Thêm | ⚙️ Cài đặt */}
      <nav
        aria-label="Điều hướng chính"
        className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9]/95 backdrop-blur-md border-t-2 border-[#EFE2E4] h-18 grid grid-cols-4 items-center max-w-4xl mx-auto px-3 rounded-t-[28px]"
      >
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
            activeTab === 'home'
              ? 'bg-[#FFE5EC] text-[#4A4453] font-bold border-2 border-[#4A4453]'
              : 'text-[#7A7284] hover:text-[#4A4453] font-semibold'
          }`}
        >
          <Home className="w-4 h-4" />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            🏠 Trang chủ
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedule')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-[#D6F0FE] text-[#4A4453] font-bold border-2 border-[#4A4453]'
              : 'text-[#7A7284] hover:text-[#4A4453] font-semibold'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            📅 Lịch học
          </span>
        </button>

        <button
          type="button"
          onClick={() => openAddForm()}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
            activeTab === 'add'
              ? 'bg-[#C8F2E0] text-[#4A4453] font-bold border-2 border-[#4A4453]'
              : 'text-[#7A7284] hover:text-[#4A4453] font-semibold'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            ➕ Thêm
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`min-h-[48px] flex flex-col items-center justify-center rounded-2xl transition-all cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#E5DEFF] text-[#4A4453] font-bold border-2 border-[#4A4453]'
              : 'text-[#7A7284] hover:text-[#4A4453] font-semibold'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="text-[11px] mt-0.5 whitespace-nowrap">
            ⚙️ Cài đặt
          </span>
        </button>
      </nav>
    </div>
  );
}

