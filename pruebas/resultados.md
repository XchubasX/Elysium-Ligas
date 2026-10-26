# Resultados de las pruebas

**❌ 12 FALLA(S)** — 327 de 339 casos pasaron.

- Fecha: 26/10/2026 10:55 (hora de Ciudad de México)
- Versión probada: `54058a8` + cambios aún sin guardar
- Duración: 72 s
- Grupos corridos: todos
- Cómo se prueba: navegador automatizado con Firebase simulado (no toca datos reales). **Sin reglas** (no se encontró la carpeta de reglas). No sustituye la revisión en el sitio de pruebas: estilos y servicios de Google reales solo se ven ahí.

## Qué falló

| Grupo | Caso | Detalle |
|---|---|---|
| Portada y página pública de la liga | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Calendario de jornadas (organizador) | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Jugadores de la liga | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Ajustes, hazañas, archivar y borrar | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Equipo: ayudantes por invitación | Ana ve la pestaña Equipo con sus ayudantes Beto y Carla | ← Ligas y torneos Liga A Organizas tú  Sin país  100% CASUAL · NO SANCIONADOS POR VEKN TablaCalendarioHazañasJugadoresEquipoAjustes OrganizadorORGANIZADOR Beto AYUDANTEQuitar + Invitar ayudante  Un ayudante puede: anotar jugadores, pasar lista, sortear mesas, capturar VP y hazañas, empezar y cerrar jornadas.  No puede: cambiar fechas, reglas ni ajustes, reabrir jornadas cerradas, ni invitar a otro |
| Equipo: ayudantes por invitación | el mismo enlace ya no sirve para otra persona |  |
| Equipo: ayudantes por invitación | el grupo terminó sin caerse | KeyError: 'invitaciones' |
| Compartir por WhatsApp y descargar Excel | el grupo terminó sin caerse | KeyError: 'jornadas' |
| Torneos de un día | fecha 5 dic: el torneo de ese día y las ligas que se juegan esas fechas (A, B, D) | sáb 5 dic · 15:30TORNEO Torneo de Invierno Monterrey, México · sáb 5 dic · 15:30 · 2 rondas + final |
| Fechas de la liga: validaciones | el grupo terminó sin caerse | KeyError: 'jornadas' |
| País y ciudad obligatorios | el grupo terminó sin caerse | KeyError: 'liga-b' |

## Resumen por grupo

| # | Grupo | Casos | Resultado |
|---|---|---|---|
| 1 | Cálculos: GW, VP y orden de la tabla | 14 | ✅ |
| 2 | Portada y página pública de la liga | 1 | ❌ 1 falla(s) |
| 3 | Sesión, roles y Mis eventos | 16 | ✅ |
| 4 | Crear liga | 16 | ✅ |
| 5 | Calendario de jornadas (organizador) | 1 | ❌ 1 falla(s) |
| 6 | Jugadores de la liga | 1 | ❌ 1 falla(s) |
| 7 | Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar | 1 | ❌ 1 falla(s) |
| 8 | Ajustes, hazañas, archivar y borrar | 1 | ❌ 1 falla(s) |
| 9 | Equipo: ayudantes por invitación | 18 | ❌ 3 falla(s) |
| 10 | Compartir por WhatsApp y descargar Excel | 1 | ❌ 1 falla(s) |
| 11 | Torneos de un día | 41 | ❌ 1 falla(s) |
| 12 | Enlaces del sitio de pruebas y detalles de diseño | 10 | ✅ |
| 13 | Fechas de la liga: validaciones | 1 | ❌ 1 falla(s) |
| 14 | Solicitudes para organizar, guía y aviso «100% casual» | 22 | ✅ |
| 15 | País y ciudad obligatorios | 1 | ❌ 1 falla(s) |
| 16 | Fecha y hora en iPhone: pista visible en campos vacíos | 16 | ✅ |
| 17 | Avisos al celular de solicitudes para organizar | 33 | ✅ |
| 18 | Eventos En línea: modalidad, plataforma y hora de cada quien | 35 | ✅ |
| 19 | Inscripciones con Google y pegar lista de jugadores | 39 | ✅ |
| 20 | Ligas de partidas libres (en línea) | 71 | ✅ |

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
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 3. Sesión, roles y Mis eventos

