/* ---------- host-authoritative world ---------- */
function allPlayers(){
  const arr=[{id:myId(),x:P.x,z:P.z,yaw:P.yaw,im:S.god,ib:S.blind||S.invis,alive:!S.caught}];
  if(NET.on)NET.peers.forEach(p=>{
    if(p.peer===NET.me)return;
    const q=p.presence.p;if(!Array.isArray(q))return;
    arr.push({id:p.peer,x:num(q[0],0),z:num(q[1],0),yaw:num(q[2],0),im:p.presence.im===1,ib:p.presence.ib===1,alive:p.presence.dd!==1});
  });
  return arr;
}
function pickSpawn(p,minD,maxD,behind){
  for(let i=0;i<60;i++){
    const a=Math.random()*Math.PI*2,d=rnd(minD,maxD),x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;
    if(!walkable(x,z))continue;
    const vx=-Math.sin(p.yaw),vz=-Math.cos(p.yaw),dot=((x-p.x)*vx+(z-p.z)*vz)/d;
    if(behind?dot>0.1:dot>0.55)continue;
    return {x:x,z:z};
  }
  for(let i=0;i<60;i++){
    const a=Math.random()*Math.PI*2,d=rnd(minD*0.6,maxD),x=p.x+Math.cos(a)*d,z=p.z+Math.sin(a)*d;
    if(walkable(x,z))return {x:x,z:z};
  }
  return {x:p.x,z:p.z>0?p.z-3:p.z+3};
}
function ghostReset(){G.state='dormant';G.timer=20;G.alpha=0;G.life=0;G.stare=0;G.reach=0;G.finT=0;G.warned=false;G.x=0;G.z=-4;G.fin='';}
function ghostBanish(sec){if(G.state==='manifest'||G.state==='dormant'||G.state==='banished'){G.state='banished';G.timer=sec;G.warned=false;}}
function ghostSpawnNear(p,minD,maxD,behind,stare){
  const sp=pickSpawn(p,minD,maxD,behind);G.x=sp.x;G.z=sp.z;G.state='manifest';G.life=rnd(26,40);G.stare=stare||2;G.warned=false;G.blink=rnd(8,14);
}
function startFinale(kind){
  G.state='finale';G.fin=kind;G.finT=kind==='end'?13:11;G.stare=0;G.reach=0;
  if(kind==='end'){G.x=0;G.z=21;}else{G.x=0;G.z=-1.4;}
}
function hostEv(by,t){W.ev=[(W.ev?W.ev[0]:0)+1,by,t];W.v++;}
function punish(by,a,b){
  if(W.gd||(W.fl&FL.GATE)||G.state==='finale')return;
  const all=allPlayers(),pl=all.find(q=>q.id===by)||all[0];
  if(pl)ghostSpawnNear(pl,a,b,true,1.6);
}
function hostScroll(by,idx){const bit=1<<(idx&3);if(!(W.sc&bit)){W.sc|=bit;W.v++;}}
function hostNote(by,id){
  W.nv++;W.v++;
  if(W.sv){W.ln=[by,id,1];return;}
  const ORDER=ordArr();
  if(id===ORDER[W.sq]){
    W.sq++;
    if(W.sq>=ORDER.length){W.ln=[by,id,2];W.sv=1;startFinale('hall');}
    else{W.ln=[by,id,1];ghostBanish(14);}
  }else{
    W.sq=0;W.ln=[by,id,0];punish(by,3.6,5);
  }
}
function hostPick(by,bit){
  if(!INV_NAMES[bit]||(W.inv&bit))return;
  if((bit===INV.RICE||bit===INV.CRANK)&&!(W.fl&FL.BARN))return;
  W.inv|=bit;W.v++;
}
function hostCode(by,str){
  if(W.fl&FL.BARN)return;
  if(String(str)===barnCode()){W.fl|=FL.BARN;hostEv(by,1);}
  else{hostEv(by,2);punish(by,5,7);}
}
function hostWell(by){
  if(!(W.inv&INV.CRANK)){hostEv(by,3);return;}
  if(!(W.inv&INV.KEY)){W.inv|=INV.WATER|INV.KEY;hostEv(by,4);}
  else hostEv(by,11);
}
function hostShrine(by,off){
  if(W.fl&FL.BLESS)return;
  const SO=shrArr();
  if(SO.indexOf(off)<0||!(W.inv&off))return;
  if(off===SO[W.of]){
    W.of++;
    if(W.of>=SO.length){W.fl|=FL.BLESS;hostEv(by,7);}else hostEv(by,5);
  }else{W.of=0;hostEv(by,6);punish(by,5,7);}
  W.v++;
}
function hostGate(by){
  if(W.fl&FL.GATE)return;
  if((W.inv&INV.KEY)&&(W.fl&FL.BLESS)){W.fl|=FL.GATE;hostEv(by,9);startFinale('end');}
  else hostEv(by,8);
}
function hostAdmin(by,cmd,arg){
  const all=allPlayers(),me=all.find(q=>q.id===by)||all[0];
  switch(cmd){
    case 'sc':W.sc=15;break;
    case 'solvehall':W.sc=15;W.sq=4;if(!W.sv){W.sv=1;W.nv++;W.ln=[by,'drum',2];startFinale('hall');}break;
    case 'give':W.inv|=(arg==='all'?127:((arg|0)&127));break;
    case 'barn':W.fl|=FL.BARN;break;
    case 'bless':W.fl|=FL.BLESS;W.of=4;break;
    case 'gate':if(!(W.fl&FL.GATE)){W.fl|=FL.GATE;startFinale('end');}break;
    case 'win':W.sc=15;W.sq=4;W.sv=1;W.inv=127;W.of=4;if(!(W.fl&FL.GATE)){W.fl=7;startFinale('end');}break;
    case 'banish':ghostBanish(clamp(num(arg,60),1,600));break;
    case 'summon':{
      const sp=String(arg==null?'near':arg).split('|'),tg=sp[1]?all.find(q=>q.id===sp[1]):me,pl=tg||me;
      if(pl&&!(W.fl&FL.GATE)){W.gd=0;const m=sp[0];
        if(m==='close')ghostSpawnNear(pl,2.4,3.4,false,0.8);else if(m==='behind')ghostSpawnNear(pl,3,4.5,true,1.2);else ghostSpawnNear(pl,6,9,false,1.5);}
      break;}
    case 'prank':{
      const sp=String(arg||'').split('|'),ty=parseInt(sp[0],10)||0;
      if(ty>=1&&ty<=8)W.pr=[(W.pr?W.pr[0]:0)+1,String(sp[1]||'*'),ty,by,me?r2(me.x):0,me?r2(me.z):0];
      break;}
    case 'kill':if(G.state!=='finale'){G.state='dormant';G.timer=20;G.alpha=0;G.warned=false;}break;
    case 'speed':W.gs=clamp(num(arg,1),0.2,5);break;
    case 'freeze':W.fz=W.fz?0:1;break;
    case 'gd':W.gd=(arg===1||arg==='1')?1:0;break;
    case 'ga':W.ga=(arg===1||arg==='1')?1:0;break;
    case 'announce':W.an=[(W.an?W.an[0]:0)+1,String(arg==null?'':arg).slice(0,80)];break;
    case 'reset':randPuzzle(W);W.sc=0;W.sq=0;W.sv=0;W.inv=0;W.fl=0;W.of=0;W.ln=null;W.fz=0;W.gd=0;W.ga=0;W.rs++;ghostReset();G.timer=12;break;
    default:break;
  }
  W.v++;
}
function hostGhost(dt){
  const pls=allPlayers().filter(p=>p.alive&&!p.ib);
  const ended=!!(W.fl&FL.GATE);
  let target=0;
  if(W.gd&&G.state==='manifest'){G.state='dormant';G.timer=5;}
  if(G.state==='dormant'||G.state==='banished'){
    if(!W.fz&&!W.gd&&!ended){
      G.timer-=dt;
      if(W.ga&&G.timer>1.2)G.timer=1.2;
      if(G.timer<2.6&&!G.warned)G.warned=true;
      if(G.timer<=0&&pls.length){const p=pls[Math.floor(Math.random()*pls.length)];ghostSpawnNear(p,7,11,false,2.2);}
    }
  }else if(G.state==='manifest'){
    target=1;
    if(!pls.length){G.state='dormant';G.timer=6;}
    else{
      let best=null,bd=1e9;
      pls.forEach(p=>{const d=Math.hypot(p.x-G.x,p.z-G.z);if(d<bd){bd=d;best=p;}});
      if(G.stare>0)G.stare-=dt;
      else if(!W.fz){
        let seen=false;
        for(let i=0;i<pls.length;i++){
          const p=pls[i],dx=G.x-p.x,dz=G.z-p.z,d=Math.hypot(dx,dz);
          if(d<14&&d>0.01){const vx=-Math.sin(p.yaw),vz=-Math.cos(p.yaw);if((dx*vx+dz*vz)/d>0.84){seen=true;break;}}
        }
        const ramp=Math.min(0.7,S.playTime/240*0.7);
        let sp=seen?0.5:1.2+ramp;if(bd>9)sp*=1.5;sp*=(W.gs||1);
        if(bd>0.01){G.x+=(best.x-G.x)/bd*sp*dt;G.z+=(best.z-G.z)/bd*sp*dt;}
      }
      G.yaw=Math.atan2(best.x-G.x,best.z-G.z);
      G.reach=lerp(G.reach,bd<4?1:0,Math.min(1,dt*2));
      if(!W.ga)G.life-=dt;
      G.blink-=dt;
      if(G.blink<=0&&bd>3.2&&!W.fz&&G.stare<=0){G.state='dormant';G.timer=rnd(2.2,4.5);G.warned=false;G.blink=rnd(8,14);}
      if(G.life<=0){G.state='dormant';G.timer=rnd(7,11);G.warned=false;}
      if(bd<1.05&&!best.im&&G.stare<=0&&!W.fz){
        W.ca=[best.id,(W.ca?W.ca[1]:0)+1];W.sq=0;W.v++;
        G.state='banished';G.timer=14;G.warned=false;
      }
    }
  }else if(G.state==='finale'){
    target=1;G.finT-=dt;G.yaw=Math.sin(S.time*0.7)*0.5;G.reach=0;
    if(G.finT<2.5)target=0;
    if(G.finT<=0){if(G.fin==='end')G.state='gone';else{G.state='banished';G.timer=40;G.warned=false;}}
  }
  G.alpha=lerp(G.alpha,target,Math.min(1,dt*(target>G.alpha?2.2:1.4)));
  if(G.alpha<0.01&&target===0)G.alpha=0;
  let code=0;
  if(G.state==='manifest')code=1;else if(G.state==='finale')code=2;else if((G.state==='dormant'||G.state==='banished')&&G.warned)code=3;
  W.gh=[r2(G.x),r2(G.z),r2(G.alpha),code,r2(G.reach),r2(G.yaw)];
}
function hostProcessPeer(p){
  const rq=p.presence.rq;if(!rq||typeof rq.k!=='number')return;
  if(NET.rq[p.peer]===undefined){NET.rq[p.peer]=rq.k;return;}
  if(NET.rq[p.peer]===rq.k)return;
  NET.rq[p.peer]=rq.k;
  const a=rq.a,b=rq.b,t=rq.t,id=p.peer;
  if(t==='sc')hostScroll(id,a|0);
  else if(t==='nt'&&typeof a==='string'&&INSTR[a])hostNote(id,a);
  else if(t==='pk')hostPick(id,a|0);
  else if(t==='cd'&&typeof a==='string')hostCode(id,a.slice(0,8));
  else if(t==='wl')hostWell(id);
  else if(t==='sh')hostShrine(id,a|0);
  else if(t==='gt')hostGate(id);
  else if(t==='ad'&&p.presence.ad===1&&typeof a==='string')hostAdmin(id,a,b);
}
function reqSend(t,a,b,fn){
  if(NET.on&&!NET.isHost){NET.rqK++;NET.room.presence({rq:{k:NET.rqK,t:t,a:a==null?null:a,b:b==null?null:b}}).catch(function(){});}
  else fn(myId(),a,b);
}
const reqScroll=i=>reqSend('sc',i,null,hostScroll);
const reqNote=id=>reqSend('nt',id,null,hostNote);
const reqPick=bit=>reqSend('pk',bit,null,hostPick);
const reqCode=str=>reqSend('cd',str,null,hostCode);
const reqWell=()=>reqSend('wl',null,null,hostWell);
const reqShrine=bit=>reqSend('sh',bit,null,hostShrine);
const reqGate=()=>reqSend('gt',null,null,hostGate);
const reqAdmin=(cmd,arg)=>reqSend('ad',cmd,arg,hostAdmin);

