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
    recaptchaKey: '6LfzN-ItAAAAAC2FoII4qC6NkyxBccLl-rMOvEpO'
  };

  var host = window.location.hostname;
  var esDireccionReal = host === 'ligas.eternalschedule.com' || host === 'elysium-ligas.chubas.workers.dev';
  window.LIGAS_CONFIG = esDireccionReal ? PRODUCCION : PRUEBAS;
  // Elysium (las mesas) del MISMO entorno: desde pruebas nunca se manda a nadie a producción.
  window.ELYSIUM_MESAS = esDireccionReal ? 'eternalschedule.com' : 'uat.eternalschedule.com';
})();
