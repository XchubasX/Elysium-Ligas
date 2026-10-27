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
    reiniciarInscripciones(); // lo inscrito por otra cuenta no se mezcla (js/inscripciones.js)
    sesionLista = true;
    alCambiar('sesion');
    revisarAvisos(alCambiar); // ¿este aparato ya recibe avisos de solicitudes? (js/avisos.js)
  });
}

function entrarConGoogle() {
  if (navegadorDentroDeApp()) { aviso('Abre esta página en Chrome o Safari para entrar con Google.', 'error'); return Promise.resolve(); }
  const p = new firebase.auth.GoogleAuthProvider();
  p.setCustomParameters({ prompt: 'select_account' });
  // Abierto como app desde el ícono (iPhone): la ventanita de Google no funciona;
  // se va a la página de Google y regresa (ver resultadoEntrarConGoogle).
  if (abiertoComoApp() && auth.signInWithRedirect) {
    return auth.signInWithRedirect(p).catch(() => aviso('No se pudo abrir Google. Revisa tu conexión e intenta de nuevo.', 'error'));
  }
  return auth.signInWithPopup(p).catch((e) => {
    if (e && e.code === 'auth/popup-closed-by-user') return;
    aviso('No se pudo entrar con Google. Intenta de nuevo.', 'error');
  });
}
function cerrarSesion() { return quitarAvisosAlSalir().then(() => auth.signOut()); }
// Al regresar de la página de Google (abierto como app): avisa si algo falló
function resultadoEntrarConGoogle() {
  if (!auth.getRedirectResult) return;
  auth.getRedirectResult().catch((e) => aviso('No se pudo entrar con Google (' + ((e && e.code) || 'error') + '). Intenta de nuevo.', 'error'));
}

function esDueno(ev) { return !!(usuario && ev && ev.ownerUid === usuario.uid && soyOrganizador); }
function esAyudante(ev) { return !!(usuario && ev && ev.ayudantes && ev.ayudantes[usuario.uid]); }
function puedeAdministrar(ev) { return soyAdmin || esDueno(ev); }
function puedeCapturar(ev) { return puedeAdministrar(ev) || esAyudante(ev); }

function nombreUsuario() { return (usuario && (usuario.displayName || '').split(' ')[0]) || 'Tú'; }

function crearLiga(id, datos, tipo) {
  const cambios = {};
  const aid = anotar(cambios, (tipo === 'torneo' ? 'Creó el torneo «' : 'Creó la liga «') + datos.nombre + '»', id,
    detalleCambios({}, Object.fromEntries(Object.keys(datos).filter(k => k !== 'jornadas').map(k => [k, datos[k]]))));
  cambios['eventos/' + id] = Object.assign({}, datos, {
    ownerUid: usuario.uid, tipo: tipo === 'torneo' ? 'torneo' : 'liga', creada: firebase.database.ServerValue.TIMESTAMP, reg: aid
  });
  return db.ref().update(cambios);
}

// Escribe varios cambios de una vez dentro de eventos/{id} (rutas relativas).
// En la misma escritura queda anotado en el historial (js/auditoria.js) y
// eventos/{id}/reg apunta a esa anotación (las reglas lo exigen en resultados).
// registro = texto para el historial (si no, textoOk). Si la base lo rechaza, avisa y devuelve false.
async function guardar(id, cambios, textoOk, registro) {
  try {
    const ev = eventos[id] || {};
    const todo = {};
    Object.keys(cambios).forEach(k => { todo['eventos/' + id + '/' + k] = cambios[k]; });
    todo['eventos/' + id + '/reg'] = anotar(todo, (registro || textoOk || textoAutomatico(ev, cambios)) + (ev.nombre ? ' · ' + ev.nombre : ''), id, detalleCambios(ev, cambios));
    await db.ref().update(todo);
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
    const ev = eventos[id] || {};
    const cambios = { ['eventos/' + id]: null };
    anotar(cambios, 'Borró definitivamente ' + (esTorneo(ev) ? 'el torneo' : 'la liga') + ' «' + (ev.nombre || id) + '»', id,
      Object.keys(ev.jugadores || {}).length + ' jugadores · ' + Object.keys(ev.jornadas || {}).length + ' jornadas · ' + Object.keys(ev.mesas || {}).length + ' mesas · dueño ' + (ev.organizadorNombre || '') + ' (' + (ev.ownerUid || '') + ')');
    try { const s = await db.ref('invitaciones/' + id).get(); Object.keys(s.val() || {}).forEach(c => { cambios['invitaciones/' + id + '/' + c] = null; }); } catch (e) { /* sin invitaciones */ }
    try { const s = await db.ref('inscripciones/' + id).get(); Object.keys(s.val() || {}).forEach(u => { cambios['inscripciones/' + id + '/' + u] = null; }); } catch (e) { /* sin inscripciones */ }
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
