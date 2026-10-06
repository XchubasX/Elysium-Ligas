// =====================================================================
// js/gestion.js — PESTAÑAS DEL EQUIPO DE LA LIGA
// Calendario (organizador): agregar, cambiar fecha, cancelar jornadas.
// Jugadores (organizador y ayudantes): anotar, renombrar, quitar, copiar.
// Ajustes (organizador): datos de la liga, hazañas, archivar; borrar (superusuario).
// =====================================================================
const INP = 'w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500';
const BTN_CH = 'text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-zinc-700 hover:border-zinc-500 text-zinc-200 whitespace-nowrap';
const BTN_PELIGRO = 'text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-red-800 text-red-300 hover:bg-red-950 whitespace-nowrap';

// Lo que se está editando en pantalla (no se guarda en la base)
const ui = { editarJornada: null, agregarJornada: false, editarJugador: null, avisoCambio: null };

function idLigaActual() { return rutaActual().id; }
function ligaActual() { return eventos[idLigaActual()]; }

// ---------------- Calendario: controles del organizador
function seccionCalendarioEquipo(id, ev) {
  const js = jornadasOrdenadas(ev); const admin = puedeAdministrar(ev);
  let h = '';
  if (ui.avisoCambio && ui.avisoCambio.liga === id) {
    h += '<div class="bg-amber-950/40 border border-amber-700/60 rounded-xl p-3 text-sm space-y-2"><p class="text-amber-200 font-semibold">Fecha cambiada. ¿Avisas al grupo?</p>' +
      '<p class="text-zinc-300 whitespace-pre-line">' + esc(ui.avisoCambio.texto) + '</p>' +
      '<div class="flex gap-2"><a href="' + esc(enlaceWhatsApp(ui.avisoCambio.texto)) + '" target="_blank" rel="noopener" class="' + BTN + ' !bg-emerald-700 hover:!bg-emerald-600">Avisar por WhatsApp</a>' +
      '<button type="button" onclick="ui.avisoCambio=null;dibujar(\'ruta\')" class="' + BTN2 + '">Cerrar</button></div></div>';
  }
  h += '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">';
  if (!js.length) h += '<p class="text-zinc-400 py-2">Todavía no hay jornadas. Agrega la primera.</p>';
  js.forEach(j => {
    const e = estadoJornada(j); const n = Object.keys(sumaJornada(j)).length;
    if (ui.editarJornada === j.id) {
      h += '<form class="py-2 space-y-2" onsubmit="guardarFechaJornada(event,\'' + esc(j.id) + '\')"><b>Jornada ' + esc(j.numero) + '</b>' +
        '<div class="grid grid-cols-2 gap-2"><label class="space-y-1"><span class="text-xs text-zinc-400">Nueva fecha</span><input id="jfFecha" type="date" required value="' + esc(j.fecha) + '" class="' + INP + '"></label>' +
        '<label class="space-y-1"><span class="text-xs text-zinc-400">Hora (opcional)</span><input id="jfHora" type="time" value="' + esc(j.hora || '') + '" class="' + INP + '"></label></div>' +
        '<p id="jfError" class="text-sm text-red-300 hidden" role="alert"></p>' +
        '<div class="flex gap-2"><button class="' + BTN + '">Guardar</button><button type="button" onclick="ui.editarJornada=null;dibujar(\'ruta\')" class="' + BTN2 + '">Cancelar</button></div></form>';
      return;
    }
    const acciones = [];
    if (j.estado !== 'cancelada') acciones.push('<a href="#/liga/' + esc(id) + '/jornada/' + esc(j.id) + '" class="' + BTN_CH + ' !border-wine-600 !text-wine-200">' + (j.estado === 'cerrada' ? 'Ver' : 'Abrir día') + ' ›</a>');
    if (admin && (j.estado === 'pendiente' || !j.estado)) {
      acciones.push('<button type="button" onclick="ui.editarJornada=\'' + esc(j.id) + '\';dibujar(\'ruta\')" class="' + BTN_CH + '">Cambiar fecha</button>');
      acciones.push('<button type="button" onclick="dosToques(this,()=>cambiarEstadoJornada(\'' + esc(j.id) + '\',\'cancelada\'))" class="' + BTN_PELIGRO + '">Cancelar</button>');
    }
    if (admin && j.estado === 'cancelada') acciones.push('<button type="button" onclick="reactivarJornada(\'' + esc(j.id) + '\')" class="' + BTN_CH + '">Reactivar</button>');
    h += '<div data-jornada="' + esc(j.numero) + '" class="py-2 space-y-1.5"><div class="flex justify-between gap-2"><span><b>Jornada ' + esc(j.numero) + '</b> · ' + esc(fechaCorta(j.fecha)) + (j.hora ? ' · ' + esc(j.hora) : '') +
      (j.fechaAnterior && j.estado !== 'cerrada' ? ' <span class="text-amber-300 text-[11px]">antes ' + esc(fechaCorta(j.fechaAnterior)) + '</span>' : '') + '</span>' +
      '<span class="' + e.clase + ' whitespace-nowrap">' + e.texto + (j.estado === 'cerrada' && n ? ' · ' + n + ' jug.' : '') + '</span></div>' +
      (acciones.length ? '<div class="flex gap-1.5 flex-wrap">' + acciones.join('') + '</div>' : '') + '</div>';
  });
  h += '</div>';
  if (admin) {
    if (ui.agregarJornada) {
      const prox = js.reduce((m, j) => Math.max(m, j.numero || 0), 0) + 1;
      h += '<form class="bg-zinc-800 border border-wine-600/50 rounded-xl p-3 space-y-2 text-sm" onsubmit="agregarJornada(event)"><b>Jornada ' + prox + '</b>' +
        '<div class="grid grid-cols-2 gap-2"><label class="space-y-1"><span class="text-xs text-zinc-400">Fecha</span><input id="jnFecha" type="date" required class="' + INP + '"></label>' +
        '<label class="space-y-1"><span class="text-xs text-zinc-400">Hora (opcional)</span><input id="jnHora" type="time" class="' + INP + '"></label></div>' +
        '<p id="jnError" class="text-sm text-red-300 hidden" role="alert"></p>' +
        '<div class="flex gap-2"><button class="' + BTN + '">Agregar</button><button type="button" onclick="ui.agregarJornada=false;dibujar(\'ruta\')" class="' + BTN2 + '">Cancelar</button></div></form>';
    } else {
      h += '<button type="button" onclick="ui.agregarJornada=true;dibujar(\'ruta\')" class="' + BTN2 + ' w-full border-dashed">+ Agregar jornada</button>';
    }
    h += '<p class="text-xs text-zinc-500">Al cambiar una fecha, la página pública marca «Cambió de fecha» con la fecha anterior.</p>';
  }
  return h;
}