| # | Caso | Resultado |
|---|---|---|
| 1 | al entrar, el encabezado muestra «Ana» y «Organizador» | ✅ |
| 2 | Mis eventos de Ana: Liga A (suya) y botón «+ Nueva liga» | ✅ |
| 3 | Ana no ve Liga B ni Liga D (no son suyas) | ✅ |
| 4 | a un organizador no se le ofrece «Quiero organizar» | ✅ |
| 5 | en su liga, Ana ve la pastilla «Organizas tú» | ✅ |
| 6 | «Salir» regresa el botón «Entrar con Google» | ✅ |
| 7 | Beto (ayudante de Liga A) la ve en Mis eventos con la etiqueta AYUDANTE | ✅ |
| 8 | Beto no tiene botón «+ Nueva liga» | ✅ |
| 9 | en Liga A, Beto ve la pastilla «Ayudante» | ✅ |
| 10 | cuenta nueva: «Todavía no organizas ni ayudas» | ✅ |
| 11 | cuenta nueva: se le ofrece el formulario «¿Quieres organizar…?» | ✅ |
| 12 | sin desborde horizontal a 390 px | ✅ |
| 13 | Dora (dueña pero SIN permiso de organizadora) no ve «Organizas tú» | ✅ |
| 14 | el superusuario ve «Superusuario» en cualquier liga | ✅ |
| 15 | sin sesión, Mis eventos pide entrar con Google | ✅ |
| 16 | las páginas abrieron sin errores | ✅ |

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
| 16 | las páginas abrieron sin errores | ✅ |

### 5. Calendario de jornadas (organizador)

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 6. Jugadores de la liga

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 7. Día de jornada: pase de lista, mesas, VP, GW, hazañas y cerrar

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 8. Ajustes, hazañas, archivar y borrar

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 9. Equipo: ayudantes por invitación

| # | Caso | Resultado |
|---|---|---|
| 1 | Ana ve la pestaña Equipo con sus ayudantes Beto y Carla | ❌ ← Ligas y torneos Liga A Organizas tú  Sin país  100% CASUAL · NO SANCIONADOS POR VEKN TablaCalendarioHazañasJugadoresEquipoAjustes OrganizadorORGANIZADOR Beto AYUDANTEQuitar + Invitar ayudante  Un ayudante puede: anotar jugadores, pasar lista, sortear mesas, capturar VP y hazañas, empezar y cerrar jornadas.  No puede: cambiar fechas, reglas ni ajustes, reabrir jornadas cerradas, ni invitar a otro |
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
| 17 | el mismo enlace ya no sirve para otra persona | ❌  |
| 18 | el grupo terminó sin caerse | ❌ KeyError: 'invitaciones' |