/* ---------- reacting to world changes ---------- */
function flashItem(id){const it=items.find(i=>i.id===id);if(it)it.flash=1;}
function itemActive(it){return !it.taken&&(!it.req||!!(W.fl&it.req));}
function syncItems(){
  items.forEach(it=>{
    if(it.kind==='scroll')it.taken=!!(W.sc&(1<<it.idx));
    else if(it.kind==='pick')it.taken=!!(W.inv&it.bit);
    else if(it.kind==='lock')it.taken=!!(W.fl&FL.BARN);
    else if(it.kind==='gate')it.taken=!!(W.fl&FL.GATE);
    if(it.mesh)it.mesh.visible=itemActive(it);
  });
}
function applyWorld(){
  if(W.sc!==SEEN.sc||W.inv!==SEEN.inv||W.fl!==SEEN.fl){
    const oldSc=SEEN.sc;SEEN.sc=W.sc;SEEN.inv=W.inv;SEEN.fl=W.fl;
    syncItems();
    if(bits(W.sc)>bits(oldSc)&&bits(W.sc)===4&&!W.sv)say('ใบลานครบทั้งสี่ใบแล้ว… ได้เวลาบรรเลง',5200);
    refreshObjective();
    if(S.shrineOpen)renderShrine();
  }
  if(W.pr&&W.pr[0]!==SEEN.pr){SEEN.pr=W.pr[0];onPr(W.pr);}
  if(W.of!==SEEN.of){SEEN.of=W.of;if(S.shrineOpen)renderShrine();}
  if(W.sq!==SEEN.sq){SEEN.sq=W.sq;updateSlots(false);}
  if(W.nv!==SEEN.nv){SEEN.nv=W.nv;onNote(W.ln);}
  if(W.sv!==SEEN.sv){SEEN.sv=W.sv;if(W.sv)onSolved();refreshObjective();updateSlots(false);}
  if(W.ca&&W.ca[1]!==SEEN.ca){SEEN.ca=W.ca[1];onCaughtEvent(W.ca[0]);updateSlots(true);}
  if(W.ev&&W.ev[0]!==SEEN.ev){SEEN.ev=W.ev[0];onEv(W.ev);}
  if(W.an&&W.an[0]!==SEEN.an){SEEN.an=W.an[0];say('ประกาศ: '+W.an[1],6000);}
  if(W.rs!==SEEN.rs){SEEN.rs=W.rs;resetLocalWorld(false);}
}
function onNote(ln){
  if(!ln)return;
  const by=ln[0],id=ln[1],ok=ln[2];
  if(by!==myId()&&INSTR[id]){sndInstr(id);flashItem(id);if(NET.on)say(nameOf(by)+' บรรเลง'+INSTR[id].name,2200);}
  if(ok===0){S.blackout=1.3;sndWrong();updateSlots(true);say('เสียงผิด! นางรำโกรธแล้ว… ลำดับเริ่มใหม่',4200);}
  else if(ok===1&&!W.sv){sndGood();say('ถูกต้อง… เสียงที่ '+thNum(W.sq)+' ก้องไปทั่วเรือน นางถอยห่างไปชั่วครู่',4200);}
}
function onEv(ev){
  const t=ev[2],msg=EV_MSG[t];if(!msg)return;
  say((NET.on&&ev[1]!==myId()?nameOf(ev[1])+': ':'')+msg,5200);
  if(t===1||t===4||t===5||t===7)sndGood();
  else if(t===2||t===6){S.blackout=1.0;sndWrong();}
  else if(t===9)sndFinale();
  if(t===7)YARD.blessFlash=1;
}
function onSolved(){
  sndFinale();
  say('เสียงดนตรีครบทั้งสี่ นางรำร่ายรำแล้วค่อย ๆ จางหาย… หมอกที่บันไดเรือนสลายไป แต่ลานบ้านเบื้องล่างยังมีบางอย่างรออยู่',9000);
}
function onCaughtEvent(id){
  if(id===myId())triggerCaught();
  else say(nameOf(id)+' ถูกนางรำจับ!',3500);
}
function onPr(pr){
  const tg=pr[1],me=myId();
  if(!(tg===me||(tg==='*'&&pr[3]!==me)))return;
  if(pr[3]===me)return;
  const t=pr[2];
  if(t===1){say('นางรำโผล่มาตรงหน้าคุณ!',2500);triggerCaught();}
  else if(t===2){S.blackout=Math.max(S.blackout,6);sndWhisper();say('ไฟทุกดวงดับวูบ…',3000);}
  else if(t===3){S.slowT=10;say('ขาหนักอึ้ง ก้าวไม่ออก…',3000);}
  else if(t===4){S.freezeT=4;sndThump(1);say('ตัวแข็งเป็นหิน ขยับไม่ได้!',3000);}
  else if(t===5){S.spinT=2.4;say('โลกหมุนติ้ว…',2500);}
  else if(t===6){sndWhisper();[0.5,0.9,1.3].forEach(d=>setTimeout(sndJingle,d*1000));say('มีเสียงกระซิบข้างหู…',3000);}
  else if(t===7){P.x=num(pr[4],0);P.z=num(pr[5],0);say('มีบางอย่างลากคุณไป…',3000);}
  else if(t===8){const sp=startPos();P.x=sp[0];P.z=sp[1];say('คุณตื่นขึ้นกลางเรืออีกครั้ง…',3000);}
}
function triggerCaught(){
  if(S.caught)return;
  S.caught=true;S.overT=0;P.moving=false;
  sndScream();
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
}

