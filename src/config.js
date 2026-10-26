// Configuración central. Cuando el cliente confirme sus respuestas, SOLO se edita este archivo.
// Formularios, listas, pantalla de Inicio y avisos se generan leyendo estos valores.
//
// Campos de cada módulo:
//   clave       nombre interno del dato (no cambiar si ya hay datos guardados)
//   etiqueta    texto visible
//   tipo        texto | telefono | cedula | placa | fecha | hora | numero | dinero | seleccion | referencia | notas
//   activo      true/false: aparece o no en formularios y listas
//   requerido   validación obligatoria
//   enLista     'titulo' | 'subtitulo' | 'meta' | 'chip' | false  (cómo se muestra en la lista)
//   buscable    se usa en el buscador de la lista
//   fijo        el campo lo necesita la lógica de negocio: `activo:false` se ignora

export const config = {
  version: '0.1.0',

  empresa: {
    nombre: 'Control de Transporte',
    subtitulo: 'Supervisión de rutas',
  },

  regional: {
    locale: 'es-DO',
    zonaHoraria: 'America/Santo_Domingo',
    moneda: 'DOP', // RD$
  },

  apariencia: {
    tema: 'sistema', // 'claro' | 'oscuro' | 'sistema'
    colorPrincipal: '#0F4C81',
    colorAcento: '#F5A524',
    tamanoLetra: 17, // px
    tamanosLetra: [15, 17, 19, 21],
  },

  negocio: {
    toleranciaMin: 5, // un viaje es "Retrasado" solo si supera estos minutos
    unidadCombustible: 'galones', // 'galones' | 'litros'
    diasAvisoLicencia: 30, // avisar cuando la licencia vence en estos días o menos
    diasAvisoRespaldo: 7, // recordar respaldo si el último tiene más de estos días
    horasTurnoLargo: 12, // avisar si un turno abierto supera estas horas
  },

  // Pantalla de Inicio: orden y presencia de bloques, y qué totales mostrar.
  inicio: {
    bloques: [
      { id: 'totales', activo: true },
      { id: 'avisos', activo: true },
      { id: 'viajesHoy', activo: true },
    ],
    totales: [
      { id: 'viajes', etiqueta: 'Viajes hoy', activo: true },
      { id: 'retrasos', etiqueta: 'Retrasos', activo: true },
      { id: 'combustible', etiqueta: 'Combustible', activo: true },
    ],
    avisos: {
      sinLlegada: true,
      salidaPendiente: true,
      licencias: true,
      turnoLargo: true,
      respaldo: true,
    },
  },

  modulos: {
    choferes: {
      singular: 'chofer',
      campos: [
        { clave: 'nombre', etiqueta: 'Nombre completo', tipo: 'texto', activo: true, requerido: true, fijo: true, enLista: 'titulo', buscable: true, max: 80 },
        { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'telefono', activo: true, requerido: false, enLista: 'subtitulo', buscable: true },
        { clave: 'cedula', etiqueta: 'Cédula', tipo: 'cedula', activo: true, requerido: false, enLista: false, buscable: true },
        { clave: 'licencia', etiqueta: 'Licencia (número o categoría)', tipo: 'texto', activo: true, requerido: false, enLista: false, buscable: true, max: 30 },
        { clave: 'licenciaVence', etiqueta: 'Vencimiento de licencia', tipo: 'fecha', activo: true, requerido: false, enLista: 'meta' },
        {
          clave: 'estado', etiqueta: 'Estado', tipo: 'seleccion', activo: true, requerido: true, enLista: 'chip', porDefecto: 'activo',
          opciones: [
            { valor: 'activo', etiqueta: 'Activo', tono: 'ok' },
            { valor: 'vacaciones', etiqueta: 'De vacaciones', tono: 'info' },
            { valor: 'suspendido', etiqueta: 'Suspendido', tono: 'aviso' },
            { valor: 'inactivo', etiqueta: 'Inactivo', tono: 'neutro' },
          ],
        },
        { clave: 'notas', etiqueta: 'Notas', tipo: 'notas', activo: true, requerido: false, enLista: false, max: 300 },
      ],
    },

    rutas: {
      singular: 'ruta',
      campos: [
        { clave: 'nombre', etiqueta: 'Nombre de la ruta', tipo: 'texto', activo: true, requerido: true, fijo: true, enLista: 'titulo', buscable: true, max: 60 },
        { clave: 'origen', etiqueta: 'Origen', tipo: 'texto', activo: true, requerido: true, enLista: 'subtitulo', buscable: true, max: 60 },
        { clave: 'destino', etiqueta: 'Destino', tipo: 'texto', activo: true, requerido: true, enLista: 'subtitulo', buscable: true, max: 60 },
        { clave: 'duracionMin', etiqueta: 'Duración estimada (minutos)', tipo: 'numero', activo: true, requerido: true, fijo: true, enLista: 'meta', min: 1, max: 1440, entero: true },
        { clave: 'notas', etiqueta: 'Notas', tipo: 'notas', activo: true, requerido: false, enLista: false, max: 300 },
      ],
    },

    vehiculos: {
      singular: 'vehículo',
      campos: [
        // Placa RD: 1–2 letras + 5–6 dígitos (p. ej. I045821). Ajustable aquí.
        { clave: 'placa', etiqueta: 'Placa', tipo: 'placa', activo: true, requerido: true, fijo: true, enLista: 'titulo', buscable: true, patron: '^[A-Z]{1,2}\\d{5,6}$', mensajePatron: 'Usa 1–2 letras y 5–6 números, sin espacios (ej. I045821).' },
        { clave: 'descripcion', etiqueta: 'Descripción (marca, modelo, capacidad)', tipo: 'texto', activo: true, requerido: false, enLista: 'subtitulo', buscable: true, max: 80 },
        {
          clave: 'estado', etiqueta: 'Estado', tipo: 'seleccion', activo: true, requerido: true, enLista: 'chip', porDefecto: 'disponible',
          opciones: [
            { valor: 'disponible', etiqueta: 'Disponible', tono: 'ok' },
            { valor: 'taller', etiqueta: 'En taller', tono: 'aviso' },
            { valor: 'fuera', etiqueta: 'Fuera de servicio', tono: 'error' },
          ],
        },
        { clave: 'notas', etiqueta: 'Notas', tipo: 'notas', activo: true, requerido: false, enLista: false, max: 300 },
      ],
    },

    viajes: {
      singular: 'viaje',
      campos: [
        { clave: 'rutaId', etiqueta: 'Ruta', tipo: 'referencia', coleccion: 'rutas', mostrar: 'nombre', activo: true, requerido: true, fijo: true },
        { clave: 'choferId', etiqueta: 'Chofer', tipo: 'referencia', coleccion: 'choferes', mostrar: 'nombre', activo: true, requerido: true },
        { clave: 'vehiculoId', etiqueta: 'Vehículo', tipo: 'referencia', coleccion: 'vehiculos', mostrar: 'placa', activo: true, requerido: true },
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', activo: true, requerido: true, fijo: true },
        { clave: 'salidaProg', etiqueta: 'Salida programada', tipo: 'hora', activo: true, requerido: true, fijo: true, grupo: 'programado' },
        { clave: 'llegadaProg', etiqueta: 'Llegada programada', tipo: 'hora', activo: true, requerido: true, fijo: true, grupo: 'programado', ayuda: 'Si es menor que la salida, se toma como el día siguiente.' },
        { clave: 'salidaReal', etiqueta: 'Salida real', tipo: 'hora', activo: true, requerido: false, fijo: true, grupo: 'real' },
        { clave: 'llegadaReal', etiqueta: 'Llegada real', tipo: 'hora', activo: true, requerido: false, fijo: true, grupo: 'real' },
        { clave: 'motivoRetraso', etiqueta: 'Motivo del retraso (opcional)', tipo: 'notas', activo: true, requerido: false, max: 200 },
      ],
    },

    combustible: {
      singular: 'carga',
      campos: [
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', activo: true, requerido: true, fijo: true, enLista: 'meta' },
        { clave: 'vehiculoId', etiqueta: 'Vehículo', tipo: 'referencia', coleccion: 'vehiculos', mostrar: 'placa', activo: true, requerido: true, enLista: 'titulo', buscable: true },
        { clave: 'choferId', etiqueta: 'Chofer', tipo: 'referencia', coleccion: 'choferes', mostrar: 'nombre', activo: true, requerido: false, enLista: 'subtitulo', buscable: true },
        { clave: 'cantidad', etiqueta: 'Cantidad', tipo: 'numero', activo: true, requerido: true, fijo: true, enLista: 'meta', min: 0.1, max: 500, unidad: 'combustible' },
        { clave: 'monto', etiqueta: 'Monto', tipo: 'dinero', activo: true, requerido: true, fijo: true, enLista: 'meta', min: 1, max: 1000000 },
        { clave: 'notas', etiqueta: 'Notas', tipo: 'notas', activo: true, requerido: false, enLista: false, max: 200 },
      ],
    },

    turnos: {
      singular: 'turno',
      campos: [
        { clave: 'fecha', etiqueta: 'Fecha', tipo: 'fecha', activo: true, requerido: true, fijo: true },
        { clave: 'entrada', etiqueta: 'Hora de entrada', tipo: 'hora', activo: true, requerido: true, fijo: true },
        { clave: 'salida', etiqueta: 'Hora de salida', tipo: 'hora', activo: true, requerido: false, fijo: true, ayuda: 'Si es menor que la entrada, se toma como el día siguiente.' },
      ],
    },
  },

  // Puntos de extensión (fuera de alcance por ahora). Para activar uno:
  // 1) crear src/modules/extensiones/<id>/index.js que exporte { titulo, render }
  // 2) poner activo: true. Aparecerá en la pestaña "Más".
  extensiones: [
    { id: 'sueldos', titulo: 'Sueldos', activo: false },
    { id: 'renta', titulo: 'Renta de vehículos', activo: false },
    { id: 'mantenimiento', titulo: 'Mantenimiento', activo: false },
    { id: 'mapa', titulo: 'Mapa / GPS', activo: false },
    { id: 'cuentas-choferes', titulo: 'Cuentas de choferes', activo: false },
  ],
};

/** Campos visibles de un módulo (respeta `activo`, salvo los `fijo`). */
export function camposDe(modulo) {
  const m = config.modulos[modulo];
  if (!m) throw new Error(`Módulo sin configurar: ${modulo}`);
  return m.campos.filter((c) => c.activo || c.fijo);
}