async function agregarJornada(e) {
  e.preventDefault();
  const id = idLigaActual(); const ev = ligaActual(); if (!ev) return;
  const fecha = $('jnFecha').value, hora = $('jnHora').value;
  const problema = problemaFechaJornada(ev, fecha, null);
  if (problema) return errorForm('jnError', problema);
  const numero = jornadasOrdenadas(ev).reduce((m, j) => Math.max(m, j.numero || 0), 0) + 1;
  const jid = siguienteId(ev.jornadas, 'j');
  const datos = { numero, fecha, estado: 'pendiente' }; if (hora) datos.hora = hora;
  if (await guardar(id, { ['jornadas/' + jid]: datos }, 'Jornada ' + numero + ' agregada')) { ui.agregarJornada = false; dibujar('ruta'); }
}

async function guardarFechaJornada(e, jid) {
  e.preventDefault();
  const id = idLigaActual(); const ev = ligaActual(); const j = ev && ev.jornadas && ev.jornadas[jid]; if (!j) return;
  const fecha = $('jfFecha').value, hora = $('jfHora').value;
  if (fecha !== j.fecha) { const problema = problemaFechaJornada(ev, fecha, jid); if (problema) return errorForm('jfError', problema); }
  const cambios = {};
  if (fecha !== j.fecha) { cambios['jornadas/' + jid + '/fecha'] = fecha; cambios['jornadas/' + jid + '/fechaAnterior'] = j.fecha; }
  if ((hora || '') !== (j.hora || '')) cambios['jornadas/' + jid + '/hora'] = hora || null;
  if (!Object.keys(cambios).length) { ui.editarJornada = null; dibujar('ruta'); return; }
  if (await guardar(id, cambios, 'Fecha guardada')) {
    ui.editarJornada = null;
    if (fecha !== j.fecha) {
      ui.avisoCambio = { liga: id, texto: '📅 Cambio de fecha · ' + ev.nombre + '\nLa jornada ' + j.numero + ' pasa del ' + fechaCorta(j.fecha) + ' al ' + fechaCorta(fecha) + (hora ? ' a las ' + hora : '') + '.\n' + location.origin + '/#/liga/' + id + '/calendario' };
    }
    dibujar('ruta');
  }
}

