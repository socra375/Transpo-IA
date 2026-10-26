# Decisiones tomadas por defecto

Lo que el cliente aún no confirmó se decidió así. Lo marcado **(config)** se cambia en `src/config.js` sin tocar código.

## Arquitectura

| # | Decisión | Por qué |
|---|----------|---------|
| A1 | La interfaz de `store.js` es **asíncrona** (devuelve Promises) aunque localStorage sea síncrono. | Supabase es asíncrono. Si hoy fuera síncrona, migrar obligaría a tocar todos los módulos. |
| A2 | Las horas se guardan como **instantes ISO UTC completos** (`2026-10-26T13:30:00.000Z`), no como "HH:MM". | El cruce de medianoche se resuelve una vez, al capturar la hora. Después el retraso es una resta. |
| A3 | La zona horaria del negocio (`America/Santo_Domingo`) se aplica siempre, sin importar la zona del teléfono. **(config)** | Un teléfono mal configurado no debe mover los viajes de día. |
| A4 | Rutas por **hash** (`#/viajes`). | Funciona en GitHub Pages sin configurar el servidor ni una página 404. |
| A5 | Archivos añadidos a la estructura pedida: `src/app.js` (arranque), `src/core/form.js` (formularios desde config), `src/core/crud.js` (lista/buscar/crear/editar/archivar genérico), `src/core/prefs.js` (ajustes del dispositivo), `src/modules/mas.js` (pestaña "Más"), `scripts/` (servidor local y QA). | Evita repetir la misma lógica en cada módulo. |
| A6 | Las **preferencias del dispositivo** (tema, letra, tolerancia) viven en `prefs.js`, fuera del store. | Son de este teléfono. Al migrar a Supabase no hace falta una tabla para ellas. Si la tolerancia debe compartirse entre dispositivos, se mueve a una tabla `ajustes`. |
| A7 | Campos marcados `fijo: true` en config (p. ej. llegada programada) ignoran `activo: false`. | La lógica de retrasos no funciona sin ellos. |
| A8 | Se pide `navigator.storage.persist()` al arrancar. | En iPhone, Safari puede borrar los datos de un sitio que no se abre en 7 días si **no** está instalado en la pantalla de inicio. Instalarlo como PWA y hacer respaldos es la protección real. |

## Interfaz

| # | Decisión |
|---|----------|
| U1 | Barra inferior de 5 pestañas: **Inicio, Viajes, Choferes, Combustible, Más**. "Más" contiene Rutas, Vehículos, Reportes y Ajustes (y extensiones futuras). Son las que se usan a diario en la calle. |
| U2 | Fuentes: **Barlow Semi Condensed** (títulos; condensada, estilo rotulación vial, y cabe en pantallas estrechas) y **Atkinson Hyperlegible** (lectura; diseñada para máxima legibilidad, útil al sol). Letra base 17 px. **(config)** |
| U3 | Color principal azul `#0F4C81` y acento ámbar `#F5A524`. El tema oscuro **deriva** el principal automáticamente (`color-mix`). Cambiar el color es una sola línea. **(config)** |
| U4 | El aviso "Datos de ejemplo" es una franja visible bajo el encabezado en todas las pantallas. Lleva a Ajustes, donde se borran todos de una vez. |
| U5 | Botón rápido de tema claro/oscuro en el encabezado (útil al pasar del sol a la noche). En Ajustes también está la opción "Sistema". |
| U6 | Formularios en **hoja inferior** (`<dialog>` nativo: atrapa el foco y cierra con Esc o gesto atrás). En pantallas táctiles no se enfoca el primer campo al abrir, para que el teclado no tape la hoja. |
| U7 | El esqueleto de carga solo aparece si los datos tardan más de 150 ms. Con localStorage casi nunca se ve; con Supabase sí. |
| U8 | En las listas no hay "eliminar", solo **archivar/restaurar** (como pidió el cliente). Así no se rompen viajes o cargas que apunten al registro. |

| U9 | **Menú lateral en escritorio.** Con mouse y ancho ≥ 768 px (`hover: hover` + `pointer: fine`), la barra inferior pasa a un riel a la izquierda con solo íconos y el logo. Al pasar el mouse (o enfocar con el teclado) se despliega sobre el contenido, sin empujarlo, con el nombre de la empresa y las secciones. En el celular y en tablets táctiles se mantiene la barra inferior, porque ahí no existe el hover y un riel sin nombres sería peor. Es el mismo `<nav>` reubicado con CSS: el router, las pestañas y los avisos no cambian. |

## Validaciones (config)

- Teléfono: 10 dígitos que empiezan por 809, 829 u 849.
- Cédula: 11 dígitos. Se muestra como `001-1234567-8`. No se valida el dígito verificador: algunas cédulas antiguas no lo cumplen.
- Placa: 1–2 letras + 5–6 dígitos (`I045821`). Patrón editable en config.

