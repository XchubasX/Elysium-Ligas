// =====================================================================
// js/inscripciones.js — LOS JUGADORES SE INSCRIBEN SOLOS (24 oct 2026)
// · El organizador abre las inscripciones y comparte el enlace de la liga.
// · El jugador entra con Google, escribe su nick y queda «pendiente».
// · El organizador (o sus ayudantes) acepta o rechaza. Ve el nick y el nombre
//   de Google para saber quién es; ese nombre NO es público.
// · Si el nick ya existe (alguien que se anotó a mano), se pregunta si es el
//   mismo jugador (se unen) o es otra persona (se acepta con otro nick).
// · Además: pegar una lista de nombres para agregarlos de golpe.
// Datos: eventos/{id}/inscripciones = 'abiertas' (sin el campo = cerradas)
//        inscripciones/{id}/{uid} = { nick, nombre, creada, estado, jid? }
//        (estado 'pendiente' o 'aceptada'; jid = jugador de la liga)
// =====================================================================
const NICK_KEY = 'ligas_mi_nick';
const inscripcionesEquipo = {};   // { liga: { uid: inscripción } } (solo el equipo las puede leer)
const escuchandoEquipo = {};      // ligas cuyo equipo ya escucha inscripciones
const miInscripcion = {};         // { liga: inscripción | null } de quien mira (undefined = sin cargar)
let uidInscripciones = null;      // cuenta para la que vale miInscripcion
const refsMias = [];

function leerNickGuardado() { try { return localStorage.getItem(NICK_KEY) || ''; } catch (e) { return ''; } }
function guardarNick(n) { try { localStorage.setItem(NICK_KEY, n); } catch (e) { /* sin almacenamiento */ } }
function inscripcionesAbiertas(ev) { return !!(ev && ev.inscripciones === 'abiertas'); }
function enlaceLiga(id) { return location.origin + location.pathname + '#/liga/' + id; }

// Al cambiar de cuenta se olvida lo cargado de la anterior
function reiniciarInscripciones() {
  const uid = usuario ? usuario.uid : null;
  if (uid === uidInscripciones) return;
  uidInscripciones = uid;
  refsMias.splice(0).forEach(r => r.off());
  Object.keys(miInscripcion).forEach(k => delete miInscripcion[k]);
}

// ---------------------------------------------------------------------
// Lado del jugador: tarjeta en la página de la liga
// ---------------------------------------------------------------------
function cargarMiInscripcion(id) {
  reiniciarInscripciones();
  if (!usuario || id in miInscripcion) return;
  miInscripcion[id] = undefined;
  const uid = usuario.uid;
  const r = db.ref('inscripciones/' + id + '/' + uid);
  refsMias.push(r);
  r.on('value', (s) => {
    if (!usuario || usuario.uid !== uid) return;
    const antes = miInscripcion[id]; const v = s.val();
    miInscripcion[id] = v;
    if (antes && antes.estado === 'pendiente' && v && v.estado === 'aceptada') aviso('✅ ¡Ya te aceptaron en la liga!');
    if (rutaActual().id === id) dibujar('datos');
  }, () => { miInscripcion[id] = null; });
}

