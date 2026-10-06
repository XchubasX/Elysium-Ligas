// =====================================================================
// js/vistas.js — PANTALLAS (se dibujan dentro de <main id="app">)
// Rutas: #/ portada · #/archivadas · #/liga/{id}/{pestaña} · #/liga/{id}/jornada/{j} · #/mis-eventos · #/crear
// =====================================================================
const CARD = 'border border-wine-600/40 rounded-xl p-4 flex flex-col gap-2';
const BTN = 'inline-flex items-center justify-center bg-wine-600 hover:bg-wine-500 text-white font-bold text-sm px-4 py-2.5 rounded-lg transition';
const BTN2 = 'inline-flex items-center justify-center border border-zinc-700 hover:border-zinc-500 text-zinc-200 font-semibold text-sm px-4 py-2.5 rounded-lg transition';
const PILL = 'text-xs font-bold px-2.5 py-1 rounded-full whitespace-nowrap';

function rutaActual() {
  const h = (window.location.hash || '#/').replace(/^#\/?/, '');
  const p = h.split('/').filter(Boolean).map(decodeURIComponent);
  return { vista: p[0] || 'portada', id: p[1] || null, pestana: p[2] || 'tabla', sub: p[3] || null };
}

function cargando() { return '<p class="text-zinc-400 text-sm py-8 text-center">Cargando ligas…</p>'; }
function problemaConexion() {
  return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300 text-sm">No se pudo conectar. Revisa tu internet.</p>' +
    '<button type="button" onclick="location.reload()" class="' + BTN2 + '">Volver a cargar</button></div>';
}

// ---------------- Portada
function tarjetaLiga(id, ev) {
  const prox = proximaJornada(ev); const cuenta = contarJornadas(ev); const tabla = tablaLiga(ev);
  const lider = tabla[0];
  const cambio = prox && prox.fechaAnterior ? '<span class="text-[11px] font-bold text-amber-300 ml-1">CAMBIÓ DE FECHA</span>' : '';
  const cabeza = prox
    ? '<span class="text-[13px] font-extrabold text-wine-300 uppercase">Próxima jornada: ' + esc(fechaCorta(prox.fecha)) + (prox.hora ? ' · ' + esc(prox.hora) : '') + cambio + '</span>'
    : '<span class="text-[13px] font-extrabold text-zinc-400 uppercase">' + (ev.archivada ? 'Archivada' : 'Sin jornadas próximas') + '</span>';
  const pastilla = cuenta.total ? '<span class="' + PILL + ' bg-emerald-950/60 text-emerald-300 border border-emerald-700/70">Jornada ' + Math.min(cuenta.jugadas + 1, cuenta.total) + ' de ' + cuenta.total + '</span>' : '';
  return '<a href="#/liga/' + esc(id) + '" class="' + CARD + ' hover:border-wine-500 transition">' +
    '<div class="flex items-center justify-between gap-2">' + cabeza + pastilla + '</div>' +
    '<div class="text-lg font-bold text-wine-300">' + esc(ev.nombre) + '</div>' +
    '<div class="text-[13px] text-zinc-300">' + [esc(ev.ciudad), Object.keys(ev.jugadores || {}).length + ' jugadores', (ev.inicio && ev.fin ? esc(fechaLarga(ev.inicio)) + ' – ' + esc(fechaLarga(ev.fin)) : '')].filter(Boolean).join(' · ') + '</div>' +
    (lider ? '<div class="text-[13px] text-zinc-400">Líder: <b class="text-zinc-100">' + esc(lider.nick) + '</b> · ' + lider.gw + ' GW · ' + lider.vp + ' VP</div>' : '') +
    '</a>';
}

function vistaPortada(archivadas) {
  if (errorDatos && !datosCargados) return problemaConexion();
  if (!datosCargados) return cargando();
  const ids = Object.keys(eventos).filter(id => !!eventos[id].archivada === !!archivadas);
  ids.sort((a, b) => {
    const pa = proximaJornada(eventos[a]), pb = proximaJornada(eventos[b]);
    return String(pa ? pa.fecha : '9999').localeCompare(String(pb ? pb.fecha : '9999')) || String(eventos[a].nombre).localeCompare(String(eventos[b].nombre), 'es');
  });
  let h = '<div class="flex items-center justify-between gap-3"><h2 class="text-base font-bold">' + (archivadas ? 'Ligas archivadas' : 'Ligas activas') + '</h2>' +
    (archivadas ? '<a href="#/" class="text-sm text-wine-300 underline">← Ligas activas</a>' : '') + '</div>';
  h += ids.length ? '<div class="grid gap-3 md:grid-cols-2">' + ids.map(id => tarjetaLiga(id, eventos[id])).join('') + '</div>'
    : '<p class="text-zinc-400 text-sm py-6 text-center">' + (archivadas ? 'No hay ligas archivadas.' : 'Todavía no hay ligas. Pronto los organizadores crearán las suyas.') + '</p>';
  if (!archivadas) h += '<div class="text-center pt-2"><a href="#/archivadas" class="text-sm text-zinc-400 underline">Ver ligas archivadas</a></div>';
  return h;
}

// ---------------- Página de una liga
function vistaLiga(id, pestana) {
  if (!datosCargados) return errorDatos ? problemaConexion() : cargando();
  const ev = eventos[id];
  if (!ev) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Esta liga no existe o fue borrada.</p><a href="#/" class="' + BTN2 + '">Ir a las ligas</a></div>';
  const pestanas = [['tabla', 'Tabla'], ['calendario', 'Calendario'], ['hazanas', 'Hazañas'], ['reglas', 'Reglas']];
  if (ev.hazanasModo === 'no') pestanas.splice(2, 1);
  if (puedeCapturar(ev)) pestanas.push(['jugadores', 'Jugadores']);
  if (puedeAdministrar(ev)) pestanas.push(['ajustes', 'Ajustes']);
  if (!pestanas.some(p => p[0] === pestana)) pestana = 'tabla';
  let rol = '';
  if (puedeAdministrar(ev)) rol = '<span class="' + PILL + ' bg-wine-900/60 text-wine-200 border border-wine-600/70">' + (esDueno(ev) ? 'Organizas tú' : 'Superusuario') + '</span>';
  else if (esAyudante(ev)) rol = '<span class="' + PILL + ' bg-violet-950/60 text-violet-200 border border-violet-700/70">Ayudante</span>';
  let h = '<a href="#/" class="text-sm text-zinc-400 hover:text-zinc-200">← Ligas</a>' +
    '<div class="space-y-1"><div class="flex items-start justify-between gap-2"><h2 class="text-xl font-extrabold text-wine-300 leading-tight">' + esc(ev.nombre) + '</h2>' + rol + '</div>' +
    '<p class="text-[13px] text-zinc-400">' + [esc(ev.ciudad), (ev.inicio && ev.fin ? esc(fechaLarga(ev.inicio)) + ' – ' + esc(fechaLarga(ev.fin)) : ''), (ev.organizadorNombre ? 'organiza ' + esc(ev.organizadorNombre) : '')].filter(Boolean).join(' · ') + '</p>' +
    (ev.archivada ? '<p class="text-[13px] text-amber-300">Liga archivada: ya no aparece en la portada.</p>' : '') + '</div>';
  h += '<nav class="flex gap-1.5 flex-wrap" aria-label="Secciones de la liga">' + pestanas.map(([k, t]) =>
    '<a href="#/liga/' + esc(id) + '/' + k + '" class="text-sm px-3 py-1.5 rounded-full ' + (k === pestana ? 'bg-wine-600 text-white font-semibold' : 'border border-zinc-700 text-zinc-400 hover:text-zinc-200') + '"' + (k === pestana ? ' aria-current="page"' : '') + '>' + t + '</a>').join('') + '</nav>';
  if (pestana === 'tabla') h += seccionTabla(ev);
  else if (pestana === 'calendario') h += puedeCapturar(ev) ? seccionCalendarioEquipo(id, ev) : seccionCalendario(id, ev);
  else if (pestana === 'jugadores') h += seccionJugadores(id, ev);
  else if (pestana === 'ajustes') h += seccionAjustes(id, ev);
  else if (pestana === 'hazanas') h += seccionHazanas(ev);
  else h += seccionReglas(ev);
  return h;
}

function seccionTabla(ev) {
  const t = tablaLiga(ev);
  if (!t.length) return '<p class="text-zinc-400 text-sm py-6 text-center">Todavía no hay jornadas jugadas. La tabla aparece cuando se cierre la primera.</p>';
  const conHaz = ev.hazanasModo !== 'no';
  let h = '<div class="bg-zinc-800 rounded-xl overflow-hidden text-sm" role="table" aria-label="Tabla general">' +
    '<div class="grid gap-2 px-3 py-2 text-[11px] font-semibold text-zinc-400 border-b border-zinc-700" style="grid-template-columns:28px 1fr 40px 48px' + (conHaz ? ' 40px' : '') + '" role="row">' +
    '<span>#</span><span>Jugador</span><span class="text-right">GW</span><span class="text-right">VP</span>' + (conHaz ? '<span class="text-right" title="Hazañas">🏅</span>' : '') + '</div>';
  t.forEach((f, i) => {
    h += '<div class="grid gap-2 px-3 py-2 border-b border-zinc-700/50 ' + (i === 0 ? 'bg-wine-900/30' : '') + '" style="grid-template-columns:28px 1fr 40px 48px' + (conHaz ? ' 40px' : '') + '" role="row">' +
      '<span class="font-extrabold text-wine-300">' + (i + 1) + '</span><span class="truncate">' + esc(f.nick) + '</span>' +
      '<span class="text-right font-bold">' + f.gw + '</span><span class="text-right">' + f.vp + '</span>' +
      (conHaz ? '<span class="text-right text-amber-300">' + (f.hazanas ? f.hazanas : '') + '</span>' : '') + '</div>';
  });
  h += '</div><p class="text-xs text-zinc-500">Orden: GW, luego VP' + (ev.hazanasModo === 'desempate' ? ', luego hazañas' : '') + '. GW: el único con más VP en su mesa, con al menos 2 VP. Solo cuentan jornadas cerradas.</p>';
  return h;
}

function seccionCalendario(id, ev) {
  const js = jornadasOrdenadas(ev);
  if (!js.length) return '<p class="text-zinc-400 text-sm py-6 text-center">El organizador todavía no agrega jornadas.</p>';
  return '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">' + js.map(j => {
    const e = estadoJornada(j); const s = sumaJornada(j); const n = Object.keys(s).length;
    const conMesas = j.estado === 'cerrada' || j.estado === 'abierta';
    return '<' + (conMesas ? 'a href="#/liga/' + esc(id) + '/jornada/' + esc(j.id) + '"' : 'div') + ' class="flex justify-between gap-2 py-2' + (conMesas ? ' hover:bg-zinc-700/40' : '') + '"><span><b>Jornada ' + esc(j.numero) + '</b> · ' + esc(fechaCorta(j.fecha)) + (j.hora ? ' · ' + esc(j.hora) : '') +
      (j.fechaAnterior && j.estado !== 'cerrada' ? ' <span class="text-amber-300 text-[11px]">antes ' + esc(fechaCorta(j.fechaAnterior)) + '</span>' : '') + '</span>' +
      '<span class="' + e.clase + '">' + e.texto + (j.estado === 'cerrada' && n ? ' · ' + n + ' jugadores' : '') + (conMesas ? ' ›' : '') + '</span></' + (conMesas ? 'a' : 'div') + '>';
  }).join('') + '</div>';
}

function seccionHazanas(ev) {
  const hs = hazanasLiga(ev);
  if (!hs.length) return '<p class="text-zinc-400 text-sm py-6 text-center">Todavía no hay hazañas otorgadas.</p>';
  return '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">' + hs.map(x =>
    '<div class="py-2 flex justify-between gap-2"><span>🏅 <b>' + esc(x.nombre) + '</b> — ' + esc(x.nick) + '</span><span class="text-zinc-400 whitespace-nowrap">J' + esc(x.numero) + '</span></div>').join('') + '</div>' +
    '<p class="text-xs text-zinc-500">' + (ev.hazanasModo === 'desempate' ? 'En esta liga las hazañas sirven de desempate después de VP.' : 'Las hazañas son menciones: no suman puntos.') + '</p>';
}

function seccionReglas(ev) {
  const modo = { mencion: 'Las hazañas son menciones (no suman puntos).', desempate: 'Las hazañas desempatan después de VP.', no: 'Esta liga no usa hazañas.' }[ev.hazanasModo || 'mencion'];
  return '<div class="bg-zinc-800 rounded-xl p-4 text-sm space-y-2"><p><b>Puntuación:</b> VP y GW como en VEKN. La tabla se ordena por GW y luego por VP. El GW de cada mesa es para el único jugador con más VP, si tiene al menos 2. Solo cuentan las jornadas cerradas.</p><p>' + esc(modo) + '</p>' +
    (ev.reglasTexto ? '<div class="border-t border-zinc-700 pt-2 whitespace-pre-line text-zinc-200">' + esc(ev.reglasTexto) + '</div>' : '') + '</div>';
}

// ---------------- Mis eventos
function vistaMisEventos() {
  if (!sesionLista) return cargando();
  if (!usuario) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Entra con Google para ver tus ligas.</p><button type="button" onclick="entrarConGoogle()" class="' + BTN + '">Entrar con Google</button></div>';
  if (!datosCargados) return cargando();
  const mias = Object.keys(eventos).filter(id => eventos[id].ownerUid === usuario.uid || esAyudante(eventos[id]));
  let h = '<h2 class="text-base font-bold">Mis ligas</h2>';
  if (soyOrganizador || soyAdmin) h += '<a href="#/crear" class="' + BTN + ' w-full md:w-auto">+ Nueva liga</a>';
  h += mias.length ? '<div class="space-y-2">' + mias.map(id => {
    const ev = eventos[id]; const prox = proximaJornada(ev);
    const etiqueta = ev.ownerUid === usuario.uid ? '' : ' <span class="text-[11px] font-bold text-violet-300">AYUDANTE</span>';
    return '<a href="#/liga/' + esc(id) + '" class="flex justify-between items-center bg-zinc-800 rounded-lg px-3 py-2.5 hover:bg-zinc-700/70"><span><b>' + esc(ev.nombre) + '</b>' + etiqueta +
      '<br><span class="text-xs text-zinc-400">' + (prox ? 'Jornada ' + esc(prox.numero) + ' el ' + esc(fechaCorta(prox.fecha)) : (ev.archivada ? 'Archivada' : 'Sin jornadas próximas')) + '</span></span><span class="text-sm font-bold text-wine-300">Abrir ›</span></a>';
  }).join('') + '</div>' : '<p class="text-zinc-400 text-sm">Todavía no organizas ni ayudas en ninguna liga.</p>';
  if (!soyOrganizador && !soyAdmin) {
    h += '<div class="bg-zinc-800 border border-zinc-700 rounded-xl p-4 space-y-2 text-sm"><p class="font-bold">¿Quieres organizar una liga?</p>' +
      '<p class="text-zinc-300">Pídele al administrador del sitio que te dé permiso de organizador y mándale este identificador de tu cuenta (no es tu correo):</p>' +
      '<div class="flex gap-2 items-center"><code id="miUid" class="flex-1 bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs break-all">' + esc(usuario.uid) + '</code>' +
      '<button type="button" onclick="copiarUid()" class="' + BTN2 + ' !py-1.5">Copiar</button></div></div>';
  }
  return h;
}
function copiarUid() {
  const t = usuario ? usuario.uid : '';
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => aviso('Identificador copiado')).catch(() => aviso('Mantén presionado el texto para copiarlo', 'error'));
}

