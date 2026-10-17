// =====================================================================
// avisos-servidor.js — AVISO AL CELULAR DEL ADMINISTRADOR (lado del servidor)
// Lo usa worker.js cada 5 minutos (cron de Cloudflare). NO se publica
// como archivo del sitio (cloudflare-publicar.sh lo deja fuera).
//
// Qué hace (acordado el 17 oct 2026):
// · Cuando alguien manda una solicitud para ser organizador, avisa a los
//   administradores en los aparatos donde activaron los avisos.
// · Cada solicitud avisa UNA sola vez. Si la rechazan y la vuelve a mandar,
//   es una solicitud nueva y vuelve a avisar.
// · Se guarda lo ya avisado en avisosEnviados/solicitudes/{uid} = fecha de
//   la solicitud. Los aparatos están en avisosAdmin/{uid}/{aparato}.
// Usa el mismo método que los avisos de mesa de Elysium (Organizador-Vtes).
// =====================================================================

// ---------------------------------------------------------------------
// Decidir qué avisar (sin red: se puede probar solo)
// ---------------------------------------------------------------------
// Devuelve { nuevas: [{uid, nombre, ciudad, mensaje, creada}], estado }
// estado = cambios para avisosEnviados/solicitudes (null = borrar)
export function planear(solicitudes, enviados) {
  solicitudes = solicitudes || {}; enviados = enviados || {};
  const nuevas = [], estado = {};
  for (const uid of Object.keys(enviados)) if (!solicitudes[uid]) estado[uid] = null; // ya aprobada, rechazada o cancelada
  for (const [uid, s] of Object.entries(solicitudes)) {
    if (!s || typeof s !== 'object') continue;
    const creada = Number(s.creada) || 0;
    if (enviados[uid] === creada) continue; // esta misma solicitud ya se avisó
    estado[uid] = creada;
    nuevas.push({ uid, nombre: String(s.nombre || 'Alguien'), ciudad: String(s.ciudad || ''), mensaje: String(s.mensaje || ''), creada });
  }
  nuevas.sort((a, b) => a.creada - b.creada);
  return { nuevas, estado };
}

const corto = (t, n) => (t.length > n ? t.slice(0, n - 1) + '…' : t);

// Texto del aviso: una solicitud con sus datos, o varias juntas en un solo aviso
export function mensaje(nuevas) {
  if (nuevas.length === 1) {
    const s = nuevas[0];
    const quien = corto(s.nombre, 40) + (s.ciudad ? ' · ' + corto(s.ciudad, 40) : '');
    return { titulo: '🔔 Nueva solicitud de organizador', texto: quien + (s.mensaje ? ' — «' + corto(s.mensaje, 90) + '»' : '') + '. Toca para revisarla.' };
  }
  const nombres = nuevas.map(s => corto(s.nombre, 25));
  const lista = nombres.length > 3 ? nombres.slice(0, 3).join(', ') + ' y ' + (nombres.length - 3) + ' más' : nombres.slice(0, -1).join(', ') + ' y ' + nombres[nombres.length - 1];
  return { titulo: '🔔 ' + nuevas.length + ' solicitudes de organizador', texto: lista + '. Toca para revisarlas.' };
}

// Aparatos con token de todos los administradores: [[ruta, token]]
export function aparatosAdmin(avisosAdmin, admins) {
  const lista = [];
  for (const [uid, aparatos] of Object.entries(avisosAdmin || {})) {
    if (!admins || admins[uid] !== true) continue; // solo quien sigue siendo administrador
    for (const [disp, a] of Object.entries(aparatos || {})) if (a && a.token) lista.push(['avisosAdmin/' + uid + '/' + disp, a.token]);
  }
  return lista;
}

// ---------------------------------------------------------------------
// Google: cuenta de servicio → token de acceso (RS256 con WebCrypto)
// ---------------------------------------------------------------------
const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
const b64urlTexto = s => b64url(new TextEncoder().encode(s));

