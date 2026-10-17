// =====================================================================
// config.js — DATOS DE CONEXIÓN DE CADA SITIO
// El mismo código sirve para pruebas y producción: se elige el proyecto
// de Firebase según la dirección desde la que se abre la página.
// Estos datos no son secretos (van dentro de la página); la protección
// está en las reglas de la base de datos y en App Check.
// =====================================================================
(function () {
  var PRUEBAS = {
    nombre: 'pruebas',
    esPruebas: true,
    firebase: {
      apiKey: 'AIzaSyARtJRCcLGW_lvXI0h0qm8ebplGmA-vWCw',
      authDomain: 'elysium-ligas-uat.firebaseapp.com',
      databaseURL: 'https://elysium-ligas-uat-default-rtdb.firebaseio.com',
      projectId: 'elysium-ligas-uat',
      storageBucket: 'elysium-ligas-uat.firebasestorage.app',
      messagingSenderId: '230744729212',
      appId: '1:230744729212:web:a7e971b9da27b118a94bf9'
    },
    recaptchaKey: '6LfZTuEtAAAAAC9MIA5gA0raN0qFkFTooQOIb74J',
    // Avisos al celular: Firebase → Configuración del proyecto → Cloud Messaging →
    // Certificados push web → «Par de claves» (vacío = los avisos no se ofrecen)
    vapidKey: 'BAH7ZBtRb8joZexWcnXQ1Z0I1MfSxdL-XLoZa3fNu6tSFmOaIprg49G_U450whjM-EEo0_NvfUebRD9tYb-5EG4'
  };
  // Producción (Firebase "elysium-ligas"), montada el 6 oct 2026.
  var PRODUCCION = {
    nombre: 'produccion',
    esPruebas: false,
    firebase: {
      apiKey: 'AIzaSyAZrRr3YVenmmnM9MqTL9bQ2w8y3TLTL0Y',
      authDomain: 'elysium-ligas.firebaseapp.com',
      databaseURL: 'https://elysium-ligas-default-rtdb.firebaseio.com',
      projectId: 'elysium-ligas',
      storageBucket: 'elysium-ligas.firebasestorage.app',
      messagingSenderId: '790037393310',
      appId: '1:790037393310:web:0df5babf84a212fb7bb08f'
    },
    recaptchaKey: '6LfzN-ItAAAAAC2FoII4qC6NkyxBccLl-rMOvEpO',
    vapidKey: 'BE6kwCQIm0JqO4w1CVkS4v6LSyN3tsnNc1DVNr2Aua6_oB299dW6Rm6if8KdtxSMTxS5kPugrnK94Ci6UcNZK70'
  };

  var host = window.location.hostname;
  var esDireccionReal = host === 'ligas.eternalschedule.com' || host === 'elysium-ligas.chubas.workers.dev';
  window.LIGAS_CONFIG = esDireccionReal ? PRODUCCION : PRUEBAS;
  // Abierto como app desde el ícono (iPhone): «Entrar con Google» pasa por nuestro
  // propio dominio (worker.js lo reenvía a Firebase), porque ahí la ventanita de
  // Google no funciona. En el navegador normal se queda como siempre.
  var comoApp = !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || (window.navigator && window.navigator.standalone));
  if (comoApp && /(^|\.)eternalschedule\.com$/.test(host)) window.LIGAS_CONFIG.firebase.authDomain = host;
  // Elysium (las mesas) del MISMO entorno: desde pruebas nunca se manda a nadie a producción.
  window.ELYSIUM_MESAS = esDireccionReal ? 'eternalschedule.com' : 'uat.eternalschedule.com';
})();
