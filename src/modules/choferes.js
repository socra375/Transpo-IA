import { pantallaCrud, chipSeleccion } from '../core/crud.js';
import { camposDe } from '../config.js';
import { hoyClave, estadoLicencia } from '../core/time.js';
import * as fmt from '../core/format.js';
import { esc } from '../core/ui.js';

const campoEstado = camposDe('choferes').find((c) => c.clave === 'estado');

export function avisoLicencia(chofer, hoy = hoyClave()) {
  const l = estadoLicencia(chofer.licenciaVence, hoy);
  if (l.estado === 'vencida') return { tono: 'error', texto: `Licencia vencida hace ${fmt.plural(-l.dias, 'día', 'días')}` };
  if (l.estado === 'por_vencer') return { tono: 'aviso', texto: l.dias === 0 ? 'Licencia vence hoy' : `Licencia vence en ${fmt.plural(l.dias, 'día', 'días')}` };
  return null;
}

export default pantallaCrud({
  modulo: 'choferes',
  titulo: 'Choferes',
  pestana: 'choferes',
  icono: 'user',
  ordenar: (a, b) => a.nombre.localeCompare(b.nombre, 'es'),
  describir(c) {
    const aviso = avisoLicencia(c);
    return {
      titulo: c.nombre,
      subtitulo: fmt.telefono(c.telefono),
      meta: c.licenciaVence && !aviso ? [`Licencia vence ${fmt.fechaNum(c.licenciaVence)}`] : [],
      chips: campoEstado ? chipSeleccion(campoEstado, c.estado) : '',
      extra: aviso ? `<span class="chip chip--${aviso.tono}">${esc(aviso.texto)}</span>` : '',
      clase: aviso ? `item--${aviso.tono === 'error' ? 'error' : 'warn'}` : '',
    };
  },
  accionesItem(c) {
    return c.telefono ? `<a class="btn btn--ghost btn--sm" href="tel:+1${esc(c.telefono)}">Llamar</a>` : '';
  },
});

