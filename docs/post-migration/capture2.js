const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const OUT = process.argv[2];
const VIEWPORTS = [
  { name: '390x844',  width: 390,  height: 844 },
  { name: '639x900',  width: 639,  height: 900 },
  { name: '640x900',  width: 640,  height: 900 },
  { name: '1440x900', width: 1440, height: 900 },
];
// Pin every CSS animation/transition to a deterministic end state, and hide the
// two irreducibly-random layers (tsparticles canvas, beam explosion spans).
const FREEZE_CSS = `
  *, *::before, *::after {
    animation-duration: 0s !important;
    animation-delay: 0s !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
  /* Perpetually-animated decorative layers: never pixel-stable by design */
  canvas { visibility: hidden !important; }                      /* tsParticles field */
  .absolute.left-0.top-20.w-px { visibility: hidden !important; } /* beams in flight */
  .absolute.z-50.h-2.w-2 { visibility: hidden !important; }       /* collision debris */
`;
const PROBE = `(() => {
  const out = [];
  document.querySelectorAll('body *').forEach((el) => {
    if (el.tagName === 'CANVAS') { const r0 = el.getBoundingClientRect();
      out.push(['CANVAS','',Math.round(r0.x),Math.round(r0.y),Math.round(r0.width),Math.round(r0.height)].join('|')); return; }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    // Explosion debris: 1x1 tailwind spans with randomised transforms — excluded by design
    if (el.tagName === 'SPAN' && r.width <= 4 && r.height <= 4) return;
    const txt = (el.children.length === 0 ? (el.textContent||'').trim().slice(0,40) : '');
    out.push([el.tagName, txt, Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height),
      cs.fontFamily.slice(0,40), cs.fontSize, cs.fontWeight, cs.color, cs.backgroundImage.slice(0,60)].join('|'));
  });
  return out;
})()`;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ headless: 'new', args: ['--font-render-hinting=none','--force-color-profile=srgb','--hide-scrollbars'] });
  const consoleLog = {};
  for (const vp of VIEWPORTS) {
    const page = await browser.newPage();
    const msgs = [];
    page.on('console', (m) => msgs.push(`[${m.type()}] ${m.text()}`));
    page.on('pageerror', (e) => msgs.push(`[pageerror] ${e.message}`));
    await page.setViewport({ width: vp.width, height: vp.height, deviceScaleFactor: 1 });
    await page.goto(process.env.URL || 'http://localhost:3000/', { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 6000)); // let the one-shot tutorial finish
    await page.screenshot({ path: path.join(OUT, `live-${vp.name}.png`) });
    await page.addStyleTag({ content: FREEZE_CSS });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(OUT, `frozen-${vp.name}.png`) });
    fs.writeFileSync(path.join(OUT, `geometry-${vp.name}.txt`), (await page.evaluate(PROBE)).join('\n'));
    consoleLog[vp.name] = msgs;
    await page.close();
  }
  fs.writeFileSync(path.join(OUT, 'console.json'), JSON.stringify(consoleLog, null, 2));
  await browser.close();
  console.log('captured ->', OUT);
})();