function errorForm(idP, texto) { const p = $(idP); if (p) { p.textContent = texto; p.classList.remove('hidden'); } else aviso(texto, 'error'); }

function reactivarJornada(jid) {
  const ev = ligaActual(); const j = ev.jornadas[jid];
  const problema = problemaFechaJornada(ev, j.fecha, jid);
  if (problema) return aviso('No se puede reactivar: ' + problema.charAt(0).toLowerCase() + problema.slice(1) + ' Mejor agrega una jornada nueva.', 'error');
  return cambiarEstadoJornada(jid, 'pendiente');
}

function cambiarEstadoJornada(jid, estado) {
  const textos = esTorneo(ligaActual())
    ? { cancelada: 'Torneo cancelado', pendiente: 'Torneo reactivado', abierta: 'Torneo en curso', cerrada: 'Torneo terminado' }
    : { cancelada: 'Jornada cancelada', pendiente: 'Jornada reactivada', abierta: 'Jornada en curso', cerrada: 'Jornada cerrada: la tabla ya se actualizó' };
  return guardar(idLigaActual(), { ['jornadas/' + jid + '/estado']: estado }, textos[estado]);
}

// ---------------- Jugadores
function seccionJugadores(id, ev) {
  const js = jugadoresOrdenados(ev);
  let h = '<form class="flex gap-2" onsubmit="agregarJugador(event)"><input id="nuevoNick" maxlength="30" placeholder="Nick del jugador" class="' + INP + '" autocomplete="off"><button class="' + BTN + '">Agregar</button></form>';
  h += '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">';
  if (!js.length) h += '<p class="text-zinc-400 py-2">Todavía no hay jugadores. Anota sus nicks (no nombres completos: la lista es pública).</p>';
  js.forEach(p => {
    if (ui.editarJugador === p.id) {
      h += '<form class="py-2 flex gap-2" onsubmit="renombrarJugador(event,\'' + esc(p.id) + '\')"><input id="editNick" maxlength="30" value="' + esc(p.nick) + '" class="' + INP + '"><button class="' + BTN + '">Guardar</button>' +
        '<button type="button" onclick="ui.editarJugador=null;dibujar(\'ruta\')" class="' + BTN2 + '">×</button></form>';
      return;
    }
    h += '<div data-jugador="' + esc(p.nick) + '" class="py-2 flex justify-between items-center gap-2"><span class="truncate">' + esc(p.nick) + '</span><span class="flex gap-1.5">' +
      '<button type="button" onclick="ui.editarJugador=\'' + esc(p.id) + '\';dibujar(\'ruta\')" class="' + BTN_CH + '">Cambiar nick</button>' +
      '<button type="button" onclick="dosToques(this,()=>quitarJugador(\'' + esc(p.id) + '\'))" class="' + BTN_PELIGRO + '">Quitar</button></span></div>';
  });
  h += '</div><p class="text-xs text-zinc-500">' + js.length + ' jugadores. Quien ya jugó alguna jornada no se puede quitar (sí se le puede cambiar el nick).</p>';
  const otras = Object.keys(eventos).filter(k => k !== id && puedeCapturar(eventos[k]) && Object.keys(eventos[k].jugadores || {}).length);
  if (otras.length) {
    h += '<div class="bg-zinc-800 border border-zinc-700 rounded-xl p-3 space-y-2 text-sm"><p class="font-semibold">Copiar jugadores de otra liga tuya</p>' +
      '<div class="flex gap-2"><select id="copiarDe" class="' + INP + '">' + otras.map(k => '<option value="' + esc(k) + '">' + esc(eventos[k].nombre) + ' (' + Object.keys(eventos[k].jugadores).length + ')</option>').join('') + '</select>' +
      '<button type="button" id="btnCopiar" onclick="copiarJugadores()" class="' + BTN2 + '">Copiar</button></div><p class="text-xs text-zinc-500">Solo se agregan los nicks que todavía no están en esta liga.</p></div>';
  }
  if (esAyudante(ev) && !puedeAdministrar(ev)) {
    h += '<button type="button" onclick="dosToques(this,()=>dejarDeAyudar(\'' + esc(id) + '\'))" class="' + BTN_PELIGRO + ' self-start">Dejar de ser ayudante de esta liga</button>';
  }
  return h;
}

