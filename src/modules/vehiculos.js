import { pantallaCrud } from '../core/crud.js';
import * as store from '../data/store.js';

export default pantallaCrud({
  modulo: 'vehiculos',
  titulo: 'Vehículos',
  pestana: 'mas',
  icono: 'truck',
  ordenar: (a, b) => a.placa.localeCompare(b.placa, 'es', { numeric: true }),
  async alGuardar(v, existente) {
    // La placa identifica al vehículo: no se permiten duplicadas.
    const otros = await store.list('vehiculos', { archivados: 'todos' });
    if (otros.some((x) => x.placa === v.placa && x.id !== existente?.id)) {
      throw { errores: { placa: 'Ya existe un vehículo con esta placa (revisa también los archivados).' } };
    }
    return v;
  },
});
