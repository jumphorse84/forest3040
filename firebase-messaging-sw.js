// firebase-messaging-sw.js
// Service Worker for Firebase Cloud Messaging (Background Push)
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAL2ziXjONGYWHLuu-wKRCPFh68FNcGRQo",
  authDomain: "forest3040-6f109.firebaseapp.com",
  projectId: "forest3040-6f109",
  storageBucket: "forest3040-6f109.firebasestorage.app",
  messagingSenderId: "550286196189",
  appId: "1:550286196189:web:114947b60b3ef03eb94a34",
  measurementId: "G-FPPHSSL948"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Forest 알림';
  const notificationOptions = {
    body: payload.notification?.body || '새 소식이 있습니다.',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    tag: payload.data?.tag || 'forest-notification',
    data: payload.data || {},
    requireInteraction: false,
    vibrate: [200, 100, 200],
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' }
    ]
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') return;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('forest3040') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('https://forest3040-6f109.web.app');
      }
    })
  );
});
