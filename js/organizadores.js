// =====================================================================
// js/organizadores.js — ORGANIZADORES (solo superusuario, 26 oct 2026)  #/organizadores
// · Lista de organizadores: nombre, ciudad, desde cuándo, sus ligas y torneos.
// · Cambiar el nombre con el que aparece en la lista.
// · Quitar permiso (dos toques): sus ligas se quedan como están; solo el
//   superusuario las administra hasta que las transfiera.
// · Transferir una liga o torneo a otro organizador: cambia el dueño y el
//   nombre del organizador de la página pública; los ayudantes se quedan.
// · Ligas sin organizador activo (su dueño ya no tiene permiso).
// Datos: organizadores/{uid} = true (permiso)
//        organizadoresInfo/{uid} = { nombre, ciudad?, desde? } (solo lo lee el superusuario)
// =====================================================================
let organizadoresLista = null, organizadoresInfo = null, escuchandoOrganizadores = false, errorOrganizadores = false;
const uiOrg = { editar: null, transferir: null };

function escucharOrganizadores() {
  if (escuchandoOrganizadores || !soyAdmin) return;
  escuchandoOrganizadores = true;
  const redibujar = () => { if (rutaActual().vista === 'organizadores' || rutaActual().vista === 'mis-eventos') dibujar('datos'); };
  const fallo = () => { errorOrganizadores = true; organizadoresLista = organizadoresLista || {}; organizadoresInfo = organizadoresInfo || {}; redibujar(); };
  db.ref('organizadores').on('value', (s) => { organizadoresLista = s.val() || {}; redibujar(); }, fallo);
  db.ref('organizadoresInfo').on('value', (s) => { organizadoresInfo = s.val() || {}; redibujar(); }, fallo);
}

