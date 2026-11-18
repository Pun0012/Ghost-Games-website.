
/* ============================ FLOW: menu / start / boot ============================ */
function saveNick(){
  let v=$('nick').value.replace(/\s+/g,' ').trim().slice(0,12);
  if(!v)v='ผู้เล่น'+Math.floor(rnd(10,99));
  S.nick=v;$('nick').value=v;
  try{localStorage.setItem('nr_nick',v);}catch(e){}
}
function fadeIn(){
  const f=$('fxFade');f.style.transition='none';f.style.background='#000';f.style.opacity=1;void f.offsetWidth;f.style.transition='opacity 1.2s';f.style.opacity=0;
}
function buildChat(){
  const c=$('chatq');c.textContent='';
  PHRASES.forEach((p,i)=>{const b=el('button','btn sm',(isTouch?'':thNum(i+1)+' ')+p);b.type='button';b.addEventListener('click',()=>sendChat(i));c.appendChild(b);});
  c.hidden=!NET.on;
}
function beginPlay(multi){
  if(S.mode==='play')return;
  S.multi=multi;initAudio();musicLoad();
  ['lobby','menu','joinBox','howto','over','win','pause','scrollModal','admWin'].forEach(id=>{$(id).hidden=true;});
  S.adminOpen=false;
  S.mode='play';S.paused=false;S.modal=false;S.winning=false;S.playTime=0;S.caught=false;S.fear=0;
  if(!NET.on||NET.isHost){if(!NET.on)W=newWorld();W.st=1;W.v++;}
  resetLocalWorld(true);
  prevGvSt=0;
  $('hud').hidden=false;$('touch').hidden=!isTouch;
  $('admFab').hidden=false;
  buildChat();updateRoster();
  const f=$('fxFade');f.style.background='#000';fadeIn();
  if(!isTouch)lockPointer();
  say('คุณตื่นขึ้นบนเสื่อกลางเรือนไทยหลังเก่า… ประตูถูกหมอกขวางไว้ และได้ยินเสียงกระพรวนเบา ๆ'+(NET.on?'':''),6500);
}
function startSolo(){saveNick();NET.on=false;NET.isHost=true;W=newWorld();beginPlay(false);}
async function toMenu(){
  S.mode='menu';S.paused=false;S.modal=false;S.caught=false;S.winning=false;musicStop(true);
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  await netLeave();
  W=newWorld();ghostReset();
  ['hud','touch','over','win','pause','lobby','joinBox','howto','scrollModal','admWin','admFab'].forEach(id=>{$(id).hidden=true;});
  S.adminOpen=false;
  const f=$('fxFade');f.style.background='#000';f.style.opacity=0;
  mistGroup.visible=true;S.dawn=0;
  $('menu').hidden=false;$('btnCreate').disabled=!NET.api;$('btnJoin').disabled=!NET.api;
}
function wire(){
  $('btnSolo').addEventListener('click',startSolo);
  $('btnCreate').addEventListener('click',()=>{saveNick();initAudio();musicLoad();createRoom();});
  $('btnJoin').addEventListener('click',()=>{saveNick();$('joinBox').hidden=false;$('joinErr').textContent='';setTimeout(()=>$('codeIn').focus(),30);});
  $('btnJoinCancel').addEventListener('click',()=>{$('joinBox').hidden=true;});
  const go=()=>{const c=$('codeIn').value.trim().toLowerCase().replace(/[^a-z0-9]/g,'');if(c.length!==5){$('joinErr').textContent='รหัสห้องมี ๕ ตัวอักษร';return;}joinRoom(c);};
  $('btnJoinGo').addEventListener('click',go);
  $('codeIn').addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  $('btnFull').addEventListener('click',async()=>{
    try{const d=document.documentElement;if(!document.fullscreenElement&&d.requestFullscreen)await d.requestFullscreen();}catch(e){}
    try{if(screen.orientation&&screen.orientation.lock)await screen.orientation.lock('landscape');}catch(e){}
    setTimeout(resize,300);
  });
  $('btnHow').addEventListener('click',()=>{$('howto').hidden=false;});
  $('btnHowClose').addEventListener('click',()=>{$('howto').hidden=true;});
  $('btnSound').addEventListener('click',()=>{initAudio();setSound(!S.sound);});
  $('btnGo').addEventListener('click',()=>{if(NET.isHost){W.st=1;W.v++;beginPlay(true);}});
  $('btnLeave').addEventListener('click',()=>{toMenu();});
  $('btnCopy').addEventListener('click',()=>{
    const t=NET.code.toUpperCase();
    try{navigator.clipboard.writeText(t).then(()=>{$('btnCopy').textContent='คัดลอกแล้ว';setTimeout(()=>{$('btnCopy').textContent='คัดลอก';},1500);},()=>{$('lobbyMsg').textContent='คัดลอกไม่ได้ จดรหัสนี้: '+t;});}
    catch(e){$('lobbyMsg').textContent='คัดลอกไม่ได้ จดรหัสนี้: '+t;}
  });
  $('btnJournal').addEventListener('click',()=>{if(S.modal)closeModal();else openJournal();});
  admWire();
  $('btnAct').addEventListener('click',doInteract);
  $('btnRun').addEventListener('click',()=>{touch.run=!touch.run;$('btnRun').classList.toggle('on',touch.run);});
  $('btnResume').addEventListener('click',()=>{S.paused=false;$('pause').hidden=true;if(!isTouch)lockPointer();});
  $('btnRetry').addEventListener('click',()=>{$('over').hidden=true;S.mode='menu';NET.on=false;W=newWorld();beginPlay(false);});
  $('btnOverMenu').addEventListener('click',()=>{toMenu();});
  $('btnWinMenu').addEventListener('click',()=>{toMenu();});
  $('scrollModal').addEventListener('click',e=>{if(e.target===$('scrollModal'))closeModal();});
  $('nick').addEventListener('keydown',e=>e.stopPropagation());
  $('codeIn').addEventListener('input',()=>{$('codeIn').value=$('codeIn').value.toUpperCase();});
}
async function netProbe(){
  let api=null;
  try{if(window.claude&&typeof window.claude.use==='function')api=await window.claude.use('room');}catch(e){api=null;}
  NET.api=api||null;
  const n=$('netNote');
  if(NET.api){n.textContent='เล่นกับเพื่อนได้: กด “สร้างห้อง” แล้วส่งรหัสให้เพื่อน';$('btnCreate').disabled=false;$('btnJoin').disabled=false;}
  else{n.textContent='ห้องออนไลน์ใช้ไม่ได้ในมุมมองนี้ (ต้องเปิดผ่าน claude.ai ขณะล็อกอิน) แต่เล่นคนเดียวได้ตามปกติ';n.style.color='var(--paper-dim)';}
}
function progress(p,txt){$('loadBar').style.width=Math.round(p*100)+'%';if(txt)$('loadStep').textContent=txt;}
async function boot(){
  $('fxFade').style.opacity=0;
  $('loadTip').textContent=TIPS[Math.floor(Math.random()*TIPS.length)];
  let nick='';try{nick=localStorage.getItem('nr_nick')||'';}catch(e){}
  $('nick').value=nick||('ผู้เล่น'+Math.floor(rnd(10,99)));S.nick=$('nick').value;
  $('btnCreate').disabled=true;$('btnJoin').disabled=true;$('netNote').textContent='กำลังตรวจสอบห้องออนไลน์…';
  wire();
  if(typeof THREE==='undefined'){$('loadStep').textContent='โหลดกราฟิก 3D ไม่สำเร็จ ตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้า';return;}
  try{initRenderer();}catch(e){$('loadStep').textContent='อุปกรณ์นี้ไม่รองรับกราฟิก 3D (WebGL)';return;}
  try{
    progress(0.05,'ลับไม้สักทำพื้นเรือน…');await wait(120);
    setupFx();initMats();
    progress(0.2,'ยกเสาและขึ้นโครงหลังคา…');await wait(120);
    buildHouse();
    progress(0.4,'จัดวางเครื่องดนตรี…');await wait(120);
    buildRanad();buildGong();buildSaw();buildDrum();buildFlute();
    progress(0.55,'ซ่อนใบลานทั้งสี่ใบ…');await wait(120);
    buildProps();buildPicks();
    progress(0.7,'ปลูกกล้วย ปลูกมะพร้าว…');await wait(120);
    buildOutside();buildYard();buildMarkers();
    progress(0.82,'ปลุกนางรำ…');await wait(200);
    buildGhost();buildLights();
    progress(0.95,'จุดตะเกียง…');await wait(120);
    camera.position.set(0,1.5,7.4);camera.lookAt(0,1.25,-3);
    try{renderer.compile(scene,camera);}catch(e){}
    progress(1,'พร้อมแล้ว');await wait(500);
  }catch(e){console.error(e);$('loadStep').textContent='เกิดข้อผิดพลาดตอนสร้างฉาก: '+(e&&e.message?e.message:e);return;}
  S.mode='menu';
  $('menu').hidden=false;
  $('loading').classList.add('out');setTimeout(()=>{$('loading').hidden=true;},900);
  requestAnimationFrame(frame);
  netProbe();
}
boot();
})();
