// =====================================================================
// js/vistas.js — PANTALLAS (se dibujan dentro de <main id="app">)
// Rutas: #/ portada · #/crear/torneo · #/archivadas · #/liga/{id}/{pestaña} · #/liga/{id}/jornada/{j} · #/invitacion/{id}/{código} · #/mis-eventos · #/crear
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

function tarjetaTorneo(id, ev) {
  const e = etapaTorneo(ev); const j = diaTorneo(ev);
  let cabeza;
  if (e.etapa === 'ronda') cabeza = '<span class="text-[13px] font-extrabold text-amber-300 uppercase">En curso · ronda ' + e.ronda + ' de ' + (ev.rondasPlan || 3) + '</span>';
  else if (e.etapa === 'final') cabeza = '<span class="text-[13px] font-extrabold text-amber-300 uppercase">En curso · final</span>';
  else if (e.etapa === 'terminado') { const c = resultadoTorneo(ev)[0]; cabeza = '<span class="text-[13px] font-extrabold text-zinc-300 uppercase">Terminado' + (c ? ' · 🏆 ' + esc(c.nick) : '') + '</span>'; }
  else if (e.etapa === 'cancelado') cabeza = '<span class="text-[13px] font-extrabold text-zinc-500 uppercase">Cancelado</span>';
  else cabeza = '<span class="text-[13px] font-extrabold text-wine-300 uppercase">' + esc(fechaCorta(ev.fecha)) + (ev.hora ? ' · ' + esc(ev.hora) : '') + '</span>';
  const n = Object.keys((j && j.presentes) || {}).length || Object.keys(ev.jugadores || {}).length;
  return '<a href="#/liga/' + esc(id) + '" class="' + CARD + ' hover:border-wine-500 transition">' +
    '<div class="flex items-center justify-between gap-2">' + cabeza + '<span class="' + PILL + ' bg-amber-950/50 text-amber-300 border border-amber-700/70">TORNEO</span></div>' +
    '<div class="text-lg font-bold text-wine-300">' + esc(ev.nombre) + '</div>' +
    '<div class="text-[13px] text-zinc-300">' + [esc(ev.ciudad), esc(fechaCorta(ev.fecha)) + (ev.hora ? ' · ' + esc(ev.hora) : ''), esc(textoRondas(ev)), n ? n + ' jugadores' : ''].filter(Boolean).join(' · ') + '</div></a>';
}
function tarjetaEvento(id, ev) { return esTorneo(ev) ? tarjetaTorneo(id, ev) : tarjetaLiga(id, ev); }

