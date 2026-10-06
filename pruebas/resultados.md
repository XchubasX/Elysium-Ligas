# Resultados de las pruebas

**✅ TODO BIEN** — 258 de 258 casos pasaron.

- Fecha: 06/10/2026 08:30 (hora de Ciudad de México)
- Versión probada: `5ce0517` + cambios aún sin guardar
- Duración: 53 s
- Grupos corridos: todos
- Cómo se prueba: navegador automatizado con Firebase simulado (no toca datos reales). **Las reglas de la base de datos se aplicaron** en cada lectura y escritura (simulador de reglas). No sustituye la revisión en el sitio de pruebas: estilos y servicios de Google reales solo se ven ahí.

## Resumen por grupo

| # | Grupo | Casos | Resultado |
|---|---|---|---|
| 1 | Cálculos: GW, VP y orden de la tabla | 14 | ✅ |
| 2 | Portada y página pública de la liga | 24 | ✅ |
| 3 | Sesión, roles y Mis eventos | 17 | ✅ |
| 4 | Crear liga | 22 | ✅ |
| 5 | Calendario de jornadas (organizador) | 21 | ✅ |
| 6 | Jugadores de la liga | 15 | ✅ |
| 7 | Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar | 37 | ✅ |
| 8 | Ajustes, hazañas, archivar y borrar | 19 | ✅ |
| 9 | Equipo: ayudantes por invitación | 26 | ✅ |
| 10 | Compartir por WhatsApp y descargar Excel | 14 | ✅ |
| 11 | Torneos de un día | 44 | ✅ |
| 12 | Enlaces del sitio de pruebas y detalles de diseño | 5 | ✅ |

## Todos los casos

### 1. Cálculos: GW, VP y orden de la tabla

| # | Caso | Resultado |
|---|---|---|
| 1 | 3 VP único máximo → gana GW | ✅ |
| 2 | empate en el máximo (2 y 2) → nadie gana GW | ✅ |
| 3 | máximo de 1.5 VP (menos de 2) → nadie gana GW | ✅ |
| 4 | exactamente 2 VP y único → gana GW | ✅ |
| 5 | medios VP: empate 2.5 y 2.5 → nadie gana GW | ✅ |
| 6 | suma de dos jornadas cerradas, varias rondas | ✅ |
| 7 | a igualdad de GW, ordena por VP (Beto 5, Ana 4, Caro 3) | ✅ |
| 8 | la jornada abierta NO cuenta (Caro no suma sus 5 VP) | ✅ |
| 9 | hazañas como mención: NO desempatan (orden alfabético: Alfa, Zeta) | ✅ |
| 10 | hazañas como desempate: Zeta pasa arriba por su hazaña | ✅ |
| 11 | las hazañas nunca suman VP ni GW | ✅ |
| 12 | próxima jornada: la más cercana sin contar cerradas ni canceladas | ✅ |
| 13 | conteo «Jornada X de Y» ignora canceladas | ✅ |
| 14 | la página abrió sin errores | ✅ |

### 2. Portada y página pública de la liga

