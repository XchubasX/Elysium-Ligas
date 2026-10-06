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
    recaptchaKey: '6LfZTuEtAAAAAC9MIA5gA0raN0qFkFTooQOIb74J'
  };
  // Se llena cuando se monte producción (Firebase "elysium-ligas").
  var PRODUCCION = null;

  var host = window.location.hostname;
  var esDireccionReal = host === 'ligas.eternalschedule.com' || host === 'elysium-ligas.chubas.workers.dev';
  window.LIGAS_CONFIG = esDireccionReal ? PRODUCCION : PRUEBAS;
})();