/* ---------- puzzle panels ---------- */
function openNote(){
  const b=$('scrollBody');b.textContent='';
  b.appendChild(makeTextLeaf('ใบบันทึกในครัว',noteLines()));
  const row=el('div','row');row.appendChild(abtn('ปิด',closeModal));b.appendChild(row);
  openModal();
}
function openLock(){
  if(W.fl&FL.BARN)return;
  const b=$('scrollBody');b.textContent='';
  b.appendChild(el('h2',null,'กุญแจยุ้งข้าว'));
  b.appendChild(el('p',null,'ใส่รหัสตัวเลข ๔ หลัก'));
  const digs=[0,0,0,0],row=el('div','row');row.style.justifyContent='center';row.style.gap='1rem';
  digs.forEach((d,i)=>{
    const col=el('div','dcol'),v=el('div','dig',thNum(0));
    col.appendChild(abtn('▲',()=>{digs[i]=(digs[i]+1)%10;v.textContent=thNum(digs[i]);}));
    col.appendChild(v);
    col.appendChild(abtn('▼',()=>{digs[i]=(digs[i]+9)%10;v.textContent=thNum(digs[i]);}));
    row.appendChild(col);
  });
  b.appendChild(row);
  const rw=el('div','row');rw.appendChild(abtn('ลองรหัส',()=>{reqCode(digs.join(''));closeModal();}));rw.appendChild(abtn('ปิด',closeModal));b.appendChild(rw);
  openModal();
}
function renderShrine(){
  const b=$('scrollBody');b.textContent='';
  const done=!!(W.fl&FL.BLESS);
  b.appendChild(el('h2',null,'ศาลพระภูมิ'));
  b.appendChild(makeTextLeaf('คำจารึกที่ศาล',shrineVerse()));
  const dots=el('div','pdots');for(let i=0;i<4;i++)dots.appendChild(el('i',(done||i<W.of)?'on':''));b.appendChild(dots);
  b.appendChild(el('p',null,done?'เจ้าที่ให้พรแล้ว':'เลือกเครื่องบูชาที่จะวางบนศาลตามลำดับ (ใช้ของในคลังร่วมของทีม)'));
  const g=el('div','offers');
  [1,2,4,8].forEach(bit=>{
    const has=!!(W.inv&bit),bt=abtn(INV_NAMES[bit]+(has?'':' (ยังไม่มี)'),()=>{reqShrine(bit);});
    bt.disabled=!has||done;g.appendChild(bt);
  });
  b.appendChild(g);
  const row=el('div','row');row.appendChild(abtn('ปิด',closeModal));b.appendChild(row);
}
function openShrine(){S.shrineOpen=true;renderShrine();openModal();}

