
/* ============================ ADMIN (floating window) ============================ */
async function sha256(s){
  const buf=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));
  return Array.prototype.map.call(new Uint8Array(buf),b=>b.toString(16).padStart(2,'0')).join('');
}
function el(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=text;return e;}
function abtn(label,fn,on){const b=el('button','btn'+(on?' on':''),label);b.type='button';b.addEventListener('click',fn);return b;}

const ADM={tab:'player',lines:[],hist:[],hi:0,min:false,max:false,placed:false,target:'*'};
const ADM_TABS=[['player','ผู้เล่น'],['world','โลก'],['ghost','เสกผี'],['prank','แกล้งเพื่อน'],['puzzle','ปริศนา'],['tp','วาร์ป'],['code','โค้ด']];
const TP_PLACES=[
  ['altar','แท่นบูชา',0,-2.2],['ranad','ระนาดเอก',-3.8,-0.9],['gong','ฆ้องวง',3.8,-0.9],['saw','ซออู้',-3.6,2.2],['drum','กลองทัด',3.6,2.2],
  ['porch','ชาน',0,6.2],['stairs','บันไดเรือน',0,8.0],['yard','ลานบ้าน',0,14],['kitchen','เรือนครัว',-9.5,20.5],
  ['shrine','ศาลพระภูมิ',-7.5,18.2],['well','บ่อน้ำ',7.5,17.2],['barn','ยุ้งข้าว',9.5,19.6],['gate','ประตูรั้ว',0,24.6],['exit','ทางออก',0,27.6]
];
const INV_KEYS={incense:1,rice:2,water:4,garland:8,crank:16,key:32,note:64};

function admLog(t,cls){
  ADM.lines.push([String(t),cls||'']);if(ADM.lines.length>90)ADM.lines.shift();
  const lg=$('admLog');if(lg){lg.appendChild(admLine(ADM.lines[ADM.lines.length-1]));lg.scrollTop=lg.scrollHeight;}
}
function admLine(l){const d=el('div',l[1],l[0]);return d;}
function admPlace(){
  const w=$('admWin'),st=stage.getBoundingClientRect();
  if(!ADM.placed){w.style.left=Math.max(8,Math.round((st.width-Math.min(390,st.width-24))/2))+'px';w.style.top='70px';ADM.placed=true;}
}
function admClamp(){
  const w=$('admWin');if(w.hidden||!w.style.left)return;
  const st=stage.getBoundingClientRect(),r=w.getBoundingClientRect();
  const x=clamp(r.left-st.left,4,Math.max(4,st.width-r.width-4)),y=clamp(r.top-st.top,4,Math.max(4,st.height-44));
  w.style.left=x+'px';w.style.top=y+'px';
}
window.addEventListener('resize',()=>setTimeout(admClamp,50));
function admOpen(){
  if(S.mode!=='play')return;
  S.adminOpen=true;ADM.min=false;S.paused=false;$('pause').hidden=true;
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  $('admWin').hidden=false;$('admWin').classList.remove('min');$('admFab').hidden=true;
  admPlace();admRender();admClamp();
}
function admClose(){
  S.adminOpen=false;$('admWin').hidden=true;
  if(S.mode==='play')$('admFab').hidden=false;
  if(S.mode==='play'&&S.hadLock&&!isTouch&&!S.modal&&!S.caught)lockPointer();
}
function toggleAdmin(){if(S.mode!=='play')return;if(S.adminOpen)admClose();else admOpen();}
function admMinToggle(){ADM.min=!ADM.min;$('admWin').classList.toggle('min',ADM.min);$('admMin').textContent=ADM.min?'+':'–';}
function admHide(){S.adminOpen=false;$('admWin').hidden=true;$('admFab').hidden=true;}

