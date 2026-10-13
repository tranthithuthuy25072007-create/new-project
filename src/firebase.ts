import { initializeApp } from 'firebase/app';
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  Messaging,
} from 'firebase/messaging';

export const firebaseConfig = {
  apiKey: "AIzaSyBdK8WkQLnO3NljWB6E4gnR47ulyJ0g2jQ",
  authDomain: "myclass-705ef.firebaseapp.com",
  projectId: "myclass-705ef",
  storageBucket: "myclass-705ef.firebasestorage.app",
  messagingSenderId: "408048894229",
  appId: "1:408048894229:web:b551828d93298f25d8291c"
};

export const FCM_VAPID_KEY =
  "BE5FmTz2d7uRJ5ZwvzI6Ze6nrUCCnwZzMqnnGPf8KRMwJRwWKmqrdOt9-D06luEcPDxI6sWfsUuUwDGeiGULoRQ";

export const firebaseApp = initializeApp(firebaseConfig);

let messagingInstance: Messaging | null = null;

/**
 * Khởi tạo Firebase Messaging nếu trình duyệt hỗ trợ
 */
export async function getFirebaseMessagingInstance(): Promise<Messaging | null> {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    if (!messagingInstance) {
      messagingInstance = getMessaging(firebaseApp);
    }
    return messagingInstance;
  } catch {
    return null;
  }
}

/**
 * Đăng ký Service Worker `/firebase-messaging-sw.js` và lấy FCM Token với VAPID Key
 */
export async function registerFCMAndGetToken(): Promise<{
  token: string | null;
  registration: ServiceWorkerRegistration | null;
  error?: string;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      token: null,
      registration: null,
      error: 'Trình duyệt không hỗ trợ Service Worker.',
    };
  }

  try {
    const registration = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    );

    const messaging = await getFirebaseMessagingInstance();
    if (!messaging) {
      return {
        token: null,
        registration,
        error: 'Trình duyệt hiện tại không hỗ trợ Firebase Cloud Messaging.',
      };
    }

    if (Notification.permission !== 'granted') {
      return {
        token: null,
        registration,
        error: 'Chưa cấp quyền thông báo trên trình duyệt.',
      };
    }

    const currentToken = await getToken(messaging, {
      vapidKey: FCM_VAPID_KEY,
      serviceWorkerRegistration: registration,
    });

    return {
      token: currentToken || null,
      registration,
    };
  } catch (err) {
    return {
      token: null,
      registration: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Lắng nghe tin nhắn FCM khi người dùng đang mở ứng dụng (Foreground)
 */
export async function subscribeForegroundFCMMessages(
  callback: (payload: { title: string; body: string }) => void
): Promise<(() => void) | null> {
  try {
    const messaging = await getFirebaseMessagingInstance();
    if (!messaging) return null;

    const unsubscribe = onMessage(messaging, (payload) => {
      const title =
        payload.notification?.title ||
        payload.data?.title ||
        '🔔 Sắp đến giờ học!';
      const body =
        payload.notification?.body ||
        payload.data?.body ||
        '1 tiếng nữa bạn có môn Tiếng Hàn 3 tại phòng B203.';
      callback({ title, body });
    });

    return unsubscribe;
  } catch {
    return null;
  }
}
