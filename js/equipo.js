// =====================================================================
// js/equipo.js — AYUDANTES POR INVITACIÓN, EXCEL Y COMPARTIR
// Pestaña Equipo (organizador): ayudantes, invitaciones pendientes, invitar.
// #/invitacion/{liga}/{código}: la persona invitada entra con Google y acepta.
// Invitaciones: un solo uso, caducan en 7 días; las reglas lo hacen cumplir.
// =====================================================================
const DIAS_INVITACION = 7;
const invitacionesLiga = {};   // { liga: { codigo: { creada, expira } } } (solo el dueño las puede leer)
let ultimaInvitacion = null;   // { liga, enlace } recién creada, para mostrar el enlace

function enlaceInvitacion(id, codigo) { return location.origin + location.pathname + '#/invitacion/' + id + '/' + codigo; }
function codigoNuevo() {
  const b = new Uint8Array(16); crypto.getRandomValues(b);
  return Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
}

async function cargarInvitaciones(id) {
  try { const s = await db.ref('invitaciones/' + id).get(); invitacionesLiga[id] = s.val() || {}; }
  catch (e) { invitacionesLiga[id] = {}; }
  if (rutaActual().pestana === 'equipo') dibujar('ruta');
}

// ---------------- Pestaña Equipo
function seccionEquipo(id, ev) {
  if (!(id in invitacionesLiga)) { invitacionesLiga[id] = null; cargarInvitaciones(id); }
  const ays = lista(ev.ayudantes).sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
  let h = '<div class="bg-zinc-800 rounded-xl p-3 text-sm divide-y divide-zinc-700">' +
    '<div class="py-2 flex justify-between"><span><b>' + esc(ev.organizadorNombre || 'Organizador') + '</b></span><span class="text-wine-300 text-xs font-bold">ORGANIZADOR</span></div>';
  ays.forEach(a => {
    h += '<div data-ayudante="' + esc(a.nombre) + '" class="py-2 flex justify-between items-center gap-2"><span><b>' + esc(a.nombre) + '</b> <span class="text-[11px] font-bold text-violet-300">AYUDANTE</span></span>' +
      '<button type="button" onclick="dosToques(this,()=>quitarAyudante(\'' + esc(a.id) + '\'))" class="' + BTN_PELIGRO + '">Quitar</button></div>';
  });
  if (!ays.length) h += '<p class="py-2 text-zinc-400">Todavía no tienes ayudantes.</p>';
  h += '</div>';

  if (ultimaInvitacion && ultimaInvitacion.liga === id) {
    const texto = 'Te invito a ser ayudante de la liga «' + ev.nombre + '» en Elysium: podrás anotar jugadores y capturar mesas y resultados. El enlace sirve una sola vez y caduca en ' + DIAS_INVITACION + ' días:\n' + ultimaInvitacion.enlace;
    h += '<div class="bg-violet-950/40 border border-violet-700/60 rounded-xl p-3 space-y-2 text-sm"><p class="font-semibold text-violet-200">Enlace de invitación listo</p>' +
      '<code id="enlaceInvitacion" class="block bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-xs break-all">' + esc(ultimaInvitacion.enlace) + '</code>' +
      '<div class="flex gap-2 flex-wrap"><a href="' + esc(enlaceWhatsApp(texto)) + '" target="_blank" rel="noopener" class="' + BTN + ' !bg-emerald-700 hover:!bg-emerald-600">Enviar por WhatsApp</a>' +
      '<button type="button" onclick="copiarTexto(ultimaInvitacion.enlace,\'Enlace copiado\')" class="' + BTN2 + '">Copiar enlace</button></div>' +
      '<p class="text-xs text-zinc-400">Mándaselo solo a esa persona: sirve una sola vez y caduca en ' + DIAS_INVITACION + ' días.</p></div>';
  }
  h += '<button type="button" onclick="invitarAyudante()" class="' + BTN2 + ' w-full border-dashed">+ Invitar ayudante</button>';

  const pend = invitacionesLiga[id];
  if (pend === null) h += '<p class="text-xs text-zinc-500">Cargando invitaciones…</p>';
  else {
    const vivas = Object.keys(pend).filter(c => (pend[c].expira || 0) > Date.now()).sort((a, b) => pend[a].expira - pend[b].expira);
    if (vivas.length) {
      h += '<div class="bg-zinc-800 rounded-xl p-3 text-sm space-y-2"><p class="font-semibold">Invitaciones sin usar</p>' + vivas.map(c => {
        const dias = Math.max(1, Math.ceil((pend[c].expira - Date.now()) / 86400000));
        return '<div data-invitacion class="flex justify-between items-center gap-2"><span class="text-zinc-300">Caduca en ' + dias + (dias === 1 ? ' día' : ' días') + '</span><span class="flex gap-1.5">' +
          '<button type="button" onclick="copiarTexto(enlaceInvitacion(\'' + esc(id) + '\',\'' + esc(c) + '\'),\'Enlace copiado\')" class="' + BTN_CH + '">Copiar</button>' +
          '<button type="button" onclick="dosToques(this,()=>cancelarInvitacion(\'' + esc(c) + '\'))" class="' + BTN_PELIGRO + '">Cancelar</button></span></div>';
      }).join('') + '</div>';
    }
  }
  h += '<div class="text-xs text-zinc-400 space-y-1"><p><b class="text-zinc-300">Un ayudante puede:</b> anotar jugadores, pasar lista, sortear mesas, capturar VP y hazañas, empezar y cerrar jornadas.</p>' +
    '<p><b class="text-zinc-300">No puede:</b> cambiar fechas, reglas ni ajustes, reabrir jornadas cerradas, ni invitar a otros. Sigue siendo ayudante hasta que lo quites.</p></div>';
  return h;
}