/* ---------- interaction ---------- */
function findFocus(){
  const cp=Math.cos(P.pitch),fx=-Math.sin(P.yaw)*cp,fy=Math.sin(P.pitch),fz=-Math.cos(P.yaw)*cp;
  let best=null,bs=-9;
  for(let i=0;i<items.length;i++){
    const it=items[i];if(!itemActive(it))continue;
    const dx=it.focus.x-P.x,dy=it.focus.y-(P.y+EYE),dz=it.focus.z-P.z,d=Math.hypot(dx,dy,dz);
    if(d>it.r||d<0.01)continue;
    const dot=(dx*fx+dy*fy+dz*fz)/d;
    if(dot<((it.kind==='scroll'||it.kind==='pick')?0.7:0.78))continue;
    const sc=dot-d*0.08;if(sc>bs){bs=sc;best=it;}
  }
  return best;
}
function promptText(it){
  switch(it.kind){
    case 'scroll':return 'เก็บใบลาน';
    case 'pick':return 'เก็บ'+it.name;
    case 'lock':return 'ใส่รหัสกุญแจยุ้งข้าว';
    case 'well':return (W.inv&INV.CRANK)?'หมุนรอกที่บ่อน้ำ':'ดูบ่อน้ำ';
    case 'shrine':return (W.fl&FL.BLESS)?'ศาลพระภูมิ (ได้รับพรแล้ว)':'บูชาศาลพระภูมิ';
    case 'gate':return 'ประตูรั้ว';
    default:return it.verb+it.name;
  }
}
function updatePrompt(){
  const f=(S.modal||S.paused||S.caught)?null:findFocus();
  if(f===S.focus&&S.focusShown)return;
  S.focus=f;S.focusShown=true;
  const pr=$('prompt');
  if(!f){pr.hidden=true;$('btnAct').hidden=true;return;}
  const txt=promptText(f);
  if(isTouch){pr.hidden=true;const b=$('btnAct');b.hidden=false;b.textContent={scroll:'เก็บ',pick:'เก็บ',lock:'รหัส',well:'หมุน',shrine:'บูชา',gate:'เปิด'}[f.kind]||f.verb;}
  else{pr.hidden=false;pr.textContent='';const k=document.createElement('kbd');k.textContent='E';pr.appendChild(k);pr.appendChild(document.createTextNode(txt));}
}
function doInteract(){
  if(S.mode!=='play'||S.modal||S.paused||S.caught||!S.focus)return;
  const it=S.focus;
  if(it.kind==='scroll'){
    if(it.taken)return;
    sndPaper();it.taken=true;it.mesh.visible=false;S.focus=null;S.focusShown=false;
    reqScroll(it.idx);openScroll(it.idx);
  }else if(it.kind==='pick'){
    sndPaper();it.taken=true;it.mesh.visible=false;S.focus=null;S.focusShown=false;
    reqPick(it.bit);
    if(it.bit===INV.NOTE)openNote();else say('ได้'+it.name+' (เก็บไว้ในคลังร่วมของทีม)',2800);
  }else if(it.kind==='lock')openLock();
  else if(it.kind==='shrine')openShrine();
  else if(it.kind==='well'){if(it.cool>S.time)return;it.cool=S.time+0.8;reqWell();}
  else if(it.kind==='gate'){if(it.cool>S.time)return;it.cool=S.time+0.8;reqGate();}
  else{
    if(it.cool>S.time)return;it.cool=S.time+0.55;it.flash=1;
    sndInstr(it.id);
    if(it.id==='khlui'&&!W.sv)say('ลมจากขลุ่ยพัดผ่านเรือน… เย็นยะเยือก',2500);
    reqNote(it.id);
  }
}