function eventosDe(uid) {
  return Object.keys(eventos).filter(id => eventos[id].ownerUid === uid)
    .sort((a, b) => String(eventos[a].nombre).localeCompare(String(eventos[b].nombre), 'es'));
}
// Nombre para mostrar: el guardado; si no hay, el que puso en sus ligas; si no, «Sin nombre»
function nombreOrganizador(uid) {
  const info = (organizadoresInfo || {})[uid];
  if (info && info.nombre) return info.nombre;
  const ev = eventosDe(uid).map(id => eventos[id]).find(e => e.organizadorNombre);
  return ev ? ev.organizadorNombre : 'Sin nombre';
}
// Organizadores ordenados por nombre: [{ uid, nombre, ciudad, desde, eventos }]
function organizadoresOrdenados() {
  return Object.keys(organizadoresLista || {}).filter(uid => organizadoresLista[uid] === true).map(uid => {
    const info = (organizadoresInfo || {})[uid] || {};
    return { uid, nombre: nombreOrganizador(uid), ciudad: info.ciudad || '', desde: info.desde || null, eventos: eventosDe(uid) };
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
}
// Ligas y torneos cuyo dueño ya no es organizador
function eventosSinOrganizador() {
  return Object.keys(eventos).filter(id => !(organizadoresLista || {})[eventos[id].ownerUid])
    .sort((a, b) => String(eventos[a].nombre).localeCompare(String(eventos[b].nombre), 'es'));
}

// Identificador abreviado (para buscarlo en Firebase → Authentication → Users, que muestra el correo)
function uidCorto(uid) { const u = String(uid || ''); return u.length > 10 ? u.slice(0, 4) + '…' + u.slice(-4) : u; }
function botonIdentificador(uid) {
  return '<span data-uid class="flex items-center gap-1.5 text-[11px] text-zinc-500">ID: <code>' + esc(uidCorto(uid)) + '</code>' +
    '<button type="button" onclick="copiarTexto(\'' + esc(uid) + '\',\'Identificador copiado\')" class="underline text-zinc-400 hover:text-zinc-200">Copiar identificador</button></span>';
}

function enlaceOrganizadores() {
  if (!soyAdmin) return '';
  escucharOrganizadores();
  const n = organizadoresLista ? organizadoresOrdenados().length : null;
  return '<a href="#/organizadores" data-enlace-organizadores class="flex justify-between items-center bg-zinc-800 border border-wine-600/50 rounded-xl px-4 py-3 hover:bg-zinc-700/70">' +
    '<span class="font-bold">👥 Organizadores' + (n !== null ? ' <span class="text-zinc-400 font-normal">(' + n + ')</span>' : '') + '</span><span class="text-sm font-bold text-wine-300">Administrar ›</span></a>';
}

function vistaOrganizadores() {
  if (!sesionLista) return cargando();
  if (!soyAdmin) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Esta sección es solo para el superusuario.</p><a href="#/mis-eventos" class="' + BTN2 + '">Ir a Mis eventos</a></div>';
  escucharOrganizadores();
  let h = '<a href="#/mis-eventos" class="text-sm text-zinc-400 hover:text-zinc-200">← Mis eventos</a><h2 class="text-base font-bold">👥 Organizadores</h2>' + bloqueSolicitudesAdmin();
  if (errorOrganizadores) return h + '<p class="text-sm text-red-300">No se pudo leer la lista de organizadores. Revisa que las reglas de la base de datos estén actualizadas.</p>';
  if (!datosCargados || organizadoresLista === null || organizadoresInfo === null) return h + cargando();
  const orgs = organizadoresOrdenados();
  h += '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">';
  if (!orgs.length) h += '<p class="py-2 text-zinc-400">Todavía no hay organizadores.</p>';
  orgs.forEach(o => {
    const yo = usuario && o.uid === usuario.uid;
    h += '<div data-organizador="' + esc(o.nombre) + '" class="py-3 space-y-2">';
    if (uiOrg.editar === o.uid) {
      h += '<form class="flex gap-2" onsubmit="guardarNombreOrganizador(event,\'' + esc(o.uid) + '\')"><input id="orgNombre" maxlength="40" value="' + esc(o.nombre === 'Sin nombre' ? '' : o.nombre) + '" class="' + INP + '" placeholder="Nombre"><button class="' + BTN + '">Guardar</button>' +
        '<button type="button" onclick="uiOrg.editar=null;dibujar(\'ruta\')" class="' + BTN2 + '">×</button></form>';
    } else {
      h += '<div class="flex justify-between items-start gap-2"><span><b>' + esc(o.nombre) + '</b>' + (yo ? ' <span class="text-[11px] font-bold text-wine-300">TÚ</span>' : '') +
        '<br><span class="text-xs text-zinc-400">' + [o.ciudad ? esc(o.ciudad) : '', o.desde ? 'desde ' + esc(fechaLarga(new Date(o.desde).toISOString().slice(0, 10))) : '',
          o.eventos.length + (o.eventos.length === 1 ? ' evento' : ' eventos')].filter(Boolean).join(' · ') + '</span>' + botonIdentificador(o.uid) + '</span>' +
        '<span class="flex gap-1.5"><button type="button" onclick="uiOrg.editar=\'' + esc(o.uid) + '\';dibujar(\'ruta\')" class="' + BTN_CH + '">Nombre</button>' +
        (yo ? '' : '<button type="button" onclick="dosToques(this,()=>quitarOrganizador(\'' + esc(o.uid) + '\'))" class="' + BTN_PELIGRO + '">Quitar permiso</button>') + '</span></div>';
    }
    h += listaEventosTransferibles(o.eventos, o.uid, orgs) + '</div>';
  });
  h += '</div><p class="text-xs text-zinc-500">¿No sabes quién es? Copia su identificador y búscalo en la consola de Firebase → Authentication → Users: ahí sale su correo.</p>' +
    '<p class="text-xs text-zinc-500">Quitar el permiso no borra nada: sus ligas y torneos se quedan como están y solo tú los administras hasta que los transfieras a otro organizador.</p>';

  const huerfanos = eventosSinOrganizador();
  if (huerfanos.length) {
    h += '<div data-sin-organizador class="bg-zinc-800 border border-amber-700/60 rounded-xl p-3 space-y-2 text-sm"><p class="font-semibold text-amber-200">Ligas y torneos sin organizador activo</p>' +
      '<p class="text-xs text-zinc-400">Su dueño ya no tiene permiso de organizador. Solo tú los administras; transfiérelos a otro organizador.</p>' +
      listaEventosTransferibles(huerfanos, null, orgs) + '</div>';
  }
  return h;
}

function listaEventosTransferibles(ids, dueno, orgs) {
  if (!ids.length) return '';
  const destinos = orgs.filter(o => o.uid !== dueno);
  return '<div class="space-y-1.5">' + ids.map(id => {
    const ev = eventos[id];
    const etiqueta = (esTorneo(ev) ? ' <span class="text-[10px] font-bold text-amber-300">TORNEO</span>' : '') + (ev.archivada ? ' <span class="text-[10px] font-bold text-zinc-500">ARCHIVADO</span>' : '');
    if (uiOrg.transferir === id) {
      return '<form data-transferir="' + esc(id) + '" class="bg-zinc-900 rounded-lg p-2 space-y-2" onsubmit="transferirEvento(event,\'' + esc(id) + '\')"><p>Transferir <b>' + esc(ev.nombre) + '</b> a:</p>' +
        (destinos.length ? '<select id="orgDestino" class="' + INP + '">' + destinos.map(o => '<option value="' + esc(o.uid) + '">' + esc(o.nombre) + '</option>').join('') + '</select>' +
          '<p class="text-xs text-zinc-400">Cambia el dueño y el nombre del organizador en la página pública. Los ayudantes se quedan.</p>' +
          '<div class="flex gap-2"><button class="' + BTN + ' !py-1.5">Transferir</button><button type="button" onclick="uiOrg.transferir=null;dibujar(\'ruta\')" class="' + BTN2 + ' !py-1.5">Cancelar</button></div>'
          : '<p class="text-xs text-amber-300">No hay otro organizador al cual transferirlo.</p><button type="button" onclick="uiOrg.transferir=null;dibujar(\'ruta\')" class="' + BTN2 + ' !py-1.5">Cerrar</button>') + '</form>';
    }
    return '<div data-evento-org="' + esc(id) + '" class="pl-2 border-l-2 border-zinc-700 space-y-0.5"><div class="flex justify-between items-center gap-2"><a href="#/liga/' + esc(id) + '" class="text-wine-300 underline truncate">' + esc(ev.nombre) + '</a>' + etiqueta +
      '<button type="button" onclick="uiOrg.transferir=\'' + esc(id) + '\';dibujar(\'ruta\')" class="' + BTN_CH + ' ml-auto">Transferir</button></div>' +
      (dueno ? '' : '<p class="text-[11px] text-zinc-500">Dueño anterior: ' + esc(ev.organizadorNombre || 'sin nombre') + '</p>' + botonIdentificador(ev.ownerUid)) + '</div>';
  }).join('') + '</div>';
}

async function guardarNombreOrganizador(e, uid) {
  e.preventDefault();
  const nombre = $('orgNombre').value.trim().slice(0, 40);
  if (!nombre) return aviso('Escribe el nombre.', 'error');
  const antes = nombreOrganizador(uid);
  try { const c = { ['organizadoresInfo/' + uid + '/nombre']: nombre }; anotar(c, 'Cambió el nombre del organizador: ' + antes + ' → ' + nombre, null, 'Cuenta: ' + uid); await db.ref().update(c); uiOrg.editar = null; aviso('Nombre guardado'); dibujar('ruta'); }
  catch (x) { aviso('No se pudo guardar. Revisa que las reglas estén actualizadas.', 'error'); }
}

async function quitarOrganizador(uid) {
  const n = nombreOrganizador(uid);
  const c = { ['organizadores/' + uid]: null, ['organizadoresInfo/' + uid]: null };
  anotar(c, 'Le quitó el permiso de organizador a ' + n, null, 'Cuenta: ' + uid + '\nSus eventos: ' + (eventosDe(uid).map(id => eventos[id].nombre).join(', ') || 'ninguno'));
  try { await db.ref().update(c); aviso(n + ' ya no es organizador'); dibujar('ruta'); }
  catch (x) { aviso('No se pudo quitar el permiso.', 'error'); }
}

async function transferirEvento(e, id) {
  e.preventDefault();
  const ev = eventos[id]; const destino = $('orgDestino') && $('orgDestino').value;
  if (!ev || !destino || !(organizadoresLista || {})[destino]) return aviso('Elige un organizador.', 'error');
  const nombre = nombreOrganizador(destino);
  const cambios = { ownerUid: destino, organizadorNombre: (nombre === 'Sin nombre' ? 'Organizador' : nombre).slice(0, 40) };
  if (ev.ayudantes && ev.ayudantes[destino]) cambios['ayudantes/' + destino] = null; // el nuevo dueño ya no es ayudante de su propia liga
  if (await guardar(id, cambios, '«' + ev.nombre + '» ahora es de ' + nombre, 'Transfirió a ' + nombre + ' (antes de ' + nombreOrganizador(ev.ownerUid) + ')')) { uiOrg.transferir = null; dibujar('ruta'); }
}
