const puppeteer=require('puppeteer');
const SECTIONS=['hero','about','projects','testimonials','contact'];
(async()=>{
const b=await puppeteer.launch({headless:'new',args:['--hide-scrollbars']});
const all=[];
for(const vp of [{n:'390x844 (mobile - tutorial visible)',w:390,h:844},{n:'1440x900 (desktop)',w:1440,h:900}]){
  const p=await b.newPage();
  const msgs=[];
  p.on('console',m=>{const t=m.text();
    if(/cannot contain a nested|cannot be a descendant|hydrat|validateDOMNesting|Warning:|In HTML,/i.test(t)) msgs.push(t.replace(/\s+/g,' ').slice(0,160));});
  p.on('pageerror',e=>msgs.push('[pageerror] '+e.message.slice(0,160)));
  await p.setViewport({width:vp.w,height:vp.h});
  await p.goto('http://localhost:3000/',{waitUntil:'networkidle0',timeout:90000});
  await p.evaluate(()=>document.fonts.ready);
  await new Promise(r=>setTimeout(r,7000));           // let the tutorial mount AND unmount
  for(const s of SECTIONS){
    await p.evaluate(sec=>{const btn=[...document.querySelectorAll('button[aria-label]')].find(b=>b.getAttribute('aria-label')===`Go to ${sec} section`);btn&&btn.click()},s);
    await new Promise(r=>setTimeout(r,1600));
  }
  all.push({vp:vp.n,msgs:[...new Set(msgs)]});
  await p.close();
}
for(const r of all){console.log('\n### '+r.vp);console.log(r.msgs.length?r.msgs.map(m=>'  ✗ '+m).join('\n'):'  ✓ no nesting/hydration warnings');}
await b.close();})();
