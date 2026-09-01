const fs=require('fs'),path=require('path'),{PNG}=require('pngjs');
const [,,A,B,LABEL]=process.argv;
const VPS=['390x844','639x900','640x900','1440x900'];
const TOL=3;            // px tolerance: absorbs sub-pixel animation settle jitter
const MAX_STRONG=0.05;  // % strongly-differing pixels allowed (measured noise floor: 0.005%)
const MAX_DIFF=1.0;     // % any-differing pixels allowed (measured noise floor: 0.47%)
let fail=0;
console.log(`\n===== VISUAL CONTRACT: ${LABEL||A+' vs '+B} =====`);
for(const vp of VPS){
  const ga=fs.readFileSync(path.join(A,`geometry-${vp}.txt`),'utf8').split('\n');
  const gb=fs.readFileSync(path.join(B,`geometry-${vp}.txt`),'utf8').split('\n');
  const diffs=[];
  if(ga.length!==gb.length) diffs.push(`ELEMENT COUNT: ${ga.length} -> ${gb.length}`);
  for(let i=0;i<Math.min(ga.length,gb.length);i++){
    const fa=ga[i].split('|'), fb=gb[i].split('|');
    // fields: 0 tag, 1 text, 2 x, 3 y, 4 w, 5 h, 6 fontFamily, 7 fontSize, 8 weight, 9 color, 10 gradient
    const hard=[0,1,6,7,8,9,10];
    for(const k of hard) if((fa[k]||'')!==(fb[k]||'')) { diffs.push(`[${vp} #${i}] field${k}: "${fa[k]}" -> "${fb[k]}"`); break; }
    for(const k of [2,3,4,5]) if(Math.abs((+fa[k]||0)-(+fb[k]||0))>TOL){ diffs.push(`[${vp} #${i}] ${fa[0]}"${(fa[1]||'').slice(0,20)}" geom ${fa.slice(2,6).join(',')} -> ${fb.slice(2,6).join(',')}`); break; }
  }
  const ia=PNG.sync.read(fs.readFileSync(path.join(A,`frozen-${vp}.png`)));
  const ib=PNG.sync.read(fs.readFileSync(path.join(B,`frozen-${vp}.png`)));
  let d1=0,strong=0;
  if(ia.width!==ib.width||ia.height!==ib.height){ diffs.push('DIMENSION MISMATCH'); }
  else for(let i=0;i<ia.data.length;i+=4){
    const d=Math.abs(ia.data[i]-ib.data[i])+Math.abs(ia.data[i+1]-ib.data[i+1])+Math.abs(ia.data[i+2]-ib.data[i+2]);
    if(d>12){d1++; if(d>90)strong++;}
  }
  const tot=ia.width*ia.height, pct=d1/tot*100, spct=strong/tot*100;
  const ok = diffs.length===0 && spct<=MAX_STRONG && pct<=MAX_DIFF;
  if(!ok) fail++;
  console.log(`\n### ${vp}  ${ok?'PASS':'*** FAIL ***'}`);
  console.log(`  contract elements : ${ga.length}`);
  console.log(`  geometry/typography: ${diffs.length===0?'IDENTICAL (within '+TOL+'px)':diffs.length+' DIFFERENCES'}`);
  diffs.slice(0,10).forEach(d=>console.log('    '+d));
  console.log(`  frozen pixels     : ${pct.toFixed(4)}% differ / ${spct.toFixed(4)}% strong  (limit ${MAX_DIFF}% / ${MAX_STRONG}%)`);
}
console.log(fail?`\nRESULT: ${fail} viewport(s) FAILED`:'\nRESULT: ALL VIEWPORTS PASS');