function bloqueInscripcion(id, ev) {
  const caja = (cuerpo, borde) => '<div data-inscripcion class="bg-zinc-800 border ' + (borde || 'border-zinc-700') + ' rounded-xl p-4 space-y-2 text-sm">' + cuerpo + '</div>';
  if (!sesionLista) return '';
  if (usuario) cargarMiInscripcion(id);
  const mia = usuario ? miInscripcion[id] : null;
  if (usuario && mia === undefined) return '';
  const jugador = mia && mia.estado === 'aceptada' && mia.jid && ev.jugadores && ev.jugadores[mia.jid];
  if (jugador) {
    // Partidas libres: el jugador inscrito reporta las mesas que juega
    const reportar = esLibre(ev) && !temporadaCerrada(ev) && rutaActual().pestana !== 'partidas'
      ? '<a href="#/liga/' + esc(id) + '/partidas" class="' + BTN + ' w-full">🎲 Reportar mesa</a>' : '';
    return caja('<p class="font-bold text-emerald-300">✅ Estás inscrito como «' + esc(jugador.nick) + '»</p>' + reportar, 'border-emerald-700/60');
  }
  if (mia && mia.estado === 'pendiente') {
    return caja('<p class="font-bold text-emerald-300">✓ Inscripción enviada como «' + esc(mia.nick) + '»</p>' +
      '<p class="text-zinc-300">El organizador la tiene que confirmar. Aquí te avisamos cuando estés dentro.</p>' +
      '<button type="button" onclick="dosToques(this,()=>cancelarMiInscripcion(\'' + esc(id) + '\'))" class="text-xs text-zinc-400 underline">Cancelar inscripción</button>', 'border-emerald-700/60');
  }
  if (!inscripcionesAbiertas(ev)) return '';
  if (puedeCapturar(ev)) return ''; // el equipo administra las inscripciones en «Jugadores»
  const titulo = '<p class="font-bold">📝 Inscripciones abiertas</p>';
  if (!usuario) {
    return caja(titulo + '<p class="text-zinc-300">Entra con tu cuenta de Google y escribe tu nick para inscribirte. El organizador confirma tu lugar.</p>' +
      '<button type="button" onclick="entrarConGoogle()" class="' + BTN + ' w-full">Inscribirme</button>', 'border-wine-600/60');
  }
  const sugerido = leerNickGuardado() || nombreUsuario();
  return caja(titulo + '<form id="formInscripcion" class="space-y-2" onsubmit="enviarInscripcion(event,\'' + esc(id) + '\')">' +
    '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">Tu nick (así saldrás en la tabla)</span>' +
    '<input id="insNick" maxlength="30" value="' + esc(sugerido) + '" class="' + INP + '" autocomplete="nickname"></label>' +
    '<p id="insError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<button class="' + BTN + ' w-full">Inscribirme</button>' +
    '<p class="text-xs text-zinc-500">El organizador ve tu nick y tu nombre de Google para saber quién eres. En la página solo sale tu nick.</p></form>', 'border-wine-600/60');
}

async function enviarInscripcion(e, id) {
  e.preventDefault();
  const nick = $('insNick').value.trim();
  const err = (t) => { const p = $('insError'); p.textContent = t; p.classList.remove('hidden'); };
  if (!nick) return err('Escribe tu nick.');
  const datos = { nick: nick.slice(0, 30), nombre: String((usuario && usuario.displayName) || '').slice(0, 60), creada: firebase.database.ServerValue.TIMESTAMP, estado: 'pendiente' };
  try {
    // Si quedó una inscripción vieja (lo aceptaron y luego lo quitaron de la liga), se borra primero
    const nombreEv = (eventos[id] || {}).nombre || id;
    if (miInscripcion[id]) { const c = { ['inscripciones/' + id + '/' + usuario.uid]: null }; anotar(c, 'Quitó su inscripción anterior para inscribirse de nuevo · ' + nombreEv, id); await db.ref().update(c); }
    const cambios = { ['inscripciones/' + id + '/' + usuario.uid]: datos };
    anotar(cambios, 'Se inscribió como «' + datos.nick + '» · ' + nombreEv, id);
    await db.ref().update(cambios);
    guardarNick(datos.nick);
    miInscripcion[id] = { nick: datos.nick, estado: 'pendiente', creada: Date.now() };
    aviso('Inscripción enviada'); dibujar('ruta');
  } catch (x) { err('No se pudo enviar. Puede que las inscripciones ya estén cerradas.'); }
}
async function cancelarMiInscripcion(id) {
  try { const c = { ['inscripciones/' + id + '/' + usuario.uid]: null }; anotar(c, 'Canceló su inscripción · ' + ((eventos[id] || {}).nombre || id), id); await db.ref().update(c); miInscripcion[id] = null; aviso('Inscripción cancelada'); dibujar('ruta'); }
  catch (x) { aviso('No se pudo cancelar.', 'error'); }
}