// Filtros de la portada (no se guardan; viven mientras la página está abierta)
const filtro = { texto: '', fecha: '', tipo: 'todos' };
function fechaOrden(ev) {
  if (esTorneo(ev)) { const e = etapaTorneo(ev).etapa; return (e === 'terminado' || e === 'cancelado') ? '9999-' + (ev.fecha || '') : (ev.fecha || '9999'); }
  const p = proximaJornada(ev); return p ? p.fecha : '9999';
}
function sinAcentos(t) { return String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function pasaFiltro(ev) {
  if (filtro.tipo === 'ligas' && esTorneo(ev)) return false;
  if (filtro.tipo === 'torneos' && !esTorneo(ev)) return false;
  if (filtro.texto) { const q = sinAcentos(filtro.texto).trim(); if (q && !(sinAcentos(ev.nombre).includes(q) || sinAcentos(ev.ciudad).includes(q))) return false; }
  if (filtro.fecha) {
    if (esTorneo(ev)) { if (ev.fecha !== filtro.fecha) return false; }
    else if (!(ev.inicio && ev.fin && ev.inicio <= filtro.fecha && filtro.fecha <= ev.fin)) return false;
  }
  return true;
}
function listaPortada(archivadas) {
  const todos = Object.keys(eventos).filter(id => !!eventos[id].archivada === !!archivadas);
  const ids = todos.filter(id => pasaFiltro(eventos[id]));
  ids.sort((a, b) => String(fechaOrden(eventos[a])).localeCompare(String(fechaOrden(eventos[b]))) || String(eventos[a].nombre).localeCompare(String(eventos[b].nombre), 'es'));
  if (ids.length) return '<div class="grid gap-3 md:grid-cols-2">' + ids.map(id => tarjetaEvento(id, eventos[id])).join('') + '</div>';
  if (todos.length) return '<p class="text-zinc-400 text-sm py-6 text-center">Ningún evento coincide con la búsqueda.</p>';
  return '<p class="text-zinc-400 text-sm py-6 text-center">' + (archivadas ? 'No hay eventos archivados.' : 'Todavía no hay ligas ni torneos. Pronto los organizadores crearán los suyos.') + '</p>';
}
function cambiarFiltro(campo, valor) {
  filtro[campo] = valor;
  const l = $('listaEventos'); if (l) l.innerHTML = listaPortada(rutaActual().vista === 'archivadas');
  document.querySelectorAll('[data-filtro-tipo]').forEach(b => {
    const on = b.dataset.filtroTipo === filtro.tipo;
    b.className = 'text-sm px-3 py-1.5 rounded-full ' + (on ? 'bg-wine-600 text-white font-semibold' : 'border border-zinc-700 text-zinc-400');
    b.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  const lim = $('limpiarFiltros'); if (lim) lim.classList.toggle('hidden', !(filtro.texto || filtro.fecha || filtro.tipo !== 'todos'));
}
function limpiarFiltros() { filtro.texto = ''; filtro.fecha = ''; filtro.tipo = 'todos'; dibujar('ruta'); }

function vistaPortada(archivadas) {
  if (errorDatos && !datosCargados) return problemaConexion();
  if (!datosCargados) return cargando();
  const inp = 'bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500 w-full';
  let h = '<div class="flex items-center justify-between gap-3"><h2 class="text-base font-bold">' + (archivadas ? 'Eventos archivados' : 'Ligas y torneos') + '</h2>' +
    (archivadas ? '<a href="#/" class="text-sm text-wine-300 underline">← Eventos activos</a>' : '') + '</div>' + '<div class="-mt-2">' + etiquetaCasual() + '</div>';
  h += '<div class="space-y-2"><div class="grid grid-cols-[1fr_150px] gap-2">' +
    '<input id="filtroTexto" type="search" placeholder="🔍 Ciudad o nombre" value="' + esc(filtro.texto) + '" oninput="cambiarFiltro(\'texto\', this.value)" class="' + inp + '" aria-label="Buscar por ciudad o nombre">' +
    '<input id="filtroFecha" type="date" value="' + esc(filtro.fecha) + '" onchange="cambiarFiltro(\'fecha\', this.value)" class="' + inp + '" aria-label="Fecha"></div>' +
    '<div class="flex gap-1.5 items-center flex-wrap">' + [['todos', 'Todos'], ['ligas', 'Ligas'], ['torneos', 'Torneos']].map(([k, t]) =>
      '<button type="button" data-filtro-tipo="' + k + '" aria-pressed="' + (filtro.tipo === k) + '" onclick="cambiarFiltro(\'tipo\',\'' + k + '\')" class="text-sm px-3 py-1.5 rounded-full ' + (filtro.tipo === k ? 'bg-wine-600 text-white font-semibold' : 'border border-zinc-700 text-zinc-400') + '">' + t + '</button>').join('') +
    '<button type="button" id="limpiarFiltros" onclick="limpiarFiltros()" class="text-sm text-zinc-400 underline ml-auto' + ((filtro.texto || filtro.fecha || filtro.tipo !== 'todos') ? '' : ' hidden') + '">Limpiar</button></div></div>';
  h += '<div id="listaEventos">' + listaPortada(archivadas) + '</div>';
  if (!archivadas) h += '<div class="text-center pt-2 flex justify-center gap-4"><a href="#/archivadas" class="text-sm text-zinc-400 underline">Ver archivados</a><a href="#/ayuda" class="text-sm text-zinc-400 underline">¿Quieres organizar? Cómo funciona</a></div>';
  return h;
}

// ---------------- Página de una liga
function vistaLiga(id, pestana) {
  if (!datosCargados) return errorDatos ? problemaConexion() : cargando();
  const ev = eventos[id];
  if (!ev) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Esta liga no existe o fue borrada.</p><a href="#/" class="' + BTN2 + '">Ir a las ligas</a></div>';
  const torneo = esTorneo(ev);
  const pestanas = torneo ? [['tabla', 'Clasificación'], ['mesas', 'Mesas']] : [['tabla', 'Tabla'], ['calendario', 'Calendario']];
  if (ev.hazanasModo !== 'no') pestanas.push(['hazanas', 'Hazañas']);
  if (ev.reglasTexto) pestanas.push(['reglas', 'Reglas']);
  if (puedeCapturar(ev)) pestanas.push(['jugadores', 'Jugadores']);
  if (puedeAdministrar(ev)) pestanas.push(['equipo', 'Equipo'], ['ajustes', 'Ajustes']);
  if (!pestanas.some(p => p[0] === pestana)) pestana = 'tabla';
  let rol = '';
  if (puedeAdministrar(ev)) rol = '<span class="' + PILL + ' bg-wine-900/60 text-wine-200 border border-wine-600/70">' + (esDueno(ev) ? 'Organizas tú' : 'Superusuario') + '</span>';
  else if (esAyudante(ev)) rol = '<span class="' + PILL + ' bg-violet-950/60 text-violet-200 border border-violet-700/70">Ayudante</span>';
  let h = '<a href="#/" class="text-sm text-zinc-400 hover:text-zinc-200">← Ligas y torneos</a>' +
    '<div class="space-y-1"><div class="flex items-start justify-between gap-2"><h2 class="text-xl font-extrabold text-wine-300 leading-tight">' + esc(ev.nombre) + '</h2>' + rol + '</div>' +
    '<p class="text-[13px] text-zinc-400">' + (torneo
      ? [esc(ev.ciudad), esc(fechaCorta(ev.fecha)) + (ev.hora ? ' · ' + esc(ev.hora) : ''), esc(textoRondas(ev)), (ev.organizadorNombre ? 'organiza ' + esc(ev.organizadorNombre) : '')]
      : [esc(ev.ciudad), (ev.inicio && ev.fin ? esc(fechaLarga(ev.inicio)) + ' – ' + esc(fechaLarga(ev.fin)) : ''), (ev.organizadorNombre ? 'organiza ' + esc(ev.organizadorNombre) : '')]).filter(Boolean).join(' · ') + '</p>' +
    etiquetaCasual() +
    (ev.archivada ? '<p class="text-[13px] text-amber-300">' + (torneo ? 'Torneo archivado' : 'Liga archivada') + ': ya no aparece en la portada.</p>' : '') + '</div>';
  h += '<nav class="flex gap-1.5 flex-wrap" aria-label="Secciones de la liga">' + pestanas.map(([k, t]) =>
    '<a href="#/liga/' + esc(id) + '/' + k + '" class="text-sm px-3 py-1.5 rounded-full ' + (k === pestana ? 'bg-wine-600 text-white font-semibold' : 'border border-zinc-700 text-zinc-400 hover:text-zinc-200') + '"' + (k === pestana ? ' aria-current="page"' : '') + '>' + t + '</a>').join('') + '</nav>';
  if (pestana === 'tabla') h += torneo ? seccionClasificacion(id, ev) : seccionTabla(id, ev);
  else if (pestana === 'mesas') h += seccionMesasTorneo(id, ev);
  else if (pestana === 'calendario') h += puedeCapturar(ev) ? seccionCalendarioEquipo(id, ev) : seccionCalendario(id, ev);
  else if (pestana === 'jugadores') h += seccionJugadores(id, ev);
  else if (pestana === 'ajustes') h += seccionAjustes(id, ev);
  else if (pestana === 'equipo') h += seccionEquipo(id, ev);
  else if (pestana === 'hazanas') h += seccionHazanas(ev);
  else h += seccionReglas(ev);
  return h;
}

function seccionTabla(id, ev) {
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
  h += '</div>';
  h += '<div class="flex gap-2 flex-wrap"><a href="' + esc(enlaceWhatsApp(textoCompartirTabla(id, ev))) + '" target="_blank" rel="noopener" class="' + BTN + ' !bg-emerald-700 hover:!bg-emerald-600 flex-1">Compartir por WhatsApp</a>' +
    '<button type="button" onclick="descargarExcel(\'' + esc(id) + '\')" class="' + BTN2 + ' flex-1">Descargar Excel</button></div>';
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
    '<div class="py-2 flex justify-between gap-2"><span>🏅 <b>' + esc(x.nombre) + '</b> — ' + esc(x.nick) + '</span>' + (esTorneo(ev) ? '' : '<span class="text-zinc-400 whitespace-nowrap">J' + esc(x.numero) + '</span>') + '</div>').join('') + '</div>';
}

function seccionReglas(ev) {
  return '<div class="bg-zinc-800 rounded-xl p-4 text-sm whitespace-pre-line text-zinc-200">' + esc(ev.reglasTexto || '') + '</div>';
}

// ---------------- Mis eventos
function vistaMisEventos() {
  if (!sesionLista) return cargando();
  if (!usuario) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Entra con Google para ver tus eventos.</p><button type="button" onclick="entrarConGoogle()" class="' + BTN + '">Entrar con Google</button></div>';
  if (!datosCargados) return cargando();
  const mias = Object.keys(eventos).filter(id => eventos[id].ownerUid === usuario.uid || esAyudante(eventos[id]));
  mias.sort((a, b) => String(fechaOrden(eventos[a])).localeCompare(String(fechaOrden(eventos[b]))));
  let h = bloqueSolicitudesAdmin() + '<h2 class="text-base font-bold">Mis eventos</h2>';
  if (soyOrganizador || soyAdmin) h += '<div class="grid grid-cols-2 gap-2"><a href="#/crear" class="' + BTN + '">+ Nueva liga</a><a href="#/crear/torneo" class="' + BTN + '">+ Nuevo torneo</a></div>';
  h += mias.length ? '<div class="space-y-2">' + mias.map(id => {
    const ev = eventos[id];
    const etiquetas = (esTorneo(ev) ? ' <span class="text-[11px] font-bold text-amber-300">TORNEO</span>' : '') + (ev.ownerUid === usuario.uid ? '' : ' <span class="text-[11px] font-bold text-violet-300">AYUDANTE</span>');
    let sub;
    if (esTorneo(ev)) { const e = etapaTorneo(ev).etapa; sub = { pendiente: fechaCorta(ev.fecha) + (ev.hora ? ' · ' + ev.hora : ''), ronda: 'En curso', final: 'En la final', terminado: 'Terminado', cancelado: 'Cancelado' }[e]; }
    else { const prox = proximaJornada(ev); sub = prox ? 'Jornada ' + prox.numero + ' el ' + fechaCorta(prox.fecha) : (ev.archivada ? 'Archivada' : 'Sin jornadas próximas'); }
    return '<a href="#/liga/' + esc(id) + '" class="flex justify-between items-center bg-zinc-800 rounded-lg px-3 py-2.5 hover:bg-zinc-700/70"><span><b>' + esc(ev.nombre) + '</b>' + etiquetas +
      '<br><span class="text-xs text-zinc-400">' + esc(sub) + '</span></span><span class="text-sm font-bold text-wine-300">Abrir ›</span></a>';
  }).join('') + '</div>' : '<p class="text-zinc-400 text-sm">Todavía no organizas ni ayudas en ninguna liga o torneo.</p>';
  if (!soyOrganizador && !soyAdmin) h += bloqueSolicitud();
  h += '<a href="#/ayuda" class="text-sm text-zinc-400 underline text-center">Cómo funciona</a>';
  return h;
}
function copiarUid() {
  const t = usuario ? usuario.uid : '';
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => aviso('Identificador copiado')).catch(() => aviso('Mantén presionado el texto para copiarlo', 'error'));
}

// ---------------- Crear liga o torneo (#/crear · #/crear/torneo)
function vistaCrear(tipo) {
  const torneo = tipo === 'torneo'; const cosa = torneo ? 'un torneo' : 'una liga';
  if (!sesionLista) return cargando();
  if (!usuario) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Entra con Google para crear ' + cosa + '.</p><button type="button" onclick="entrarConGoogle()" class="' + BTN + '">Entrar con Google</button></div>';
  if (!soyOrganizador && !soyAdmin) return '<div class="text-center py-8 space-y-3"><p class="text-zinc-300">Tu cuenta todavía no tiene permiso de organizador.</p><a href="#/mis-eventos" class="' + BTN2 + '">Ver cómo pedirlo</a></div>';
  const campo = (lbl, html, nota) => '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">' + lbl + '</span>' + html + (nota ? '<span class="block text-xs text-zinc-500">' + nota + '</span>' : '') + '</label>';
  const inp = 'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500';
  let h = '<a href="#/mis-eventos" class="text-sm text-zinc-400 hover:text-zinc-200">← Mis eventos</a>' +
    '<form id="formCrear" data-tipo="' + (torneo ? 'torneo' : 'liga') + '" class="bg-zinc-800 border border-wine-600/50 rounded-2xl p-4 space-y-3" novalidate>' +
    '<h2 class="text-lg font-bold text-wine-300">' + (torneo ? 'Nuevo torneo' : 'Nueva liga') + '</h2>' +
    campo('Nombre', '<input id="crNombre" maxlength="80" required class="' + inp + '" placeholder="' + (torneo ? 'ej. Torneo de Otoño' : 'ej. Liga CDMX · Temporada 1') + '" oninput="sugerirEnlace()">') +
    campo('Enlace', '<div class="flex items-center gap-1 text-sm"><span class="text-zinc-500">#/liga/</span><input id="crEnlace" maxlength="40" class="' + inp + '" placeholder="' + (torneo ? 'torneo-otono' : 'liga-cdmx-1') + '" oninput="this.dataset.tocado=1"></div>', 'Solo minúsculas, números y guiones. No se puede cambiar después.') +
    campo(torneo ? 'Ciudad o lugar' : 'Ciudad', '<input id="crCiudad" maxlength="60" class="' + inp + '" placeholder="ej. Ciudad de México">') +
    campo('Nombre del organizador', '<input id="crOrganizador" maxlength="40" class="' + inp + '" value="' + esc(nombreUsuario()) + '">');
  if (torneo) {
    h += '<div class="grid grid-cols-2 gap-2">' + campo('Fecha', '<input id="crFecha" type="date" class="' + inp + '">') + campo('Hora (opcional)', '<input id="crHora" type="time" class="' + inp + '">') + '</div>' +
      '<fieldset class="space-y-1.5"><legend class="text-xs font-semibold text-zinc-400 mb-1">Rondas antes de la final</legend><div class="flex gap-2">' +
      [2, 3].map(n => '<label class="flex gap-2 items-center text-sm border border-zinc-700 rounded-full px-3 py-1.5"><input type="radio" name="crRondas" value="' + n + '"' + (n === 3 ? ' checked' : '') + ' class="accent-wine-500"> ' + n + ' rondas</label>').join('') + '</div></fieldset>' +
      '<label class="flex gap-2 items-center text-sm"><input id="crFinal" type="checkbox" checked class="accent-wine-500"> Final de 5 con los mejores clasificados</label>';
  } else {
    h += '<div class="grid grid-cols-2 gap-2">' + campo('Inicio', '<input id="crInicio" type="date" class="' + inp + '">') + campo('Fin', '<input id="crFin" type="date" class="' + inp + '">') + '</div>' +
      '<p class="text-xs text-zinc-500 -mt-1">Las fechas se pueden cambiar después; las jornadas deben caer dentro de la temporada.</p>';
  }
  h += '<fieldset class="space-y-1.5"><legend class="text-xs font-semibold text-zinc-400 mb-1">Hazañas</legend>' +
    [['mencion', 'Solo mención', true], ['desempate', 'Desempatan después de VP'], ['no', 'Sin hazañas']].map(([v, t, c]) =>
      '<label class="flex gap-2 items-center text-sm"><input type="radio" name="crHazanas" value="' + v + '"' + (c ? ' checked' : '') + ' class="accent-wine-500"> ' + t + '</label>').join('') + '</fieldset>' +
    campo('Reglas o notas (opcional)', '<textarea id="crReglas" maxlength="1500" rows="3" class="' + inp + '" placeholder="ej. Formato V5, se juega en Tienda El Dragón"></textarea>') +
    '<p id="crError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<button type="submit" class="' + BTN + ' w-full">' + (torneo ? 'Crear torneo' : 'Crear liga') + '</button></form>';
  return h;
}

function sugerirEnlace() {
  const e = $('crEnlace'); if (!e || e.dataset.tocado) return;
  e.value = aEnlace($('crNombre').value);
}

async function enviarCrear(ev) {
  ev.preventDefault();
  const torneo = $('formCrear').dataset.tipo === 'torneo'; const cosa = torneo ? 'del torneo' : 'de la liga';
  const err = (t) => { const p = $('crError'); p.textContent = t; p.classList.remove('hidden'); };
  const nombre = $('crNombre').value.trim(), id = $('crEnlace').value.trim().toLowerCase();
  if (!nombre) return err('Escribe el nombre ' + cosa + '.');
  if (!enlaceValido(id)) return err('El enlace debe tener de 3 a 40 letras minúsculas, números o guiones.');
  if (eventos[id]) return err('Ese enlace ya lo usa otro evento. Elige otro.');
  const datos = { nombre, ciudad: $('crCiudad').value.trim(), organizadorNombre: $('crOrganizador').value.trim() || nombreUsuario(),
    hazanasModo: (document.querySelector('input[name="crHazanas"]:checked') || {}).value || 'mencion' };
  if (torneo) {
    const fecha = $('crFecha').value, hora = $('crHora').value;
    if (!fechaValida(fecha)) return err('Elige la fecha del torneo.');
    datos.fecha = fecha; if (hora) datos.hora = hora;
    datos.rondasPlan = Number((document.querySelector('input[name="crRondas"]:checked') || {}).value || 3);
    datos.conFinal = $('crFinal').checked;
    datos.jornadas = { j1: Object.assign({ numero: 1, fecha, estado: 'pendiente' }, hora ? { hora } : {}) };
  } else {
    const inicio = $('crInicio').value, fin = $('crFin').value;
    if (!fechaValida(inicio) || !fechaValida(fin)) return err('Las fechas de inicio y fin son obligatorias.');
    if (fin < inicio) return err('La fecha de fin es anterior al inicio.');
    if (inicio) datos.inicio = inicio; if (fin) datos.fin = fin;
  }
  const reglas = $('crReglas').value.trim(); if (reglas) datos.reglasTexto = reglas;
  try { await crearLiga(id, datos, torneo ? 'torneo' : 'liga'); aviso(torneo ? '¡Torneo creado!' : '¡Liga creada!'); window.location.hash = '#/liga/' + id; }
  catch (e) { console.warn(e); err('No se pudo crear. Revisa tu conexión o pide al administrador que confirme tu permiso de organizador.'); }
}

// ---------------- Barra de sesión (encabezado)
function barraSesion() {
  if (!sesionLista) return '';
  if (!usuario) return '<button type="button" onclick="entrarConGoogle()" class="bg-white text-zinc-900 font-bold text-sm px-3 py-2 rounded-lg">Entrar con Google</button>';
  const rol = soyAdmin ? 'Superusuario' : (soyOrganizador ? 'Organizador' : '');
  return '<div class="text-right text-[13px] leading-tight"><div class="text-zinc-200 font-semibold">' + esc(nombreUsuario()) + '</div>' +
    (rol ? '<div class="text-zinc-400">' + rol + '</div>' : '') +
    '<div class="flex gap-2 justify-end mt-0.5"><a href="#/mis-eventos" class="text-wine-300 underline">Mis eventos</a>' + (solicitudesPendientes() ? ' <span data-pendientes class="' + PILL + ' bg-wine-600 text-white !py-0">' + solicitudesPendientes() + '</span>' : '') + '<button type="button" onclick="cerrarSesion()" class="text-zinc-400 underline">Salir</button></div></div>';
}
