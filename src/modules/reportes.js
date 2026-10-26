// Reportes: retrasos por chofer y por ruta, combustible por semana/mes; exportación CSV.
import * as store from '../data/store.js';
import { tolerancia } from '../core/prefs.js';
import { hoyClave, sumarDias, formatoDuracion } from '../core/time.js';
import { retrasosPor, totalesRetrasos, combustiblePor, aCSV } from '../core/agregados.js';
import { cargarRefs, porId } from '../core/crud.js';
import * as fmt from '../core/format.js';
import { esc, icon, vacio, descargar, toast, conCarga } from '../core/ui.js';

const PERIODOS = {
  '7d': { etiqueta: '7 días', rango: (h) => [sumarDias(h, -6), h] },
  '30d': { etiqueta: '30 días', rango: (h) => [sumarDias(h, -29), h] },
  mes: { etiqueta: 'Este mes', rango: (h) => [`${h.slice(0, 7)}-01`, h] },
  ant: { etiqueta: 'Mes pasado', rango: (h) => { const fin = sumarDias(`${h.slice(0, 7)}-01`, -1); return [`${fin.slice(0, 7)}-01`, fin]; } },
};

const pct = (n) => (n == null ? '—' : `${n}%`);

function tablaRetrasos(id, titulo, filas, nombres) {
  if (!filas.length) return `<section class="card section"><h2 class="section__title">${titulo}</h2>${vacio({ icono: 'chart', titulo: 'Sin viajes en este periodo' })}</section>`;
  const t = totalesRetrasos(filas);
  const max = Math.max(1, ...filas.map((f) => f.retrasados));
  return `<section class="card section" aria-labelledby="t-${id}">
    <div class="section__head"><h2 class="section__title" id="t-${id}">${titulo}</h2>
      <button type="button" class="btn btn--ghost btn--sm" data-csv="${id}">${icon('download', 'icon--sm')}CSV</button></div>
    <div class="table-wrap"><table class="table">
      <thead><tr><th scope="col">${id === 'chofer' ? 'Chofer' : 'Ruta'}</th><th scope="col">Viajes</th><th scope="col">Retrasos</th><th scope="col">A tiempo</th></tr></thead>
      <tbody>${filas.map((f) => `<tr>
        <td><span style="display:grid;gap:4px">${esc(nombres.get(f.id) ?? '(eliminado)')}<span class="bar bar--warn" aria-hidden="true"><span style="width:${(f.retrasados / max) * 100}%"></span></span></span></td>
        <td>${f.viajes}</td><td>${f.retrasados}${f.retrasados ? `<br><small class="muted">prom. ${f.promRetraso} min</small>` : ''}${f.sinLlegada ? `<br><small class="muted">+${f.sinLlegada} s/l</small>` : ''}</td><td>${pct(f.pctATiempo)}</td></tr>`).join('')}</tbody>
      <tfoot><tr><td>Total</td><td>${t.viajes}</td><td>${t.retrasados}${t.retrasados ? `<br><small class="muted">prom. ${t.promRetraso} min</small>` : ''}</td><td>${pct(t.pctATiempo)}</td></tr></tfoot>
    </table></div>
    <p class="field__help">“s/l”: viajes sin llegada registrada (no cuentan en la puntualidad). prom.: retraso promedio de los viajes retrasados.</p>
  </section>`;
}

function etiquetaPeriodo(clave, tipo) {
  return tipo === 'semana' ? `Sem. ${fmt.fecha(clave).replace(/^\S+\s/, '')}` : fmt.mes(clave).replace(/^./, (c) => c.toUpperCase());
}

