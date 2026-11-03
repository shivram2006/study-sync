import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

self.skipWaiting();
clientsClaim();

cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST || []);

// Stealth Background Push Notification Listener
// Even when the PWA is closed or in the background, this receives incoming partner messages
self.addEventListener('push', (event) => {
  let data = {
    title: 'New task added',
    body: 'A new priority task was added to your daily list.'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch (e) {
      const text = event.data.text();
      if (text) {
        data.body = text;
      }
    }
  }

  const options = {
    body: data.body || 'A new task was added to your daily focus list.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [200, 100, 200, 100, 250],
    data: {
      url: data.url || '/'
    },
    tag: 'zenith-task-reminder',
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'New task added', options)
  );
});

// Clear all active notifications when requested by active app clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_NOTIFICATIONS') {
    self.registration.getNotifications().then((notifications) => {
      notifications.forEach((n) => n.close());
    });
  }
});

// When user taps the notification on mobile
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // Clear all pending notifications
  self.registration.getNotifications().then((notifications) => {
    notifications.forEach((n) => n.close());
  });

  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'CLEAR_NOTIFICATIONS' });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