/* ---------- actions shared by buttons and console ---------- */
function admTp(x,z,label){
  if(z>11&&!W.sv&&!S.noclip){S.noclip=true;admLog('ลานบ้านยังถูกหมอกปิด จึงเปิดทะลุผนังให้อัตโนมัติ','er');}
  P.x=x;P.z=z;P.y=groundY(z);
  return 'วาร์ปไป'+(label||'')+' ('+r2(x)+', '+r2(z)+')';
}
function onoff(v,cur,arg){
  if(arg==null)return !cur;
  const a=String(arg).toLowerCase();
  if(a==='on'||a==='1'||a==='true'||a==='เปิด')return true;
  if(a==='off'||a==='0'||a==='false'||a==='ปิด')return false;
  return !cur;
}
const PRANKS=[[1,'ผีหลอกจนเกิดใหม่'],[2,'ดับไฟ ๖ วิ'],[3,'ขาหนัก ๑๐ วิ'],[4,'ตัวแข็ง ๔ วิ'],[5,'หัวหมุนติ้ว'],[6,'เสียงกระซิบ'],[7,'ลากมาหาเรา'],[8,'ส่งกลับกลางเรือน']];
function friends(){return NET.peers.filter(p=>p.peer!==NET.me&&Array.isArray(p.presence.p));}
function targetId(name){
  if(name==null||name===''||String(name).toLowerCase()==='all'||name==='*')return '*';
  const k=String(name).toLowerCase(),f=friends().find(p=>String(p.presence.n||'').toLowerCase()===k)||friends().find(p=>String(p.presence.n||'').toLowerCase().indexOf(k)===0);
  return f?f.peer:null;
}
function targetName(id){if(id==='*')return 'ทุกคน';const f=friends().find(p=>p.peer===id);return f?String(f.presence.n||'เพื่อน').slice(0,10):'(ออกไปแล้ว)';}
function doPrank(ty,id){
  if(!NET.on||!friends().length)return 'ต้องเล่นหลายคนและมีเพื่อนอยู่ในห้องก่อน';
  if(id!=='*'&&!friends().find(p=>p.peer===id))return 'ไม่พบเพื่อนคนนั้นในห้อง';
  reqAdmin('prank',ty+'|'+id);return 'แกล้ง '+(PRANKS.find(p=>p[0]===ty)||[0,'?'])[1]+' → '+targetName(id);
}
function doSummon(mode,id){
  reqAdmin('summon',mode+'|'+(id&&id!=='*'?id:''));return 'เสกผี '+mode+(id&&id!=='*'?' ใส่ '+targetName(id):' ใกล้ตัวคุณ');
}
function setFly(on){S.fly=on;S.flyIn=0;S.fy=on?P.y:null;}
function admTargetChips(allowAll){
  const c=el('div','chips');
  if(allowAll)c.appendChild(abtn('ทุกคน',()=>{ADM.target='*';admRender();},ADM.target==='*'));
  friends().forEach(p=>c.appendChild(abtn(String(p.presence.n||'เพื่อน').slice(0,10),()=>{ADM.target=p.peer;admRender();},ADM.target===p.peer)));
  if(!friends().length)c.appendChild(el('p','lbl','ยังไม่มีเพื่อนในห้อง (ต้องเล่นหลายคน)'));
  return c;
}
function admStatus(){
  const gs=['ซ่อน','ปรากฏ','รำส่งวิญญาณ','ใกล้มา'][W.gh[3]]||'?';
  const inv=Object.keys(INV_KEYS).filter(k=>W.inv&INV_KEYS[k]).join(',')||'-';
  return 'ใบลาน '+bits(W.sc)+'/4 · ลำดับ '+W.sq+'/4 · เรือนเปิด '+(W.sv?'ใช่':'ไม่')+'\nของ: '+inv+' · ยุ้ง '+((W.fl&FL.BARN)?'เปิด':'ปิด')+' · พร '+((W.fl&FL.BLESS)?'ได้':'ยัง')+' · ประตู '+((W.fl&FL.GATE)?'เปิด':'ปิด')+'\nผี: '+gs+' · ความเร็ว ×'+(W.gs||1)+(W.fz?' · หยุด':'')+(W.gd?' · สงบ':'')+(W.ga?' · ก้าวร้าว':'')+'\nตำแหน่ง ('+r2(P.x)+', '+r2(P.z)+')'+(NET.on?' · ห้อง '+NET.code.toUpperCase()+' · '+(NET.isHost?'เจ้าของห้อง':'ผู้เล่น'):' · เล่นคนเดียว');
}
function itemArg(a){
  if(a==null||a==='all')return 'all';
  const k=String(a).toLowerCase();
  if(INV_KEYS[k])return INV_KEYS[k];
  const n=parseInt(k,10);return isNaN(n)?null:n;
}