async function invitarAyudante() {
  const id = idLigaActual(); const codigo = codigoNuevo();
  const datos = { creada: firebase.database.ServerValue.TIMESTAMP, expira: Date.now() + DIAS_INVITACION * 86400000 };
  try {
    await db.ref('invitaciones/' + id + '/' + codigo).set(datos);
    ultimaInvitacion = { liga: id, enlace: enlaceInvitacion(id, codigo) };
    aviso('Invitación creada');
    cargarInvitaciones(id);
  } catch (e) { aviso('No se pudo crear la invitación.', 'error'); }
}
async function cancelarInvitacion(codigo) {
  const id = idLigaActual();
  try { await db.ref('invitaciones/' + id + '/' + codigo).remove(); aviso('Invitación cancelada'); if (ultimaInvitacion && ultimaInvitacion.enlace.endsWith(codigo)) ultimaInvitacion = null; cargarInvitaciones(id); }
  catch (e) { aviso('No se pudo cancelar.', 'error'); }
}
function quitarAyudante(uid) { return guardar(idLigaActual(), { ['ayudantes/' + uid]: null }, 'Ayudante quitado'); }
async function dejarDeAyudar(id) {
  if (await guardar(id, { ['ayudantes/' + usuario.uid]: null }, 'Ya no eres ayudante de esta liga')) location.hash = '#/mis-eventos';
}
function copiarTexto(t, ok) {
  (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => aviso(ok || 'Copiado')).catch(() => aviso('Mantén presionado el texto para copiarlo', 'error'));
}

// ---------------- Página de la invitación (la abre la persona invitada)
let resultadoInvitacion = null; // 'ok' | 'error'
function vistaInvitacion(id, codigo) {
  if (!datosCargados || !sesionLista) return cargando();
  const ev = eventos[id];
  const caja = (t) => '<div class="bg-zinc-800 border border-violet-700/50 rounded-2xl p-5 space-y-3 text-center">' + t + '</div>';
  if (!ev || !codigo) return caja('<p class="text-zinc-300">Este enlace de invitación no es válido.</p><a href="#/" class="' + BTN2 + '">Ir a las ligas</a>');
  const titulo = '<p class="text-xs font-bold text-violet-300">INVITACIÓN</p><h2 class="text-lg font-extrabold text-wine-300">' + esc(ev.nombre) + '</h2>';
  if (resultadoInvitacion === 'error') return caja(titulo + '<p class="text-zinc-300">Este enlace ya se usó, caducó o fue cancelado.</p><p class="text-sm text-zinc-400">Pídele a ' + esc(ev.organizadorNombre || 'el organizador') + ' un enlace nuevo.</p><a href="#/liga/' + esc(id) + '" class="' + BTN2 + '">Ver la liga</a>');
  if (usuario && esAyudante(ev)) return caja(titulo + '<p class="text-emerald-300 font-semibold">¡Listo! Ya eres ayudante de esta liga.</p><p class="text-sm text-zinc-400">Encuéntrala en «Mis ligas». Desde ahí abres el día de cada jornada.</p><a href="#/liga/' + esc(id) + '/calendario" class="' + BTN + '">Ir a la liga</a>');
  if (usuario && ev.ownerUid === usuario.uid) return caja(titulo + '<p class="text-zinc-300">Esta liga es tuya: no necesitas invitación. Mándale este enlace a la persona que quieres de ayudante.</p><a href="#/liga/' + esc(id) + '/equipo" class="' + BTN2 + '">Ir a Equipo</a>');
  let h = titulo + '<p class="text-zinc-300">' + esc(ev.organizadorNombre || 'El organizador') + ' te invita a ser <b>ayudante</b>: podrás anotar jugadores y capturar mesas y resultados de las jornadas.</p>';
  if (!usuario) {
    if (navegadorDentroDeApp()) {
      h += '<div class="bg-amber-950/50 border border-amber-700/60 rounded-lg p-3 text-sm text-amber-100 text-left space-y-2"><p><b>Abre este enlace en Chrome o Safari.</b> Google no deja entrar desde WhatsApp.</p>' +
        '<p>Toca los tres puntos (⋮) o el botón de compartir y elige «Abrir en el navegador». O copia el enlace y pégalo en Chrome o Safari.</p>' +
        '<button type="button" onclick="copiarTexto(location.href,\'Enlace copiado\')" class="' + BTN2 + ' w-full">Copiar enlace</button></div>';
    } else {
      h += '<button type="button" onclick="entrarConGoogle()" class="bg-white text-zinc-900 font-bold text-sm px-4 py-2.5 rounded-lg w-full">Entrar con Google para aceptar</button>';
    }
    h += '<p class="text-xs text-zinc-500">Solo se guarda tu primer nombre para mostrarlo en el equipo de la liga; tu correo no.</p>';
    return caja(h);
  }
  h += '<p class="text-sm text-zinc-400">Entraste como <b class="text-zinc-200">' + esc(nombreUsuario()) + '</b>.</p>' +
    '<button type="button" onclick="aceptarInvitacion(\'' + esc(id) + '\',\'' + esc(codigo) + '\')" class="' + BTN + ' w-full">Aceptar y ser ayudante</button>';
  return caja(h);
}

