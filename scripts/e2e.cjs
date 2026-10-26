// Flujos principales en navegador headless (390 px). Uso: node scripts/e2e.cjs
const { chromium } = require('playwright');
const { crear } = require('./serve.cjs');

let fallos = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? '✓' : '✗'} ${msg}`);
  if (!cond) fallos++;
};

(async () => {
  const servidor = crear().listen(0);
  const base = `http://localhost:${servidor.address().port}/index.html`;
  const navegador = await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce', timezoneId: 'America/Santo_Domingo', hasTouch: true });
  const page = await ctx.newPage();
  page.setDefaultTimeout(5000);
  const errores = [];
  page.on('pageerror', (e) => errores.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('dialog', (d) => { errores.push(`alert() usado: ${d.message()}`); d.dismiss(); });

  await page.goto(`${base}#/viajes`);
  await page.waitForSelector('[data-lista] .item');

  // Validación: formulario vacío muestra errores junto a los campos, sin alert().
  await page.click('[data-nuevo]');
  await page.click('dialog.sheet button[type=submit]');
  const errRuta = await page.textContent('#f-rutaId-err');
  ok(errRuta.includes('Selecciona'), `error junto al campo Ruta: "${errRuta}"`);
  ok((await page.getAttribute('#f-rutaId', 'aria-invalid')) === 'true', 'campo inválido marcado con aria-invalid');

  // Viaje que cruza la medianoche, llegada autocompletada con la duración de la ruta (R5 = 25 min).
  await page.selectOption('#f-rutaId', { label: 'R5 Boca Chica – AILA' });
  await page.selectOption('#f-choferId', { index: 1 });
  await page.selectOption('#f-vehiculoId', { index: 1 });
  await page.fill('#f-salidaProg', '23:50');
  await page.dispatchEvent('#f-salidaProg', 'change');
  ok((await page.inputValue('#f-llegadaProg')) === '00:15', 'llegada programada autocompletada 00:15');
  await page.fill('#f-salidaReal', '23:52');
  await page.fill('#f-llegadaReal', '00:40');
  await page.click('dialog.sheet button[type=submit]');
  await page.waitForSelector('dialog.sheet', { state: 'detached' });
  const ultimo = await page.evaluate(() => {
    const v = JSON.parse(localStorage.getItem('ct:v1:viajes')).filter((x) => !x.ejemplo).pop();
    return v;
  });
  ok(ultimo && ultimo.llegadaProg > ultimo.salidaProg, 'llegada programada guardada al día siguiente');
  const tarjeta = page.locator('.item', { hasText: '11:50 p. m.' }).filter({ hasText: 'Retrasado' });
  ok((await tarjeta.count()) === 1, 'viaje nocturno muestra "Retrasado (+25 min)"');
  ok((await tarjeta.first().textContent()).includes('+25 min'), 'retraso de 25 min calculado a través de la medianoche');

  // Botón rápido "Salió ahora" → pasa a "En ruta" y aparece "Llegó ahora".
  const antes = await page.locator('[data-rapido="salio"]').count();
  if (antes) {
    await page.locator('[data-rapido="salio"]').first().click();
    await page.waitForTimeout(300);
    ok((await page.locator('[data-rapido="salio"]').count()) === antes - 1, '"Salió ahora" registra la salida');
    ok((await page.locator('.toast').last().textContent()).includes('Salida registrada'), 'toast de salida');
  } else console.log('· sin viajes pendientes de salir hoy (depende de la hora)');

  // Llegó ahora sobre un viaje "Sin llegada registrada" → pide motivo si va tarde.
  const llego = page.locator('[data-rapido="llego"]').first();
  if (await llego.count()) {
    await llego.click();
    await page.waitForTimeout(300);
    const pide = await page.locator('dialog.sheet', { hasText: 'Motivo del retraso' }).count();
    if (pide) {
      await page.fill('#f-motivoRetraso', 'Tapón en la 27');
      await page.click('dialog.sheet button[type=submit]');
      await page.waitForSelector('dialog.sheet', { state: 'detached' });
      ok((await page.locator('.item', { hasText: 'Tapón en la 27' }).count()) === 1, 'motivo del retraso guardado');
    } else ok(true, 'llegada registrada a tiempo');
  }

  // Turnos: marcar entrada y salida.
  await page.evaluate(() => { location.hash = '#/choferes'; });
  await page.waitForSelector('[data-lista] .item');
  const card = page.locator('.item', { hasText: 'Luis Manuel' });
  await card.locator('[data-accion="entrada"]').click();
  await page.waitForTimeout(300);
  ok((await card.textContent()).includes('En turno desde'), 'marcar entrada abre el turno');
  await card.locator('[data-accion="salida"]').click();
  await page.waitForTimeout(300);
  ok((await card.locator('[data-accion="entrada"]').count()) === 1, 'marcar salida cierra el turno');

  // Corregir un turno nocturno (22:00 → 06:00 al día siguiente).
  await card.locator('[data-accion="turnos"]').click();
  await page.click('[data-agregar]');
  await page.fill('#f-entrada', '22:00');
  await page.fill('#f-salida', '06:00');
  await page.locator('dialog.sheet button[type=submit]').last().click();
  await page.waitForTimeout(400);
  ok((await page.locator('dialog.sheet', { hasText: '(día sig.)' }).count()) === 1, 'turno nocturno de 8 h cruza la medianoche');

  // Archivar y restaurar un vehículo, con confirmación dentro de la página.
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  await page.evaluate(() => { location.hash = '#/vehiculos'; });
  await page.waitForSelector('[data-lista] .item');
  await page.locator('[data-editar]').first().click();
  await page.click('[data-accion="archivar"]');
  await page.click('dialog.modal [data-r="1"]');
  await page.waitForTimeout(400);
  ok((await page.locator('[data-lista] .item').count()) === 2, 'vehículo archivado sale de la lista de activos');
  await page.click('[data-filtro="1"]');
  ok((await page.locator('[data-lista] .item').count()) === 1, 'aparece en Archivados');

  // Placa duplicada.
  await page.click('[data-filtro="0"]');
  await page.click('[data-nuevo]');
  await page.fill('#f-placa', 'i067310');
  await page.click('dialog.sheet button[type=submit]');
  await page.waitForTimeout(200);
  ok((await page.textContent('#f-placa-err')).includes('Ya existe'), 'placa duplicada rechazada');

  ok(!errores.length, `sin errores de consola${errores.length ? `: ${errores.join(' | ')}` : ''}`);
  await navegador.close();
  servidor.close();
  console.log(fallos ? `\n${fallos} fallo(s).` : '\nFlujos OK.');
  process.exit(fallos ? 1 : 0);
})();