### 10. Compartir por WhatsApp y descargar Excel

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

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
| 14 | filtro de ciudad «Monterrey» deja solo el torneo de esa ciudad | ✅ |
| 15 | sin coincidencias: «Ningún evento coincide» | ✅ |
| 16 | fecha 5 dic: el torneo de ese día y las ligas que se juegan esas fechas (A, B, D) | ❌ sáb 5 dic · 15:30TORNEO Torneo de Invierno Monterrey, México · sáb 5 dic · 15:30 · 2 rondas + final |
| 17 | fecha sin eventos: «Ningún evento coincide» | ✅ |
| 18 | sin desborde horizontal a 390 px | ✅ |
| 19 | Beto empieza el torneo | ✅ |
| 20 | pase de lista: 10 presentes | ✅ |
| 21 | con 2 rondas planeadas no ofrece una tercera | ✅ |
| 22 | aparece «Pasar a la final (top 5)» | ✅ |
| 23 | la final tiene a los 5 primeros de la clasificación, con su lugar | ✅ |
| 24 | las rondas quedan cerradas a cambios (sin selectores de VP de rondas) | ✅ |
| 25 | la final NO tiene selección de asientos ni orden de elección | ✅ |
| 26 | la final lista a los 5 por su lugar (1º a 5º) | ✅ |
| 27 | aparecen de una vez los 5 selectores de VP de la final | ✅ |
| 28 | Beto termina el torneo | ✅ |
| 29 | las reglas aceptaron todo lo de Beto | ✅ |
| 30 | Clasificación pública: «🏆 CAMPEÓN» con quien tuvo más VP en la final (2 VP) | ✅ |
| 31 | la tabla trae la columna «Final» y 10 jugadores | ✅ |
| 32 | no muestra TP ni explicaciones de puntos | ✅ |
| 33 | el público ve la final y las 2 rondas sin controles | ✅ |
| 34 | Excel del torneo: hojas Clasificación, Mesas y Hazañas | ✅ |
| 35 | Excel: 20 filas de rondas + 5 de la final | ✅ |
| 36 | WhatsApp: «campeón: Pau» | ✅ |
| 37 | sin final: tras la ronda 1 no se puede terminar todavía | ✅ |
| 38 | sin final: tras la última ronda aparece «Terminar torneo» (sin «Pasar a la final») | ✅ |
| 39 | cambiar la fecha del torneo también cambia la de su día | ✅ |
| 40 | sin desborde horizontal a 390 px | ✅ |
| 41 | las páginas abrieron sin errores | ✅ |

### 12. Enlaces del sitio de pruebas y detalles de diseño

| # | Caso | Resultado |
|---|---|---|
| 1 | en pruebas, «las mesas» lleva a uat.eternalschedule.com | ✅ |
| 2 | y dice «uat.eternalschedule.com» | ✅ |
| 3 | no queda ningún enlace a producción en la página | ✅ |
| 4 | la página abrió sin errores | ✅ |
| 5 | fechas y horas usan el esquema oscuro (ícono de calendario/reloj claro y visible) | ✅ |
| 6 | ligas.eternalschedule.com → base «elysium-ligas», mesas en eternalschedule.com sin franja de pruebas | ✅ |
| 7 | elysium-ligas.chubas.workers.dev → base «elysium-ligas», mesas en eternalschedule.com sin franja de pruebas | ✅ |
| 8 | uat-ligas.eternalschedule.com → base «elysium-ligas-uat», mesas en uat.eternalschedule.com y franja de pruebas | ✅ |
| 9 | elysium-ligas-uat.chubas.workers.dev → base «elysium-ligas-uat», mesas en uat.eternalschedule.com y franja de pruebas | ✅ |
| 10 | localhost → base «elysium-ligas-uat», mesas en uat.eternalschedule.com y franja de pruebas | ✅ |

### 13. Fechas de la liga: validaciones

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'jornadas' |

### 14. Solicitudes para organizar, guía y aviso «100% casual»