// ---------------- Crear liga
function vistaCrear() {
  if (!sesionLista) return cargando();
  if (!usuario) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Entra con Google para crear una liga.</p><button type="button" onclick="entrarConGoogle()" class="' + BTN + '">Entrar con Google</button></div>';
  if (!soyOrganizador && !soyAdmin) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Tu cuenta todavía no tiene permiso de organizador.</p><a href="#/mis-eventos" class="' + BTN2 + '">Ver cómo pedirlo</a></div>';
  const campo = (lbl, html, nota) => '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">' + lbl + '</span>' + html + (nota ? '<span class="block text-xs text-zinc-500">' + nota + '</span>' : '') + '</label>';
  const inp = 'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500';
  return '<a href="#/mis-eventos" class="text-sm text-zinc-400 hover:text-zinc-200">← Mis ligas</a>' +
    '<form id="formCrear" class="bg-zinc-800 border border-wine-600/50 rounded-2xl p-4 space-y-3" novalidate>' +
    '<h2 class="text-lg font-bold text-wine-300">Nueva liga</h2>' +
    campo('Nombre', '<input id="crNombre" maxlength="80" required class="' + inp + '" placeholder="ej. Liga CDMX · Temporada 1" oninput="sugerirEnlace()">') +
    campo('Enlace de la liga', '<div class="flex items-center gap-1 text-sm"><span class="text-zinc-500">#/liga/</span><input id="crEnlace" maxlength="40" class="' + inp + '" placeholder="liga-cdmx-1" oninput="this.dataset.tocado=1"></div>', 'Solo minúsculas, números y guiones. No se puede cambiar después.') +
    campo('Ciudad', '<input id="crCiudad" maxlength="60" class="' + inp + '" placeholder="ej. Ciudad de México">') +
    campo('Nombre del organizador (se muestra en la liga)', '<input id="crOrganizador" maxlength="40" class="' + inp + '" value="' + esc(nombreUsuario()) + '">') +
    '<div class="grid grid-cols-2 gap-2">' + campo('Inicio', '<input id="crInicio" type="date" class="' + inp + '">') + campo('Fin', '<input id="crFin" type="date" class="' + inp + '">') + '</div>' +
    '<p class="text-xs text-zinc-500 -mt-1">Las fechas se pueden cambiar después.</p>' +
    '<fieldset class="space-y-1.5"><legend class="text-xs font-semibold text-zinc-400 mb-1">Puntuación: VP + GW como VEKN. Hazañas:</legend>' +
    [['mencion', 'Solo mención (no suman puntos)', true], ['desempate', 'Suman en la tabla (desempate después de VP)'], ['no', 'Sin hazañas']].map(([v, t, c]) =>
      '<label class="flex gap-2 items-center text-sm"><input type="radio" name="crHazanas" value="' + v + '"' + (c ? ' checked' : '') + ' class="accent-wine-500"> ' + t + '</label>').join('') + '</fieldset>' +
    campo('Reglas o notas (opcional)', '<textarea id="crReglas" maxlength="1500" rows="3" class="' + inp + '" placeholder="ej. Formato V5, se juega en Tienda El Dragón"></textarea>') +
    '<p id="crError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<button type="submit" class="' + BTN + ' w-full">Crear liga</button></form>';
}

