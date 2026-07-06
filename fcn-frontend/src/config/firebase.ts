import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage, type MessagePayload } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: ReturnType<typeof initializeApp> | null = null;
let messaging: ReturnType<typeof getMessaging> | null = null;

try {
  app = initializeApp(firebaseConfig);
  messaging = getMessaging(app);
} catch {
  // Firebase config may not be set in development
}

export { messaging, onMessage };
export type { MessagePayload };

export async function requestNotificationPermission(): Promise<string | null> {
  if (!messaging) return null;
  if (!("Notification" in window)) return null;

  try {
    const permission = await Notification.requestPermission();
    if (permission === "denied") {
      console.warn("Notification permission denied");
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("VITE_FIREBASE_VAPID_KEY not set");
      return null;
    }

    const registration = await navigator.serviceWorker.getRegistration();
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration ?? undefined
    });

    return token;
  } catch (err) {
    console.warn("Failed to get FCM token:", err);
    return null;
  }
}

export function onForegroundMessage(callback: (payload: MessagePayload) => void): void {
  if (!messaging) return;
  onMessage(messaging, (payload) => {
    callback(payload);
  });
}