| # | Caso | Resultado |
|---|---|---|
| 1 | portada: etiqueta «100% CASUAL · NO SANCIONADOS POR VEKN» | ✅ |
| 2 | portada: enlace «¿Quieres organizar? Cómo funciona» | ✅ |
| 3 | pie: dice que son 100% casuales y no sancionados por VEKN | ✅ |
| 4 | página de la liga: también trae la etiqueta | ✅ |
| 5 | guía «Cómo funciona»: 5 pasos y preguntas frecuentes | ✅ |
| 6 | la guía invita a «Quiero organizar» a quien no organiza | ✅ |
| 7 | sin desborde horizontal a 390 px | ✅ |
| 8 | el formulario trae su primer nombre | ✅ |
| 9 | se guarda su solicitud (nombre, ciudad, mensaje y fecha), sin correo | ✅ |
| 10 | cambia a «✓ Solicitud enviada» | ✅ |
| 11 | en vivo: al aprobarlo, sin recargar le salen «+ Nueva liga» y «+ Nuevo torneo» | ✅ |
| 12 | en vivo: le avisa «¡Ya te aprobaron!» | ✅ |
| 13 | en vivo: si la rechazan, vuelve a salir el formulario (sin botones de crear) | ✅ |
| 14 | al volver, sigue diciendo «Solicitud enviada» | ✅ |
| 15 | el superusuario ve un contador «1» junto a «Mis eventos» | ✅ |
| 16 | «Solicitudes para organizar»: Pepe · Guadalajara con su mensaje | ✅ |
| 17 | Aprobar: queda como organizador y se borra la solicitud | ✅ |
| 18 | ya no hay solicitudes pendientes (desaparece el bloque y el contador) | ✅ |
| 19 | las reglas aceptaron todo | ✅ |
| 20 | Pepe ya ve «+ Nueva liga» y «+ Nuevo torneo», sin formulario | ✅ |
| 21 | Rechazar: borra la solicitud y NO da permiso | ✅ |
| 22 | las páginas abrieron sin errores | ✅ |

### 15. País y ciudad obligatorios

| # | Caso | Resultado |
|---|---|---|
| 1 | el grupo terminó sin caerse | ❌ KeyError: 'liga-b' |

### 16. Fecha y hora en iPhone: pista visible en campos vacíos

| # | Caso | Resultado |
|---|---|---|
| 1 | iPhone: «Fecha» vacía muestra «Elegir fecha» y el ícono de calendario | ✅ |
| 2 | iPhone: «Hora» vacía muestra «Elegir hora» y el ícono de reloj | ✅ |
| 3 | al elegir la fecha, la pista se oculta y queda solo el ícono | ✅ |
| 4 | la hora sigue con su pista mientras esté vacía | ✅ |
| 5 | la pista no estorba al tocar: el toque llega al campo | ✅ |
| 6 | la pista no se lee dos veces con lector de pantalla | ✅ |
| 7 | el formulario sigue enviando el valor elegido | ✅ |
| 8 | sin desborde horizontal a 390 px | ✅ |
| 9 | al redibujar no se duplica la pista | ✅ |
| 10 | agregar jornada en iPhone: «Fecha» y «Hora» caben dentro de la tarjeta | ✅ |
| 11 | agregar jornada en iPhone: los dos campos miden lo mismo | ✅ |
| 12 | agregar jornada en iPhone: con la pista «Elegir fecha» y «Elegir hora» | ✅ |
| 13 | portada en iPhone: el filtro de fecha también muestra «Elegir fecha» | ✅ |
| 14 | Chrome en iPhone: también muestra «Elegir fecha» y «Elegir hora» | ✅ |
| 15 | computadora: sin pista (el navegador ya muestra su ícono y dd/mm/aaaa) | ✅ |
| 16 | sin errores de JavaScript | ✅ |

### 17. Avisos al celular de solicitudes para organizar

