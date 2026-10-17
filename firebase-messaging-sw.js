// =====================================================================
// firebase-messaging-sw.js — recibe el aviso de solicitudes nuevas con
// Ligas cerrado y lo muestra como notificación. Al tocarla se abre
// «Mis eventos», donde están las solicitudes para aprobar o rechazar.
// Toma los datos de Firebase de config.js (el mismo del sitio).
// =====================================================================

// Una versión nueva de este archivo entra en funciones de inmediato
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(clients.claim()));

// Al tocar el aviso: si Ligas ya está abierto (pestaña o app del iPhone)
// se trae al frente y se le pide ir a «Mis eventos»; si no, se abre ahí.
// Va ANTES de Firebase para que este sea el que atiende el toque.
self.addEventListener('notificationclick', (event) => {
  event.stopImmediatePropagation();
  event.notification.close();
  const fcm = (event.notification.data && event.notification.data.FCM_MSG) || {};
  const link = (fcm.data && fcm.data.link) || (fcm.fcmOptions && fcm.fcmOptions.link) || self.registration.scope + '#/mis-eventos';
  event.waitUntil((async () => {
    const abiertas = await clients.matchAll({ type: 'window', includeUncontrolled: true });
    const propia = abiertas.find(c => new URL(c.url).origin === self.location.origin);
    if (propia) {
      await propia.focus();
      propia.postMessage({ tipo: 'abrirSolicitudes' });
      return;
    }
    await clients.openWindow(link);
  })());
});

self.window = self; // config.js escribe en window.LIGAS_CONFIG
importScripts('config.js?v=20261017a');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
              'https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');
firebase.initializeApp(self.LIGAS_CONFIG.firebase);
firebase.messaging(); // muestra sola la notificación cuando Ligas está cerrado o en segundo plano
