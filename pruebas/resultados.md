# Resultados de las pruebas

**✅ TODO BIEN** — 76 de 76 casos pasaron.

- Fecha: 05/10/2026 23:16 (hora de Ciudad de México)
- Versión probada: `1d25921` + cambios aún sin guardar
- Duración: 10 s
- Grupos corridos: todos
- Cómo se prueba: navegador automatizado con Firebase simulado (no toca datos reales). **Las reglas de la base de datos se aplicaron** en cada lectura y escritura (simulador de reglas). No sustituye la revisión en el sitio de pruebas: estilos y servicios de Google reales solo se ven ahí.

## Resumen por grupo

| # | Grupo | Casos | Resultado |
|---|---|---|---|
| 1 | Cálculos: GW, VP y orden de la tabla | 14 | ✅ |
| 2 | Portada y página pública de la liga | 23 | ✅ |
| 3 | Sesión, roles y Mis ligas | 17 | ✅ |
| 4 | Crear liga | 22 | ✅ |

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
| 9 | «Ver ligas archivadas» muestra Liga B | ✅ |
| 10 | al tocar la tarjeta abre la liga en la pestaña Tabla | ✅ |
| 11 | la tabla: 1° Lasombra con 1 GW y 3 VP | ✅ |
| 12 | la jornada abierta no cuenta (Iván con 5 VP no aparece arriba) | ✅ |
| 13 | la columna de hazañas muestra 1 para Toni | ✅ |
| 14 | no hay pastilla de rol (no entraste) | ✅ |
| 15 | calendario: jornada 1 «En curso», jornada 2 «Jugada · 5 jugadores» | ✅ |
| 16 | calendario: la jornada 3 avisa la fecha anterior (antes sáb 31 oct) | ✅ |
| 17 | hazañas: «Sangrado más cuantioso — Toni» en J2 | ✅ |
| 18 | reglas: explica GW con mínimo 2 VP y que las hazañas no suman | ✅ |
| 19 | sin desborde horizontal a 390 px | ✅ |
| 20 | una liga que no existe muestra aviso y botón para volver | ✅ |
| 21 | liga «sin hazañas»: no hay pestaña Hazañas ni columna 🏅 | ✅ |
| 22 | sin ligas: mensaje «Todavía no hay ligas» | ✅ |
| 23 | las páginas abrieron sin errores | ✅ |

### 3. Sesión, roles y Mis ligas

| # | Caso | Resultado |
|---|---|---|
| 1 | al entrar, el encabezado muestra «Ana» y «Organizador» | ✅ |
| 2 | Mis ligas de Ana: Liga A (suya) y botón «+ Nueva liga» | ✅ |
| 3 | Ana no ve Liga B ni Liga D (no son suyas) | ✅ |
| 4 | a un organizador no se le pide su identificador | ✅ |
| 5 | en su liga, Ana ve la pastilla «Organizas tú» | ✅ |
| 6 | «Salir» regresa el botón «Entrar con Google» | ✅ |
| 7 | Beto (ayudante de Liga A) la ve en Mis ligas con la etiqueta AYUDANTE | ✅ |
| 8 | Beto no tiene botón «+ Nueva liga» | ✅ |
| 9 | en Liga A, Beto ve la pastilla «Ayudante» | ✅ |
| 10 | cuenta nueva: «Todavía no organizas ni ayudas» | ✅ |
| 11 | cuenta nueva: se muestra su identificador para pedir permiso | ✅ |
| 12 | el identificador NO es el correo (no hay @) | ✅ |
| 13 | sin desborde horizontal a 390 px | ✅ |
| 14 | Dora (dueña pero SIN permiso de organizadora) no ve «Organizas tú» | ✅ |
| 15 | el superusuario ve «Superusuario» en cualquier liga | ✅ |
| 16 | sin sesión, Mis ligas pide entrar con Google | ✅ |
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
