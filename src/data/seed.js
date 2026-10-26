// Datos de ejemplo: se cargan una sola vez en el primer uso y llevan `ejemplo: true`.
import * as store from './store.js';
import { config } from '../config.js';
import { pref, setPref } from '../core/prefs.js';
import { aISO, hoyClave, sumarDias, sumarMinutos, diaSemana } from '../core/time.js';

// Generador pseudoaleatorio con semilla: los mismos datos en cada instalación.
function azar(semilla) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const MOTIVOS = ['Tapón en la Duarte', 'Lluvia fuerte', 'Avería menor (goma)', 'Accidente en la vía', 'Personal llegó tarde a la parada', 'Desvío por obras en la avenida'];

export async function sembrarSiPrimeraVez(ahora = new Date()) {
  if (pref('sembrado')) return false;
  const existentes = await Promise.all(store.COLECCIONES.map((c) => store.list(c, { archivados: 'todos' })));
  if (existentes.some((l) => l.length)) {
    setPref('sembrado', true);
    return false;
  }
  await sembrar(ahora);
  setPref('sembrado', true);
  return true;
}

export async function sembrar(ahora = new Date()) {
  const r = azar(20261026);
  const entre = (a, b) => a + Math.floor(r() * (b - a + 1));
  const hoy = hoyClave(ahora);
  const ej = { ejemplo: true };

  const choferes = [
    { nombre: 'Juan Carlos Pérez Mejía', telefono: '8095550142', cedula: '00112345678', licencia: 'Cat. 4 · 4502318', licenciaVence: sumarDias(hoy, 410), estado: 'activo' },
    { nombre: 'Ramón Antonio Féliz', telefono: '8295550187', cedula: '40223456781', licencia: 'Cat. 4 · 4498120', licenciaVence: sumarDias(hoy, 18), estado: 'activo' },
    { nombre: 'María Altagracia Santos', telefono: '8495550123', cedula: '22334567892', licencia: 'Cat. 3 · 3871045', licenciaVence: sumarDias(hoy, 240), estado: 'activo' },
    { nombre: 'Luis Manuel De la Cruz', telefono: '8095550199', cedula: '03145678903', licencia: 'Cat. 4 · 4120776', licenciaVence: sumarDias(hoy, 95), estado: 'vacaciones' },
  ].map((c, i) => ({ ...c, ...ej, id: `ej-chofer-${i + 1}` }));

  const rutas = [
    { nombre: 'R1 Alcarrizos – ZF Las Américas', origen: 'Los Alcarrizos', destino: 'Zona Franca Las Américas', duracionMin: 55 },
    { nombre: 'R2 Villa Mella – Haina', origen: 'Villa Mella', destino: 'Parque Industrial Haina', duracionMin: 70 },
    { nombre: 'R3 SDE – ZF San Isidro', origen: 'Santo Domingo Este', destino: 'Zona Franca San Isidro', duracionMin: 35 },
    { nombre: 'R4 Herrera – Naco', origen: 'Herrera', destino: 'Ensanche Naco', duracionMin: 40 },
    { nombre: 'R5 Boca Chica – AILA', origen: 'Boca Chica', destino: 'Aeropuerto Las Américas', duracionMin: 25 },
  ].map((x, i) => ({ ...x, ...ej, id: `ej-ruta-${i + 1}` }));

  const vehiculos = [
    { placa: 'I045821', descripcion: 'Toyota Coaster 2019 · 30 pasajeros', estado: 'disponible' },
    { placa: 'I067310', descripcion: 'Hyundai County 2021 · 29 pasajeros', estado: 'disponible' },
    { placa: 'I052984', descripcion: 'Nissan Urvan 2018 · 15 pasajeros', estado: 'disponible' },
  ].map((x, i) => ({ ...x, ...ej, id: `ej-vehiculo-${i + 1}` }));

  // Plan diario: [ruta, salida, chofer, vehículo]. El último viaje cruza la medianoche.
  const plan = [
    [0, '05:30', 0, 0], [1, '05:45', 1, 1], [2, '06:15', 2, 2],
    [3, '13:30', 2, 2], [0, '15:30', 0, 0], [1, '17:00', 1, 1],
    [4, '23:40', 0, 0],
  ];

  const viajes = [];
  const ahoraT = ahora.getTime();
  for (let d = -13; d <= 0; d++) {
    const dia = sumarDias(hoy, d);
    const domingo = diaSemana(dia) === 0;
    for (const [ri, salida, ci, vi] of plan) {
      if (domingo && salida > '06:00' && salida < '23:00') continue;
      const ruta = rutas[ri];
      const salidaProg = aISO(dia, salida);
      const llegadaProg = sumarMinutos(salidaProg, ruta.duracionMin);
      const retrasado = r() < 0.22;
      const retraso = retrasado ? entre(7, 38) : entre(-6, 4);
      const salidaReal = sumarMinutos(salidaProg, retrasado ? entre(0, 12) : entre(-3, 3));
      const llegadaReal = sumarMinutos(llegadaProg, retraso);
      const v = {
        ...ej,
        id: `ej-viaje-${dia}-${salida}`,
        rutaId: ruta.id, choferId: choferes[ci].id, vehiculoId: vehiculos[vi].id,
        salidaProg, llegadaProg, salidaReal: null, llegadaReal: null, motivoRetraso: '',
      };
      // Solo se registra lo que ya ocurrió respecto a "ahora".
      if (new Date(salidaReal).getTime() <= ahoraT) v.salidaReal = salidaReal;
      if (new Date(llegadaReal).getTime() <= ahoraT) {
        v.llegadaReal = llegadaReal;
        if (retraso > config.negocio.toleranciaMin) v.motivoRetraso = MOTIVOS[entre(0, MOTIVOS.length - 1)];
      }
      viajes.push(v);
    }
  }
  // Uno de hoy queda "Sin llegada registrada" para que el aviso se vea.
  const deHoy = viajes.filter((v) => v.llegadaReal && v.id.includes(hoy));
  const sinLlegada = deHoy[deHoy.length - 1];
  if (sinLlegada) Object.assign(sinLlegada, { llegadaReal: null, motivoRetraso: '' });

  const factor = config.negocio.unidadCombustible === 'litros' ? 3.785 : 1;
  const precioGalon = 235.1;
  const combustible = [];
  for (let d = -13; d <= 0; d++) {
    const dia = sumarDias(hoy, d);
    vehiculos.forEach((veh, i) => {
      if ((d + 13 + i) % 3 !== 0) return;
      const galones = entre(160, 300) / 10;
      combustible.push({
        ...ej,
        id: `ej-combustible-${dia}-${i}`,
        fecha: dia, vehiculoId: veh.id, choferId: choferes[i].id,
        cantidad: Math.round(galones * factor * 10) / 10,
        monto: Math.round(galones * precioGalon * 100) / 100,
        notas: '',
      });
    });
  }

  const turnos = [];
  for (let d = -13; d <= 0; d++) {
    const dia = sumarDias(hoy, d);
    choferes.forEach((c, i) => {
      if (c.estado !== 'activo' || diaSemana(dia) === 0) return;
      const entrada = aISO(dia, i === 2 ? '12:45' : '05:00');
      const salida = sumarMinutos(entrada, 9 * 60 + entre(-20, 40));
      if (new Date(entrada).getTime() > ahoraT) return;
      turnos.push({
        ...ej, id: `ej-turno-${dia}-${i}`, choferId: c.id, fecha: dia,
        entrada: sumarMinutos(entrada, entre(-10, 10)),
        salida: new Date(salida).getTime() <= ahoraT ? salida : null,
      });
    });
  }

  await store.createMany('choferes', choferes);
  await store.createMany('rutas', rutas);
  await store.createMany('vehiculos', vehiculos);
  await store.createMany('viajes', viajes);
  await store.createMany('combustible', combustible);
  await store.createMany('turnos', turnos);
}

export async function hayDatosEjemplo() {
  for (const c of store.COLECCIONES) {
    if ((await store.list(c, { archivados: 'todos' })).some((x) => x.ejemplo)) return true;
  }
  return false;
}

/** Cuenta registros reales que apuntan a datos de ejemplo (quedarán como "(eliminado)"). */
export async function referenciasReales() {
  const ids = new Set();
  for (const c of ['choferes', 'rutas', 'vehiculos']) {
    for (const x of await store.list(c, { archivados: 'todos' })) if (x.ejemplo) ids.add(x.id);
  }
  let n = 0;
  for (const c of ['viajes', 'combustible', 'turnos']) {
    for (const x of await store.list(c, { archivados: 'todos' })) {
      if (!x.ejemplo && [x.rutaId, x.choferId, x.vehiculoId].some((id) => ids.has(id))) n++;
    }
  }
  return n;
}

export async function borrarDatosEjemplo() {
  let total = 0;
  for (const c of store.COLECCIONES) {
    const ids = (await store.list(c, { archivados: 'todos' })).filter((x) => x.ejemplo).map((x) => x.id);
    total += await store.removeMany(c, ids);
  }
  return total;
}
