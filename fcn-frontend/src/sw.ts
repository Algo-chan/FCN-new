/// <reference lib="webworker" />

import { clientsClaim } from "workbox-core";
import { createHandlerBoundToURL, precacheAndRoute, type PrecacheEntry } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst } from "workbox-strategies";
import { ExpirationPlugin } from "workbox-expiration";
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage, type Messaging } from "firebase/messaging/sw";

declare let self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<PrecacheEntry | string>;
};

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/\/api\//, /\/socket\.io\//]
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "fcn-api-runtime",
    plugins: [new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 60 * 60 })]
  })
);

let messaging: Messaging | null = null;

try {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  });
  messaging = getMessaging(app);
} catch {
  messaging = null;
}

if (messaging) {
  onBackgroundMessage(messaging, (payload) => {
    const { title, body, icon } = payload.notification ?? {};

    self.registration.showNotification(title ?? "Fast Care Now", {
      body: body ?? "",
      icon: icon ?? "/assets/logo-fast-care-now.png",
      badge: "/logo/fcn-logo-full.png",
      vibrate: [200, 100, 200],
      data: payload.data,
      actions: [
        { action: "open", title: "Open Fast Care Now" },
        { action: "close", title: "Dismiss" }
      ]
    } as NotificationOptions);
  });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const url = event.notification.data?.actionUrl ?? "https://app.fcncare.com";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("fcncare.com") && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

clientsClaim();
self.skipWaiting();