| # | Caso | Resultado |
|---|---|---|
| 1 | se ve la franja de «sitio de pruebas» | ✅ |
| 2 | se ven las ligas activas (Liga A y Liga D) | ✅ |
| 3 | la liga archivada NO sale en la portada | ✅ |
| 4 | la tarjeta dice la próxima jornada (sáb 10 oct) | ✅ |
| 5 | la tarjeta muestra «Jornada 2 de 3» (una jugada) | ✅ |
| 6 | la tarjeta muestra el líder: Lasombra · 1 GW · 3 VP | ✅ |
| 7 | hay botón «Entrar con Google» | ✅ |
| 8 | el pie trae el aviso legal (Paradox · Dark Pack) | ✅ |
| 9 | «Ver archivados» muestra Liga B | ✅ |
| 10 | al tocar la tarjeta abre la liga en la pestaña Tabla | ✅ |
| 11 | la tabla: 1° Lasombra con 1 GW y 3 VP | ✅ |
| 12 | la jornada abierta no cuenta (Iván con 5 VP no aparece arriba) | ✅ |
| 13 | la columna de hazañas muestra 1 para Toni | ✅ |
| 14 | no hay pastilla de rol (no entraste) | ✅ |
| 15 | calendario: jornada 1 «En curso», jornada 2 «Jugada · 5 jugadores» | ✅ |
| 16 | calendario: la jornada 3 avisa la fecha anterior (antes sáb 31 oct) | ✅ |
| 17 | hazañas: «Sangrado más cuantioso — Toni» en J2 | ✅ |
| 18 | sin notas del organizador no hay pestaña Reglas | ✅ |
| 19 | ya no hay textos que expliquen los puntos | ✅ |
| 20 | sin desborde horizontal a 390 px | ✅ |
| 21 | una liga que no existe muestra aviso y botón para volver | ✅ |
| 22 | liga «sin hazañas»: no hay pestaña Hazañas ni columna 🏅 | ✅ |
| 23 | sin eventos: mensaje «Todavía no hay ligas ni torneos» | ✅ |
| 24 | las páginas abrieron sin errores | ✅ |

### 3. Sesión, roles y Mis eventos

| # | Caso | Resultado |
|---|---|---|
| 1 | al entrar, el encabezado muestra «Ana» y «Organizador» | ✅ |
| 2 | Mis eventos de Ana: Liga A (suya) y botón «+ Nueva liga» | ✅ |
| 3 | Ana no ve Liga B ni Liga D (no son suyas) | ✅ |
| 4 | a un organizador no se le pide su identificador | ✅ |
| 5 | en su liga, Ana ve la pastilla «Organizas tú» | ✅ |
| 6 | «Salir» regresa el botón «Entrar con Google» | ✅ |
| 7 | Beto (ayudante de Liga A) la ve en Mis eventos con la etiqueta AYUDANTE | ✅ |
| 8 | Beto no tiene botón «+ Nueva liga» | ✅ |
| 9 | en Liga A, Beto ve la pastilla «Ayudante» | ✅ |
| 10 | cuenta nueva: «Todavía no organizas ni ayudas» | ✅ |
| 11 | cuenta nueva: se muestra su identificador para pedir permiso | ✅ |
| 12 | el identificador NO es el correo (no hay @) | ✅ |
| 13 | sin desborde horizontal a 390 px | ✅ |
| 14 | Dora (dueña pero SIN permiso de organizadora) no ve «Organizas tú» | ✅ |
| 15 | el superusuario ve «Superusuario» en cualquier liga | ✅ |
| 16 | sin sesión, Mis eventos pide entrar con Google | ✅ |
| 17 | las páginas abrieron sin errores | ✅ |

### 4. Crear liga

| # | Caso | Resultado |
|---|---|---|
| 1 | Ana (organizadora) ve el formulario «Nueva liga» | ✅ |
| 2 | el nombre del organizador viene lleno con «Ana» | ✅ |
| 3 | el enlace se sugiere solo: liga-cdmx-temporada-1 | ✅ |
| 4 | sin nombre → «Escribe el nombre de la liga.» | ✅ |
| 5 | enlace inválido → aviso de minúsculas, números o guiones | ✅ |
| 6 | enlace ya usado (liga-a) → «Ese enlace ya lo usa otra liga» | ✅ |
| 7 | fin antes del inicio → aviso | ✅ |
| 8 | se crea la liga y abre su página | ✅ |
| 9 | se guardó con dueña Ana, tipo liga y fecha de creación | ✅ |
| 10 | se guardaron fechas, ciudad, hazañas=desempate y reglas | ✅ |
| 11 | fue UNA sola escritura y las reglas la aceptaron | ✅ |
| 12 | aparece el aviso «¡Liga creada!» | ✅ |
| 13 | la nueva liga aparece en la portada | ✅ |
| 14 | sin desborde horizontal a 390 px | ✅ |
| 15 | cuenta sin permiso: no hay formulario, dice que falta permiso de organizador | ✅ |
| 16 | REGLAS: si una cuenta sin permiso intenta crear a mano, la base la bloquea | ✅ |
| 17 | REGLAS: otra organizadora (Carla) no puede cambiar la liga de Ana | ✅ |
| 18 | REGLAS: nadie puede crear encima de una liga existente | ✅ |
| 19 | REGLAS: nadie se puede hacer superusuario desde la página | ✅ |
| 20 | REGLAS: nadie puede leer la lista de superusuarios | ✅ |
| 21 | si la base rechaza (le quitaron el permiso), se ve un aviso claro y no se crea | ✅ |
| 22 | las páginas abrieron sin errores | ✅ |