/* ---------- console command table ---------- */
const CMDS={};
const fnum=(x,d)=>{const v=parseFloat(x);return isNaN(v)?d:v;};
function defCmd(names,usage,help,fn){const c={usage:usage,help:help,fn:fn};names.forEach(n=>{CMDS[n]=c;});c.main=names[0];}
function defToggle(names,key,label,after){
  defCmd(names,names[0]+' [on|off]',label,a=>{S[key]=onoff(null,S[key],a[0]);if(after)after();return label+': '+(S[key]?'เปิด':'ปิด');});
}
function defWorld(names,usage,help,cmd,argf){
  defCmd(names,usage,help,a=>{reqAdmin(cmd,argf?argf(a):null);return 'ส่งคำสั่ง '+cmd+' แล้ว'+(NET.on&&!NET.isHost?' (รอเจ้าของห้องประมวลผล)':'');});
}
defToggle(['god','iddqd'],'god','อมตะ');
defToggle(['noclip','idclip'],'noclip','ทะลุผนัง');
defToggle(['fast'],'fast','วิ่งเร็ว ×2');
defToggle(['bright','fiatlux'],'bright','สว่างจ้า');
defToggle(['esp'],'esp','ลูกศรชี้ผี');
defToggle(['blind','ghostblind'],'blind','ผีมองไม่เห็นคุณ');
defToggle(['xray'],'xray','เห็นไอเทมทะลุผนัง');
defToggle(['dawn'],'forceDawn','บังคับฟ้าสาง');
defToggle(['invis','vanish','ghostmode'],'invis','ล่องหน (เพื่อนและผีมองไม่เห็นคุณ)');
defToggle(['see','pesp','friends'],'pesp','เห็นตัวเพื่อนทะลุกำแพง');
defCmd(['fly'],'fly [on|off]','บิน (Space ขึ้น · C ลง)',a=>{setFly(onoff(null,S.fly,a[0]));return 'บิน: '+(S.fly?'เปิด (Space ขึ้น · C ลง)':'ปิด');});
defCmd(['prank'],'prank <1-8> [ชื่อ|all]','แกล้งเพื่อน 1 หลอก 2 ดับไฟ 3 ช้า 4 แข็ง 5 หมุน 6 กระซิบ 7 ลากมา 8 ส่งกลับ',a=>{
  const ty=parseInt(a[0],10);if(!(ty>=1&&ty<=8))return PRANKS.map(p=>p[0]+'='+p[1]).join(' · ');
  const id=targetId(a[1]);if(id==null)return 'ไม่พบเพื่อนชื่อ "'+a[1]+'"';return doPrank(ty,id);
});
defCmd(['scare','boo'],'scare [ชื่อ|all]','ให้ผีหลอกเพื่อนจนต้องเกิดใหม่',a=>{const id=targetId(a[0]);if(id==null)return 'ไม่พบเพื่อนชื่อ "'+a[0]+'"';return doPrank(1,id);});
defCmd(['pull'],'pull [ชื่อ|all]','ลากเพื่อนมาหาคุณ',a=>{const id=targetId(a[0]);if(id==null)return 'ไม่พบเพื่อน';return doPrank(7,id);});
defCmd(['spawn','conjure'],'spawn [near|close|behind] [ชื่อ]','เสกผีใส่ตัวคุณหรือเพื่อน',a=>{
  const m=['near','close','behind'].indexOf(a[0])>=0?a[0]:'near',nm=['near','close','behind'].indexOf(a[0])>=0?a[1]:a[0];
  const id=nm?targetId(nm):'*';if(id==null)return 'ไม่พบเพื่อน';return doSummon(m,id);
});
defCmd(['speed','spd'],'speed <0.5-4>','ความเร็วเดินของคุณ',a=>{const v=clamp(fnum(a[0],1),0.3,4);S.speedMul=v;return 'ความเร็วเดิน ×'+v;});
defCmd(['tp','goto'],'tp <ที่|ชื่อเพื่อน|x z>','วาร์ป — ใช้ list ดูชื่อที่',a=>{
  if(!a.length)return 'ใช้: tp altar | tp 3 -2 | tp <ชื่อเพื่อน>';
  if(a.length>=2&&!isNaN(parseFloat(a[0]))&&!isNaN(parseFloat(a[1])))return admTp(parseFloat(a[0]),parseFloat(a[1]),'');
  const k=a[0].toLowerCase(),pl=TP_PLACES.find(p=>p[0]===k||p[1]===a[0]);
  if(pl)return admTp(pl[2],pl[3],pl[1]);
  const pe=NET.peers.find(p=>p.peer!==NET.me&&Array.isArray(p.presence.p)&&String(p.presence.n||'').toLowerCase()===k);
  if(pe)return admTp(num(pe.presence.p[0],0),num(pe.presence.p[1],0),' '+pe.presence.n);
  return 'ไม่รู้จักที่ "'+a[0]+'" — พิมพ์ list';
});
defCmd(['list','places'],'list','รายชื่อจุดวาร์ป',()=>TP_PLACES.map(p=>p[0]+' ('+p[1]+')').join(', '));
defWorld(['sc','scrolls'],'sc','เปิดใบลานครบ ๔ ใบ','sc');
defWorld(['solvehall','solve'],'solvehall','ข้ามปริศนาเครื่องดนตรี (เปิดทางสู่ลานบ้าน)','solvehall');
defCmd(['give'],'give <ธูป|incense|rice|water|garland|crank|key|note|all>','ให้ของทีม',a=>{
  const v=itemArg(a[0]);if(v==null)return 'ของไม่ถูกต้อง: incense rice water garland crank key note all';
  reqAdmin('give',v);return 'ให้ '+(a[0]||'all')+' แล้ว';
});
defWorld(['barn'],'barn','เปิดยุ้งข้าวโดยไม่ต้องใส่รหัส','barn');
defWorld(['bless'],'bless','ได้พรจากศาลพระภูมิทันที','bless');
defWorld(['gate'],'gate','เปิดประตูรั้ว (เริ่มฉากจบ)','gate');
defWorld(['win','idkfa'],'win','ข้ามทุกปริศนาแล้วเปิดประตูรั้ว','win');
defWorld(['banish','calm'],'banish [วินาที]','ไล่ผีไปชั่วคราว','banish',a=>clamp(fnum(a[0],60),1,600));
defCmd(['summon'],'summon','เรียกผีมาหาเดี๋ยวนี้',()=>doSummon('near','*'));
defWorld(['kill','despawn'],'kill','ทำให้ผีที่ปรากฏอยู่หายไป','kill');
defWorld(['gspeed','ghostspeed'],'gspeed <0.2-5>','ความเร็วผี','speed',a=>clamp(fnum(a[0],1),0.2,5));
defWorld(['freeze'],'freeze','สลับ หยุดผีทั้งหมด','freeze');
defCmd(['gd','peace'],'gd [on|off]','ผีสงบ ไม่ปรากฏเลย',a=>{const v=onoff(null,!!W.gd,a[0]);reqAdmin('gd',v?1:0);return 'ผีสงบ: '+(v?'เปิด':'ปิด');});
defCmd(['ga','rage'],'ga [on|off]','ผีก้าวร้าว มาถี่และอยู่นาน',a=>{const v=onoff(null,!!W.ga,a[0]);reqAdmin('ga',v?1:0);return 'ผีก้าวร้าว: '+(v?'เปิด':'ปิด');});
defCmd(['announce','say'],'announce <ข้อความ>','ประกาศถึงทุกคนในห้อง',a=>{const t=a.join(' ').trim();if(!t)return 'พิมพ์ข้อความด้วย';reqAdmin('announce',t);return 'ประกาศแล้ว';});
defWorld(['reset'],'reset','รีเซ็ตเรือนทั้งหมดเป็นเริ่มต้น','reset');
defCmd(['status','st'],'status','ดูสถานะเกม',()=>admStatus());
defCmd(['clear','cls'],'clear','ล้างหน้าจอ',()=>{ADM.lines=[];const lg=$('admLog');if(lg)lg.textContent='';return null;});
defCmd(['lock'],'lock','ล็อกแอดมินและปิดสิทธิ์โกงทั้งหมด',()=>{admLockOut();return null;});
defCmd(['help','?'],'help [คำสั่ง]','รายการคำสั่ง',a=>{
  if(a[0]&&CMDS[a[0].toLowerCase()]){const c=CMDS[a[0].toLowerCase()];return c.usage+' — '+c.help;}
  const seen={},out=[];Object.keys(CMDS).forEach(k=>{const c=CMDS[k];if(!seen[c.main]){seen[c.main]=1;out.push(c.main);}});
  return 'คำสั่ง: '+out.join(' ')+'\nพิมพ์ help <คำสั่ง> เพื่อดูวิธีใช้ · โค้ดลัด: iddqd idclip idkfa fiatlux';
});
function admRun(line){
  const t=line.trim();if(!t)return;
  admLog('> '+t,'in');
  const parts=t.split(/\s+/),name=parts[0].toLowerCase().replace(/^\//,''),c=CMDS[name];
  if(!c){admLog('ไม่รู้จักคำสั่ง "'+parts[0]+'" — พิมพ์ help','er');return;}
  let r;try{r=c.fn(parts.slice(1));}catch(e){admLog('ผิดพลาด: '+(e&&e.message?e.message:e),'er');return;}
  if(r)String(r).split('\n').forEach(x=>admLog(x));
  if(S.adminOpen&&ADM.tab!=='code')admRender();
}
function admLockOut(){
  S.admin=false;S.god=S.noclip=S.fast=S.bright=S.esp=S.blind=S.xray=S.forceDawn=S.invis=S.pesp=false;setFly(false);S.speedMul=1;
  ADM.lines=[];admRender();
}

/* ---------- window rendering ---------- */
function admTog(label,key,after){
  return abtn(label+': '+(S[key]?'เปิด':'ปิด'),()=>{S[key]=!S[key];if(after)after();admRender();},S[key]);
}
function admWorldBtn(label,cmd,arg){return abtn(label,()=>{reqAdmin(cmd,arg==null?null:arg);admLog('ส่ง '+cmd+(arg!=null?' '+arg:''));setTimeout(()=>{if(S.adminOpen)admRender();},350);});}
function admRender(){
  const tabs=$('admTabs'),body=$('admBody');tabs.textContent='';body.textContent='';
  $('admTitle').textContent=S.admin?'ADMIN':'ADMIN · ล็อก';
  if(!S.admin){
    tabs.hidden=true;
    body.appendChild(el('p',null,'ใส่โค้ดแอดมินเพื่อปลดล็อกเมนูโกงและคอนโซลคำสั่ง'));
    const inp=el('input');inp.type='text';inp.id='admCode';inp.autocomplete='off';inp.spellcheck=false;inp.placeholder='โค้ดแอดมิน';body.appendChild(inp);
    const err=el('p','err');body.appendChild(err);
    const go=abtn('ปลดล็อก',async()=>{
      let ok=false;
      try{ok=(await sha256(ADMIN_SALT+inp.value.trim().toUpperCase()))===ADMIN_HASH;}catch(e){ok=false;}
      if(ok){S.admin=true;admLog('ปลดล็อกแล้ว พิมพ์ help เพื่อดูคำสั่ง','in');admRender();}else{err.textContent='โค้ดไม่ถูกต้อง';inp.value='';}
    });
    inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')go.click();if(e.key==='Escape')admClose();});
    body.appendChild(go);
    return;
  }
  tabs.hidden=false;
  ADM_TABS.forEach(t=>{
    const b=el('button',null,t[1]);b.type='button';b.setAttribute('role','tab');b.setAttribute('aria-selected',ADM.tab===t[0]?'true':'false');
    b.addEventListener('click',()=>{ADM.tab=t[0];admRender();});tabs.appendChild(b);
  });
  const tab=ADM.tab,note=NET.on&&!NET.isHost?' (ส่งไปยังเจ้าของห้อง)':'';
  if(tab==='player'){
    body.appendChild(el('h3',null,'ตัวคุณ (มีผลเฉพาะคุณ)'));
    const g=el('div','grid');
    g.appendChild(admTog('อมตะ','god'));g.appendChild(admTog('ทะลุผนัง','noclip'));g.appendChild(admTog('เร็ว ×2','fast'));g.appendChild(admTog('สว่างจ้า','bright'));
    g.appendChild(admTog('ลูกศรชี้ผี','esp'));g.appendChild(admTog('ผีมองไม่เห็น','blind'));g.appendChild(admTog('เห็นไอเทมทะลุ','xray'));g.appendChild(admTog('ฟ้าสาง','forceDawn'));
    g.appendChild(admTog('ล่องหน','invis'));g.appendChild(admTog('เห็นเพื่อนทะลุกำแพง','pesp'));
    g.appendChild(abtn('บิน: '+(S.fly?'เปิด':'ปิด'),()=>{setFly(!S.fly);admRender();},S.fly));
    body.appendChild(g);
    if(S.fly){
      const fr=el('div','grid');
      const hold=(lab,v)=>{const b=abtn(lab,()=>{});b.addEventListener('pointerdown',e=>{S.flyIn=v;try{b.setPointerCapture(e.pointerId);}catch(x){}});['pointerup','pointercancel','lostpointercapture'].forEach(ev=>b.addEventListener(ev,()=>{S.flyIn=0;}));b.style.touchAction='none';return b;};
      fr.appendChild(hold('▲ ขึ้น (กดค้าง)',1));fr.appendChild(hold('▼ ลง (กดค้าง)',-1));body.appendChild(fr);
      body.appendChild(el('p','lbl','คีย์บอร์ด: Space ขึ้น · C ลง · บินทะลุผนังได้'));
    }
    body.appendChild(el('h3',null,'ความเร็วเดิน ×'+S.speedMul));
    const c=el('div','chips');[1,1.5,2,3].forEach(v=>c.appendChild(abtn('×'+v,()=>{S.speedMul=v;admRender();},S.speedMul===v)));body.appendChild(c);
    const r=el('div','row');r.appendChild(abtn('ล็อกแอดมิน',admLockOut));body.appendChild(r);
  }else if(tab==='world'){
    body.appendChild(el('h3',null,'โลกของเกม'+note));
    const g=el('div','grid');
    g.appendChild(admWorldBtn('เปิดใบลานทั้งหมด','sc'));g.appendChild(admWorldBtn('ข้ามปริศนาเครื่องดนตรี','solvehall'));
    g.appendChild(admWorldBtn('ชนะทันที','win'));g.appendChild(admWorldBtn('รีเซ็ตเรือน','reset'));
    body.appendChild(g);
    body.appendChild(el('h3',null,'ประกาศถึงทุกคน'));
    const inp=el('input');inp.type='text';inp.maxLength=80;inp.placeholder='ข้อความ…';inp.autocomplete='off';
    const send=()=>{const t=inp.value.trim();if(!t)return;reqAdmin('announce',t);admLog('ประกาศ: '+t);inp.value='';};
    inp.addEventListener('keydown',e=>{e.stopPropagation();if(e.key==='Enter')send();});
    body.appendChild(inp);body.appendChild(abtn('ส่งประกาศ',send));
    body.appendChild(el('h3',null,'สถานะ'));
    const pre=el('p','lbl',admStatus());pre.style.whiteSpace='pre-wrap';body.appendChild(pre);
  }else if(tab==='ghost'){
    body.appendChild(el('h3',null,'นางรำ'+note));
    const g=el('div','grid');
    g.appendChild(admWorldBtn('ไล่ผี ๖๐ วิ','banish',60));g.appendChild(admWorldBtn('ไล่ผี ๓ นาที','banish',180));
    g.appendChild(admWorldBtn('ทำให้ผีหาย','kill'));
    g.appendChild(abtn('หยุดผี: '+(W.fz?'เปิด':'ปิด'),()=>{reqAdmin('freeze');setTimeout(()=>{if(S.adminOpen)admRender();},350);},!!W.fz));
    g.appendChild(abtn('ผีสงบ: '+(W.gd?'เปิด':'ปิด'),()=>{reqAdmin('gd',W.gd?0:1);setTimeout(()=>{if(S.adminOpen)admRender();},350);},!!W.gd));
    g.appendChild(abtn('ผีก้าวร้าว: '+(W.ga?'เปิด':'ปิด'),()=>{reqAdmin('ga',W.ga?0:1);setTimeout(()=>{if(S.adminOpen)admRender();},350);},!!W.ga));
    body.appendChild(g);
    body.appendChild(el('h3',null,'เสกผี — เลือกเป้าหมาย'));
    body.appendChild(admTargetChips(false));
    const sm=el('div','grid'),tgt=ADM.target==='*'?null:ADM.target;
    sm.appendChild(abtn('เสกใกล้ ๆ',()=>admLog(doSummon('near',tgt))));
    sm.appendChild(abtn('เสกประชิดตัว',()=>admLog(doSummon('close',tgt))));
    sm.appendChild(abtn('เสกข้างหลัง',()=>admLog(doSummon('behind',tgt))));
    body.appendChild(sm);
    body.appendChild(el('h3',null,'ความเร็วผี ×'+(W.gs||1)));
    const c=el('div','chips');[0.5,1,1.5,2.5,4].forEach(v=>c.appendChild(abtn('×'+v,()=>{reqAdmin('speed',v);setTimeout(()=>{if(S.adminOpen)admRender();},350);},(W.gs||1)===v)));body.appendChild(c);
  }else if(tab==='prank'){
    body.appendChild(el('h3',null,'แกล้งเพื่อน — เลือกเป้าหมาย'));
    body.appendChild(admTargetChips(true));
    const g=el('div','grid');
    PRANKS.forEach(p=>g.appendChild(abtn(p[1],()=>admLog(doPrank(p[0],ADM.target)))));
    body.appendChild(g);
    body.appendChild(el('p','lbl','เพื่อนจะเห็นเหตุการณ์แปลก ๆ โดยไม่รู้ว่าเป็นฝีมือคุณ · "ผีหลอกจนเกิดใหม่" ทำให้เพื่อนถูกจับแล้วกลับไปเกิดกลางเรือน'));
  }else if(tab==='puzzle'){
    body.appendChild(el('h3',null,'ห้องเครื่องดนตรี'+note));
    const g=el('div','grid');
    g.appendChild(admWorldBtn('เปิดใบลานครบ','sc'));g.appendChild(admWorldBtn('ข้ามบรรเลง','solvehall'));
    body.appendChild(g);
    body.appendChild(el('h3',null,'ลานบ้าน'));
    const g2=el('div','grid');
    g2.appendChild(admWorldBtn('เปิดยุ้งข้าว','barn'));g2.appendChild(admWorldBtn('รับพรศาล','bless'));
    g2.appendChild(admWorldBtn('เปิดประตูรั้ว','gate'));g2.appendChild(admWorldBtn('ข้ามทั้งหมด','win'));
    body.appendChild(g2);
    body.appendChild(el('h3',null,'ให้ของ'));
    const c=el('div','chips');
    Object.keys(INV_KEYS).forEach(k=>{const v=INV_KEYS[k];c.appendChild(abtn(INV_NAMES[v],()=>{reqAdmin('give',v);admLog('ให้ '+INV_NAMES[v]);setTimeout(()=>{if(S.adminOpen)admRender();},350);},!!(W.inv&v)));});
    c.appendChild(abtn('ทั้งหมด',()=>{reqAdmin('give','all');setTimeout(()=>{if(S.adminOpen)admRender();},350);}));
    body.appendChild(c);
    const pre=el('p','lbl',admStatus());pre.style.whiteSpace='pre-wrap';body.appendChild(pre);
  }else if(tab==='tp'){
    body.appendChild(el('h3',null,'เทเลพอร์ต'));
    const g=el('div','grid');
    TP_PLACES.forEach(p=>g.appendChild(abtn(p[1],()=>{admLog(admTp(p[2],p[3],p[1]));admRender();})));
    NET.peers.forEach(p=>{if(p.peer===NET.me||!Array.isArray(p.presence.p))return;g.appendChild(abtn('ไปหา '+String(p.presence.n||'เพื่อน').slice(0,10),()=>{admLog(admTp(num(p.presence.p[0],0),num(p.presence.p[1],0),String(p.presence.n||'')));}));});
    body.appendChild(g);
  }else{
    body.appendChild(el('h3',null,'คอนโซลคำสั่ง'));
    const lg=el('div');lg.id='admLog';body.appendChild(lg);
    if(!ADM.lines.length)ADM.lines.push(['พิมพ์ help เพื่อดูคำสั่งทั้งหมด','']);
    ADM.lines.forEach(l=>lg.appendChild(admLine(l)));lg.scrollTop=lg.scrollHeight;
    const inp=el('input');inp.type='text';inp.id='admCmd';inp.autocomplete='off';inp.spellcheck=false;inp.placeholder='เช่น god · tp well · give key · win';
    inp.addEventListener('keydown',e=>{
      e.stopPropagation();
      if(e.key==='Enter'){const v=inp.value;if(v.trim()){ADM.hist.push(v);if(ADM.hist.length>40)ADM.hist.shift();}ADM.hi=ADM.hist.length;inp.value='';admRun(v);}
      else if(e.key==='ArrowUp'){e.preventDefault();if(ADM.hi>0)ADM.hi--;inp.value=ADM.hist[ADM.hi]||'';}
      else if(e.key==='ArrowDown'){e.preventDefault();if(ADM.hi<ADM.hist.length)ADM.hi++;inp.value=ADM.hist[ADM.hi]||'';}
      else if(e.key==='Escape'){inp.blur();}
    });
    body.appendChild(inp);
    const c=el('div','chips');
    ['help','status','god','noclip','xray','win','banish','list'].forEach(k=>c.appendChild(abtn(k,()=>admRun(k))));
    body.appendChild(c);
  }
}

/* ---------- drag + wiring ---------- */
function admWire(){
  $('admFab').addEventListener('click',admOpen);
  $('admClose').addEventListener('click',admClose);
  $('admMin').addEventListener('click',admMinToggle);
  $('admMax').addEventListener('click',()=>{ADM.max=!ADM.max;$('admWin').classList.toggle('max',ADM.max);$('admMax').textContent=ADM.max?'❐':'☐';});
  const bar=$('admBar'),win=$('admWin');
  let d=null;
  bar.addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    const r=win.getBoundingClientRect(),st=stage.getBoundingClientRect();
    d={dx:e.clientX-r.left,dy:e.clientY-r.top,sx:st.left,sy:st.top,w:r.width,sw:st.width,sh:st.height,id:e.pointerId};
    try{bar.setPointerCapture(e.pointerId);}catch(x){}
    bar.classList.add('drag');e.preventDefault();
  });
  bar.addEventListener('pointermove',e=>{
    if(!d||e.pointerId!==d.id)return;
    const x=clamp(e.clientX-d.dx-d.sx,4,Math.max(4,d.sw-d.w-4)),y=clamp(e.clientY-d.dy-d.sy,4,Math.max(4,d.sh-44));
    win.style.left=x+'px';win.style.top=y+'px';
  });
  const end=e=>{if(d&&e.pointerId===d.id){d=null;bar.classList.remove('drag');}};
  bar.addEventListener('pointerup',end);bar.addEventListener('pointercancel',end);
}