| # | Caso | Resultado |
|---|---|---|
| 1 | servidor: detecta las solicitudes nuevas | ✅ |
| 2 | servidor: una solicitud ya avisada no se vuelve a avisar | ✅ |
| 3 | servidor: al aprobarla o rechazarla se olvida | ✅ |
| 4 | servidor: si la rechazan y la vuelve a mandar, avisa otra vez | ✅ |
| 5 | texto: «Nueva solicitud de organizador · nombre · ciudad · mensaje» | ✅ |
| 6 | texto: varias juntas en un solo aviso («A, B, C y 2 más») | ✅ |
| 7 | texto: dos solicitudes («A y B») | ✅ |
| 8 | solo a administradores vigentes y aparatos activados | ✅ |
| 9 | vuelta completa: un aviso por aparato con todas las nuevas | ✅ |
| 10 | vuelta completa: el aviso abre «Mis eventos» del mismo sitio | ✅ |
| 11 | vuelta completa: guarda lo avisado antes de mandar (no repite si falla) | ✅ |
| 12 | vuelta completa: borra aparatos que ya no reciben avisos | ✅ |
| 13 | sin aparatos activados no marca nada (te llegan al activarlos) | ✅ |
| 14 | la siguiente vuelta (5 min después) no repite | ✅ |
| 15 | worker: «Entrar con Google» desde el ícono se reenvía a Firebase | ✅ |
| 16 | quien no es administrador no ve la tarjeta de avisos | ✅ |
| 17 | una organizadora tampoco la ve | ✅ |
| 18 | administrador: sin la clave de avisos dice «todavía no están configurados» | ✅ |
| 19 | administrador: ve «Activar avisos en este aparato» | ✅ |
| 20 | al activar se guarda el código del aparato (sin correo) | ✅ |
| 21 | la tarjeta cambia a «ACTIVADOS AQUÍ» con «Mandarme un aviso de prueba» | ✅ |
| 22 | al volver a entrar, recuerda que este aparato ya tiene avisos | ✅ |
| 23 | «Mandarme un aviso de prueba» llama a /api/aviso-prueba con la sesión | ✅ |
| 24 | al desactivar se borra el aparato y vuelve «DESACTIVADOS AQUÍ» | ✅ |
| 25 | si no da permiso, explica cómo darlo | ✅ |
| 26 | sin desborde horizontal a 390 px | ✅ |
| 27 | al «Salir» se quitan los avisos de esta cuenta en este aparato | ✅ |
| 28 | iPhone en Safari: avisa que primero hay que agregar Ligas a la pantalla de inicio | ✅ |
| 29 | iPhone en Safari: al tocar «Activar» sale la guía de 4 pasos | ✅ |
| 30 | iPhone en Safari: no se guarda nada todavía | ✅ |
| 31 | la página se puede instalar (manifiesto «Ligas», pantalla completa) | ✅ |
| 32 | el código del servidor no se publica como parte del sitio | ✅ |
| 33 | sin errores de JavaScript | ✅ |

### 18. Eventos En línea: modalidad, plataforma y hora de cada quien

