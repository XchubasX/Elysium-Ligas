// =====================================================================
// js/base.js — utilidades: texto seguro, fechas, enlaces, avisos.
// Solo define funciones (lo que se ejecuta al abrir está en arranque.js).
// =====================================================================

function $(id) { return document.getElementById(id); }

// Convierte & < > " ' en texto para que nadie meta código en un nombre o nick.
function esc(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Fechas: se guardan como "AAAA-MM-DD" (día del lugar de la liga, sin hora mundial).
function fechaValida(f) { return typeof f === 'string' && /^20\d\d-[01]\d-[0-3]\d$/.test(f) && !isNaN(Date.parse(f + 'T12:00:00Z')); }
function fechaCorta(f) { // "sáb 24 oct"
  if (!fechaValida(f)) return '';
  return new Date(f + 'T12:00:00Z').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(/\./g, '').replace(',', '').replace(' de ', ' ');
}
function fechaLarga(f) { // "24 oct 2026"
  if (!fechaValida(f)) return '';
  return new Date(f + 'T12:00:00Z').toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).replace(/\./g, '');
}
function hoyISO() { // fecha de hoy en la zona de quien mira
  const d = new Date(); const p = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

// "Liga CDMX · Temporada 3" → "liga-cdmx-temporada-3"
function aEnlace(texto) {
  return String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/g, '');
}
function enlaceValido(id) { return /^[a-z0-9-]{3,40}$/.test(id || ''); }

// Aviso breve abajo de la pantalla
function aviso(texto, tipo) {
  const caja = $('avisos'); if (!caja) return;
  const d = document.createElement('div');
  d.className = 'px-4 py-2.5 rounded-lg text-sm font-semibold shadow-lg ' + (tipo === 'error' ? 'bg-red-900 text-red-100 border border-red-700' : 'bg-emerald-900 text-emerald-100 border border-emerald-700');
  d.textContent = texto;
  caja.appendChild(d);
  setTimeout(() => d.remove(), 3500);
}

// Navegadores dentro de otras apps (WhatsApp, Instagram, Facebook): Google no deja entrar ahí.
function navegadorDentroDeApp() {
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|Line\/|; wv\)|WhatsApp/i.test(ua);
}

