/* eslint-disable no-undef */
/**
 * Firebase Cloud Messaging (FCM) Service Worker cho MyClass 🐾
 * Nhận thông báo đẩy nền ngay cả khi người dùng đóng ứng dụng hoặc đóng trình duyệt.
 */

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBdK8WkQLnO3NljWB6E4gnR47ulyJ0g2jQ",
  authDomain: "myclass-705ef.firebaseapp.com",
  projectId: "myclass-705ef",
  storageBucket: "myclass-705ef.firebasestorage.app",
  messagingSenderId: "408048894229",
  appId: "1:408048894229:web:b551828d93298f25d8291c"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Xử lý thông báo đẩy từ Firebase Cloud Messaging khi ứng dụng đang đóng hoặc chạy nền
messaging.onBackgroundMessage((payload) => {
  const notif = payload.notification || payload.data || {};
  const notificationTitle = notif.title || '🔔 Sắp đến giờ học!';
  const notificationOptions = {
    body: notif.body || '1 tiếng nữa bạn có môn Tiếng Hàn 3 tại phòng B203.',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    tag: `fcm-myclass-${Date.now()}`,
    renotify: true,
    data: {
      url: (payload.data && payload.data.url) || '/',
    },
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Hỗ trợ gửi thông báo trực tiếp qua Service Worker khi đến giờ nhắc lịch học
self.addEventListener('message', (event) => {
  if (!event.data) return;

  if (event.data.type === 'SHOW_SW_NOTIFICATION') {
    const { title, body, tag } = event.data.payload || {};
    event.waitUntil(
      self.registration.showNotification(title || '🔔 Sắp đến giờ học!', {
        body: body || '1 tiếng nữa bạn có môn học.',
        icon: '/icon.svg',
        badge: '/icon.svg',
        vibrate: [200, 100, 200],
        tag: tag || `myclass-sw-${Date.now()}`,
        renotify: true,
        data: { url: '/' },
      })
    );
  }
});

// Khi người dùng bấm vào thông báo trên điện thoại -> mở lại ứng dụng MyClass
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
