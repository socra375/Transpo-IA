// QA en navegador headless: 390 px, tema claro y oscuro. Revisa errores de consola y desbordes
// horizontales, y guarda capturas en qa/capturas/. Uso: node scripts/qa.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');
const { crear } = require('./serve.cjs');

const SALIDA = path.resolve(__dirname, '../qa/capturas');

// [nombre, ruta, acción opcional antes de la captura]
const PANTALLAS = [
  ['inicio', '#/inicio'],
  ['viajes', '#/viajes'],
  ['viajes-formulario', '#/viajes', async (p) => { await p.click('[data-nuevo]'); await p.waitForSelector('dialog.sheet[open]'); }],
  ['choferes', '#/choferes'],
  ['chofer-formulario', '#/choferes', async (p) => { await p.click('[data-editar]'); await p.waitForSelector('dialog.sheet[open]'); }],
  ['rutas', '#/rutas'],
  ['vehiculos', '#/vehiculos'],
  ['combustible', '#/combustible'],
  ['reportes', '#/reportes'],
  ['ajustes', '#/ajustes'],
  ['mas', '#/mas'],
];

async function desbordes(page) {
  return page.evaluate(() => {
    const ancho = document.documentElement.clientWidth;
    const fuera = [];
    if (document.documentElement.scrollWidth > ancho) fuera.push(`documento: scrollWidth ${document.documentElement.scrollWidth} > ${ancho}`);
    for (const el of document.querySelectorAll('body *')) {
      if (el.closest('.filters, .table-wrap, svg, .sr-only, [hidden]')) continue;
      const r = el.getBoundingClientRect();
      if (r.width && (r.right > ancho + 1 || r.left < -1)) fuera.push(`${el.tagName.toLowerCase()}.${[...el.classList].join('.')} (${Math.round(r.left)}–${Math.round(r.right)})`);
    }
    return fuera.slice(0, 8);
  });
}

(async () => {
  fs.mkdirSync(SALIDA, { recursive: true });
  const servidor = crear().listen(0);
  const puerto = servidor.address().port;
  const navegador = await chromium.launch();
  let fallos = 0;

  for (const tema of ['light', 'dark']) {
    const ctx = await navegador.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: tema, reducedMotion: 'reduce',
      locale: 'es-DO', timezoneId: 'America/Santo_Domingo', serviceWorkers: 'allow',
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(5000);
    const errores = [];
    page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errores.push(`[${m.type()}] ${m.text()}`); });
    page.on('pageerror', (e) => errores.push(`[pageerror] ${e.message}`));
    page.on('requestfailed', (r) => { if (!r.url().includes('fonts.g')) errores.push(`[request] ${r.url()} ${r.failure()?.errorText}`); });

    await page.goto(`http://localhost:${puerto}/index.html#/inicio`);
    await page.waitForLoadState('networkidle');

    for (const [nombre, ruta, accion] of PANTALLAS) {
      await page.evaluate((h) => { location.hash = h; }, ruta);
      await page.waitForTimeout(250);
      if (accion) {
        try { await accion(page); } catch (e) { fallos++; console.log(`✗ ${tema} ${nombre}: la acción falló (${e.message.split('\n')[0]})`); continue; }
      }
      await page.waitForTimeout(250);
      const fuera = await desbordes(page);
      const archivo = path.join(SALIDA, `${tema === 'light' ? 'claro' : 'oscuro'}-${nombre}.png`);
      await page.screenshot({ path: archivo, fullPage: !accion });
      if (fuera.length) {
        fallos++;
        console.log(`✗ ${tema} ${nombre}: desborde\n   ${fuera.join('\n   ')}`);
      } else console.log(`✓ ${tema} ${nombre}`);
      if (accion) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }
    if (errores.length) {
      fallos++;
      console.log(`✗ ${tema}: errores de consola\n   ${[...new Set(errores)].join('\n   ')}`);
    }
    await ctx.close();
  }

  await navegador.close();
  servidor.close();
  console.log(fallos ? `\n${fallos} problema(s).` : '\nQA sin problemas.');
  process.exit(fallos ? 1 : 0);
})();
