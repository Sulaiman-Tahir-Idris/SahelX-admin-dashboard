// SahelX — Firebase Messaging Service Worker
// Handles background push notifications when the app tab is not focused.

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAbvJX4T18HBcxr1BpD-WFhYDUyMthaFR0',
  authDomain: 'sahelx-backend.firebaseapp.com',
  projectId: 'sahelx-backend',
  storageBucket: 'sahelx-backend.firebasestorage.app',
  messagingSenderId: '838199821074',
  appId: '1:838199821074:web:7eb6bcd1b973d616a129cb',
});

// Initialising messaging is enough — the SDK handles background notifications automatically.
// Do NOT add a custom onBackgroundMessage() here; it conflicts with the SDK default handler
// and can cause both to suppress each other.
const messaging = firebase.messaging();

// Open the messages page when the user clicks a notification
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
