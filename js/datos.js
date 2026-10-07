// =====================================================================
// js/datos.js — FIREBASE: conexión, sesión con Google y permisos.
// Los permisos que se revisan aquí solo deciden qué botones mostrar;
// la protección real son las reglas de la base de datos.
// =====================================================================
let db = null, auth = null;
let usuario = null, soyAdmin = false, soyOrganizador = false, sesionLista = false;
let eventos = {}, datosCargados = false, errorDatos = false;
// Solicitudes para ser organizador: la propia (cuenta sin permiso) y todas (superusuario)
let miSolicitud = null, solicitudes = {}, escuchandoSolicitudes = false;

function iniciarFirebase() {
  const cfg = window.LIGAS_CONFIG;
  firebase.initializeApp(cfg.firebase);
  firebase.appCheck().activate(new firebase.appCheck.ReCaptchaEnterpriseProvider(cfg.recaptchaKey), true);
  db = firebase.database();
  auth = firebase.auth();
}

function escucharEventos(alCambiar) {
  db.ref('eventos').on('value', (s) => { eventos = s.val() || {}; datosCargados = true; errorDatos = false; alCambiar('datos'); },
    (e) => { console.warn('No se pudieron leer las ligas:', e && e.message); errorDatos = true; alCambiar('datos'); });
}

async function leerPropio(rama, uid) {
  try { const s = await db.ref(rama + '/' + uid).get(); return s.val() === true; } catch (e) { return false; }
}

function escucharSesion(alCambiar) {
  auth.onAuthStateChanged(async (u) => {
    usuario = u || null; soyAdmin = false; soyOrganizador = false;
    if (usuario) { [soyAdmin, soyOrganizador] = await Promise.all([leerPropio('admins', usuario.uid), leerPropio('organizadores', usuario.uid)]); }
    await cargarSolicitudes(alCambiar);
    sesionLista = true;
    alCambiar('sesion');
  });
}

function entrarConGoogle() {
  if (navegadorDentroDeApp()) { aviso('Abre esta página en Chrome o Safari para entrar con Google.', 'error'); return Promise.resolve(); }
  const p = new firebase.auth.GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  return auth.signInWithPopup(p).catch((e) => {
    if (e && e.code === 'auth/popup-closed-by-user') return;
    aviso('No se pudo entrar con Google. Intenta de nuevo.', 'error');
  });
}
function cerrarSesion() { return auth.signOut(); }

function esDueno(ev) { return !!(usuario && ev && ev.ownerUid === usuario.uid && soyOrganizador); }
function esAyudante(ev) { return !!(usuario && ev && ev.ayudantes && ev.ayudantes[usuario.uid]); }
function puedeAdministrar(ev) { return soyAdmin || esDueno(ev); }
function puedeCapturar(ev) { return puedeAdministrar(ev) || esAyudante(ev); }

function nombreUsuario() { return (usuario && (usuario.displayName || '').split(' ')[0]) || 'Tú'; }

function crearLiga(id, datos, tipo) {
  return db.ref('eventos/' + id).set(Object.assign({}, datos, {
    ownerUid: usuario.uid, tipo: tipo === 'torneo' ? 'torneo' : 'liga', creada: firebase.database.ServerValue.TIMESTAMP
  }));
}

// Escribe varios cambios de una vez dentro de eventos/{id} (rutas relativas).
// Si la base lo rechaza, avisa y devuelve false.
async function guardar(id, cambios, textoOk) {
  try {
    await db.ref('eventos/' + id).update(cambios);
    if (textoOk) aviso(textoOk);
    return true;
  } catch (e) {
    console.warn('No se pudo guardar:', e && e.message);
    aviso('No se pudo guardar. Revisa tu conexión o tus permisos.', 'error');
    return false;
  }
}
async function borrarLiga(id) {
  try {
    // Las invitaciones pendientes se borran una por una (las reglas no dejan borrar la rama completa)
    const cambios = { ['eventos/' + id]: null };
    try { const s = await db.ref('invitaciones/' + id).get(); Object.keys(s.val() || {}).forEach(c => { cambios['invitaciones/' + id + '/' + c] = null; }); } catch (e) { /* sin invitaciones */ }
    await db.ref().update(cambios); aviso('Liga borrada'); return true;
  }
  catch (e) { aviso('No se pudo borrar la liga.', 'error'); return false; }
}

let refAprobacion = null, refMiSolicitud = null;
function dejarDeEscucharAprobacion() {
  if (refAprobacion) refAprobacion.off(); if (refMiSolicitud) refMiSolicitud.off();
  refAprobacion = refMiSolicitud = null;
}
async function cargarSolicitudes(alCambiar) {
  miSolicitud = null;
  dejarDeEscucharAprobacion();
  if (usuario && !soyOrganizador && !soyAdmin) {
    try { miSolicitud = (await db.ref('solicitudes/' + usuario.uid).get()).val(); } catch (e) { miSolicitud = null; }
    // En vivo: si el administrador aprueba, aparecen «+ Nueva liga» y «+ Nuevo torneo» sin recargar
    const uid = usuario.uid;
    refAprobacion = db.ref('organizadores/' + uid);
    refAprobacion.on('value', (s) => {
      if (s.val() !== true || !usuario || usuario.uid !== uid || soyOrganizador) return;
      soyOrganizador = true; miSolicitud = null;
      dejarDeEscucharAprobacion();
      aviso('✅ ¡Ya te aprobaron! Ya puedes crear ligas y torneos');
      alCambiar('sesion');
    }, () => {});
    // Si el administrador la rechaza (se borra), vuelve a salir el formulario
    refMiSolicitud = db.ref('solicitudes/' + uid);
    refMiSolicitud.on('value', (s) => {
      if (!usuario || usuario.uid !== uid || soyOrganizador) return;
      const v = s.val();
      if (!!v !== !!miSolicitud) { miSolicitud = v; alCambiar('datos'); }
    }, () => {});
  }
  if (soyAdmin && !escuchandoSolicitudes) {
    escuchandoSolicitudes = true;
    db.ref('solicitudes').on('value', (s) => { solicitudes = s.val() || {}; alCambiar('datos'); }, () => { solicitudes = {}; });
  }
}