// ---------------------------------------------------------------------
// Lado del equipo: tarjeta «📝 Inscripciones» en la pestaña Jugadores
// ---------------------------------------------------------------------
function escucharInscripcionesEquipo(id) {
  if (escuchandoEquipo[id]) return;
  escuchandoEquipo[id] = true;
  db.ref('inscripciones/' + id).on('value', (s) => {
    inscripcionesEquipo[id] = s.val() || {};
    if (rutaActual().id === id) dibujar('datos');
  }, () => { inscripcionesEquipo[id] = {}; });
}
function pendientesDe(id) {
  const t = inscripcionesEquipo[id] || {};
  return Object.keys(t).filter(u => t[u] && t[u].estado === 'pendiente').sort((a, b) => (t[a].creada || 0) - (t[b].creada || 0)).map(u => Object.assign({ uid: u }, t[u]));
}
function jugadorConNick(ev, nick) {
  const n = String(nick || '').trim().toLowerCase();
  return lista(ev.jugadores).find(p => String(p.nick).trim().toLowerCase() === n) || null;
}
function textoInvitacionInscripcion(id, ev) {
  return '📝 Inscríbete a ' + ev.nombre + ':\n' + enlaceLiga(id) + '\nEntra con tu cuenta de Google y escribe tu nick. El organizador confirma tu lugar.';
}

function tarjetaInscripciones(id, ev) {
  escucharInscripcionesEquipo(id);
  const abiertas = inscripcionesAbiertas(ev); const admin = puedeAdministrar(ev);
  let h = '<div data-inscripciones class="bg-zinc-800 border ' + (abiertas ? 'border-wine-600/60' : 'border-zinc-700') + ' rounded-xl p-3 space-y-2 text-sm">' +
    '<div class="flex justify-between items-center gap-2"><p class="font-semibold">📝 Inscripciones</p>' +
    '<span class="text-xs font-extrabold ' + (abiertas ? 'text-emerald-300' : 'text-zinc-500') + '">' + (abiertas ? 'ABIERTAS' : 'CERRADAS') + '</span></div>';
  if (abiertas) {
    h += '<p class="text-zinc-300">Comparte el enlace de la liga: cada jugador entra con Google, escribe su nick y aquí lo aceptas.</p>' +
      '<div class="flex gap-2 flex-wrap"><a href="' + esc(enlaceWhatsApp(textoInvitacionInscripcion(id, ev))) + '" target="_blank" rel="noopener" class="' + BTN + ' !bg-emerald-700 hover:!bg-emerald-600 flex-1">Compartir por WhatsApp</a>' +
      '<button type="button" onclick="copiarTexto(\'' + esc(enlaceLiga(id)) + '\', \'Enlace copiado\')" class="' + BTN2 + ' flex-1">Copiar enlace</button></div>';
  } else {
    h += '<p class="text-zinc-300">Ábrelas para que los jugadores se inscriban solos con su cuenta de Google.</p>';
  }
  if (admin) h += '<button type="button" onclick="' + (abiertas ? 'dosToques(this,()=>cambiarInscripciones(false))' : 'cambiarInscripciones(true)') + '" class="' + (abiertas ? BTN2 : BTN) + ' w-full">' + (abiertas ? 'Cerrar inscripciones' : 'Abrir inscripciones') + '</button>';
  else h += '<p class="text-xs text-zinc-500">Solo el organizador las abre o las cierra.</p>';

  const pend = pendientesDe(id);
  if (inscripcionesEquipo[id] === undefined) h += '<p class="text-zinc-400">Cargando inscripciones…</p>';
  else if (pend.length) {
    h += '<div class="border-t border-zinc-700 pt-2 space-y-2"><div class="flex justify-between items-center"><p class="font-semibold">Por aceptar</p><span class="' + PILL + ' bg-wine-600 text-white">' + pend.length + '</span></div>';
    pend.forEach(s => {
      const igual = jugadorConNick(ev, s.nick);
      const quien = '<p><b>' + esc(s.nick) + '</b>' + (s.nombre ? ' <span class="text-zinc-400">· ' + esc(s.nombre) + '</span>' : '') + '</p>';
      if (ui.otroNick === s.uid) {
        h += '<form data-inscrito="' + esc(s.nick) + '" class="space-y-1.5" onsubmit="aceptarConOtroNick(event,\'' + esc(s.uid) + '\')">' + quien +
          '<div class="flex gap-2"><input id="otroNick" maxlength="30" value="' + esc(s.nick) + ' 2" class="' + INP + '"><button class="' + BTN + ' !py-1.5">Aceptar</button>' +
          '<button type="button" onclick="ui.otroNick=null;dibujar(\'ruta\')" class="' + BTN2 + ' !py-1.5">×</button></div><p class="text-xs text-zinc-500">Ponle un nick distinto para no confundirlo con «' + esc(igual ? igual.nick : s.nick) + '».</p></form>';
        return;
      }
      h += '<div data-inscrito="' + esc(s.nick) + '" class="space-y-1.5">' + quien;
      if (igual) {
        h += '<p class="text-xs text-amber-300">Ya hay un jugador «' + esc(igual.nick) + '» en la liga. ¿Es la misma persona?</p>' +
          '<div class="flex gap-2 flex-wrap"><button type="button" onclick="aceptarInscripcion(\'' + esc(s.uid) + '\',\'' + esc(igual.id) + '\')" class="' + BTN + ' flex-1 !py-1.5">Sí, es el mismo</button>' +
          '<button type="button" onclick="ui.otroNick=\'' + esc(s.uid) + '\';dibujar(\'ruta\')" class="' + BTN2 + ' flex-1 !py-1.5">No, es otra persona</button>' +
          '<button type="button" onclick="dosToques(this,()=>rechazarInscripcion(\'' + esc(s.uid) + '\'))" class="' + BTN_PELIGRO + '">Rechazar</button></div>';
      } else {
        h += '<div class="flex gap-2"><button type="button" onclick="aceptarInscripcion(\'' + esc(s.uid) + '\')" class="' + BTN + ' flex-1 !py-1.5">Aceptar</button>' +
          '<button type="button" onclick="dosToques(this,()=>rechazarInscripcion(\'' + esc(s.uid) + '\'))" class="' + BTN2 + ' flex-1 !py-1.5">Rechazar</button></div>';
      }
      h += '</div>';
    });
    if (pend.filter(s => !jugadorConNick(ev, s.nick)).length > 1) h += '<button type="button" onclick="aceptarTodas()" class="' + BTN2 + ' w-full">Aceptar todas las que no tienen nick repetido</button>';
    h += '<p class="text-xs text-zinc-500">El nombre de Google solo lo ve el equipo de la liga; en la página pública solo sale el nick.</p></div>';
  }
  return h + '</div>';
}