| # | Caso | Resultado |
|---|---|---|
| 1 | crear: hay selector «Presencial / En línea», con Presencial marcado | ✅ |
| 2 | crear: en Presencial se ven país y ciudad | ✅ |
| 3 | crear: al elegir En línea desaparecen país y ciudad | ✅ |
| 4 | crear: en En línea sale «Plataforma (opcional)» y no hay selector de zona | ✅ |
| 5 | crear: dice la zona detectada «Santiago de Chile (detectada de tu aparato)» | ✅ |
| 6 | crear: sin desborde horizontal a 390 px | ✅ |
| 7 | se crea sin país ni ciudad, con modalidad, plataforma y zona | ✅ |
| 8 | su página dice «🌐 En línea · Lackey» | ✅ |
| 9 | torneo en línea sin plataforma: se crea sin ese campo | ✅ |
| 10 | presencial sin ciudad → «Elige el país y escribe la ciudad.» | ✅ |
| 11 | presencial: se guarda igual que antes (país y ciudad, sin modalidad) | ✅ |
| 12 | portada en CDMX (misma zona): «sáb 7 nov · 20:00» sin «(tu hora)» | ✅ |
| 13 | portada: la tarjeta dice «🌐 En línea · Discord» | ✅ |
| 14 | en CDMX no sale la nota de zona horaria | ✅ |
| 15 | portada en Madrid: el torneo sale a «dom 8 nov · 03:00 (tu hora)» | ✅ |
| 16 | portada en Madrid: próxima jornada de la liga «dom 15 nov · 02:30 (tu hora)» | ✅ |
| 17 | portada en Madrid: la liga presencial no cambia | ✅ |
| 18 | página del torneo en Madrid: nota «Los horarios se muestran en tu hora… hora de Ciudad de México» | ✅ |
| 19 | calendario en Madrid: «Jornada 1 · dom 15 nov · 02:30 (tu hora)» | ✅ |
| 20 | portada en Santiago de Chile: «sáb 7 nov · 23:00 (tu hora)» | ✅ |
| 21 | calendario del equipo: hora original «(hora de Ciudad de México)» aunque estés en Madrid | ✅ |
| 22 | al agregar jornada, el campo dice «Hora (opcional) · hora de Ciudad de México» | ✅ |
| 23 | filtro de país: incluye «🌐 En línea» | ✅ |
| 24 | filtro «🌐 En línea»: solo los eventos en línea | ✅ |
| 25 | filtro «🌐 En línea»: la ciudad queda desactivada | ✅ |
| 26 | filtro «México»: no incluye los eventos en línea | ✅ |
| 27 | ajustes de una liga en línea: En línea marcado, sin país ni ciudad | ✅ |
| 28 | ajustes: no sale el aviso «Este evento no tiene país» | ✅ |
| 29 | ajustes: se puede poner o cambiar la plataforma | ✅ |
| 30 | ajustes desde Madrid: la liga conserva su zona (Ciudad de México) | ✅ |
| 31 | pasar a Presencial sin ciudad → pide país y ciudad | ✅ |
| 32 | pasar a Presencial: guarda país y ciudad y borra modalidad, zona y plataforma | ✅ |
| 33 | pasar a En línea: borra país y ciudad y guarda la zona del aparato (Madrid) | ✅ |
| 34 | aviso de cambio de fecha: «a las 19:30 (hora de Ciudad de México)» | ✅ |
| 35 | sin errores de JavaScript | ✅ |

### 19. Inscripciones con Google y pegar lista de jugadores

| # | Caso | Resultado |
|---|---|---|
| 1 | Jugadores: tarjeta «📝 Inscripciones» CERRADAS con «Abrir inscripciones» | ✅ |
| 2 | al abrirlas se guarda inscripciones: «abiertas» | ✅ |
| 3 | abiertas: botones «Compartir por WhatsApp» y «Copiar enlace» | ✅ |
| 4 | el mensaje de WhatsApp trae el enlace de la liga | ✅ |
| 5 | Jugadores: hay «Pegar varios nombres» | ✅ |
| 6 | sin desborde horizontal a 390 px | ✅ |
| 7 | portada: la tarjeta dice «📝 Inscripciones abiertas» | ✅ |
| 8 | sin sesión: «📝 Inscripciones abiertas» con botón «Inscribirme» | ✅ |
| 9 | al tocar «Inscribirme» entra con Google y sale el campo de nick | ✅ |
| 10 | el nick viene sugerido con su primer nombre («Pepe») | ✅ |
| 11 | se guarda su inscripción pendiente con nick y nombre de Google, sin correo | ✅ |
| 12 | cambia a «✓ Inscripción enviada como «Toni»» | ✅ |
| 13 | la página pública no muestra el nombre de Google | ✅ |
| 14 | recuerda el nick para la próxima liga | ✅ |
| 15 | en vivo: al aceptarlo dice «✅ Estás inscrito como «Toni»» | ✅ |
| 16 | en vivo: le avisa «¡Ya te aceptaron en la liga!» | ✅ |
| 17 | puede cancelar su inscripción pendiente (dos toques) | ✅ |
| 18 | aceptado pero ya no está en la liga: vuelve a salir el formulario | ✅ |
| 19 | y se reemplaza por una inscripción nueva pendiente | ✅ |
| 20 | inscripciones cerradas: no sale nada para inscribirse | ✅ |
| 21 | el equipo ve «Por aceptar» con nick y nombre de Google («Lalo · Eduardo Ruiz») | ✅ |
| 22 | nick repetido: pregunta «¿Es la misma persona?» para Toni | ✅ |
| 23 | «Aceptar todas»: entran Lalo y Mau como jugadores | ✅ |
| 24 | sus inscripciones quedan «aceptada» con su jugador | ✅ |
| 25 | «Aceptar todas» deja pendiente al del nick repetido | ✅ |
| 26 | «Sí, es el mismo»: se une al Toni que ya estaba (no se duplica) | ✅ |
| 27 | ya no quedan pendientes | ✅ |
| 28 | «No, es otra persona»: propone otro nick («Toni 2») | ✅ |
| 29 | se acepta como jugador nuevo «Toni Pepe» | ✅ |
| 30 | «Rechazar» (dos toques) borra la inscripción | ✅ |
| 31 | «Cerrar inscripciones» (dos toques) borra el campo | ✅ |
| 32 | ayudante: ve las pendientes, sin botón de abrir/cerrar | ✅ |
| 33 | ayudante: puede aceptar | ✅ |
| 34 | pegar lista: quita números y viñetas, salta vacíos y repetidos | ✅ |
| 35 | pegar lista: avisa «Se agregaron 3 jugadores (2 ya estaban)» | ✅ |
| 36 | guía: paso «Inscribe a los jugadores» con el enlace | ✅ |
| 37 | guía: «¿Los jugadores necesitan cuenta?» explica lo de Google | ✅ |
| 38 | guía: nueva pregunta «¿Se puede hacer una liga en línea?» | ✅ |
| 39 | sin errores de JavaScript | ✅ |