function nickRepetido(ev, nick, salvo) {
  const n = nick.trim().toLowerCase();
  return lista(ev.jugadores).some(p => p.id !== salvo && String(p.nick).trim().toLowerCase() === n);
}

async function agregarJugador(e, marcarPresenteEn) {
  e.preventDefault();
  const campo = e.target.querySelector('input'); const nick = campo.value.trim();
  const id = idLigaActual(); const ev = ligaActual(); if (!ev) return;
  if (!nick) return aviso('Escribe el nick.', 'error');
  if (nickRepetido(ev, nick)) return aviso('Ya hay un jugador con ese nick.', 'error');
  const jid = nuevoId('p');
  // Dos pasos: la base solo deja marcar presente a un jugador que ya existe en la lista
  if (!(await guardar(id, { ['jugadores/' + jid]: { nick } }, nick + ' agregado'))) return;
  if (marcarPresenteEn) await guardar(id, { ['jornadas/' + marcarPresenteEn + '/presentes/' + jid]: true });
  campo.value = ''; dibujar('ruta');
}

async function renombrarJugador(e, jid) {
  e.preventDefault();
  const nick = $('editNick').value.trim(); const ev = ligaActual();
  if (!nick) return aviso('Escribe el nick.', 'error');
  if (nickRepetido(ev, nick, jid)) return aviso('Ya hay un jugador con ese nick.', 'error');
  if (await guardar(idLigaActual(), { ['jugadores/' + jid + '/nick']: nick }, 'Nick cambiado')) { ui.editarJugador = null; dibujar('ruta'); }
}

function quitarJugador(jid) {
  const ev = ligaActual();
  if (jugadorUsado(ev, jid)) return aviso('Ya jugó en alguna jornada: no se puede quitar. Puedes cambiarle el nick.', 'error');
  return guardar(idLigaActual(), { ['jugadores/' + jid]: null }, 'Jugador quitado');
}

async function copiarJugadores() {
  const id = idLigaActual(); const ev = ligaActual(); const origen = eventos[$('copiarDe').value];
  if (!ev || !origen) return;
  const ya = new Set(lista(ev.jugadores).map(p => String(p.nick).trim().toLowerCase()));
  const cambios = {};
  lista(origen.jugadores).forEach(p => {
    const k = String(p.nick).trim().toLowerCase();
    if (!ya.has(k)) { ya.add(k); cambios['jugadores/' + nuevoId('p')] = { nick: String(p.nick).trim().slice(0, 30) }; }
  });
  const n = Object.keys(cambios).length;
  if (!n) return aviso('Todos esos jugadores ya están en esta liga.');
  await guardar(id, cambios, n === 1 ? 'Se copió 1 jugador' : 'Se copiaron ' + n + ' jugadores');
}