### 5. Calendario de jornadas (organizador)

| # | Caso | Resultado |
|---|---|---|
| 1 | Ana ve las pestañas extra «Jugadores» y «Ajustes» | ✅ |
| 2 | hay botón «+ Agregar jornada» | ✅ |
| 3 | el formulario propone «Jornada 4» | ✅ |
| 4 | se guardó la jornada 4 (sáb 21 nov, 17:00, pendiente) | ✅ |
| 5 | aparece en el calendario: «Jornada 4 · sáb 21 nov · 17:00» | ✅ |
| 6 | cambiar fecha guarda la nueva y recuerda la anterior | ✅ |
| 7 | el calendario marca «antes sáb 7 nov» | ✅ |
| 8 | sale el aviso para avisar al grupo, con el mensaje ya escrito | ✅ |
| 9 | el botón abre WhatsApp con el mensaje | ✅ |
| 10 | el primer toque en «Cancelar» solo pide confirmar | ✅ |
| 11 | el segundo toque cancela la jornada | ✅ |
| 12 | «Reactivar» la regresa a pendiente | ✅ |
| 13 | las reglas aceptaron todo | ✅ |
| 14 | sin desborde horizontal a 390 px | ✅ |
| 15 | Beto (ayudante) ve «Jugadores» pero no «Ajustes» | ✅ |
| 16 | Beto no ve «Cambiar fecha», «Cancelar» ni «+ Agregar jornada» | ✅ |
| 17 | Beto sí ve «Abrir día ›» en las jornadas | ✅ |
| 18 | REGLAS: si Beto intenta cambiar una fecha a mano, la base lo bloquea | ✅ |
| 19 | público: la jornada 2 (jugada) se puede abrir | ✅ |
| 20 | público: la jornada 3 (pendiente) no es enlace | ✅ |
| 21 | las páginas abrieron sin errores | ✅ |

### 6. Jugadores de la liga

| # | Caso | Resultado |
|---|---|---|
| 1 | Beto (ayudante) entra a la pestaña Jugadores | ✅ |
| 2 | agrega «Carlos» | ✅ |
| 3 | la casilla queda vacía para el siguiente | ✅ |
| 4 | nick repetido (aunque cambien mayúsculas) → aviso y no se agrega | ✅ |
| 5 | cambiar nick: Carlos → Carlitos | ✅ |
| 6 | no deja quitar a quien ya jugó (Lasombra) | ✅ |
| 7 | sí deja quitar a quien no ha jugado (Carlitos) | ✅ |
| 8 | ofrece copiar jugadores de «Liga de Beto» | ✅ |
| 9 | copia solo los que faltan (Nocturna y Mireia; «toni» ya estaba) | ✅ |
| 10 | aviso «Se copiaron 2 jugadores» | ✅ |
| 11 | las reglas aceptaron todo | ✅ |
| 12 | sin desborde horizontal a 390 px | ✅ |
| 13 | REGLAS: Beto no puede anotar jugadores en la Liga B (no es su equipo) | ✅ |
| 14 | el público no ve la pestaña Jugadores (le muestra la Tabla) | ✅ |
| 15 | las páginas abrieron sin errores | ✅ |

### 7. Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar

