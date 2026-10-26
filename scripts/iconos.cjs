// Genera los PNG de la PWA a partir de los SVG: node scripts/iconos.cjs
const path = require('path');
const fs = require('fs');
const { chromium } = require('playwright');

const dir = path.resolve(__dirname, '../icons');
const SALIDAS = [
  ['icon.svg', 'icon-192.png', 192],
  ['icon.svg', 'icon-512.png', 512],
  ['icon-maskable.svg', 'icon-maskable-512.png', 512],
  ['icon-maskable.svg', 'apple-touch-icon.png', 180],
];

(async () => {
  const b = await chromium.launch();
  for (const [svg, png, t] of SALIDAS) {
    const p = await b.newPage({ viewport: { width: t, height: t } });
    const datos = fs.readFileSync(path.join(dir, svg), 'utf8');
    await p.setContent(`<style>html,body{margin:0}svg{display:block;width:${t}px;height:${t}px}</style>${datos}`);
    await p.screenshot({ path: path.join(dir, png), omitBackground: true });
    await p.close();
    console.log(png);
  }
  await b.close();
})();
