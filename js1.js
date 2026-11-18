(function(){
'use strict';
/* ============================ ผีนางรำ ============================ */
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,t)=>a+(b-a)*t;
const rnd=(a,b)=>a+Math.random()*(b-a);
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
const TH='๐๑๒๓๔๕๖๗๘๙';
const thNum=n=>String(n).replace(/\d/g,d=>TH[+d]);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const isTouch=!!((window.matchMedia&&matchMedia('(pointer:coarse)').matches)||('ontouchstart' in window));
const r2=v=>Math.round(v*100)/100;
const num=(v,d)=>(typeof v==='number'&&isFinite(v))?v:d;

const ORDER=['ranad','gong','saw','drum'];
const INSTR={
  ranad:{name:'ระนาดเอก',verb:'ตี'},
  gong:{name:'ฆ้องวงใหญ่',verb:'ตี'},
  saw:{name:'ซออู้',verb:'สี'},
  drum:{name:'กลองทัด',verb:'ตี'},
  khlui:{name:'ขลุ่ยเพียงออ',verb:'เป่า'}
};
const SCROLLS=[{title:'บทที่ ๑'},{title:'บทที่ ๒'},{title:'บทที่ ๓'},{title:'บทที่ ๔'}];
const HEADS=['เสียงแรก ปลุกนางจากหลับใหล','เสียงที่สอง ก้องเรียกนางกลับมา','เสียงที่สาม ร้องไห้แทนนาง','เสียงสุดท้าย ปิดการร่ายรำ'];
const CLUES={
  ranad:['แผ่นไม้เรียงเป็นรางโค้ง ดั่งท้องเรือ','ถือไม้ค้อนสองมือ ตีทีละแผ่น','กังวานใส ดุจฝนแรกแห่งฤดู'],
  gong:['ทองเหลืองกลมเรียงล้อม ผู้บรรเลง','ตีเบา ๆ ให้ก้องทั่วเรือน','เสียงเหมือนระฆังที่ไม่มีใครแขวน'],
  saw:['กะลามะพร้าวหุ้มหนัง สองสายตึง','ใช้คันชักสีให้ครวญคร่ำ','ทุ้มต่ำ ราวเสียงคนคิดถึงบ้าน'],
  drum:['ขึงหนังสองหน้า บนไม้ตะเคียน','ตีให้สะเทือนถึงรากเสาเรือน','ส่วนเสียงลมนั้น อย่าเป่าให้นางได้ยิน']
};
const ordArr=()=>String(W.or).split(',');
const shrArr=()=>String(W.so).split(',').map(Number);
const scrollLines=i=>[HEADS[i]].concat(CLUES[ordArr()[i]]||[]);
const barnCode=()=>W.bv?'1621':'2116';
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;};
function randPuzzle(w){w.or=shuf(['ranad','gong','saw','drum']).join(',');w.so=shuf([1,2,4,8]).join(',');w.bv=Math.random()<0.5?0:1;}

const PLAYER_COLORS=['#d9a441','#4fa3a5','#c8553d','#7a9e4b'];
const PHRASES=['ผีอยู่ข้างหลัง!','เจอใบลานแล้ว','มาช่วยตรงนี้','ระวังนะ!'];
const TIPS=['ในลานบ้านมีเรือนครัว ยุ้งข้าว บ่อน้ำ และศาลพระภูมิรออยู่','ถ้าจ้องนางรำอยู่ เธอจะขยับช้าลง','ใบลานแต่ละใบอยู่คนละมุมของเรือน รวมทั้งบนชาน','เสียงกระพรวนดังใกล้ขึ้น แปลว่าเธออยู่ใกล้','เล่นกับเพื่อนได้ สร้างห้องแล้วส่งรหัสให้เพื่อน'];
const ADMIN_SALT='phi-nangram-v1:';
const ADMIN_HASH='1ff18f2fe9e0adc79939dfb1fe08a084e2ae5cf8be3e5002e50b9e15cd7ed61b';
const NIGHT_BG=0x060a11, DAWN_BG=0xa9b3c2;
const EYE=1.62;
/* shared team inventory bits, puzzle flags */
const INV={INCENSE:1,RICE:2,WATER:4,GARLAND:8,CRANK:16,KEY:32,NOTE:64};
const INV_NAMES={1:'ธูป',2:'ข้าวสาร',4:'น้ำมนต์',8:'มาลัย',16:'คันโยกรอก',32:'กุญแจเหล็ก',64:'ใบบันทึกครัว'};
const FL={BARN:1,BLESS:2,GATE:4};
const noteLines=()=>W.bv?
  ['กุญแจยุ้งข้าวไม่มีลูกกุญแจ มีแต่ตัวเลข','หลักหน้า คือจำนวนใบฆ้องที่เรียงเป็นวง','หลักหลัง คือจำนวนแผ่นไม้บนระนาดเอก','อ่านสองจำนวนต่อกันเป็นรหัสสี่หลัก ขลุ่ยไม่ต้องนับ']:
  ['กุญแจยุ้งข้าวไม่มีลูกกุญแจ มีแต่ตัวเลข','หลักหน้า คือจำนวนแผ่นไม้บนระนาดเอก','หลักหลัง คือจำนวนใบฆ้องที่เรียงเป็นวง','อ่านสองจำนวนต่อกันเป็นรหัสสี่หลัก อย่าลืมนับให้ถี่ถ้วน'];
