/* Service Worker de Firebase Cloud Messaging (notificaciones en segundo plano).
 * La configuración (pública) llega por query params en la URL de registro, así
 * no se fijan los valores del proyecto en este archivo del repositorio.
 * Las funciones envían mensajes "data-only" y aquí construimos la notificación
 * (evita la notificación doble que ocurre con payloads de tipo "notification"). */

importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const params = new URL(self.location).searchParams;

firebase.initializeApp({
  apiKey: params.get('apiKey'),
  authDomain: params.get('authDomain'),
  projectId: params.get('projectId'),
  messagingSenderId: params.get('messagingSenderId'),
  appId: params.get('appId'),
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || 'Lexia';
  const link = data.link || (data.wordId ? '/palabras?word=' + data.wordId : '/');

  self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    data: { link },
  });
});

// Al tocar la notificación, abre (o enfoca) el detalle de esa palabra (US-09 CA3).
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((all) => {
      for (const client of all) {
        if ('focus' in client) {
          client.navigate(link);
          return client.focus();
        }
      }
      return clients.openWindow(link);
    }),
  );
});
