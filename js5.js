
/* ============================ ONLINE ROOMS ============================ */
function copyWorld(g){
  const w=newWorld();
  ['v','sc','sq','sv','st','nv','gs','fz','rs','inv','fl','of','gd','ga','bv'].forEach(k=>{if(typeof g[k]==='number')w[k]=g[k];});
  if(Array.isArray(g.ln))w.ln=[String(g.ln[0]),String(g.ln[1]),num(g.ln[2],1)];
  if(Array.isArray(g.ca))w.ca=[String(g.ca[0]),num(g.ca[1],0)];
  if(typeof g.or==='string'&&/^[a-z,]{3,40}$/.test(g.or))w.or=g.or;
  if(typeof g.so==='string'&&/^[0-9,]{3,20}$/.test(g.so))w.so=g.so;
  if(Array.isArray(g.pr))w.pr=[num(g.pr[0],0),String(g.pr[1]),num(g.pr[2],0),String(g.pr[3]),num(g.pr[4],0),num(g.pr[5],0)];
  if(Array.isArray(g.ev))w.ev=[num(g.ev[0],0),String(g.ev[1]),num(g.ev[2],0)];
  if(Array.isArray(g.an))w.an=[num(g.an[0],0),String(g.an[1]).slice(0,80)];
  if(Array.isArray(g.gh)&&g.gh.length>=6)w.gh=g.gh.map(v=>num(v,0));
  return w;
}
function computeHost(){
  let best=null;
  NET.peers.forEach(p=>{
    if(p.kind&&p.kind!=='viewer')return;
    const jt=num(p.presence.jt,1e15);
    if(!best||jt<best.jt||(jt===best.jt&&p.peer<best.p.peer))best={jt:jt,p:p};
  });
  NET.hostPeer=best?best.p:null;
  const was=NET.isHost;
  NET.isHost=!NET.on||!best||best.p.peer===NET.me;
  if(NET.on&&NET.isHost&&!was){
    const g=W.gh,c=g[3];
    G.x=g[0];G.z=g[1];G.alpha=g[2];G.reach=g[4];G.yaw=g[5];
    G.state=c===1?'manifest':c===2?'finale':'dormant';G.timer=8;G.life=25;G.finT=6;G.stare=0;G.warned=false;
    if(W.sv&&G.state!=='finale')G.state='gone';
    if(S.mode==='play')say('คุณเป็นเจ้าของห้องแทนแล้ว',3000);
  }
}
function onPeers(change){
  NET.peers=change.peers.slice();
  const me=change.peers.find(p=>p.isMe&&p.sameTab);if(me)NET.me=me.peer;
  computeHost();
  if(!NET.isHost&&NET.hostPeer){const g=NET.hostPeer.presence.g;if(g&&g!==NET.lastG){NET.lastG=g;W=copyWorld(g);}}
  if(NET.isHost)NET.peers.forEach(p=>{if(p.peer!==NET.me)hostProcessPeer(p);});
  NET.peers.forEach(p=>{
    if(p.peer===NET.me)return;
    const ch=p.presence.ch;
    if(ch&&typeof ch.k==='number'){
      if(NET.ch[p.peer]===undefined)NET.ch[p.peer]=ch.k;
      else if(NET.ch[p.peer]!==ch.k){NET.ch[p.peer]=ch.k;const ph=PHRASES[ch.i|0];if(ph&&S.mode==='play')say(nameOf(p.peer)+': '+ph,3200);}
    }
  });
  change.joined.forEach(p=>{if(p.peer!==NET.me&&S.mode==='play')say(String(p.presence.n||'เพื่อน').slice(0,12)+' เข้าร่วมเรือน',3000);});
  change.left.forEach(p=>{removeAvatar(p.peer);delete NET.rq[p.peer];if(S.mode==='play')say(String(p.presence.n||'เพื่อน').slice(0,12)+' ออกจากห้อง',3000);});
  updateLobby();updateRoster();
  if(S.mode==='lobby'&&W.st===1)beginPlay(true);
}
function genCode(){const c='abcdefghjkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<5;i++)s+=c[Math.floor(Math.random()*c.length)];return s;}
async function netEnter(code,creating){
  const r=await NET.api.join('nr-'+code);
  NET.room=r;NET.code=code;NET.on=true;NET.rq={};NET.ch={};NET.peers=[];NET.me='';NET.rqK=0;NET.chK=0;NET.lastG=null;NET.jt=Date.now();NET.acc=0;
  NET.unsub=r.onPeers(onPeers,function(){});
  await r.presence({v:1,n:S.nick,jt:NET.jt,p:[0,0,0,0,0]});
  await wait(creating?1300:2500);
  const ps=r.peers();
  const me=ps.find(p=>p.isMe&&p.sameTab);NET.me=me?me.peer:'';
  const others=ps.filter(p=>!(p.isMe&&p.sameTab));
  return {r:r,others:others};
}
async function netLeave(){
  const r=NET.room;
  try{if(NET.unsub)NET.unsub();}catch(e){}
  NET.on=false;NET.room=null;NET.peers=[];NET.isHost=true;NET.hostPeer=null;NET.me='';NET.code='';
  Object.keys(avatars).forEach(removeAvatar);
  try{if(r)await r.leave();}catch(e){}
  $('roster').textContent='';
}
async function createRoom(){
  $('btnCreate').disabled=true;$('netNote').textContent='กำลังสร้างห้อง…';
  try{
    for(let i=0;i<4;i++){
      const code=genCode();
      const res=await netEnter(code,true);
      if(res.others.length>0){await netLeave();continue;}
      W=newWorld();NET.isHost=true;computeHost();
      await NET.room.presence({c:0});
      showLobby();return;
    }
    $('netNote').textContent='สร้างห้องไม่สำเร็จ ลองใหม่อีกครั้ง';
  }catch(e){await netLeave();$('netNote').textContent='สร้างห้องไม่สำเร็จ ลองใหม่อีกครั้ง';}
  $('btnCreate').disabled=false;
}
async function joinRoom(code){
  $('joinErr').textContent='กำลังเข้าห้อง…';$('btnJoinGo').disabled=true;
  try{
    const res=await netEnter(code,false);
    if(res.others.length===0){await netLeave();$('joinErr').textContent='ไม่พบห้องนี้ ตรวจรหัสอีกครั้ง หรือให้เพื่อนสร้างห้องก่อน';$('btnJoinGo').disabled=false;return;}
    if(res.others.length>=4){await netLeave();$('joinErr').textContent='ห้องเต็มแล้ว (สูงสุด ๔ คน)';$('btnJoinGo').disabled=false;return;}
    const used={};res.others.forEach(p=>{used[num(p.presence.c,0)|0]=1;});
    let ci=0;while(used[ci])ci++;
    await NET.room.presence({c:ci%4});
    W=newWorld();
    NET.peers=NET.room.peers();computeHost();
    if(!NET.isHost&&NET.hostPeer&&NET.hostPeer.presence.g){NET.lastG=NET.hostPeer.presence.g;W=copyWorld(NET.lastG);}
    $('joinBox').hidden=true;$('btnJoinGo').disabled=false;$('joinErr').textContent='';
    if(W.st===1)beginPlay(true);else showLobby();
  }catch(e){await netLeave();$('joinErr').textContent='เข้าห้องไม่สำเร็จ ลองใหม่อีกครั้ง';$('btnJoinGo').disabled=false;}
}
function showLobby(){
  S.mode='lobby';$('menu').hidden=true;$('lobby').hidden=false;$('lobbyCode').textContent=NET.code.toUpperCase();
  updateLobby();
}
function sortedPeers(){return NET.peers.slice().sort((a,b)=>num(a.presence.jt,1e15)-num(b.presence.jt,1e15)||(a.peer<b.peer?-1:1));}
function peerColor(p){return PLAYER_COLORS[((num(p.presence.c,0)|0)%4+4)%4];}
function updateLobby(){
  if(S.mode!=='lobby')return;
  const ul=$('lobbyList');ul.textContent='';
  sortedPeers().forEach((p,i)=>{
    const li=document.createElement('li');
    const d=document.createElement('span');d.className='dot';d.style.background=peerColor(p);li.appendChild(d);
    const n=document.createElement('span');n.textContent=String(p.presence.n||'ผู้เล่น').slice(0,12)+(p.peer===NET.me?' (คุณ)':'');li.appendChild(n);
    const t=document.createElement('span');t.className='tag';t.textContent=(NET.hostPeer&&p.peer===NET.hostPeer.peer)?'เจ้าของห้อง':'';li.appendChild(t);
    ul.appendChild(li);
  });
  $('btnGo').hidden=!NET.isHost;
  $('lobbyMsg').textContent=NET.isHost?(NET.peers.length<2?'ยังไม่มีเพื่อนเข้าห้อง เริ่มเล่นคนเดียวในห้องนี้ก็ได้':''):'รอเจ้าของห้องกดเริ่มเกม…';
  $('lobbyMsg').style.color='var(--paper-dim)';
}
function updateRoster(){
  const el=$('roster');el.textContent='';
  if(!NET.on)return;
  const h=document.createElement('div');h.className='lbl';h.textContent='ห้อง '+NET.code.toUpperCase();el.appendChild(h);
  sortedPeers().forEach(p=>{
    const d=document.createElement('div');
    const dot=document.createElement('span');dot.className='dot';dot.style.background=peerColor(p);d.appendChild(dot);
    const n=document.createElement('span');n.textContent=String(p.presence.n||'ผู้เล่น').slice(0,12)+(p.peer===NET.me?' (คุณ)':'')+(p.presence.dd===1?' ✕':'');d.appendChild(n);
    el.appendChild(d);
  });
}
function netTick(dt){
  if(!NET.on||!NET.room)return;
  NET.acc+=dt;if(NET.acc<0.08)return;NET.acc=0;
  const patch={p:[r2(P.x),r2(P.z),r2(P.yaw),r2(P.pitch),P.moving?1:0,r2(P.y)],dd:S.caught?1:0,im:S.god?1:null,ib:(S.blind||S.invis)?1:null,iv:S.invis?1:null,ad:S.admin?1:null};
  if(NET.isHost)patch.g=JSON.parse(JSON.stringify(W));
  NET.room.presence(patch).catch(function(){});
}
function sendChat(i){
  if(!NET.on)return;NET.chK++;NET.room.presence({ch:{k:NET.chK,i:i}}).catch(function(){});say('คุณ: '+PHRASES[i],2500);
}

/* ============================ AVATAR / GHOST RENDER ============================ */
function updateAvatars(dt){
  const seen={};
  if(NET.on&&S.mode==='play'){
    NET.peers.forEach(p=>{
      if(p.peer===NET.me)return;
      const q=p.presence.p;if(!Array.isArray(q))return;
      seen[p.peer]=1;
      let av=avatars[p.peer];
      if(!av)av=avatars[p.peer]=makeAvatar(peerColor(p));
      setAvatarName(av,String(p.presence.n||'เพื่อน').slice(0,12));
      const tx=num(q[0],0),tz=num(q[1],0),ty=num(q[2],0);
      if(!av.init){av.x=tx;av.z=tz;av.yaw=ty;av.init=true;}
      const k=1-Math.exp(-dt*10);
      av.x=lerp(av.x,tx,k);av.z=lerp(av.z,tz,k);
      let dy=ty-av.yaw;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;av.yaw+=dy*k;
      av.mv=q[4]?1:0;av.phase+=dt*(av.mv?9:0);
      const hidden=p.presence.iv===1;
      av.group.visible=p.presence.dd!==1&&(!hidden||S.pesp);
      const ty2=q.length>5?num(q[5],0):groundY(av.z);av.y=av.y==null?ty2:lerp(av.y,ty2,k);
      av.group.position.set(av.x,av.y+Math.abs(Math.sin(av.phase))*0.03*av.mv,av.z);
      if(S.pesp&&!av.beam){av.beam=new THREE.Mesh(new THREE.BoxGeometry(0.05,3.2,0.05),new THREE.MeshBasicMaterial({color:new THREE.Color(av.color),transparent:true,opacity:0.55,depthTest:false,depthWrite:false,fog:false}));av.beam.position.y=1.6;av.beam.renderOrder=998;av.group.add(av.beam);}
      if(av.beam)av.beam.visible=!!S.pesp;
      av.label.material.depthTest=!S.pesp;av.label.renderOrder=S.pesp?999:0;av.label.material.needsUpdate=true;
      av.group.rotation.y=av.yaw;
      av.arms[0].rotation.x=Math.sin(av.phase)*0.7*av.mv;av.arms[1].rotation.x=-Math.sin(av.phase)*0.7*av.mv;
    });
  }
  Object.keys(avatars).forEach(id=>{if(!seen[id])removeAvatar(id);});
}
function angDiff(a,b){let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;}
function updateGhostView(dt){
  GV.yoff=0;
  if(S.mode==='menu'||S.mode==='lobby'){GV.x=0;GV.z=-2.5;GV.a=lerp(GV.a,0.55,Math.min(1,dt*2));GV.st=0;GV.reach=0;GV.yaw=Math.sin(S.time*0.4)*0.3;return;}
  const t=W.gh;
  if(!NET.on||NET.isHost){GV.x=t[0];GV.z=t[1];GV.a=t[2];GV.st=t[3];GV.reach=t[4];GV.yaw=t[5];}
  else{
    const k=Math.min(1,dt*8);
    GV.x=lerp(GV.x,t[0],k);GV.z=lerp(GV.z,t[1],k);GV.a=lerp(GV.a,t[2],k);GV.reach=lerp(GV.reach,t[4],k);GV.yaw+=angDiff(GV.yaw,t[5])*k;GV.st=t[3];
  }
  if(S.caught&&S.overT<3.0){
    const d=Math.max(0.9,1.7-S.overT*1.3),fx=-Math.sin(P.yaw),fz=-Math.cos(P.yaw);
    GV.x=P.x+fx*d;GV.z=P.z+fz*d;GV.a=1;GV.reach=1;GV.yaw=Math.atan2(-fx,-fz);GV.yoff=(P.y+EYE)-1.84-0.28;
  }
}
function animGhost(t,dt){
  const v=GV,vis=v.a>0.02&&S.mode!=='loading';
  GH.root.visible=vis;
  if(!vis){GH.light.intensity=0;return;}
  const scream=S.caught?clamp(S.overT*2,0,1):0;
  GH.root.position.set(v.x,0.28+Math.sin(t*2)*0.06+v.yoff+groundY(v.z),v.z);
  GH.root.rotation.y=v.yaw+(S.caught?Math.sin(t*70)*0.05:0);
  const fl=(v.st===1&&Math.sin(t*37)>0.93)?0.55:1;
  for(let i=0;i<ghostMats.length;i++)ghostMats[i].m.opacity=ghostMats[i].base*clamp(v.a,0,1)*fl;
  GH.light.position.set(v.x,1.4,v.z);GH.light.intensity=0.9*v.a;
  const s1=Math.sin(t*1.6),s2=Math.sin(t*2.3+1),r=clamp(v.reach,0,1);
  GH.armA.sh.rotation.set(lerp(0,-1.45,r),0,lerp(1.35+0.15*s1,0.25,r));
  GH.armA.el.rotation.z=lerp(1.2+0.3*s2,0.1,r);
  GH.armB.sh.rotation.set(lerp(-0.8,-1.5,r),0,lerp(-(0.65+0.12*s2),-0.25,r));
  GH.armB.el.rotation.z=lerp(-(0.9+0.25*s1),-0.1,r);
  GH.armA.hand.rotation.z=0.4*Math.sin(t*3);GH.armB.hand.rotation.z=-0.4*Math.sin(t*3+1);
  GH.body.rotation.z=Math.sin(t*1.3)*0.06;GH.body.rotation.y=Math.sin(t*0.9)*0.2;
  GH.hair.rotation.x=Math.sin(t*1.8)*0.05;GH.tail.rotation.x=0.2+Math.sin(t*2.2)*0.15;
  GH.head.rotation.z=Math.sin(t*1.1)*0.12+r*0.15;
  GH.mouth.scale.y=0.35+r*0.5+scream*2.2;
}

/* ============================ PER-FRAME ============================ */
const FX={};
function setupFx(){FX.night=new THREE.Color(NIGHT_BG);FX.dawn=new THREE.Color(DAWN_BG);FX.tmp=new THREE.Color();}
function updateWorldFx(dt){
  const t=S.time;
  let dark=1;
  if(S.blackout>0){S.blackout-=dt;dark=Math.random()<0.35?0.5:0.05;}
  const fl=1+Math.sin(t*9.1)*0.04+Math.sin(t*23.7+1)*0.03;
  const ff=S.fear>0.3?(1-Math.random()*S.fear*0.5):1;
  const k=fl*dark*ff;
  L.l1.intensity=L.base.l1*k;L.l2.intensity=L.base.l2*k;L.alt.intensity=L.base.alt*k;L.verd.intensity=L.base.verd*k;
  const target=(((W.fl&FL.GATE)||S.forceDawn)&&S.mode==='play')?1:0;
  S.dawn=lerp(S.dawn,target,Math.min(1,dt*0.25));
  const d=S.dawn;
  FX.tmp.copy(FX.night).lerp(FX.dawn,d);scene.background.copy(FX.tmp);scene.fog.color.copy(FX.tmp);
  scene.fog.density=lerp(0.04,0.018,d)*(S.bright?0.5:1);
  hemi.intensity=0.55+0.7*d+(S.bright?1.3:0);
  stars.material.opacity=0.9*(1-d);moonSprite.material.opacity=1-d*0.8;
  renderer.toneMappingExposure=1.2+0.2*d;
  if(W.sv&&mistGroup.visible){S.mistFade=Math.min(1,(S.mistFade||0)+dt*0.25);if(S.mistFade>=1)mistGroup.visible=false;}
  if(mistGroup.visible)mistGroup.children.forEach(sp=>{
    const b=sp.userData;sp.position.x=b.b[0]+Math.sin(t*0.5+b.p)*0.25;sp.position.y=b.b[1]+Math.sin(t*0.7+b.p)*0.12;sp.material.opacity=0.5*(1-(S.mistFade||0));
  });
  // courtyard animation
  const gOpen=(W.fl&FL.GATE)?1:0,bOpen=(W.fl&FL.BARN)?1:0,kf=1-Math.exp(-dt*3);
  YARD.go=lerp(YARD.go,gOpen,kf);YARD.bo=lerp(YARD.bo,bOpen,kf);
  if(YARD.gateL){YARD.gateL.rotation.y=-1.4*YARD.go;YARD.gateR.rotation.y=1.4*YARD.go;}
  if(YARD.barnDoor)YARD.barnDoor.rotation.y=1.4*YARD.bo;
  if(YARD.lock)YARD.lock.visible=!bOpen;
  if(YARD.wellCrank)YARD.wellCrank.visible=!!(W.inv&INV.CRANK);
  if(YARD.offer)YARD.offer.forEach((m,i)=>{const on=(W.fl&FL.BLESS)||W.of>i;m.emissiveIntensity=lerp(m.emissiveIntensity,on?1.1:0,kf);});
  if(YARD.blessFlash>0)YARD.blessFlash=Math.max(0,YARD.blessFlash-dt*0.5);
  if(YARD.shrineGlow)YARD.shrineGlow.material.opacity=Math.max((W.fl&FL.BLESS)?0.35+0.1*Math.sin(t*2):0,(YARD.blessFlash||0)*0.9);
  if(YARD.gateGlow)YARD.gateGlow.material.opacity=gOpen?0.55*Math.min(1,YARD.go*1.5):0;
  setLightMode(P.z>11.8?'yard':(P.z<9.8?'house':L.mode));
  items.forEach(it=>{
    if(it.marker)it.marker.visible=!!(S.xray&&S.mode==='play'&&itemActive(it));
    if(it.flash>0){it.flash=Math.max(0,it.flash-dt*1.4);it.glow.forEach(m=>{m.emissiveIntensity=it.flash*1.4;});}
    if(it.kind==='scroll'&&it.sprite){it.sprite.material.opacity=0.45+0.2*Math.sin(t*3+it.idx);}
  });
}
function updatePlay(dt){
  const frozen=!S.multi&&(S.paused||S.modal);
  if(!frozen){
    S.playTime+=dt;
    if(!NET.on||NET.isHost)hostGhost(dt);
  }
  if(S.slowT>0)S.slowT-=dt;if(S.freezeT>0)S.freezeT-=dt;if(S.spinT>0){S.spinT-=dt;P.yaw+=dt*6;}
  const canMove=!S.modal&&!S.paused&&!S.caught&&S.mode==='play'&&!(S.freezeT>0);
  if(canMove)movePlayer(dt);else P.moving=false;
  if(S.fly&&S.mode==='play'){
    const up=(keys.Space?1:0)-((keys.KeyC||keys.ControlLeft)?1:0)+(S.flyIn||0);
    if(S.fy==null)S.fy=P.y;
    S.fy=clamp(S.fy+up*dt*4.5,-2.4,14);P.y=lerp(P.y,S.fy,Math.min(1,dt*12));
  }else if(!frozen)P.y=lerp(P.y,groundY(P.z),Math.min(1,dt*10));
  // caught timeline
  if(S.caught){
    S.overT+=dt;
    const gx=GV.x-P.x,gz=GV.z-P.z,want=Math.atan2(-gx,-gz);
    if(S.overT>0.05)P.yaw+=angDiff(P.yaw,want)*Math.min(1,dt*10);P.pitch=lerp(P.pitch,0.1,Math.min(1,dt*6));
    if(!S.multi&&S.overT>1.9&&$('over').hidden)$('over').hidden=false;
    if(S.multi&&S.overT>3.6){
      S.caught=false;const sp=startPos();P.x=sp[0];P.z=sp[1];P.yaw=0;P.pitch=0;GV.yoff=0;say('คุณฟื้นขึ้นมาที่กลางเรืออีกครั้ง…',3500);
    }
  }
  applyWorld();
  // ghost cues
  if(GV.st!==prevGvSt){
    if(GV.st===3){sndWhisper();S.blackout=Math.max(S.blackout,0.45);}
    if(GV.st===1){say('เสียงเพลงดังขึ้น… นางรำปรากฏตัวแล้ว',3500);musicStart();}
    if(prevGvSt===1&&GV.st!==1)musicStop(false);
    prevGvSt=GV.st;
  }
  const dxg=GV.x-P.x,dzg=GV.z-P.z,dg=Math.hypot(dxg,dzg);
  S.fear=(GV.a>0.3&&(GV.st===1||S.caught))?clamp(1-dg/8,0,1):0;
  if(S.fear>0.05&&!frozen){S.heart-=dt;if(S.heart<=0){sndThump(0.4+S.fear*0.8);S.heart=lerp(0.4,1.1,1-S.fear);}}
  if(GV.a>0.3&&GV.st===1&&!frozen&&!MU.playing){
    S.jingleT-=dt;if(S.jingleT<=0){sndJingle();S.jingleT=lerp(0.25,1.4,clamp(dg/12,0,1))*rnd(0.7,1.3);}
  }
  pannerPos(A.gp,GV.x,1.5,GV.z);
  // mist hint + win
  S.mistHint-=dt;
  if(!W.sv&&P.z>8.5&&S.mistHint<=0&&!S.caught){say('หมอกหนาทึบขวางบันไดเรือนไว้… ยังก้าวออกไปไม่ได้',3500);S.mistHint=7;}
  if((W.fl&FL.GATE)&&P.z>28.2&&S.mode==='play'&&!S.winning)winGame();
  // camera
  const sh=S.fear*S.fear*0.02+(S.caught?0.04:0);
  const bobY=P.moving?Math.sin(P.bob)*0.035:0;
  camera.position.set(P.x+(sh?rnd(-sh,sh):0),P.y+EYE+bobY+(sh?rnd(-sh,sh):0),P.z);
  camera.rotation.set(P.pitch,P.yaw,0);
  updateListener(P.x,P.y+EYE,P.z,P.yaw,P.pitch);
  updatePrompt();
  // fx overlays
  $('fxVig').style.opacity=(0.35+S.fear*0.5).toFixed(2);
  $('fxRed').style.opacity=(S.caught?Math.min(1,0.3+Math.sin(S.time*40)*0.3+0.4):S.fear*0.35).toFixed(2);
  // esp arrow
  const ar=$('ghostArrow');
  if(S.esp&&GV.a>0.05){ar.hidden=false;const rel=angDiff(P.yaw,Math.atan2(-dxg,-dzg));ar.style.transform='rotate('+(-rel*180/Math.PI).toFixed(1)+'deg)';}
  else ar.hidden=true;
  netTick(dt);
}
function winGame(){
  S.winning=true;S.mode='win';
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  const f=$('fxFade');f.style.background='#e9e2cf';f.style.opacity=1;
  setTimeout(()=>{$('win').hidden=false;},1400);
  $('hud').hidden=true;$('touch').hidden=true;
}
function updateMenu(dt){
  camera.position.set(Math.sin(S.time*0.15)*0.7,1.5+Math.sin(S.time*0.2)*0.05,7.4);
  camera.rotation.set(0,0,0);camera.lookAt(0,1.25,-3);
  if(A.ready)updateListener(0,1.5,7.4,0,0);
}
let last=performance.now();
function frame(now){
  requestAnimationFrame(frame);
  if(!renderer)return;
  const dt=Math.min((now-last)/1000,0.05);last=now;S.time+=dt;
  if(S.mode==='menu'||S.mode==='lobby'){updateMenu(dt);if(NET.on)netTick(dt);}
  else if(S.mode==='play')updatePlay(dt);
  updateGhostView(dt);
  animGhost(S.time,dt);
  updateAvatars(dt);
  updateWorldFx(dt);
  renderer.render(scene,camera);
}

/* ============================ INPUT ============================ */
function lockPointer(){try{const p=canvas.requestPointerLock&&canvas.requestPointerLock();if(p&&p.catch)p.catch(function(){});}catch(e){}}
document.addEventListener('pointerlockchange',()=>{
  S.locked=document.pointerLockElement===canvas;
  if(S.locked)S.hadLock=true;
  else if(S.mode==='play'&&S.hadLock&&!S.modal&&!S.adminOpen&&!S.caught&&$('pause').hidden){S.paused=true;$('pause').hidden=false;}
});
window.addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT')return;
  keys[e.code]=true;
  if(S.mode!=='play')return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].indexOf(e.code)>=0)e.preventDefault();
  if(e.code==='KeyE'||e.code==='KeyF'){if(S.modal)closeModal();else if(!e.repeat)doInteract();}
  else if(e.code==='KeyJ'){if(S.modal)closeModal();else openJournal();}
  else if(e.code==='F2'){e.preventDefault();toggleAdmin();}
  else if(e.code==='Escape'){if(S.modal)closeModal();else if(S.adminOpen)admClose();}
  else if(/^Digit[1-4]$/.test(e.code)&&NET.on)sendChat(Number(e.code.slice(5))-1);
});
window.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{Object.keys(keys).forEach(k=>{keys[k]=false;});});
canvas.addEventListener('mousedown',()=>{if(S.mode!=='play'||S.modal||S.caught||isTouch)return;if(S.adminOpen){S.drag=true;return;}if(!S.locked){S.drag=true;lockPointer();}});
window.addEventListener('mouseup',()=>{S.drag=false;});
window.addEventListener('mousemove',e=>{
  if(S.mode!=='play'||S.modal||S.paused||S.caught)return;
  if(S.locked||S.drag){P.yaw-=e.movementX*0.0022;P.pitch=clamp(P.pitch-e.movementY*0.0022,-1.3,1.3);}
});
function ignoreTouch(e){return e.target&&e.target.closest&&e.target.closest('button,input,.panel,.side,#admWin,#admFab');}
stage.addEventListener('touchstart',e=>{
  if(S.mode!=='play'||S.modal||S.caught||ignoreTouch(e))return;
  const r=stage.getBoundingClientRect();
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    if(t.clientX-r.left<r.width*0.45&&!touch.joy){
      touch.joy={id:t.identifier,sx:t.clientX,sy:t.clientY};
      const jb=$('joyBase');jb.style.display='block';jb.style.left=(t.clientX-r.left)+'px';jb.style.top=(t.clientY-r.top)+'px';
    }else if(!touch.look)touch.look={id:t.identifier,lx:t.clientX,ly:t.clientY};
  }
  e.preventDefault();
},{passive:false});
stage.addEventListener('touchmove',e=>{
  if(S.mode!=='play')return;
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    if(touch.joy&&t.identifier===touch.joy.id){
      let dx=(t.clientX-touch.joy.sx)/50,dy=(t.clientY-touch.joy.sy)/50;const l=Math.hypot(dx,dy);if(l>1){dx/=l;dy/=l;}
      touch.mx=Math.abs(dx)<0.15?0:dx;touch.mz=Math.abs(dy)<0.15?0:-dy;
      $('joyKnob').style.transform='translate('+(dx*40)+'px,'+(dy*40)+'px)';
    }else if(touch.look&&t.identifier===touch.look.id){
      if(!S.modal&&!S.paused&&!S.caught){P.yaw-=(t.clientX-touch.look.lx)*0.0048;P.pitch=clamp(P.pitch-(t.clientY-touch.look.ly)*0.0048,-1.3,1.3);}
      touch.look.lx=t.clientX;touch.look.ly=t.clientY;
    }
  }
  e.preventDefault();
},{passive:false});
function touchEnd(e){
  for(let i=0;i<e.changedTouches.length;i++){
    const t=e.changedTouches[i];
    if(touch.joy&&t.identifier===touch.joy.id){touch.joy=null;touch.mx=0;touch.mz=0;$('joyBase').style.display='none';$('joyKnob').style.transform='';}
    if(touch.look&&t.identifier===touch.look.id)touch.look=null;
  }
}
stage.addEventListener('touchend',touchEnd);stage.addEventListener('touchcancel',touchEnd);
window.addEventListener('resize',resize);