async function cambiarInscripciones(abrir) {
  if (await guardar(idLigaActual(), { inscripciones: abrir ? 'abiertas' : null }, abrir ? 'Inscripciones abiertas' : 'Inscripciones cerradas')) dibujar('ruta');
}

// Acepta una o varias inscripciones de una vez. lista = [{ uid, jid?, nick? }]
// Sin jid: se crea el jugador con su nick. Con jid: se une a ese jugador que ya existe.
async function aceptarVarias(lista) {
  const id = idLigaActual(); const ev = ligaActual(); const t = inscripcionesEquipo[id] || {};
  const cambios = {};
  for (const x of lista) {
    const s = t[x.uid]; if (!s) continue;
    let jid = x.jid;
    if (!jid) { jid = nuevoId('p'); cambios['eventos/' + id + '/jugadores/' + jid] = { nick: String(x.nick || s.nick).trim().slice(0, 30) }; }
    cambios['inscripciones/' + id + '/' + x.uid + '/estado'] = 'aceptada';
    cambios['inscripciones/' + id + '/' + x.uid + '/jid'] = jid;
  }
  if (!Object.keys(cambios).length) return false;
  const quienes = lista.filter(x => t[x.uid]).map(x => {
    const s = t[x.uid]; const nick = x.nick || s.nick;
    return '«' + nick + '» (' + (s.nombre || 'sin nombre') + ')' + (x.jid ? ' unido a «' + ((ev.jugadores || {})[x.jid] || {}).nick + '»' : '');
  });
  anotar(cambios, (quienes.length === 1 ? 'Aceptó la inscripción de ' + quienes[0] : 'Aceptó ' + quienes.length + ' inscripciones') + ' · ' + (ev.nombre || id), id, quienes.join('\n'));
  try { await db.ref().update(cambios); return true; }
  catch (e) { console.warn(e); aviso('No se pudo aceptar. Revisa tu conexión o tus permisos.', 'error'); return false; }
}
async function aceptarInscripcion(uid, jid) {
  const s = (inscripcionesEquipo[idLigaActual()] || {})[uid];
  if (await aceptarVarias([{ uid, jid }])) { aviso((s ? s.nick : 'Jugador') + (jid ? ' unido a su jugador' : ' aceptado')); dibujar('ruta'); }
}
async function aceptarConOtroNick(e, uid) {
  e.preventDefault();
  const nick = $('otroNick').value.trim(); const ev = ligaActual();
  if (!nick) return aviso('Escribe el nick.', 'error');
  if (nickRepetido(ev, nick)) return aviso('Ya hay un jugador con ese nick.', 'error');
  if (await aceptarVarias([{ uid, nick }])) { ui.otroNick = null; aviso(nick + ' aceptado'); dibujar('ruta'); }
}
async function aceptarTodas() {
  const id = idLigaActual(); const ev = ligaActual();
  const vistos = new Set();
  const lista = pendientesDe(id).filter(s => {
    const k = String(s.nick).trim().toLowerCase();
    if (jugadorConNick(ev, s.nick) || vistos.has(k)) return false; // repetidos: se deciden uno por uno
    vistos.add(k); return true;
  }).map(s => ({ uid: s.uid }));
  if (await aceptarVarias(lista)) { aviso(lista.length === 1 ? 'Se aceptó 1 inscripción' : 'Se aceptaron ' + lista.length + ' inscripciones'); dibujar('ruta'); }
}
async function rechazarInscripcion(uid) {
  const id = idLigaActual(); const s = (inscripcionesEquipo[id] || {})[uid] || {};
  try { const c = { ['inscripciones/' + id + '/' + uid]: null }; anotar(c, 'Rechazó la inscripción de «' + (s.nick || '?') + '» (' + (s.nombre || 'sin nombre') + ') · ' + ((eventos[id] || {}).nombre || id), id); await db.ref().update(c); aviso('Inscripción rechazada'); dibujar('ruta'); }
  catch (e) { aviso('No se pudo rechazar.', 'error'); }
}