### 20. Ligas de partidas libres (en línea)

| # | Caso | Resultado |
|---|---|---|
| 1 | media de la liga = 1 VP por partida | ✅ |
| 2 | Carla: partidas, VP, rendimiento, participación, total y provisional como el documento | ✅ |
| 3 | Ana J: partidas, VP, rendimiento, participación, total y provisional como el documento | ✅ |
| 4 | Beto J: partidas, VP, rendimiento, participación, total y provisional como el documento | ✅ |
| 5 | orden: Carla, Ana J, Beto J, Toni | ✅ |
| 6 | Toni (12 partidas): participación 100 (tope) | ✅ |
| 7 | desempate y orden con varios casos: A, B, C | ✅ |
| 8 | si nadie tiene VP (media 0), no hay división entre cero: rendimiento 100 | ✅ |
| 9 | portada: «Partidas libres · en juego», 23 partidas y líder con puntos | ✅ |
| 10 | portada: dice «🌐 En línea · Lackey» | ✅ |
| 11 | pestañas públicas: Tabla y Partidas (sin Calendario ni Hazañas) | ✅ |
| 12 | cabecera: «🎲 Liga de partidas libres» | ✅ |
| 13 | tabla: «Clasificación provisional» y media de la liga 1 VP | ✅ |
| 14 | tabla: Carla 1.º con 1 partida, 5 VP, 200, 8.3, 142.5 y PROVISIONAL | ✅ |
| 15 | tabla: Beto J sin marca de provisional | ✅ |
| 16 | «¿Cómo se calcula?» explica 70/30, relleno de 3 partidas y 12 partidas | ✅ |
| 17 | botones Compartir por WhatsApp y Excel | ✅ |
| 18 | WhatsApp: «clasificación provisional» y «Carla · 142.5 pts» | ✅ |
| 19 | Excel: hojas Clasificación (4 jugadores) y Partidas (23) | ✅ |
| 20 | sin desborde horizontal a 390 px | ✅ |
| 21 | pestaña Partidas pública: lista sin formulario ni botones de corregir | ✅ |
| 22 | sin sesión: invita a entrar e inscribirse para reportar | ✅ |
| 23 | sin partidas: «Todavía no hay partidas reportadas» | ✅ |
| 24 | jugador inscrito: «Estás inscrito como «Toni»» con botón «🎲 Reportar partida» | ✅ |
| 25 | formulario: el jugador es él mismo (sin poder elegir otro) | ✅ |
| 26 | VP de 0 a 5 en mesa de 5 | ✅ |
| 27 | al elegir mesa de 4, VP solo hasta 4 | ✅ |
| 28 | sin VP no deja seguir: «Elige los VP» | ✅ |
| 29 | confirmación: resumen con jugador, fecha, mesa, VP y rivales | ✅ |
| 30 | confirmación: avisa que después no podrá cambiarla | ✅ |
| 31 | todavía no se guarda nada antes de confirmar | ✅ |
| 32 | «Volver a editar» conserva lo capturado | ✅ |
| 33 | se guarda la partida con jugador, fecha, VP, mesa, rivales, invitados, por y creada | ✅ |
| 34 | aparece en la lista sin botones de corregir para el jugador | ✅ |
| 35 | el formulario queda limpio para otra partida | ✅ |
| 36 | fecha antes del inicio: no deja seguir | ✅ |
| 37 | más rivales que lugares en la mesa: no deja seguir | ✅ |
| 38 | mesa de 4 con 3 rivales de la liga: sí pasa a la confirmación | ✅ |
| 39 | cuenta no inscrita: no ve el formulario de reportar | ✅ |
| 40 | organizador: pestañas Tabla, Partidas, Jugadores, Equipo y Ajustes | ✅ |
| 41 | organizador: elige el jugador de una lista | ✅ |
| 42 | el jugador elegido no sale como su propio rival | ✅ |
| 43 | organizador: la confirmación dice que después puede corregirla | ✅ |
| 44 | se guarda la partida de «Ana J» reportada por el organizador | ✅ |
| 45 | corregir: cambia VP y mesa, conserva quién la reportó y cuándo | ✅ |
| 46 | borrar (dos toques) quita la partida | ✅ |
| 47 | no se puede quitar a un jugador con partidas reportadas | ✅ |
| 48 | Ajustes: «Liga de partidas libres (no se puede cambiar)», sin hazañas | ✅ |
| 49 | Ajustes: «Presencial» deshabilitado (solo en línea) | ✅ |
| 50 | Ajustes: no deja mover el inicio si deja partidas fuera | ✅ |
| 51 | Ajustes: guardar no cambia formato, modalidad ni hazañas | ✅ |
| 52 | Cerrar temporada (dos toques) guarda temporada: «cerrada» | ✅ |
| 53 | tabla: «Clasificación definitiva · temporada cerrada» | ✅ |
| 54 | temporada cerrada: ya no hay formulario de reportar | ✅ |
| 55 | Reabrir temporada borra el campo | ✅ |
| 56 | ayudante: puede elegir cualquier jugador para reportar | ✅ |
| 57 | ayudante: no ve Corregir ni Borrar | ✅ |
| 58 | ayudante: la confirmación avisa que no habrá cambios | ✅ |
| 59 | ayudante: se guarda la partida de «Beto J» | ✅ |
| 60 | Equipo (partidas libres): explica que el ayudante reporta por otros y no corrige | ✅ |
| 61 | Equipo (liga por jornadas): el ayudante sigue igual que antes | ✅ |
| 62 | crear: el formato no se ve si es presencial | ✅ |
| 63 | crear en línea: aparece «🎲 Partidas libres» | ✅ |
| 64 | al elegir partidas libres se ocultan las hazañas | ✅ |
| 65 | se crea con formato «libre», en línea y sin hazañas | ✅ |
| 66 | presencial: aunque se haya marcado «libre», se crea por jornadas | ✅ |
| 67 | torneo en línea: no ofrece partidas libres | ✅ |
| 68 | guía: pregunta «¿Qué es una liga de partidas libres?» | ✅ |
| 69 | guía: el ayudante reporta por otros en partidas libres | ✅ |
| 70 | Mis eventos: «Partidas libres · 23 partidas» | ✅ |
| 71 | sin errores de JavaScript | ✅ |