// ---------------- Ajustes
function seccionAjustes(id, ev) {
  const campo = (lbl, html, nota) => '<label class="block space-y-1"><span class="text-xs font-semibold text-zinc-400">' + lbl + '</span>' + html + (nota ? '<span class="block text-xs text-zinc-500">' + nota + '</span>' : '') + '</label>';
  let h = '<form id="formAjustes" class="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 space-y-3" onsubmit="guardarAjustes(event)" oninput="this.dataset.sucio=1" onchange="this.dataset.sucio=1" novalidate>' +
    '<h3 class="font-bold">Datos de la liga</h3>' +
    campo('Nombre', '<input id="ajNombre" maxlength="80" value="' + esc(ev.nombre) + '" class="' + INP + '">') +
    campo('Ciudad', '<input id="ajCiudad" maxlength="60" value="' + esc(ev.ciudad || '') + '" class="' + INP + '">') +
    campo('Nombre del organizador', '<input id="ajOrganizador" maxlength="40" value="' + esc(ev.organizadorNombre || '') + '" class="' + INP + '">') +
    (esTorneo(ev)
      ? '<div class="grid grid-cols-2 gap-2">' + campo('Fecha', '<input id="ajFecha" type="date" value="' + esc(ev.fecha || '') + '" class="' + INP + '">') + campo('Hora', '<input id="ajHora" type="time" value="' + esc(ev.hora || '') + '" class="' + INP + '">') + '</div>' +
        '<fieldset class="space-y-1.5"><legend class="text-xs font-semibold text-zinc-400 mb-1">Rondas antes de la final</legend><div class="flex gap-2">' +
        [2, 3].map(n => '<label class="flex gap-2 items-center text-sm border border-zinc-700 rounded-full px-3 py-1.5"><input type="radio" name="ajRondas" value="' + n + '"' + ((ev.rondasPlan || 3) === n ? ' checked' : '') + ' class="accent-wine-500"> ' + n + ' rondas</label>').join('') + '</div></fieldset>' +
        '<label class="flex gap-2 items-center text-sm"><input id="ajFinal" type="checkbox"' + (ev.conFinal ? ' checked' : '') + ' class="accent-wine-500"> Final de 5 con los mejores clasificados</label>'
      : '<div class="grid grid-cols-2 gap-2">' + campo('Inicio', '<input id="ajInicio" type="date" value="' + esc(ev.inicio || '') + '" class="' + INP + '">') + campo('Fin', '<input id="ajFin" type="date" value="' + esc(ev.fin || '') + '" class="' + INP + '">') + '</div>') +
    '<fieldset class="space-y-1.5"><legend class="text-xs font-semibold text-zinc-400 mb-1">Hazañas</legend>' +
    [['mencion', 'Solo mención'], ['desempate', 'Desempatan después de VP'], ['no', 'Sin hazañas']].map(([v, t]) =>
      '<label class="flex gap-2 items-center text-sm"><input type="radio" name="ajHazanas" value="' + v + '"' + ((ev.hazanasModo || 'mencion') === v ? ' checked' : '') + ' class="accent-wine-500"> ' + t + '</label>').join('') + '</fieldset>' +
    campo('Reglas o notas', '<textarea id="ajReglas" maxlength="1500" rows="3" class="' + INP + '">' + esc(ev.reglasTexto || '') + '</textarea>') +
    '<p id="ajError" class="text-sm text-red-300 hidden" role="alert"></p>' +
    '<button class="' + BTN + ' w-full">Guardar cambios</button></form>';

  if (ev.hazanasModo !== 'no') {
    const cat = lista(ev.hazanasCatalogo).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
    h += '<div class="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 space-y-2 text-sm"><h3 class="font-bold">Hazañas que se pueden otorgar</h3>' +
      (cat.length ? cat.map(x => '<div data-hazana="' + esc(x.nombre) + '" class="flex justify-between items-center gap-2"><span>🏅 ' + esc(x.nombre) + '</span>' +
        '<button type="button" onclick="dosToques(this,()=>quitarHazanaCatalogo(\'' + esc(x.id) + '\'))" class="' + BTN_PELIGRO + '">Quitar</button></div>').join('') : '<p class="text-zinc-400">Todavía no hay hazañas.</p>') +
      '<form class="flex gap-2 pt-1" onsubmit="agregarHazanaCatalogo(event)"><input id="nuevaHazana" maxlength="60" placeholder="ej. Sangrado más cuantioso" class="' + INP + '"><button class="' + BTN2 + '">Agregar</button></form></div>';
  }

  h += '<div class="bg-zinc-800 border border-zinc-700 rounded-2xl p-4 space-y-2 text-sm"><h3 class="font-bold">Archivar</h3>' +
    (ev.archivada
      ? '<p class="text-zinc-300">Está archivado: no sale en la portada, pero se puede ver en «Ver archivados».</p><button type="button" onclick="archivar(false)" class="' + BTN2 + '">Desarchivar</button>'
      : '<p class="text-zinc-300">Deja de salir en la portada y se conserva todo.</p><button type="button" onclick="dosToques(this,()=>archivar(true))" class="' + BTN2 + '">Archivar ' + (esTorneo(ev) ? 'torneo' : 'liga') + '</button>') + '</div>';

  if (soyAdmin) {
    h += '<div class="border border-red-900 rounded-2xl p-4 space-y-2 text-sm"><h3 class="font-bold text-red-300">Borrar definitivamente (solo superusuario)</h3>' +
      '<p class="text-zinc-300">Se borra con todas sus jornadas y resultados. No se puede deshacer.</p>' +
      '<button type="button" onclick="dosToques(this,()=>borrarLiga(\'' + esc(id) + '\').then(ok=>{if(ok)location.hash=\'#/\'}))" class="' + BTN_PELIGRO + '">Borrar definitivamente</button></div>';
  }
  return h;
}