function tablaCombustible(filas, tipo) {
  const max = Math.max(1, ...filas.map((f) => f.monto));
  const t = filas.reduce((s, f) => ({ cargas: s.cargas + f.cargas, cantidad: s.cantidad + f.cantidad, monto: s.monto + f.monto }), { cargas: 0, cantidad: 0, monto: 0 });
  return `<div class="table-wrap"><table class="table">
    <thead><tr><th scope="col">${tipo === 'semana' ? 'Semana (lunes)' : 'Mes'}</th><th scope="col">Cargas</th><th scope="col">${fmt.unidad('larga').replace(/^./, (c) => c.toUpperCase())}</th><th scope="col">Monto</th></tr></thead>
    <tbody>${filas.map((f) => `<tr><td><span style="display:grid;gap:4px">${esc(etiquetaPeriodo(f.periodo, tipo))}<span class="bar" aria-hidden="true"><span style="width:${(f.monto / max) * 100}%"></span></span></span></td><td>${f.cargas}</td><td>${fmt.numero(f.cantidad, 1)}</td><td>${fmt.dinero(f.monto)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td>Total</td><td>${t.cargas}</td><td>${fmt.numero(t.cantidad, 1)}</td><td>${fmt.dinero(t.monto)}</td></tr></tfoot>
  </table></div>`;
}

export default {
  titulo: 'Reportes',
  pestana: 'mas',
  async render(el) {
    const est = { periodo: '7d', comb: 'semana' };
    el.innerHTML = `
      <div class="segmented" role="group" aria-label="Periodo">${Object.entries(PERIODOS).map(([k, p]) => `<button type="button" data-periodo="${k}" aria-pressed="${k === est.periodo}">${p.etiqueta}</button>`).join('')}</div>
      <p class="muted" data-rango></p>
      <div class="stack" data-cuerpo style="gap:var(--sp-4)"></div>`;
    const cuerpo = el.querySelector('[data-cuerpo]');
    const [datos, refs] = await conCarga(cuerpo, Promise.all([
      Promise.all([store.list('viajes'), store.list('combustible')]),
      cargarRefs(['choferes', 'rutas']),
    ]), 3);
    const [viajes, cargas] = datos;
    const nombresChofer = new Map([...porId(refs.choferes)].map(([id, c]) => [id, c.nombre]));
    const nombresRuta = new Map([...porId(refs.rutas)].map(([id, r]) => [id, r.nombre]));
    let actual = {};

    const pintar = () => {
      const hoy = hoyClave();
      const [desde, hasta] = PERIODOS[est.periodo].rango(hoy);
      const op = { desde, hasta, tolerancia: tolerancia() };
      const porChofer = retrasosPor(viajes, 'choferId', op);
      const porRuta = retrasosPor(viajes, 'rutaId', op);
      const comb = combustiblePor(cargas, est.comb, { hoy, n: est.comb === 'semana' ? 8 : 6 });
      const t = totalesRetrasos(porChofer);
      actual = { desde, hasta, porChofer, porRuta, comb };
      el.querySelector('[data-rango]').textContent = `Del ${fmt.fechaNum(desde)} al ${fmt.fechaNum(hasta)} · tolerancia ${tolerancia()} min`;
      cuerpo.innerHTML = `
        <div class="stats">
          <div class="stat stat--hero"><span class="stat__label">A tiempo</span><span class="stat__value">${pct(t.pctATiempo)}</span><span class="stat__note">${t.completados} viajes llegados</span></div>
          <div class="stat ${t.retrasados ? 'stat--warn' : ''}"><span class="stat__label">Retrasos</span><span class="stat__value">${t.retrasados}</span><span class="stat__note">${t.minRetraso ? `${formatoDuracion(t.minRetraso)} en total` : 'Ninguno'}</span></div>
          <div class="stat"><span class="stat__label">Sin llegada</span><span class="stat__value">${t.sinLlegada}</span><span class="stat__note">por registrar</span></div>
        </div>
        ${tablaRetrasos('chofer', 'Retrasos por chofer', porChofer, nombresChofer)}
        ${tablaRetrasos('ruta', 'Retrasos por ruta', porRuta, nombresRuta)}
        <section class="card section" aria-labelledby="t-comb">
          <div class="section__head"><h2 class="section__title" id="t-comb">Combustible</h2>
            <button type="button" class="btn btn--ghost btn--sm" data-csv="combustible">${icon('download', 'icon--sm')}CSV</button></div>
          <div class="segmented" role="group" aria-label="Agrupar combustible">
            <button type="button" data-comb="semana" aria-pressed="${est.comb === 'semana'}">Por semana</button>
            <button type="button" data-comb="mes" aria-pressed="${est.comb === 'mes'}">Por mes</button>
          </div>
          ${tablaCombustible(comb, est.comb)}
        </section>`;
    };

    const exportar = (tipo) => {
      const { desde, hasta } = actual;
      let nombre;
      let csv;
      if (tipo === 'combustible') {
        nombre = `combustible-por-${est.comb}-${hoyClave()}.csv`;
        csv = aCSV(
          [est.comb === 'semana' ? 'Semana (lunes)' : 'Mes', 'Cargas', `Cantidad (${fmt.unidad('larga')})`, 'Monto (RD$)'],
          actual.comb.map((f) => [f.periodo, f.cargas, f.cantidad, f.monto.toFixed(2)]),
        );
      } else {
        const filas = tipo === 'chofer' ? actual.porChofer : actual.porRuta;
        const nombres = tipo === 'chofer' ? nombresChofer : nombresRuta;
        nombre = `retrasos-por-${tipo}-${desde}-a-${hasta}.csv`;
        csv = aCSV(
          [tipo === 'chofer' ? 'Chofer' : 'Ruta', 'Viajes', 'Completados', 'Retrasados', 'Sin llegada', '% a tiempo', 'Retraso promedio (min)', 'Minutos de retraso'],
          filas.map((f) => [nombres.get(f.id) ?? '(eliminado)', f.viajes, f.completados, f.retrasados, f.sinLlegada, f.pctATiempo ?? '', f.promRetraso, f.minRetraso]),
        );
      }
      descargar(nombre, csv, 'text/csv;charset=utf-8');
      toast(`Descargado ${nombre}`);
    };

    el.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.periodo) {
        est.periodo = b.dataset.periodo;
        el.querySelectorAll('[data-periodo]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
        pintar();
      } else if (b.dataset.comb) {
        est.comb = b.dataset.comb;
        pintar();
      } else if (b.dataset.csv) exportar(b.dataset.csv);
    });
    pintar();
  },
};
