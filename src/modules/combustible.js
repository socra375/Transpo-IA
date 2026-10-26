import { pantallaCrud, porId } from '../core/crud.js';
import { hoyClave, inicioSemana } from '../core/time.js';
import * as fmt from '../core/format.js';
import { esc } from '../core/ui.js';

function resumen(cargas, desde) {
  const r = cargas.filter((c) => !c.archivado && c.fecha >= desde);
  return { cantidad: r.reduce((s, c) => s + (c.cantidad || 0), 0), monto: r.reduce((s, c) => s + (c.monto || 0), 0), n: r.length };
}

export default pantallaCrud({
  modulo: 'combustible',
  titulo: 'Combustible',
  pestana: 'combustible',
  icono: 'fuel',
  refsDe: ['vehiculos', 'choferes'],
  textoVacio: 'Toca “Nueva carga” para registrar la primera carga de combustible.',
  ordenar: (a, b) => b.fecha.localeCompare(a.fecha) || b.creado.localeCompare(a.creado),
  valoresNuevos: () => ({ fecha: hoyClave() }),
  cabecera(refs, cargas) {
    const hoy = hoyClave();
    const semana = resumen(cargas, inicioSemana(hoy));
    const mes = resumen(cargas, `${hoy.slice(0, 7)}-01`);
    const tile = (t, r) => `<div class="stat"><span class="stat__label">${t}</span><span class="stat__value stat__value--sm tabular">${fmt.dinero(r.monto)}</span><span class="stat__note">${fmt.cantidad(Math.round(r.cantidad * 10) / 10)} · ${fmt.plural(r.n, 'carga', 'cargas')}</span></div>`;
    return `<div class="stats">${tile('Esta semana', semana)}${tile('Este mes', mes)}</div>`;
  },
  describir(c, refs) {
    const veh = porId(refs.vehiculos).get(c.vehiculoId);
    const chofer = porId(refs.choferes).get(c.choferId);
    const precio = c.cantidad ? c.monto / c.cantidad : 0;
    return {
      titulo: veh ? `${veh.placa}` : '(vehículo eliminado)',
      subtitulo: chofer?.nombre || '',
      meta: [fmt.fecha(c.fecha), fmt.cantidad(c.cantidad), `${fmt.dinero(precio)}/${fmt.unidad()}`],
      chips: `<strong class="tabular" style="font-size:var(--fs-lg)">${esc(fmt.dinero(c.monto))}</strong>`,
    };
  },
});