const RIDDLE={1:'สายลมพาควันขึ้นไปบอกฟ้า',2:'ผลแห่งผืนดิน เลี้ยงชีวิตผู้คน',4:'ธารใสที่ชำระใจให้สงบ',8:'กลีบเหลืองร้อยเรียง งามปิดท้ายพิธี'};
const shrineVerse=()=>['วางตามลำดับที่จารึกไว้'].concat(shrArr().map(b=>RIDDLE[b]));
const EV_MSG={
  1:'กุญแจยุ้งข้าวเปิดออกแล้ว! มีของวางอยู่บนม้านั่งหน้ายุ้ง',
  2:'รหัสไม่ถูกต้อง… ลมเย็นพัดผ่านลานบ้าน',
  3:'ต้องมีคันโยกรอกก่อนจึงจะหมุนรอกได้',
  4:'หมุนรอกขึ้นมา… ได้น้ำมนต์และกุญแจเหล็กเก่า',
  5:'เครื่องบูชาถูกวางตามลำดับ… ศาลสั่นไหวเบา ๆ',
  6:'ผิดลำดับ! ศาลสั่นสะเทือน เครื่องบูชาต้องเริ่มใหม่',
  7:'ศาลพระภูมิสว่างวาบ… เจ้าที่ให้พรแล้ว',
  8:'ประตูรั้วเปิดไม่ได้ ต้องมีกุญแจเหล็กและพรจากศาลพระภูมิ',
  9:'ประตูรั้วเปิดออก! แสงแรกของวันเริ่มส่องมาแล้ว',
  11:'บ่อน้ำเงียบสงบ… ไม่มีอะไรเหลืออยู่อีกแล้ว'
};

/* ---------- state ---------- */
const S={mode:'loading',paused:false,modal:null,multi:false,time:0,playTime:0,locked:false,hadLock:false,drag:false,sound:true,
  admin:false,god:false,noclip:false,fast:false,bright:false,esp:false,adminOpen:false,blind:false,xray:false,invis:false,fly:false,pesp:false,fy:null,flyIn:0,slowT:0,freezeT:0,spinT:0,speedMul:1,forceDawn:false,shrineOpen:false,nick:'',colorIdx:0,
  dawn:0,blackout:0,overT:0,winT:0,mistHint:0,fear:0,heart:0,stepT:0,jingleT:0,whisperT:0,spawnedFinale:false,finaleT:0,startedAt:0};
const P={x:0,z:1.6,yaw:0,pitch:0,y:0,bob:0,moving:false,dead:0};
function newWorld(){const w=newWorld0();randPuzzle(w);return w;}
function newWorld0(){return {pr:null,or:'ranad,gong,saw,drum',so:'1,2,4,8',bv:0,v:0,sc:0,sq:0,sv:0,st:0,nv:0,ln:null,ca:null,gs:1,fz:0,rs:0,inv:0,fl:0,of:0,ev:null,gd:0,ga:0,an:null,gh:[0,-4,0,0,0,0]};}
let W=newWorld();
const SEEN={pr:0,sc:0,sq:0,sv:0,nv:0,ca:0,rs:0,st:0,inv:0,fl:0,of:0,ev:0,an:0};