| # | Caso | Resultado |
|---|---|---|
| 1 | jornada pendiente: dice que no ha empezado y ofrece «Empezar jornada» | ✅ |
| 2 | Beto (ayudante) la empieza: queda «En curso» | ✅ |
| 3 | pase de lista: 9 presentes | ✅ |
| 4 | «+ jugador nuevo» lo agrega a la liga y lo deja presente (10) | ✅ |
| 5 | dice «10 presentes → 2 mesas de 5» | ✅ |
| 6 | sorteo: 2 mesas de 5 con asientos 1 a 5 | ✅ |
| 7 | nadie quedó en dos mesas | ✅ |
| 8 | mover a «una mesa nueva»: queda solo en la mesa 3 y la mesa 1 se reacomoda (asientos 1–4) | ✅ |
| 9 | regresarlo a la mesa 1: vuelve como asiento 5 y la mesa 3 desaparece | ✅ |
| 10 | VP guardados en las dos mesas | ✅ |
| 11 | la mesa 1 marca GW al de 3 VP | ✅ |
| 12 | la mesa 2 dice «Sin GW» por empate | ✅ |
| 13 | con VP capturados ya no se puede volver a sortear la ronda | ✅ |
| 14 | si la suma de VP pasa de 5, avisa | ✅ |
| 15 | aparece «+ Sortear ronda 2» | ✅ |
| 16 | ronda 2 sorteada | ✅ |
| 17 | cerrar está bloqueado mientras falten VP (lo dice) | ✅ |
| 18 | «Borrar ronda» quita la ronda 2 (sin VP) | ✅ |
| 19 | hazaña otorgada a Toni | ✅ |
| 20 | todo capturado: «Cerrar jornada» habilitado | ✅ |
| 21 | Beto la cierra: queda «Jugada» | ✅ |
| 22 | cerrada: ya no hay selectores de VP para Beto | ✅ |
| 23 | Beto (ayudante) NO ve «Reabrir jornada» | ✅ |
| 24 | las reglas aceptaron todo lo de Beto | ✅ |
| 25 | REGLAS: con la jornada cerrada, Beto ya no puede cambiar VP a mano | ✅ |
| 26 | REGLAS: Beto no puede reabrirla a mano | ✅ |
| 27 | sin desborde horizontal a 390 px | ✅ |
| 28 | la tabla pública ya cuenta la jornada (el líder tiene 1 GW y 3 VP) | ✅ |
| 29 | el público ve las mesas de la jornada con VP y GW, sin controles | ✅ |
| 30 | el público ve la hazaña del día | ✅ |
| 31 | Ana (organizadora) reabre la jornada | ✅ |
| 32 | 7 presentes: avisa «1 mesa de 5 · 2 sin mesa» (como el sorteo de Elysium) | ✅ |
| 33 | los que sobran salen en «Sin mesa (2)» para acomodarlos | ✅ |
| 34 | se acomodan a mano en una mesa de 4 y otra de 3 | ✅ |
| 35 | asientos sin huecos en las dos mesas | ✅ |
| 36 | las reglas aceptaron todo | ✅ |
| 37 | las páginas abrieron sin errores | ✅ |

### 8. Ajustes, hazañas, archivar y borrar

| # | Caso | Resultado |
|---|---|---|
| 1 | Ana ve el formulario con los datos actuales | ✅ |
| 2 | se guardan nombre, fin, hazañas y reglas | ✅ |
| 3 | fin antes del inicio → aviso y no se guarda | ✅ |
| 4 | no deja borrar las fechas de la temporada | ✅ |
| 5 | agrega la hazaña «Mazo más original» | ✅ |
| 6 | no deja quitar una hazaña ya otorgada | ✅ |
| 7 | sí quita una que no se ha otorgado | ✅ |
| 8 | archivar: la liga queda archivada | ✅ |
| 9 | Ana no ve «Borrar definitivamente» (solo superusuario) | ✅ |
| 10 | desarchivar la regresa | ✅ |
| 11 | las reglas aceptaron todo | ✅ |
| 12 | sin desborde horizontal a 390 px | ✅ |
| 13 | Beto (ayudante) no puede entrar a Ajustes (le muestra la Tabla) | ✅ |
| 14 | REGLAS: Beto no puede archivar a mano | ✅ |
| 15 | el superusuario ve «Borrar definitivamente» en cualquier liga | ✅ |
| 16 | borra la liga y regresa a la portada | ✅ |
| 17 | también borra sus invitaciones pendientes | ✅ |
| 18 | la Liga A no se tocó | ✅ |
| 19 | las páginas abrieron sin errores | ✅ |

