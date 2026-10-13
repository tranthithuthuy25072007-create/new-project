/* eslint-disable no-undef */
/**
 * Service Worker cho MyClass 🐾
 * Xử lý thông báo đẩy nền (Background Push Notification) ngay cả khi người dùng đóng ứng dụng hoặc đóng trình duyệt.
 */

const CACHE_NAME = 'myclass-pwa-cache-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Lắng nghe sự kiện Push Notification từ hệ thống / máy chủ thông báo nền
self.addEventListener('push', (event) => {
  let payload = {
    title: '🔔 Sắp đến giờ học!',
    body: '1 tiếng nữa bạn có môn Tiếng Hàn 3 tại phòng B203.',
    url: '/',
  };

  if (event.data) {
    try {
      const data = event.data.json();
      const notif = data.notification || data.data || data;
      payload = {
        title: notif.title || payload.title,
        body: notif.body || payload.body,
        url: notif.url || '/',
      };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const options = {
    body: payload.body,
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    tag: `myclass-bg-${Date.now()}`,
    renotify: true,
    data: {
      url: payload.url,
    },
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

// Lắng nghe thông điệp từ ứng dụng để gửi thông báo qua Service Worker hoặc lập lịch nhắc trước 1 tiếng
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