async function aceptarInvitacion(id, codigo) {
  const cambios = {
    ['eventos/' + id + '/ayudantes/' + usuario.uid]: { nombre: nombreUsuario().slice(0, 40), desde: firebase.database.ServerValue.TIMESTAMP, codigo },
    ['invitaciones/' + id + '/' + codigo]: null   // un solo uso: se borra en la misma escritura
  };
  try { await db.ref().update(cambios); resultadoInvitacion = 'ok'; aviso('¡Ya eres ayudante!'); }
  catch (e) { console.warn(e); resultadoInvitacion = 'error'; }
  dibujar('ruta');
}

// ---------------- Compartir la tabla por WhatsApp (top 5 + enlace)
function textoCompartirTabla(id, ev) {
  const t = tablaLiga(ev);
  const cerradas = jornadasOrdenadas(ev).filter(j => j.estado === 'cerrada');
  const ult = cerradas.length ? cerradas[cerradas.length - 1].numero : null;
  return '🏆 ' + ev.nombre + (ult ? ' · tabla tras la jornada ' + ult : '') + '\n' +
    t.slice(0, 5).map((f, i) => (i + 1) + '. ' + f.nick + ' · ' + f.gw + ' GW · ' + f.vp + ' VP').join('\n') +
    '\nVer todo: ' + location.origin + location.pathname + '#/liga/' + id;
}

// ---------------- Excel (tabla, jornadas y hazañas)
function hojasExcel(ev) {
  const nick = (pid) => ((ev.jugadores || {})[pid] || {}).nick || '(jugador borrado)';
  const conHaz = ev.hazanasModo !== 'no';
  const tabla = [['#', 'Jugador', 'GW', 'VP'].concat(conHaz ? ['Hazañas'] : []).concat(['Jornadas jugadas'])];
  tablaLiga(ev).forEach((f, i) => tabla.push([i + 1, f.nick, f.gw, f.vp].concat(conHaz ? [f.hazanas] : []).concat([f.jornadas])));
  const jornadas = [['Jornada', 'Fecha', 'Ronda', 'Mesa', 'Asiento', 'Jugador', 'VP', 'GW']];
  jornadasOrdenadas(ev).filter(j => j.estado === 'cerrada').forEach(j => {
    rondasOrdenadas(j).forEach(r => r.mesas.forEach(m => {
      const res = resultadosMesa(Object.fromEntries(m.jugadores.map(x => [x.jid, { vp: x.vp }])));
      m.jugadores.forEach(x => jornadas.push([j.numero, j.fecha, r.n, m.n, x.asiento, nick(x.jid), typeof x.vp === 'number' ? x.vp : '', res[x.jid].gw]));
    }));
  });
  const hojas = [['Tabla', tabla], ['Jornadas', jornadas]];
  if (conHaz) {
    const hz = [['Jornada', 'Fecha', 'Hazaña', 'Jugador']];
    hazanasLiga(ev).forEach(x => hz.push([x.numero, x.fecha, x.nombre, x.nick]));
    hojas.push(['Hazañas', hz]);
  }
  return hojas;
}

function cargarXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  return new Promise((ok, mal) => {
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => ok(window.XLSX); s.onerror = mal;
    document.head.appendChild(s);
  });
}
async function descargarExcel(id) {
  const ev = eventos[id]; if (!ev) return;
  try {
    const X = await cargarXLSX();
    const libro = X.utils.book_new();
    hojasExcel(ev).forEach(([nombre, filas]) => X.utils.book_append_sheet(libro, X.utils.aoa_to_sheet(filas), nombre));
    X.writeFile(libro, id + '.xlsx');
  } catch (e) { console.warn(e); aviso('No se pudo preparar el Excel. Revisa tu conexión.', 'error'); }
}