### 9. Equipo: ayudantes por invitación

| # | Caso | Resultado |
|---|---|---|
| 1 | Ana ve la pestaña Equipo con sus ayudantes Beto y Carla | ✅ |
| 2 | explica qué puede y qué no puede un ayudante | ✅ |
| 3 | crea una invitación con código largo y caducidad de 7 días | ✅ |
| 4 | muestra el enlace con su código | ✅ |
| 5 | «Enviar por WhatsApp» lleva el mensaje con el enlace | ✅ |
| 6 | aparece en «Invitaciones sin usar» (caduca en 7 días) | ✅ |
| 7 | «Cancelar» borra la invitación | ✅ |
| 8 | las reglas aceptaron todo lo de Ana | ✅ |
| 9 | sin sesión: dice quién invita a qué liga y pide entrar con Google | ✅ |
| 10 | aclara que no se guarda el correo | ✅ |
| 11 | al entrar ofrece «Aceptar y ser ayudante» | ✅ |
| 12 | queda como ayudante con su primer nombre (Pepe) | ✅ |
| 13 | la invitación se borró (un solo uso) | ✅ |
| 14 | dice «¡Listo! Ya eres ayudante» | ✅ |
| 15 | en «Mis eventos» le aparece Liga A como AYUDANTE | ✅ |
| 16 | las reglas aceptaron la aceptación | ✅ |
| 17 | el mismo enlace ya no sirve para otra persona | ✅ |
| 18 | una invitación de la Liga A no sirve en la Liga B | ✅ |
| 19 | una invitación caducada no sirve | ✅ |
| 20 | desde WhatsApp: pide abrirlo en Chrome o Safari y ofrece copiar el enlace | ✅ |
| 21 | Ana quita a Pepe del equipo | ✅ |
| 22 | Beto no ve las pestañas Equipo ni Ajustes | ✅ |
| 23 | Beto puede dejar de ser ayudante por su cuenta | ✅ |
| 24 | REGLAS: alguien que no es el dueño no puede crear invitaciones | ✅ |
| 25 | REGLAS: nadie se puede volver ayudante sin invitación | ✅ |
| 26 | las páginas abrieron sin errores | ✅ |

### 10. Compartir por WhatsApp y descargar Excel

| # | Caso | Resultado |
|---|---|---|
| 1 | el visitante (sin cuenta) ve «Compartir por WhatsApp» y «Descargar Excel» | ✅ |
| 2 | el mensaje dice la liga y «tabla tras la jornada 2» | ✅ |
| 3 | el primero es «1. Lasombra · 1 GW · 3 VP» | ✅ |
| 4 | trae como máximo 5 jugadores | ✅ |
| 5 | termina con el enlace a la liga | ✅ |
| 6 | descarga «liga-a.xlsx» | ✅ |
| 7 | tiene 3 hojas: Tabla, Jornadas, Hazañas | ✅ |
| 8 | Tabla: encabezados y primer lugar Lasombra (1 GW, 3 VP) | ✅ |
| 9 | Jornadas: una fila por jugador de cada mesa jugada (5) y la abierta no sale | ✅ |
| 10 | Jornadas: el de 3 VP tiene GW = 1 | ✅ |
| 11 | Hazañas: «Sangrado más cuantioso» de Toni en la jornada 2 | ✅ |
| 12 | liga sin hazañas: el Excel no lleva hoja de hazañas | ✅ |
| 13 | sin internet para el Excel: aviso claro | ✅ |
| 14 | las páginas abrieron sin errores | ✅ |

### 11. Torneos de un día