/* ---------- local world (visuals) ---------- */
function startPos(){
  let idx=0;
  if(NET.on){const sorted=NET.peers.slice().sort((a,b)=>num(a.presence.jt,0)-num(b.presence.jt,0)||(a.peer<b.peer?-1:1));idx=Math.max(0,sorted.findIndex(p=>p.peer===NET.me));}
  return [[0,1.6],[-1.3,1.9],[1.3,1.9],[0,2.8]][idx%4];
}
function resetLocalWorld(full){
  const sp=startPos();P.x=sp[0];P.z=sp[1];P.yaw=0;P.pitch=0;P.y=0;P.dead=0;S.caught=false;S.overT=0;
  S.blackout=0;S.fear=0;S.mistHint=0;S.focus=null;S.focusShown=false;S.shrineOpen=false;S.dawn=0;
  mistGroup.visible=true;mistGroup.children.forEach(s=>{s.material.opacity=0.5;});S.mistFade=0;
  YARD.go=0;YARD.bo=0;
  syncItems();
  SEEN.sc=W.sc;SEEN.sq=W.sq;SEEN.sv=W.sv;SEEN.nv=W.nv;SEEN.ca=W.ca?W.ca[1]:0;SEEN.rs=W.rs;
  SEEN.inv=W.inv;SEEN.fl=W.fl;SEEN.of=W.of;SEEN.ev=W.ev?W.ev[0]:0;SEEN.an=W.an?W.an[0]:0;SEEN.pr=W.pr?W.pr[0]:0;
  if(!NET.on||NET.isHost){if(full)ghostReset();}
  if(W.fl&FL.GATE){S.dawn=1;YARD.go=1;YARD.bo=1;}
  if(W.fl&FL.BARN)YARD.bo=1;
  if(W.sv){S.mistFade=1;mistGroup.visible=false;}
  refreshObjective();updateSlots(false);
  if(!full)say('เรือนถูกรีเซ็ตโดยแอดมิน',3000);
}