## Reglas de negocio interpretadas

| # | Decisión | Alternativa si el cliente prefiere otra cosa |
|---|----------|------|
| N1 | El prompt mezcla estado y puntualidad. Se separaron: **estado** = Programado → En ruta → Completado (o *Sin llegada registrada*); **puntualidad** (solo completados) = *A tiempo* o *Retrasado (+N min)*. Un viaje completado muestra dos chips: "Completado" y "A tiempo"/"Retrasado". | Mostrar un solo chip: cambiar `chipsEstado()` en `viajes.js`. |
| N2 | "Sin llegada registrada" se aplica en cuanto pasa la llegada programada, **sin** tolerancia (regla literal). | Sumar la tolerancia en `estadoViaje()` (`time.js`) y en su prueba. |
| N3 | Llegar antes de tiempo cuenta como "A tiempo" (retraso negativo). Retraso **igual** a la tolerancia = a tiempo; solo cuenta si la **supera**. | — |
| N4 | Un viaje programado cuya hora de salida pasó sin marcarse muestra "Salida pendiente". El retraso solo se mide por la llegada, como pide el prompt. | Medir también el retraso de salida. |
| N5 | Cruce de medianoche al capturar: la **llegada programada** que es menor que la salida cae al día siguiente. Las **horas reales** se asignan al día más cercano a la hora programada (±12 h). | — |
| N6 | Un viaje pertenece al día de su **salida programada**. Inicio también muestra los viajes de **ayer** aún abiertos (p. ej. el de las 11:40 p. m.). | — |
| N7 | Al pulsar "Llegó ahora" con retraso, se abre una hoja corta para el motivo. Es opcional: se puede omitir. | Quitarla: `activo: false` en el campo `motivoRetraso`. |
| N8 | Turnos: se permiten **varios turnos por día** (turno partido). Un turno sin salida sigue abierto aunque cambie el día (turnos nocturnos). Si un turno abierto supera `horasTurnoLargo` (12 h), sale un aviso de que quizá falta marcar la salida. | — |
| N9 | Los viajes y cargas **archivados** no cuentan en Inicio ni en Reportes. | — |
| N10 | Reportes: la puntualidad se calcula solo con viajes completados. "Sin llegada" se reporta aparte (no se adivina su retraso). | — |
| N11 | Combustible: la cantidad y el monto se registran; el precio por unidad se calcula (monto ÷ cantidad) y se muestra. | Pedir precio por galón y calcular el monto. |
| N12 | Avisos de Inicio: sin llegada (hoy y ayer), salidas pendientes, licencias vencidas o que vencen en ≤ 30 días, turnos de más de 12 h y respaldo con más de 7 días (solo cuando ya hay datos reales). Cada uno se enciende o apaga en `config.inicio.avisos`. | — |
| N13 | Al borrar los datos de ejemplo, los registros del usuario que apuntaban a ellos se conservan y muestran "(eliminado)". La confirmación avisa cuántos hay. | Bloquear el borrado o convertir esos ejemplos en datos reales. |

## Datos, respaldo y PWA

| # | Decisión |
|---|----------|
| D1 | Respaldo en JSON con `{ app, formato, version, exportado, datos }`. Al importar se valida el formato y se pide confirmación, porque **reemplaza** todo. |
| D2 | CSV con BOM UTF-8, separador coma y números sin formato (RD$ en el encabezado), para que Excel en español muestre bien las tildes y pueda sumar. |
| D3 | Service worker: los archivos propios salen de la caché y se actualizan en segundo plano; las fuentes de Google se guardan al usarse. Hay que subir `VERSION` en `sw.js` en cada publicación. |
| D4 | Datos de ejemplo: 4 choferes (uno de vacaciones y uno con licencia por vencer), 5 rutas de Santo Domingo, 3 autobuses, 14 días con 7 viajes diarios (menos los domingos) y ~22 % con retraso, cargas de gasoil a RD$235.10/gal (precio supuesto) y turnos. Se generan relativos al día de instalación y con semilla fija. |

## Preguntas para el cliente (lo que más cambiaría la app)

1. ¿Uno o varios supervisores/teléfonos? Con más de uno, localStorage no sirve: hay que migrar a Supabase antes de usarla en serio.
2. ¿El retraso se mide solo por la llegada, o también importa la salida tardía?
3. ¿"Sin llegada registrada" debe esperar la tolerancia?
4. ¿Galones o litros? ¿Se paga por monto o por precio por galón?
5. ¿Qué es lo primero que quiere ver al abrir la app (Inicio)?
6. Nombre de la empresa, color de marca y logo.
