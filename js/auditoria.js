// =====================================================================
// js/auditoria.js — HISTORIAL DE CAMBIOS (27 oct 2026)  #/historial
// · Cada cambio que hace la página queda anotado: quién (cuenta y nombre de
//   Google), cuándo, qué hizo y, cuando aplica, el antes y el después.
// · SOLO el superusuario lo puede ver. Nadie lo puede editar ni borrar desde
//   la página (ni el superusuario); solo desde la consola de Firebase.
// · Para los resultados (jornadas, mesas de partidas libres, temporada) las
//   reglas de la base EXIGEN que el cambio venga con su anotación: cada
//   escritura apunta eventos/{id}/reg a una anotación nueva de quien escribe.
// Datos: auditoria/{aid} = { uid, nombre, cuando, evento?, texto, detalle? }
// No se anotan: los avisos al celular del superusuario (aparatos registrados).
// =====================================================================
let auditoria = null, escuchandoAuditoria = false, errorAuditoria = false;
const uiHist = { evento: '', persona: '', texto: '', cuantos: 100 };

function idAuditoria() { return 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// Anotación lista para guardar en la misma escritura que el cambio
function entradaAuditoria(texto, evento, detalle) {
  const e = { uid: usuario ? usuario.uid : '', nombre: String((usuario && usuario.displayName) || 'Sin nombre').slice(0, 60),
    cuando: firebase.database.ServerValue.TIMESTAMP, texto: String(texto || 'Cambio').slice(0, 300) };
  if (evento) e.evento = String(evento).slice(0, 40);
  const d = String(detalle || '').slice(0, 4000); if (d) e.detalle = d;
  return e;
}
// Agrega la anotación a un objeto de cambios de la raíz (db.ref().update) y devuelve su id
function anotar(cambiosRaiz, texto, evento, detalle) {
  const aid = idAuditoria();
  cambiosRaiz['auditoria/' + aid] = entradaAuditoria(texto, evento, detalle);
  return aid;
}

// ---------------- Antes y después, en palabras
function valorEn(obj, ruta) { return ruta.split('/').reduce((n, k) => (n == null ? undefined : n[k]), obj); }
function nicksDe(ev, cambios) {
  const m = {}; Object.keys((ev && ev.jugadores) || {}).forEach(j => { m[j] = ev.jugadores[j].nick; });
  Object.keys(cambios || {}).forEach(k => { const x = /^jugadores\/([^/]+)$/.exec(k); if (x && cambios[k] && cambios[k].nick) m[x[1]] = cambios[k].nick; });
  return m;
}
const NOMBRES_CAMPO = { presentes: 'pase de lista', vp: 'VP', hazanas: 'hazaña', hazanasCatalogo: 'catálogo de hazañas', estado: 'estado', final: 'final',
  ayudantes: 'ayudante', jugadores: 'jugador', nick: 'nick', asiento: 'asiento', fecha: 'fecha', hora: 'hora', temporada: 'temporada', inscripciones: 'inscripciones',
  organizadorNombre: 'nombre del organizador', ownerUid: 'dueño', archivada: 'archivada', reglasTexto: 'reglas', hazanasModo: 'hazañas', inicio: 'inicio', fin: 'fin',
  nombre: 'nombre', pais: 'país', ciudad: 'ciudad', plataforma: 'plataforma', modalidad: 'modalidad', zona: 'zona horaria', invitados: 'invitados', mesa: 'mesa de' };
function rutaLegible(ev, ruta, nicks) {
  const p = ruta.split('/'); const out = [];
  for (let i = 0; i < p.length; i++) {
    const k = p[i], sig = p[i + 1];
    if (k === 'jornadas' && sig) { const j = (ev.jornadas || {})[sig]; out.push(esTorneo(ev) ? 'Torneo' : 'Jornada ' + (j && j.numero ? j.numero : sig)); i++; }
    else if (k === 'rondas' && sig) { out.push('ronda ' + sig.replace(/^r/, '')); i++; }
    else if (k === 'mesas' && sig && i > 0) { out.push('mesa ' + sig.replace(/^m/, '')); i++; }
    else if (k === 'mesas' && sig) { const m = (ev.mesas || {})[sig]; out.push('Mesa' + (m && m.fecha ? ' del ' + fechaCorta(m.fecha) : '')); i++; }
    else if (nicks[k]) out.push(nicks[k]);
    else if (NOMBRES_CAMPO[k]) out.push(NOMBRES_CAMPO[k]);
    else out.push(k);
  }
  return out.join(' · ');
}
function valorLegible(v, nicks) {
  if (v === null || v === undefined) return '—';
  if (typeof v !== 'object') return String(v);
  let t = JSON.stringify(v, (k, x) => (x && typeof x === 'object' && x['.sv']) ? 'ahora' : x);
  Object.keys(nicks).forEach(j => { t = t.replace(new RegExp('"' + j.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"', 'g'), '"' + nicks[j] + '"'); });
  t = t.replace(/[{}"]/g, '').replace(/:/g, ': ').replace(/,/g, ', ');
  return t.length > 300 ? t.slice(0, 300) + '…' : t;
}
// Una línea por cambio: «Jornada 2 · ronda 1 · mesa 1 · Toni · VP: 1 → 2»
function detalleCambios(ev, cambios) {
  const nicks = nicksDe(ev, cambios);
  return Object.keys(cambios).filter(k => k !== 'reg').map(k => {
    const antes = valorEn(ev, k); const despues = cambios[k];
    const a = valorLegible(antes, nicks), d = (despues && despues['.sv']) ? 'ahora' : valorLegible(despues, nicks);
    return rutaLegible(ev, k, nicks) + ': ' + (antes === undefined || antes === null ? d : a + ' → ' + d);
  }).join('\n');
}
// Texto cuando quien llama no dio uno
function textoAutomatico(ev, cambios) { return 'Cambio en ' + ((ev && ev.nombre) || 'el evento') + ' (' + Object.keys(cambios).length + (Object.keys(cambios).length === 1 ? ' dato' : ' datos') + ')'; }

// ---------------- Página «Historial de cambios» (solo superusuario)
function escucharAuditoria() {
  if (escuchandoAuditoria || !soyAdmin) return;
  escuchandoAuditoria = true;
  db.ref('auditoria').on('value', (s) => { auditoria = s.val() || {}; if (rutaActual().vista === 'historial') dibujar('datos'); },
    () => { errorAuditoria = true; auditoria = {}; if (rutaActual().vista === 'historial') dibujar('datos'); });
}
function enlaceHistorial() {
  if (!soyAdmin) return '';
  return '<a href="#/historial" data-enlace-historial class="flex justify-between items-center bg-zinc-800 border border-wine-600/50 rounded-xl px-4 py-3 hover:bg-zinc-700/70">' +
    '<span class="font-bold">📜 Historial de cambios</span><span class="text-sm font-bold text-wine-300">Ver ›</span></a>';
}
function cuandoLegible(t) {
  if (typeof t !== 'number') return '';
  const d = new Date(t); const p = (n) => String(n).padStart(2, '0');
  return fechaCorta(d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate())) + ' ' + d.getFullYear() + ' · ' + p(d.getHours()) + ':' + p(d.getMinutes());
}
function entradasAuditoria() {
  return Object.keys(auditoria || {}).map(k => Object.assign({ id: k }, auditoria[k])).filter(e => e && e.texto)
    .sort((a, b) => (b.cuando || 0) - (a.cuando || 0) || String(b.id).localeCompare(String(a.id)));
}
function pasaFiltroHistorial(e) {
  if (uiHist.evento === '__ninguno' && e.evento) return false;
  if (uiHist.evento && uiHist.evento !== '__ninguno' && e.evento !== uiHist.evento) return false;
  if (uiHist.persona && e.uid !== uiHist.persona) return false;
  if (uiHist.texto) { const q = sinAcentos(uiHist.texto).trim(); if (q && !sinAcentos([e.texto, e.detalle, e.nombre, (eventos[e.evento] || {}).nombre].join(' ')).includes(q)) return false; }
  return true;
}
function cambiarFiltroHistorial(campo, valor) { uiHist[campo] = valor; uiHist.cuantos = 100; const l = $('listaHistorial'); if (l) l.innerHTML = listaHistorial(); }

function listaHistorial() {
  const todas = entradasAuditoria().filter(pasaFiltroHistorial);
  if (!todas.length) return '<p class="text-zinc-400 text-sm py-6 text-center">No hay cambios registrados' + (uiHist.evento || uiHist.persona || uiHist.texto ? ' con esos filtros' : ' todavía') + '.</p>';
  const vis = todas.slice(0, uiHist.cuantos);
  return '<p class="text-xs text-zinc-500">' + todas.length + (todas.length === 1 ? ' cambio' : ' cambios') + (vis.length < todas.length ? ' · mostrando los ' + vis.length + ' más recientes' : '') + '</p>' +
    '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">' + vis.map(e => {
      const ev = e.evento ? eventos[e.evento] : null;
      return '<div data-registro class="py-2 space-y-1"><div class="flex justify-between gap-2"><span class="text-xs text-zinc-400 whitespace-nowrap">' + esc(cuandoLegible(e.cuando)) + '</span>' +
        (e.evento ? (ev ? '<a href="#/liga/' + esc(e.evento) + '" class="text-xs text-wine-300 underline truncate">' + esc(ev.nombre) + '</a>' : '<span class="text-xs text-zinc-500 truncate">' + esc(e.evento) + ' (borrado)</span>') : '') + '</div>' +
        '<p><b>' + esc(e.nombre || 'Sin nombre') + '</b> <code class="text-[10px] text-zinc-500">' + esc(uidCorto(e.uid)) + '</code></p>' +
        '<p class="text-zinc-200">' + esc(e.texto) + '</p>' +
        (e.detalle ? '<details class="text-xs"><summary class="cursor-pointer text-zinc-400">Detalle</summary><p class="whitespace-pre-line text-zinc-300 bg-zinc-900 rounded p-2 mt-1 break-words">' + esc(e.detalle) + '</p></details>' : '') + '</div>';
    }).join('') + '</div>' +
    (vis.length < todas.length ? '<button type="button" onclick="uiHist.cuantos+=100;$(\'listaHistorial\').innerHTML=listaHistorial()" class="' + BTN2 + ' w-full">Ver 100 más</button>' : '');
}

function vistaHistorial() {
  if (!sesionLista) return cargando();
  if (!soyAdmin) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Esta sección es solo para el superusuario.</p><a href="#/mis-eventos" class="' + BTN2 + '">Ir a Mis eventos</a></div>';
  escucharAuditoria(); escucharOrganizadores();
  let h = '<a href="#/mis-eventos" class="text-sm text-zinc-400 hover:text-zinc-200">← Mis eventos</a><h2 class="text-base font-bold">📜 Historial de cambios</h2>' +
    '<p class="text-xs text-zinc-400">Solo tú lo ves. Nadie puede editarlo ni borrarlo desde la página.</p>';
  if (errorAuditoria) return h + '<p class="text-sm text-red-300">No se pudo leer el historial. Revisa que las reglas de la base de datos estén actualizadas.</p>';
  if (auditoria === null || !datosCargados) return h + cargando();
  const es = entradasAuditoria();
  const evIds = [...new Set(es.map(e => e.evento).filter(Boolean))].sort((a, b) => String((eventos[a] || {}).nombre || a).localeCompare(String((eventos[b] || {}).nombre || b), 'es'));
  const personas = {}; es.forEach(e => { if (e.uid && !personas[e.uid]) personas[e.uid] = e.nombre || 'Sin nombre'; });
  const inp = 'bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white w-full';
  h += '<div class="grid grid-cols-2 gap-2">' +
    '<select id="histEvento" onchange="cambiarFiltroHistorial(\'evento\',this.value)" class="' + inp + '" aria-label="Liga o torneo"><option value="">Todas las ligas</option><option value="__ninguno"' + (uiHist.evento === '__ninguno' ? ' selected' : '') + '>Sin liga (cuentas, solicitudes)</option>' +
      evIds.map(id => '<option value="' + esc(id) + '"' + (uiHist.evento === id ? ' selected' : '') + '>' + esc((eventos[id] || {}).nombre || id + ' (borrado)') + '</option>').join('') + '</select>' +
    '<select id="histPersona" onchange="cambiarFiltroHistorial(\'persona\',this.value)" class="' + inp + '" aria-label="Persona"><option value="">Todas las personas</option>' +
      Object.keys(personas).sort((a, b) => personas[a].localeCompare(personas[b], 'es')).map(u => '<option value="' + esc(u) + '"' + (uiHist.persona === u ? ' selected' : '') + '>' + esc(personas[u]) + '</option>').join('') + '</select></div>' +
    '<input id="histTexto" type="search" placeholder="🔍 Buscar (nick, acción…)" value="' + esc(uiHist.texto) + '" oninput="cambiarFiltroHistorial(\'texto\',this.value)" class="' + inp + '">';
  h += '<div id="listaHistorial" class="space-y-2">' + listaHistorial() + '</div>';
  return h;
}
