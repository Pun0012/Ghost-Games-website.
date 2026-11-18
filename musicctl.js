
/* ============================ GHOST THEME (เพลงตอนผีมา) ============================ */
const MU={buf:null,src:null,g:null,loading:false,playing:false,starts:0};
function musicLoad(){
  if(MU.buf||MU.loading||!A.ctx)return;MU.loading=true;
  try{
    const bin=atob(MUSIC_B64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);
    const p=A.ctx.decodeAudioData(u.buffer,b=>{MU.buf=b;MU.loading=false;},()=>{MU.loading=false;});
    if(p&&p.catch)p.catch(()=>{MU.loading=false;});
  }catch(e){MU.loading=false;}
}
function musicStop(now){
  const s=MU.src,g=MU.g;if(!s)return;MU.src=null;MU.playing=false;
  try{
    if(now){s.stop();s.disconnect();g.disconnect();}
    else{g.gain.cancelScheduledValues(A.ctx.currentTime);g.gain.setTargetAtTime(0,A.ctx.currentTime,0.35);s.stop(A.ctx.currentTime+1.8);}
  }catch(e){}
}
function musicStart(){
  if(!A.ready||!MU.buf)return false;
  musicStop(true);
  const ctx=A.ctx,src=ctx.createBufferSource();src.buffer=MU.buf;
  const g=ctx.createGain();g.gain.value=0;
  const dry=ctx.createGain();dry.gain.value=0.4;
  src.connect(g);g.connect(A.gp);g.connect(dry);dry.connect(A.sfx);
  g.gain.setTargetAtTime(0.9,ctx.currentTime,0.25);
  src.start(0);MU.src=src;MU.g=g;MU.playing=true;MU.starts++;
  src.onended=()=>{if(MU.src===src){MU.playing=false;}};
  return true;
}