/* ============================ AUDIO ============================ */
const A={ctx:null,master:null,sfx:null,rev:null,noise:null,gp:null,ready:false};
function impulse(ctx,sec,decay){
  const n=Math.floor(ctx.sampleRate*sec),b=ctx.createBuffer(2,n,ctx.sampleRate);
  for(let c=0;c<2;c++){const d=b.getChannelData(c);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,decay);}
  return b;
}
function initAudio(){
  if(A.ctx){if(A.ctx.state==='suspended')A.ctx.resume();return;}
  const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
  try{
    const ctx=new AC();A.ctx=ctx;
    const comp=ctx.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=6;
    A.master=ctx.createGain();A.master.gain.value=S.sound?0.85:0;A.master.connect(comp);comp.connect(ctx.destination);
    const conv=ctx.createConvolver();conv.buffer=impulse(ctx,2.6,2.8);
    A.rev=ctx.createGain();A.rev.gain.value=0.38;A.rev.connect(conv);conv.connect(A.master);
    A.sfx=ctx.createGain();A.sfx.connect(A.master);A.sfx.connect(A.rev);
    const nb=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate),nd=nb.getChannelData(0);
    for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;A.noise=nb;
    const gp=ctx.createPanner();gp.panningModel='HRTF';gp.distanceModel='inverse';gp.refDistance=1.5;gp.rolloffFactor=1.1;gp.connect(A.sfx);A.gp=gp;
    ambient();A.ready=true;
  }catch(e){console.warn('audio',e);}
}
function setSound(on){S.sound=on;if(A.master)A.master.gain.value=on?0.85:0;$('btnSound').textContent='เสียง: '+(on?'เปิด':'ปิด');}
function ambient(){
  const ctx=A.ctx;
  [55,55.6,82.4].forEach((f,i)=>{const o=ctx.createOscillator();o.type=i<2?'sine':'triangle';o.frequency.value=f;const g=ctx.createGain();g.gain.value=i<2?0.05:0.012;o.connect(g);g.connect(A.master);o.start();});
  const ws=ctx.createBufferSource();ws.buffer=A.noise;ws.loop=true;
  const bp=ctx.createBiquadFilter();bp.type='bandpass';bp.frequency.value=420;bp.Q.value=0.7;
  const wg=ctx.createGain();wg.gain.value=0.05;
  const lfo=ctx.createOscillator();lfo.frequency.value=0.11;const lg=ctx.createGain();lg.gain.value=0.035;lfo.connect(lg);lg.connect(wg.gain);lfo.start();
  ws.connect(bp);bp.connect(wg);wg.connect(A.master);ws.start();
  [4300,4650].forEach((f,i)=>{
    const o=ctx.createOscillator();o.type='sine';o.frequency.value=f;
    const g=ctx.createGain();g.gain.value=0.003;
    const m=ctx.createOscillator();m.type='square';m.frequency.value=6.5+i*1.7;
    const mg=ctx.createGain();mg.gain.value=0.003;m.connect(mg);mg.connect(g.gain);
    o.connect(g);g.connect(A.master);o.start();m.start();
  });
}
function noiseBurst(dest,o){
  if(!A.ready)return;o=o||{};
  const ctx=A.ctx,t0=ctx.currentTime+(o.t||0),dur=o.dur||0.1;
  const s=ctx.createBufferSource();s.buffer=A.noise;s.loop=true;
  const flt=ctx.createBiquadFilter();flt.type=o.type||'bandpass';flt.frequency.setValueAtTime(o.f||1000,t0);
  if(o.sweep)flt.frequency.exponentialRampToValueAtTime(o.sweep,t0+dur);
  flt.Q.value=o.q||1;
  const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(o.gain||0.3,t0+Math.min(0.01,dur/3));
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  s.connect(flt);flt.connect(g);g.connect(dest||A.sfx);s.start(t0,Math.random());s.stop(t0+dur+0.05);
}
function tone(dest,o){
  if(!A.ready)return;o=o||{};
  const ctx=A.ctx,t0=ctx.currentTime+(o.t||0),a=o.a||0.01,d=o.d||0.5;
  const os=ctx.createOscillator();os.type=o.type||'sine';os.frequency.setValueAtTime(o.f||440,t0);
  if(o.slide)os.frequency.exponentialRampToValueAtTime(o.slide,t0+a+d);
  os.detune.value=o.det||0;
  const g=ctx.createGain();g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(o.gain||0.3,t0+a);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+a+d);
  let node=os;
  if(o.lp){const fl=ctx.createBiquadFilter();fl.type='lowpass';fl.frequency.value=o.lp;os.connect(fl);node=fl;}
  if(o.vib){const l=ctx.createOscillator();l.frequency.value=o.vib.rate;const lg=ctx.createGain();lg.gain.value=o.vib.depth;l.connect(lg);lg.connect(os.frequency);l.start(t0);l.stop(t0+a+d+0.1);}
  node.connect(g);g.connect(dest||A.sfx);os.start(t0);os.stop(t0+a+d+0.1);
}
function sndInstr(id){
  if(!A.ready)return;const d=A.sfx;
  if(id==='ranad'){const f=587.3;tone(d,{f:f,type:'triangle',d:1.1,gain:0.45});tone(d,{f:f*3,d:0.5,gain:0.15});tone(d,{f:f*6.1,d:0.2,gain:0.07});noiseBurst(d,{dur:0.04,f:2500,q:2,gain:0.25});}
  else if(id==='gong'){const f=196;[1,2.0,2.76,4.07,5.4].forEach((r,i)=>tone(d,{f:f*r,a:0.005,d:3.6/(1+i*0.5),gain:0.32/(1+i*0.5),det:i*3}));noiseBurst(d,{dur:0.08,f:1800,q:1,gain:0.2});}
  else if(id==='saw'){const f=392;tone(d,{f:f,type:'sawtooth',a:0.15,d:1.3,gain:0.2,lp:1700,vib:{rate:5.6,depth:7}});tone(d,{f:f*1.004,type:'sawtooth',a:0.15,d:1.3,gain:0.15,lp:1500,vib:{rate:5.6,depth:7}});}
  else if(id==='drum'){tone(d,{f:170,a:0.004,d:0.45,gain:0.9,slide:62});noiseBurst(d,{dur:0.22,f:260,q:0.8,gain:0.5});noiseBurst(d,{dur:0.05,f:3000,q:1,gain:0.2});}
  else if(id==='khlui'){const f=740;tone(d,{f:f,a:0.09,d:1.2,gain:0.3,vib:{rate:5,depth:6}});tone(d,{f:f*2,a:0.09,d:1.0,gain:0.06});noiseBurst(d,{dur:1.2,f:3200,q:3,gain:0.05});}
}
function sndWrong(){
  if(!A.ready)return;const d=A.sfx;
  [55,58.3,82.4,87].forEach((f,i)=>tone(d,{f:f,type:'sawtooth',a:0.05,d:1.8,gain:0.18,lp:500+i*80}));
  noiseBurst(d,{dur:1.4,f:300,sweep:4000,q:0.8,gain:0.4});
}
function sndGood(){
  if(!A.ready)return;const d=A.sfx;
  [880,1318.5,1760].forEach((f,i)=>tone(d,{f:f,t:i*0.09,d:1.2,gain:0.12}));
}
function sndScream(){
  if(!A.ready)return;const d=A.sfx;
  noiseBurst(d,{dur:0.9,f:500,sweep:7000,q:0.6,gain:0.9});
  [700,1050,1500].forEach(f=>tone(d,{f:f,type:'sawtooth',a:0.02,d:1.2,gain:0.3,slide:f*2.1}));
  tone(d,{f:45,a:0.01,d:1.2,gain:1.0});
}
function sndJingle(){
  if(!A.ready)return;
  const f=rnd(2600,3700);
  tone(A.gp,{f:f,d:0.45,gain:0.08});tone(A.gp,{f:f*1.51,d:0.3,gain:0.05,t:0.03});
}
function sndWhisper(){
  if(!A.ready)return;
  noiseBurst(A.gp,{dur:1.6,f:1400,sweep:2600,q:5,gain:0.1});
  noiseBurst(A.gp,{dur:1.2,f:2200,sweep:1100,q:6,gain:0.07,t:0.4});
}
function sndThump(v){
  if(!A.ready)return;
  tone(A.sfx,{f:62,a:0.005,d:0.18,gain:0.5*v,slide:38});tone(A.sfx,{f:62,t:0.17,a:0.005,d:0.16,gain:0.35*v,slide:36});
}
function sndStep(){noiseBurst(A.sfx,{dur:0.09,f:rnd(180,320),q:2,gain:0.07});}
function sndPaper(){noiseBurst(A.sfx,{dur:0.35,f:3500,sweep:1800,q:0.8,gain:0.18});}
function sndFinale(){
  if(!A.ready)return;const d=A.sfx;
  const mel=[587,659,784,880,784,659,587,523,587,784,880,1175];
  mel.forEach((f,i)=>tone(d,{f:f,type:'triangle',t:i*0.55,d:1.2,gain:0.3}));
  [196,147].forEach((f,i)=>[1,2.0,2.76,4.07].forEach((r,k)=>tone(d,{f:f*r,t:i*3.3,a:0.01,d:3.5/(1+k*0.5),gain:0.2/(1+k*0.5)})));
  tone(d,{f:392,type:'sawtooth',t:1.1,a:0.3,d:3.6,gain:0.1,lp:1500,vib:{rate:5.4,depth:6}});
}
function pannerPos(p,x,y,z){if(!p)return;if(p.positionX){p.positionX.value=x;p.positionY.value=y;p.positionZ.value=z;}else if(p.setPosition)p.setPosition(x,y,z);}
function updateListener(x,y,z,yaw,pitch){
  if(!A.ready)return;const L=A.ctx.listener;
  const fx=-Math.sin(yaw)*Math.cos(pitch),fy=Math.sin(pitch),fz=-Math.cos(yaw)*Math.cos(pitch);
  if(L.positionX){L.positionX.value=x;L.positionY.value=y;L.positionZ.value=z;L.forwardX.value=fx;L.forwardY.value=fy;L.forwardZ.value=fz;L.upX.value=0;L.upY.value=1;L.upZ.value=0;}
  else if(L.setPosition){L.setPosition(x,y,z);L.setOrientation(fx,fy,fz,0,1,0);}
}