function sugerirEnlace() {
  const e = $('crEnlace'); if (!e || e.dataset.tocado) return;
  e.value = aEnlace($('crNombre').value);
}

async function enviarCrear(ev) {
  ev.preventDefault();
  const err = (t) => { const p = $('crError'); p.textContent = t; p.classList.remove('hidden'); };
  const nombre = $('crNombre').value.trim(), id = $('crEnlace').value.trim().toLowerCase();
  const inicio = $('crInicio').value, fin = $('crFin').value;
  if (!nombre) return err('Escribe el nombre de la liga.');
  if (!enlaceValido(id)) return err('El enlace debe tener de 3 a 40 letras minúsculas, números o guiones.');
  if (eventos[id]) return err('Ese enlace ya lo usa otra liga. Elige otro.');
  if ((inicio && !fechaValida(inicio)) || (fin && !fechaValida(fin))) return err('Revisa las fechas.');
  if (inicio && fin && fin < inicio) return err('La fecha de fin es anterior al inicio.');
  const datos = { nombre, ciudad: $('crCiudad').value.trim(), organizadorNombre: $('crOrganizador').value.trim() || nombreUsuario(),
    hazanasModo: (document.querySelector('input[name="crHazanas"]:checked') || {}).value || 'mencion' };
  if (inicio) datos.inicio = inicio; if (fin) datos.fin = fin;
  const reglas = $('crReglas').value.trim(); if (reglas) datos.reglasTexto = reglas;
  try { await crearLiga(id, datos); aviso('¡Liga creada!'); window.location.hash = '#/liga/' + id; }
  catch (e) { console.warn(e); err('No se pudo crear la liga. Revisa tu conexión o pide al administrador que confirme tu permiso de organizador.'); }
}

// ---------------- Barra de sesión (encabezado)
function barraSesion() {
  if (!sesionLista) return '';
  if (!usuario) return '<button type="button" onclick="entrarConGoogle()" class="bg-white text-zinc-900 font-bold text-sm px-3 py-2 rounded-lg">Entrar con Google</button>';
  const rol = soyAdmin ? 'Superusuario' : (soyOrganizador ? 'Organizador' : '');
  return '<div class="text-right text-[13px] leading-tight"><div class="text-zinc-200 font-semibold">' + esc(nombreUsuario()) + '</div>' +
    (rol ? '<div class="text-zinc-400">' + rol + '</div>' : '') +
    '<div class="flex gap-2 justify-end mt-0.5"><a href="#/mis-eventos" class="text-wine-300 underline">Mis ligas</a><button type="button" onclick="cerrarSesion()" class="text-zinc-400 underline">Salir</button></div></div>';
}