| # | Caso | Resultado |
|---|---|---|
| 1 | TP mesa de 5 con empates promediados: 60 · 42 · 42 · 18 · 18 | ✅ |
| 2 | TP mesa de 4: 60 · 36 · 36 · 12 (sin el 36 del tercer lugar) | ✅ |
| 3 | empate en GW y VP: desempata el TP (B quedó 1º en su mesa y va arriba de A) | ✅ |
| 4 | «Mis eventos» tiene «+ Nueva liga» y «+ Nuevo torneo» | ✅ |
| 5 | el formulario de torneo pide fecha, hora, rondas y final | ✅ |
| 6 | solo se puede elegir 2 o 3 rondas | ✅ |
| 7 | sin fecha → «Elige la fecha del torneo.» | ✅ |
| 8 | se crea como torneo: fecha, hora, 2 rondas, con final y su día j1 pendiente | ✅ |
| 9 | abre la página del torneo con pestañas Clasificación y Mesas | ✅ |
| 10 | muestra «2 rondas + final» | ✅ |
| 11 | la tarjeta del torneo trae la etiqueta TORNEO y «2 rondas + final» | ✅ |
| 12 | filtro «Torneos»: solo el torneo | ✅ |
| 13 | filtro «Ligas»: sin el torneo | ✅ |
| 14 | buscar «monterrey» (sin importar mayúsculas) deja solo el torneo de esa ciudad | ✅ |
| 15 | escribir en la búsqueda no pierde lo escrito | ✅ |
| 16 | sin coincidencias: «Ningún evento coincide» | ✅ |
| 17 | fecha 5 dic: el torneo de ese día y las ligas que se juegan esas fechas (A, B, D) | ✅ |
| 18 | fecha sin eventos: «Ningún evento coincide» | ✅ |
| 19 | sin desborde horizontal a 390 px | ✅ |
| 20 | Beto empieza el torneo | ✅ |
| 21 | pase de lista: 10 presentes | ✅ |
| 22 | con 2 rondas planeadas no ofrece una tercera | ✅ |
| 23 | aparece «Pasar a la final (top 5)» | ✅ |
| 24 | la final tiene a los 5 primeros de la clasificación, con su lugar | ✅ |
| 25 | las rondas quedan cerradas a cambios (sin selectores de VP de rondas) | ✅ |
| 26 | la final NO tiene selección de asientos ni orden de elección | ✅ |
| 27 | la final lista a los 5 por su lugar (1º a 5º) | ✅ |
| 28 | aparecen de una vez los 5 selectores de VP de la final | ✅ |
| 29 | Beto termina el torneo | ✅ |
| 30 | las reglas aceptaron todo lo de Beto | ✅ |
| 31 | Clasificación pública: «🏆 CAMPEÓN» con quien tuvo más VP en la final (2 VP) | ✅ |
| 32 | la tabla trae la columna «Final» y 10 jugadores | ✅ |
| 33 | no muestra TP ni explicaciones de puntos | ✅ |
| 34 | el público ve la final y las 2 rondas sin controles | ✅ |
| 35 | Excel del torneo: hojas Clasificación, Mesas y Hazañas | ✅ |
| 36 | Excel: 20 filas de rondas + 5 de la final | ✅ |
| 37 | WhatsApp: «campeón: Eva» | ✅ |
| 38 | sin final: tras la ronda 1 no se puede terminar todavía | ✅ |
| 39 | sin final: tras la última ronda aparece «Terminar torneo» (sin «Pasar a la final») | ✅ |
| 40 | cambiar la fecha del torneo también cambia la de su día | ✅ |
| 41 | sin desborde horizontal a 390 px | ✅ |
| 42 | REGLAS: el ayudante no cambia las rondas | ✅ |
| 43 | REGLAS: nadie pone 4 rondas | ✅ |
| 44 | las páginas abrieron sin errores | ✅ |

### 12. Enlaces del sitio de pruebas y detalles de diseño

| # | Caso | Resultado |
|---|---|---|
| 1 | en pruebas, «las mesas» lleva a uat.eternalschedule.com | ✅ |
| 2 | y dice «uat.eternalschedule.com» | ✅ |
| 3 | no queda ningún enlace a producción en la página | ✅ |
| 4 | la página abrió sin errores | ✅ |
| 5 | fechas y horas usan el esquema oscuro (ícono de calendario/reloj claro y visible) | ✅ |