// Identificador nuevo (jugadores, hazañas): corto, único y sin datos personales
function nuevoId(prefijo) { return prefijo + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

// Botón de dos toques para acciones delicadas (sin ventanas del navegador):
// el primer toque pide confirmar; el segundo, en menos de 5 s, ejecuta.
function dosToques(boton, accion) {
  if (boton.dataset.armado) { delete boton.dataset.armado; accion(); return; }
  boton.dataset.armado = '1'; boton.dataset.texto = boton.textContent;
  boton.textContent = '¿Seguro? Toca otra vez';
  setTimeout(() => { if (boton.isConnected && boton.dataset.armado) { delete boton.dataset.armado; boton.textContent = boton.dataset.texto; } }, 5000);
}

function enlaceWhatsApp(texto) { return 'https://wa.me/?text=' + encodeURIComponent(texto); }

// Países (la misma lista que los eventos presenciales de Elysium)
const PAISES = ['México', 'Chile', 'España', 'Otro'];
function sinAcentosTexto(t) { return String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }
// Ciudades ya usadas en un país (para sugerir y no repetir "CDMX" / "Ciudad de México")
function ciudadesDe(pais, salvoId) {
  const vistas = {};
  Object.keys(eventos || {}).forEach(id => {
    const ev = eventos[id];
    if (id !== salvoId && ev.pais === pais && ev.ciudad) vistas[sinAcentosTexto(ev.ciudad)] = vistas[sinAcentosTexto(ev.ciudad)] || ev.ciudad;
  });
  return Object.values(vistas).sort((a, b) => a.localeCompare(b, 'es'));
}
// Si la ciudad escrita ya existe con otra forma (mayúsculas/acentos), usa la existente
function normalizarCiudad(pais, ciudad, salvoId) {
  const c = String(ciudad || '').trim();
  return ciudadesDe(pais, salvoId).find(x => sinAcentosTexto(x) === sinAcentosTexto(c)) || c;
}
function selectorPais(id, valor, alCambiar) {
  return '<select id="' + id + '" onchange="' + (alCambiar || '') + '" class="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-wine-500">' +
    (valor ? '' : '<option value="">Elige…</option>') + PAISES.map(p => '<option' + (p === valor ? ' selected' : '') + '>' + p + '</option>').join('') + '</select>';
}
function listaCiudades(idLista, pais, salvoId) {
  return '<datalist id="' + idLista + '">' + ciudadesDe(pais, salvoId).map(c => '<option value="' + esc(c) + '">').join('') + '</datalist>';
}
function lugarTexto(ev) {
  if (esEnLinea(ev)) return '🌐 En línea' + (ev.plataforma ? ' · ' + ev.plataforma : '');
  return [ev.ciudad, ev.pais].filter(Boolean).join(', ');
}

// ---------------- Eventos En línea (24 oct 2026)
// Un evento en línea guarda modalidad: 'en-linea', no tiene país ni ciudad, puede
// tener plataforma (texto libre) y guarda la zona horaria del organizador (zona),
// que se detecta sola del aparato de quien lo crea y ya no cambia.
// Fechas y horas se siguen guardando como «AAAA-MM-DD» y «HH:MM» en esa zona;
// al mostrarlas, cada quien las ve convertidas a su propia hora.
// Sin «modalidad» = presencial (así son todos los eventos creados antes).
function esEnLinea(ev) { return !!(ev && ev.modalidad === 'en-linea'); }
const ZONAS = [
  ['America/Mexico_City', 'Ciudad de México'], ['America/Tijuana', 'Tijuana'], ['America/Cancun', 'Cancún'],
  ['America/Bogota', 'Bogotá'], ['America/Lima', 'Lima'], ['America/Santiago', 'Santiago de Chile'],
  ['America/Argentina/Buenos_Aires', 'Buenos Aires'], ['America/New_York', 'Nueva York'], ['America/Los_Angeles', 'Los Ángeles'],
  ['Europe/Madrid', 'Madrid'], ['Atlantic/Canary', 'Canarias'], ['Europe/London', 'Londres']
];
// Nombre para mostrar: el de la lista, o el último pedazo de la zona («America/Monterrey» → «Monterrey»)
function nombreZona(z) { const x = ZONAS.find(([k]) => k === z); return x ? x[1] : String(z || '').split('/').pop().replace(/_/g, ' '); }
// Cualquier zona horaria que el navegador reconozca (no solo las de la lista)
function zonaValida(z) {
  if (typeof z !== 'string' || z.length < 3 || z.length > 40) return false;
  try { new Intl.DateTimeFormat('en-US', { timeZone: z }); return true; } catch (e) { return false; }
}
function zonaNavegador() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } }
// Zona del aparato (se detecta sola al crear); si el navegador no la da, Ciudad de México
function zonaDelAparato() { const z = zonaNavegador(); return zonaValida(z) ? z : 'America/Mexico_City'; }
// Minutos que la zona z va adelante de la hora mundial (UTC) en el instante t
function desfaseZona(z, t) {
  const p = {}; new Intl.DateTimeFormat('en-US', { timeZone: z, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(new Date(t)).forEach(x => { p[x.type] = x.value; });
  return (Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - Math.floor(t / 60000) * 60000) / 60000;
}
// «2026-10-24» + «20:00» en la zona z → instante (milisegundos)
function instanteEnZona(fecha, hora, z) {
  const [a, m, d] = fecha.split('-').map(Number); const [hh, mm] = hora.split(':').map(Number);
  const base = Date.UTC(a, m - 1, d, hh, mm);
  let t = base - desfaseZona(z, base) * 60000;
  t = base - desfaseZona(z, t) * 60000; // segunda vuelta por si cae en cambio de horario
  return t;
}
// Fecha y hora para mostrar. Presencial: tal cual. En línea con hora: convertida a la
// hora de quien mira; si cambia respecto a la del organizador, se marca «(tu hora)».
// Devuelve texto (sin escapar): «sáb 24 oct · 20:00».
function cuando(ev, fecha, hora, opciones) {
  const o = opciones || {};
  if (!fechaValida(fecha)) return '';
  if (!hora || !esEnLinea(ev) || !zonaValida(ev.zona)) return fechaCorta(fecha) + (hora ? ' · ' + hora : '');
  if (o.original) return fechaCorta(fecha) + ' · ' + hora + ' (hora de ' + nombreZona(ev.zona) + ')';
  let t; try { t = instanteEnZona(fecha, hora, ev.zona); } catch (e) { return fechaCorta(fecha) + ' · ' + hora; }
  const d = new Date(t); const p2 = (n) => String(n).padStart(2, '0');
  const f2 = d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()); const h2 = p2(d.getHours()) + ':' + p2(d.getMinutes());
  if (f2 === fecha && h2 === hora) return fechaCorta(fecha) + ' · ' + hora;
  return fechaCorta(f2) + ' · ' + h2 + ' (tu hora)';
}
// ¿Quien mira está en otra zona que el organizador (en este momento)?
function otraZona(ev) {
  if (!esEnLinea(ev) || !zonaValida(ev.zona)) return false;
  const ahora = Date.now();
  try { return desfaseZona(ev.zona, ahora) !== -new Date(ahora).getTimezoneOffset(); } catch (e) { return false; }
}

// ---------------- Campos de fecha y hora en iPhone
// Safari de iPhone no dibuja ícono ni «dd/mm/aaaa»: un campo vacío se ve como una
// caja oscura y no se entiende que hay que tocarlo. Ahí se agrega una pista gris
// («Elegir fecha» / «Elegir hora») que se oculta al elegir, y el ícono a la derecha.
// En computadora y Android no cambia nada (ya muestran su propio ícono).
function esIPhone() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
const ICONO_CALENDARIO = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg>';
const ICONO_RELOJ = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
function decorarFechas(raiz) {
  if (!esIPhone() || !raiz) return;
  raiz.querySelectorAll('input[type=date], input[type=time]').forEach(inp => {
    if (inp.dataset.pista) return;
    inp.dataset.pista = '1';
    const esHora = inp.type === 'time';
    const caja = document.createElement('span');
    caja.style.cssText = 'position:relative;display:block;min-width:0;width:100%';
    inp.parentNode.style.minWidth = '0'; // en una cuadrícula de 2 columnas, que la celda pueda encogerse
    inp.parentNode.insertBefore(caja, inp);
    caja.appendChild(inp);
    // Safari de iPhone le pone un ancho mínimo propio a fecha y hora, y se salía de la tarjeta
    inp.style.webkitAppearance = 'none';
    inp.style.appearance = 'none';
    inp.style.width = '100%';
    inp.style.minWidth = '0';
    inp.style.boxSizing = 'border-box';
    inp.style.minHeight = '2.5rem';
    inp.style.paddingRight = '2.25rem';
    const pista = document.createElement('span');
    pista.setAttribute('aria-hidden', 'true');
    pista.dataset.pistaFecha = esHora ? 'hora' : 'fecha';
    pista.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 .75rem;pointer-events:none;color:#a1a1aa;font-size:.875rem';
    pista.innerHTML = '<span data-texto>' + (esHora ? 'Elegir hora' : 'Elegir fecha') + '</span>' + (esHora ? ICONO_RELOJ : ICONO_CALENDARIO);
    caja.appendChild(pista);
    const actualizar = () => { pista.querySelector('[data-texto]').style.visibility = inp.value ? 'hidden' : 'visible'; };
    ['input', 'change', 'blur'].forEach(ev => inp.addEventListener(ev, actualizar));
    actualizar();
  });
}