export async function tokenGoogle(cuenta) {
  const der = Uint8Array.from(atob(cuenta.private_key.replace(/-----[^-]+-----/g, '').replace(/\s/g, '')), c => c.charCodeAt(0));
  const llave = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const iat = Math.floor(Date.now() / 1000);
  const cuerpo = b64urlTexto(JSON.stringify({ alg: 'RS256', typ: 'JWT' })) + '.' + b64urlTexto(JSON.stringify({
    iss: cuenta.client_email, aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.database https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/firebase.messaging'
  }));
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', llave, new TextEncoder().encode(cuerpo));
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=' + cuerpo + '.' + b64url(firma)
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Google no dio token: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

// ---------------------------------------------------------------------
// Conexión con Firebase (base de datos y avisos)
// ---------------------------------------------------------------------
export function conexion(env, token) {
  const cuenta = JSON.parse(env.FIREBASE_CUENTA_SERVICIO);
  const base = env.FIREBASE_DB_URL.replace(/\/$/, '');
  const db = async (metodo, ruta, datos) => {
    const r = await fetch(base + '/' + ruta + '.json?access_token=' + encodeURIComponent(token), {
      method: metodo, headers: { 'Content-Type': 'application/json' }, body: datos === undefined ? undefined : JSON.stringify(datos)
    });
    if (!r.ok) throw new Error('Base de datos ' + metodo + ' ' + ruta + ': ' + r.status + ' ' + (await r.text()).slice(0, 200));
    return r.json();
  };
  // Devuelve 'ok', 'borrar' (el aparato ya no recibe avisos) o 'error'
  const enviar = async (tokenAparato, msj, enlace) => {
    const r = await fetch('https://fcm.googleapis.com/v1/projects/' + cuenta.project_id + '/messages:send', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ message: {
        token: tokenAparato,
        notification: { title: msj.titulo, body: msj.texto },
        data: { link: enlace },
        webpush: { notification: { icon: '/iconos/icono-192.png' }, fcm_options: { link: enlace } }
      } })
    });
    if (r.ok) return 'ok';
    const txt = await r.text();
    console.log('Aviso no enviado:', r.status, txt.slice(0, 200));
    return r.status === 404 || /UNREGISTERED|registration-token-not-registered|INVALID_ARGUMENT/.test(txt) ? 'borrar' : 'error';
  };
  return { db, enviar };
}

// Manda un aviso a una lista de aparatos; devuelve cuántos salieron y cuáles borrar
async function mandarA(aparatos, msj, enlace, enviar) {
  let ok = 0; const borrar = {};
  for (const [ruta, token] of aparatos) {
    const res = await enviar(token, msj, enlace);
    if (res === 'ok') ok++;
    if (res === 'borrar') borrar[ruta] = null;
  }
  return { ok, borrar };
}

const enlaceSolicitudes = env => env.SITIO.replace(/\/$/, '') + '/#/mis-eventos';

// Una vuelta del cron (cada 5 minutos)
export async function vuelta(env) {
  const token = await tokenGoogle(JSON.parse(env.FIREBASE_CUENTA_SERVICIO));
  const { db, enviar } = conexion(env, token);
  const [solicitudes, enviados, avisosAdmin, admins] = await Promise.all([
    db('GET', 'solicitudes'), db('GET', 'avisosEnviados/solicitudes'), db('GET', 'avisosAdmin'), db('GET', 'admins')]);
  const { nuevas, estado } = planear(solicitudes, enviados);
  const aparatos = aparatosAdmin(avisosAdmin, admins);
  // Primero se guarda lo avisado (si algo falla después, no se repite cada 5 minutos).
  // Si todavía nadie activó los avisos, las nuevas NO se marcan: te llegan al activarlos.
  const cambios = {};
  for (const [uid, v] of Object.entries(estado)) if (v === null || aparatos.length) cambios['avisosEnviados/solicitudes/' + uid] = v;
  if (Object.keys(cambios).length) await db('PATCH', '', cambios);
  if (!nuevas.length || !aparatos.length) return { nuevas: nuevas.length, aparatos: aparatos.length, enviados: 0, borrados: 0 };
  const { ok, borrar } = await mandarA(aparatos, mensaje(nuevas), enlaceSolicitudes(env), enviar);
  if (Object.keys(borrar).length) await db('PATCH', '', borrar);
  return { nuevas: nuevas.length, aparatos: aparatos.length, enviados: ok, borrados: Object.keys(borrar).length };
}

// «Mandarme un aviso de prueba»: solo para administradores, uno por minuto
export async function avisoPrueba(env, idToken, ahora = Date.now()) {
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + env.FIREBASE_API_KEY, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Referer: env.SITIO.replace(/\/?$/, '/') }, body: JSON.stringify({ idToken })
  });
  const j = await r.json().catch(() => ({}));
  const uid = j.users && j.users[0] && j.users[0].localId;
  if (!uid) return { estado: 401, texto: 'Sesión no válida' };
  const token = await tokenGoogle(JSON.parse(env.FIREBASE_CUENTA_SERVICIO));
  const { db, enviar } = conexion(env, token);
  if ((await db('GET', 'admins/' + uid)) !== true) return { estado: 403, texto: 'Solo el administrador' };
  const ultima = await db('GET', 'avisosEnviados/_prueba/' + uid);
  if (ultima && ahora - ultima < 60000) return { estado: 429, texto: 'Espera un minuto' };
  await db('PUT', 'avisosEnviados/_prueba/' + uid, ahora);
  const aparatos = aparatosAdmin({ [uid]: await db('GET', 'avisosAdmin/' + uid) }, { [uid]: true });
  const { ok, borrar } = await mandarA(aparatos, { titulo: 'Aviso de prueba 🦇', texto: 'Así te llegarán las solicitudes para organizar.' }, enlaceSolicitudes(env), enviar);
  if (Object.keys(borrar).length) await db('PATCH', '', borrar);
  return { estado: 200, texto: JSON.stringify({ aparatos: aparatos.length, enviados: ok }) };
}