async function guardarAjustes(e) {
  e.preventDefault();
  const id = idLigaActual(); const ev = ligaActual(); if (!ev) return;
  const err = (t) => { const p = $('ajError'); p.textContent = t; p.classList.remove('hidden'); };
  const nombre = $('ajNombre').value.trim();
  if (!nombre) return err('Escribe el nombre.');
  const nuevo = { nombre, ciudad: $('ajCiudad').value.trim(), organizadorNombre: $('ajOrganizador').value.trim() || ev.organizadorNombre || nombreUsuario(),
    hazanasModo: (document.querySelector('input[name="ajHazanas"]:checked') || {}).value || 'mencion', reglasTexto: $('ajReglas').value.trim() };
  const extra = {};
  if (esTorneo(ev)) {
    const fecha = $('ajFecha').value, hora = $('ajHora').value;
    if (!fechaValida(fecha)) return err('Elige la fecha del torneo.');
    const rondas = Number((document.querySelector('input[name="ajRondas"]:checked') || {}).value || 3);
    const j = diaTorneo(ev); const jugadas = j ? rondasOrdenadas(j).length : 0;
    if (rondas < jugadas) return err('Ya se sortearon ' + jugadas + ' rondas: no puedes poner menos.');
    if (j && j.final && !$('ajFinal').checked) return err('La final ya empezó: no se puede quitar.');
    nuevo.fecha = fecha; nuevo.rondasPlan = rondas; nuevo.conFinal = $('ajFinal').checked;
    if (hora) nuevo.hora = hora; // la hora se puede cambiar, no borrar
    if (j && fecha !== j.fecha) extra['jornadas/j1/fecha'] = fecha;
    if (j && hora && hora !== j.hora) extra['jornadas/j1/hora'] = hora;
  } else {
    const inicio = $('ajInicio').value, fin = $('ajFin').value;
    if (!fechaValida(inicio) || !fechaValida(fin)) return err('Las fechas de inicio y fin son obligatorias.');
    if (fin < inicio) return err('La fecha de fin es anterior al inicio.');
    const fuera = jornadasFuera(ev, inicio, fin);
    if (fuera.length) return err((fuera.length === 1 ? 'La jornada ' : 'Las jornadas ') + fuera.map(j => j.numero + ' (' + fechaCorta(j.fecha) + ')').join(', ') + (fuera.length === 1 ? ' queda' : ' quedan') + ' fuera de la temporada. Primero cámbiale la fecha o cancélala.');
    if (inicio) nuevo.inicio = inicio; if (fin) nuevo.fin = fin;
  }
  $('ajError').classList.add('hidden');
  const cambios = Object.assign({}, extra);
  Object.keys(nuevo).forEach(k => { if ((ev[k] === undefined ? '' : ev[k]) !== nuevo[k]) cambios[k] = nuevo[k]; });
  if (!Object.keys(cambios).length) return aviso('No hay cambios que guardar.');
  if (await guardar(id, cambios, 'Cambios guardados')) dibujar('ruta');
}

async function agregarHazanaCatalogo(e) {
  e.preventDefault();
  const nombre = $('nuevaHazana').value.trim(); const ev = ligaActual();
  if (!nombre) return aviso('Escribe el nombre de la hazaña.', 'error');
  if (lista(ev.hazanasCatalogo).some(x => String(x.nombre).toLowerCase() === nombre.toLowerCase())) return aviso('Esa hazaña ya existe.', 'error');
  if (await guardar(idLigaActual(), { ['hazanasCatalogo/' + nuevoId('h')]: { nombre } }, 'Hazaña agregada')) dibujar('ruta');
}
function quitarHazanaCatalogo(hid) {
  if (hazanaUsada(ligaActual(), hid)) return aviso('Esa hazaña ya se otorgó en alguna jornada: no se puede quitar.', 'error');
  return guardar(idLigaActual(), { ['hazanasCatalogo/' + hid]: null }, 'Hazaña quitada');
}
async function archivar(si) {
  if (await guardar(idLigaActual(), { archivada: si }, si ? 'Liga archivada' : 'Liga desarchivada')) dibujar('ruta');
}
