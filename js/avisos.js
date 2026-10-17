// =====================================================================
// js/avisos.js — AVISO AL CELULAR DEL ADMINISTRADOR (lado del navegador)
// Acordado el 17 oct 2026: cuando alguien pide ser organizador, al
// administrador le llega una notificación (revisión cada 5 minutos).
// · Tarjeta «🔔 Avisos de solicitudes» en Mis eventos, solo para el administrador.
// · iPhone abierto en Safari (no desde el ícono): guía para instalar.
// Se guarda en avisosAdmin/{uid}/{aparato}: el código del aparato para
// recibir avisos y qué tipo de aparato es. Nada de correo ni teléfono.
// Los manda worker.js (avisos-servidor.js).
// =====================================================================
const AVISOS_DISP_KEY = 'ligas_avisos_disp';
let avisosActivos = false;   // este aparato recibe avisos para la cuenta actual
let avisosUidActual = null;  // cuenta con la que se activaron aquí (para quitarlos al salir)

function leerLocal(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function guardarLocal(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) { /* sin almacenamiento */ } }
function idAparato() {
  let id = leerLocal(AVISOS_DISP_KEY);
  if (!id) { id = 'd' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36); guardarLocal(AVISOS_DISP_KEY, id); }
  return id;
}
function esIPhone() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function tipoAparato() { return esIPhone() ? 'iphone' : (/Android/i.test(navigator.userAgent) ? 'android' : 'pc'); }
function abiertoComoApp() {
  return !!((window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone);
}
function navegadorPermiteAvisos() {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window && !!(window.firebase && firebase.messaging);
}
function avisosConfigurados() { return !!(window.LIGAS_CONFIG && LIGAS_CONFIG.vapidKey); }
function rutaAparato(uid) { return 'avisosAdmin/' + uid + '/' + idAparato(); }

// ---------------------------------------------------------------------
// Tarjeta en «Mis eventos» (solo administrador)
// ---------------------------------------------------------------------
function bloqueAvisosAdmin() {
  if (!soyAdmin || !usuario) return '';
  const caja = (cuerpo) => '<div data-avisos-admin class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-2 text-sm">' + cuerpo + '</div>';
  const titulo = (estado) => '<div class="flex justify-between items-center gap-2"><p class="font-bold">🔔 Avisos de solicitudes</p>' + estado + '</div>';
  const ACT = '<span class="text-xs font-extrabold text-emerald-300">ACTIVADOS AQUÍ</span>';
  const DES = '<span class="text-xs font-extrabold text-zinc-500">DESACTIVADOS AQUÍ</span>';
  if (!avisosConfigurados()) {
    return caja(titulo('') + '<p class="text-zinc-400">Los avisos todavía no están configurados en este sitio.</p>');
  }
  if (avisosActivos) {
    return caja(titulo(ACT) + '<p class="text-zinc-300">Te llega una notificación a este aparato cuando alguien pide ser organizador (se revisa cada 5 minutos).</p>' +
      '<div class="flex gap-2"><button type="button" onclick="mandarAvisoPrueba(this)" class="' + BTN2 + ' flex-1 !py-1.5">Mandarme un aviso de prueba</button>' +
      '<button type="button" onclick="dosToques(this,()=>desactivarAvisos())" class="' + BTN2 + ' flex-1 !py-1.5">Desactivar</button></div>');
  }
  return caja(titulo(DES) + '<p class="text-zinc-300">Activa los avisos para que te llegue una notificación a este aparato cuando alguien pida ser organizador.</p>' +
    '<button type="button" onclick="activarAvisos()" class="' + BTN + ' w-full">Activar avisos en este aparato</button>' +
    (esIPhone() && !abiertoComoApp() ? '<p class="text-xs text-zinc-400">En iPhone primero hay que agregar Ligas a la pantalla de inicio. Al tocar el botón te decimos cómo.</p>' : ''));
}

// ---------------------------------------------------------------------
// Ventanas (guía de iPhone y mensajes)
// ---------------------------------------------------------------------
function ventanaAvisos(html) {
  let v = $('avisosModal');
  if (!v) {
    v = document.createElement('div');
    v.id = 'avisosModal';
    v.className = 'fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4';
    v.addEventListener('click', e => { if (e.target === v) cerrarVentanaAvisos(); });
    document.body.appendChild(v);
  }
  v.innerHTML = '<div class="bg-zinc-800 border border-wine-600/50 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3 text-sm">' + html + '</div>';
  v.classList.remove('hidden');
}
function cerrarVentanaAvisos() { const v = $('avisosModal'); if (v) v.classList.add('hidden'); }

function guiaIPhone() {
  const paso = (n, t, d) => '<div class="flex gap-3"><span class="w-6 h-6 rounded-full bg-wine-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">' + n + '</span><span class="text-zinc-300"><b class="text-white">' + t + '</b><br>' + d + '</span></div>';
  ventanaAvisos('<div id="avisosGuiaIPhone" class="space-y-3">' +
    '<div class="text-base font-bold">📱 En iPhone, primero instala Ligas</div>' +
    '<div class="text-zinc-300">El iPhone solo deja mandar avisos si abres Ligas desde su ícono.</div>' +
    paso(1, 'Toca Compartir', 'el cuadrito con la flecha hacia arriba, abajo en Safari.') +
    paso(2, '«Agregar a pantalla de inicio»', 'y luego «Agregar».') +
    paso(3, 'Abre Ligas desde el ícono', 'y entra con Google.') +
    paso(4, 'Mis eventos → «Activar avisos»', 'y acepta el permiso del iPhone.') +
    '<div class="text-xs text-zinc-400">Necesitas iOS 16.4 o más nuevo.</div>' +
    '<button type="button" onclick="cerrarVentanaAvisos()" class="' + BTN2 + ' w-full">Entendido</button></div>');
}
function avisoNoDisponible(texto) {
  ventanaAvisos('<div id="avisosNoDisponible" class="space-y-3"><div class="font-bold">🔔 Avisos</div>' +
    '<div class="text-zinc-300">' + texto + '</div>' +
    '<button type="button" onclick="cerrarVentanaAvisos()" class="' + BTN2 + ' w-full">Entendido</button></div>');
}

// ---------------------------------------------------------------------
// Activar / desactivar / probar
// ---------------------------------------------------------------------
async function tokenAparato() {
  const reg = await navigator.serviceWorker.register('firebase-messaging-sw.js');
  return firebase.messaging().getToken({ vapidKey: LIGAS_CONFIG.vapidKey, serviceWorkerRegistration: reg });
}

function activarAvisos() {
  if (!usuario || !soyAdmin) return;
  if (esIPhone() && !abiertoComoApp()) return guiaIPhone();
  if (!navegadorPermiteAvisos()) {
    return avisoNoDisponible(esIPhone()
      ? 'Tu iPhone tiene una versión que no permite avisos (antes de iOS 16.4).'
      : 'Este navegador no permite avisos. Prueba con Chrome.');
  }
  if (!avisosConfigurados()) return aviso('Los avisos todavía no están configurados en este sitio.', 'error');
  // El permiso se pide de inmediato, dentro del toque (el iPhone lo exige)
  Notification.requestPermission().then(async (permiso) => {
    if (permiso !== 'granted') {
      return avisoNoDisponible(esIPhone()
        ? 'No diste permiso. Para activarlos: Ajustes del iPhone → Notificaciones → Ligas → Permitir notificaciones. Luego vuelve a tocar «Activar avisos».'
        : 'No diste permiso. Toca el candado junto a la dirección del sitio → Notificaciones → Permitir, y vuelve a tocar «Activar avisos».');
    }
    try {
      const token = await tokenAparato();
      if (!token) throw new Error('sin token');
      await db.ref(rutaAparato(usuario.uid)).set({ token, tipo: tipoAparato(), at: firebase.database.ServerValue.TIMESTAMP });
      avisosActivos = true; avisosUidActual = usuario.uid;
      aviso('🔔 Avisos activados en este aparato');
      dibujar('ruta');
    } catch (e) {
      console.warn('Avisos:', e && e.message);
      aviso('No se pudieron activar los avisos. Intenta de nuevo.', 'error');
    }
  });
}

async function desactivarAvisos() {
  try {
    await db.ref(rutaAparato(usuario.uid)).remove();
    try { await firebase.messaging().deleteToken(); } catch (e) { /* ya no existía */ }
    avisosActivos = false;
    aviso('🔕 Avisos desactivados en este aparato');
    dibujar('ruta');
  } catch (e) { aviso('No se pudo desactivar. Intenta de nuevo.', 'error'); }
}

async function mandarAvisoPrueba(boton) {
  if (boton) boton.disabled = true;
  try {
    const idToken = await usuario.getIdToken();
    const r = await fetch('/api/aviso-prueba', { method: 'POST', headers: { Authorization: 'Bearer ' + idToken } });
    if (r.status === 429) aviso('Espera un minuto antes de pedir otro aviso de prueba.', 'error');
    else if (!r.ok) aviso('No se pudo mandar el aviso de prueba (' + r.status + ').', 'error');
    else aviso('✅ Aviso de prueba enviado: debe llegarte en unos segundos');
  } catch (e) { aviso('No se pudo mandar el aviso de prueba.', 'error'); }
  if (boton) setTimeout(() => { if (boton.isConnected) boton.disabled = false; }, 60000);
}

// ---------------------------------------------------------------------
// Al entrar: ¿este aparato ya tiene avisos? (y renueva el código si cambió)
// Al salir: se quitan los de esta cuenta en este aparato.
// ---------------------------------------------------------------------
async function revisarAvisos(alCambiar) {
  avisosActivos = false;
  if (!usuario || !soyAdmin || !leerLocal(AVISOS_DISP_KEY) || !navegadorPermiteAvisos() || !avisosConfigurados()) return;
  if (Notification.permission !== 'granted') return;
  const uid = usuario.uid;
  try {
    const s = await db.ref(rutaAparato(uid)).get();
    if (!s.exists() || !usuario || usuario.uid !== uid) return;
    avisosActivos = true; avisosUidActual = uid;
    alCambiar('datos');
    const guardado = s.val();
    const token = await tokenAparato();
    if (token && (token !== guardado.token || guardado.tipo !== tipoAparato())) {
      await db.ref(rutaAparato(uid)).update({ token, tipo: tipoAparato(), at: firebase.database.ServerValue.TIMESTAMP });
    }
  } catch (e) { console.warn('Avisos:', e && e.message); }
}

function quitarAvisosAlSalir() {
  if (!avisosActivos || !avisosUidActual) return Promise.resolve();
  return db.ref('avisosAdmin/' + avisosUidActual + '/' + idAparato()).remove().catch(() => {}).then(() => { avisosActivos = false; avisosUidActual = null; });
}

// Con Ligas abierto: al tocar un aviso se va a «Mis eventos»; si llega un
// aviso con la página al frente, se muestra abajo como mensaje breve.
function escucharAvisosEnPagina() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.addEventListener) {
    navigator.serviceWorker.addEventListener('message', (e) => {
      if (e.data && e.data.tipo === 'abrirSolicitudes') window.location.hash = '#/mis-eventos';
    });
  }
  if (!navegadorPermiteAvisos() || !avisosConfigurados()) return;
  try {
    firebase.messaging().onMessage((p) => {
      const n = (p && p.notification) || {};
      aviso((n.title || '🔔 Aviso') + (n.body ? ' — ' + n.body : ''));
    });
  } catch (e) { /* navegador sin soporte */ }
}