// ---------------------------------------------------------------------
// Pegar una lista de nombres (uno por renglón)
// ---------------------------------------------------------------------
// Quita viñetas y números del principio («1.», «2)», «-», «•») y repetidos
function nicksDeLista(texto, ev) {
  const ya = new Set(lista(ev.jugadores).map(p => String(p.nick).trim().toLowerCase()));
  const nuevos = [], repetidos = [];
  String(texto || '').split(/\r?\n/).forEach(l => {
    const n = l.replace(/^\s*(\d+\s*[.)\-:]|[-•*·–])\s*/, '').trim().slice(0, 30);
    if (!n) return;
    const k = n.toLowerCase();
    if (ya.has(k)) { repetidos.push(n); return; }
    ya.add(k); nuevos.push(n);
  });
  return { nuevos, repetidos };
}
function bloquePegarLista() {
  return '<details class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 text-sm"><summary class="font-semibold cursor-pointer">Pegar varios nombres</summary>' +
    '<form class="space-y-2 pt-2" onsubmit="agregarListaPegada(event)"><textarea id="listaNicks" rows="5" class="' + INP + '" placeholder="Uno por renglón, por ejemplo:&#10;Toni&#10;Lasombra&#10;Mau"></textarea>' +
    '<button class="' + BTN2 + ' w-full">Agregar todos</button><p class="text-xs text-zinc-500">Se quitan números y viñetas del principio, y se saltan los que ya están en la liga.</p></form></details>';
}
async function agregarListaPegada(e) {
  e.preventDefault();
  const id = idLigaActual(); const ev = ligaActual(); if (!ev) return;
  const { nuevos, repetidos } = nicksDeLista($('listaNicks').value, ev);
  if (!nuevos.length) return aviso(repetidos.length ? 'Todos esos jugadores ya están en la liga.' : 'Pega al menos un nombre.', 'error');
  const cambios = {}; nuevos.forEach(n => { cambios['jugadores/' + nuevoId('p')] = { nick: n }; });
  const texto = (nuevos.length === 1 ? 'Se agregó 1 jugador' : 'Se agregaron ' + nuevos.length + ' jugadores') + (repetidos.length ? ' (' + repetidos.length + ' ya estaban)' : '');
  if (await guardar(id, cambios, texto)) { $('listaNicks').value = ''; dibujar('ruta'); }
}
