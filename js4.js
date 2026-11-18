
/* ============================ GAME LOGIC ============================ */
const keys={};
const touch={mx:0,mz:0,run:false,joy:null,look:null};
const NET={api:null,room:null,on:false,code:'',me:'',peers:[],isHost:true,hostPeer:null,jt:0,acc:0,rqK:0,chK:0,seenPeers:{},rq:{},ch:{},creating:false};
const G={state:'dormant',timer:20,x:0,z:-4,alpha:0,life:0,stare:0,reach:0,yaw:0,finT:0,warned:false};
const GV={x:0,z:-4,a:0,st:0,reach:0,yaw:0};
let prevGvSt=0;

const myId=()=>NET.on?NET.me:'me';
const bits=n=>((n&1)?1:0)+((n&2)?1:0)+((n&4)?1:0)+((n&8)?1:0);
function nameOf(id){
  if(id===myId())return S.nick;
  const p=NET.peers.find(q=>q.peer===id);
  return p&&typeof p.presence.n==='string'?p.presence.n.slice(0,12):'เพื่อน';
}

/* ---------- movement / collision ---------- */
function walkable(x,z){
  if(x>-5.7&&x<5.7&&z>-3.7&&z<3.7)return true;
  if(Math.abs(x)<1.15&&z>=3.7&&z<=4.4)return true;
  if(x>-5.7&&x<5.7&&z>=4.4&&z<8.2)return true;
  if(Math.abs(x)<1.05&&z>=8.2&&z<=(W.sv?11.2:8.9))return true;
  if(W.sv&&x>-12.5&&x<12.5&&z>11.0&&z<26.0)return true;
  if((W.fl&FL.GATE)&&Math.abs(x)<1.4&&z>=26.0&&z<=29.6)return true;
  return false;
}
function blocked(x,z){
  const r=0.28;
  if(!walkable(x-r,z-r)||!walkable(x+r,z-r)||!walkable(x-r,z+r)||!walkable(x+r,z+r))return true;
  for(let i=0;i<colliders.length;i++){const c=colliders[i];if(x>c.x0-r&&x<c.x1+r&&z>c.z0-r&&z<c.z1+r)return true;}
  return false;
}
const groundY=z=>z<=8.4?0:-(Math.min(z,11.2)-8.4)*0.9;

function movePlayer(dt){
  const f=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+touch.mz;
  const s=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0)+touch.mx;
  let len=Math.hypot(f,s);P.moving=len>0.05;
  if(!P.moving)return;
  const fw=f/Math.max(1,len),st=s/Math.max(1,len);
  const run=keys.ShiftLeft||keys.ShiftRight||touch.run;
  const sp=(run?4.0:2.5)*(S.fast?2:1)*S.speedMul*((S.noclip||S.fly)?1.5:1)*(S.slowT>0?0.35:1);
  const sn=Math.sin(P.yaw),cs=Math.cos(P.yaw);
  const dx=(-sn*fw+cs*st)*sp*dt,dz=(-cs*fw-sn*st)*sp*dt;
  if(S.noclip||S.fly){P.x=clamp(P.x+dx,-30,30);P.z=clamp(P.z+dz,-30,30);}
  else{
    const stuck=blocked(P.x,P.z);
    if(stuck||!blocked(P.x+dx,P.z))P.x+=dx;
    if(stuck||!blocked(P.x,P.z+dz))P.z+=dz;
  }
  P.bob+=dt*(run?10:7);
  S.stepT-=dt;if(S.stepT<=0){sndStep();S.stepT=run?0.32:0.5;}
}

/* ---------- ui helpers ---------- */
let sayTimer=0;
function say(t,ms){
  const el=$('sub');el.textContent=t;el.classList.add('on');clearTimeout(sayTimer);sayTimer=setTimeout(()=>el.classList.remove('on'),ms||4200);
}
function updateInv(){
  const el2=$('inv');el2.textContent='';
  [1,2,4,8,16,32,64].forEach(b=>{if(W.inv&b){const c=document.createElement('span');c.className='chip';c.textContent=INV_NAMES[b];el2.appendChild(c);}});
}
function refreshObjective(){
  const n=bits(W.sc);let t;
  if(W.fl&FL.GATE)t='เดินออกประตูรั้วไปรับแสงอรุณ';
  else if(W.sv){
    const need=[];
    if(!(W.inv&INV.KEY))need.push('กุญแจเหล็ก');
    if(!(W.fl&FL.BLESS))need.push('พรจากศาลพระภูมิ');
    t=need.length?'เปิดประตูรั้วท้ายลานบ้านให้ได้ ยังต้องมี: '+need.join(' และ '):'ไปที่ประตูรั้วท้ายลานบ้านแล้วเปิดออก';
  }
  else if(n<4)t='ค้นหาใบลานให้ครบ ๔ ใบ ในเรือนและบนชาน ('+thNum(n)+'/๔)';
  else t='ใบลานครบแล้ว บรรเลงเครื่องดนตรีตามลำดับบทที่ ๑ ถึง ๔';
  $('objText').textContent=t;$('scCount').textContent=thNum(n)+'/๔';
  updateInv();
}
function updateSlots(bad){
  const el=$('slots');[].forEach.call(el.children,(c,i)=>c.classList.toggle('lit',i<W.sq||!!W.sv));
  el.classList.toggle('bad',!!bad);if(bad)setTimeout(()=>el.classList.remove('bad'),900);
}
function makeLeaf(i,found){
  const d=document.createElement('div');d.className='leaf'+(found?'':' empty');
  const h=document.createElement('h3');h.textContent=SCROLLS[i].title;d.appendChild(h);
  if(found)scrollLines(i).forEach(l=>{const p=document.createElement('p');p.textContent=l;d.appendChild(p);});
  else{const p=document.createElement('p');p.textContent='ยังไม่พบใบลานใบนี้';d.appendChild(p);}
  return d;
}
function makeTextLeaf(title,lines){
  const d=document.createElement('div');d.className='leaf';
  const h=document.createElement('h3');h.textContent=title;d.appendChild(h);
  lines.forEach(l=>{const p=document.createElement('p');p.textContent=l;d.appendChild(p);});return d;
}
function openModal(){
  S.modal=true;S.paused=false;
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  $('scrollModal').hidden=false;
}
function closeModal(){
  if(!S.modal)return;
  S.modal=false;S.shrineOpen=false;$('scrollModal').hidden=true;
  if(S.hadLock&&!isTouch)lockPointer();
}
function openScroll(i){
  const b=$('scrollBody');b.textContent='';b.appendChild(makeLeaf(i,true));
  const row=document.createElement('div');row.className='row';const bt=document.createElement('button');bt.className='btn';bt.type='button';bt.textContent='เก็บใบลาน';bt.addEventListener('click',closeModal);row.appendChild(bt);b.appendChild(row);
  openModal();bt.focus();
}
function openJournal(){
  const b=$('scrollBody');b.textContent='';
  const h=document.createElement('h2');h.textContent='ใบลานของทีม';b.appendChild(h);
  for(let i=0;i<4;i++)b.appendChild(makeLeaf(i,!!(W.sc&(1<<i))));
  if(W.inv&INV.NOTE)b.appendChild(makeTextLeaf('ใบบันทึกในครัว',noteLines()));
  const row=document.createElement('div');row.className='row';const bt=document.createElement('button');bt.className='btn';bt.type='button';bt.textContent='ปิด';bt.addEventListener('click',closeModal);row.appendChild(bt);b.appendChild(row);
  openModal();bt.focus();
}

