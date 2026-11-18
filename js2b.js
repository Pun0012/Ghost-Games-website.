
/* ============================ COURTYARD (ลานบ้าน) ============================ */
const GY=-2.52;
const YARD={go:0,bo:0};
function regPick(o){
  const it={kind:'pick',id:'pk'+o.bit,name:o.name,verb:'เก็บ',bit:o.bit,req:o.req||0,focus:{x:o.x,y:o.y,z:o.z},r:o.r||2.5,mesh:o.mesh,taken:false,flash:0,glow:[]};
  items.push(it);return it;
}
function pgroup(x,y,z){const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);return g;}
function tableAt(x,z,w,d,h,y0){
  box(w,0.06,d,x,y0+h,z,mats.pillar);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s=>box(0.07,h,0.07,x+s[0]*(w/2-0.06),y0+h/2,z+s[1]*(d/2-0.06),mats.pillar));
}
function slopeBox(len,thick,depth,x,y,z,mat,rotAxis,ang){
  const m=box(len,thick,depth,x,y,z,mat);m.rotation[rotAxis]=ang;return m;
}
function buildPicks(){
  // garland (hall) next to the decoy flute
  let g=pgroup(1.45,0.63,-1.15);
  const orange=M(0xff7a1a,0.7,0,{emissive:0x7a2a08,emissiveIntensity:0.9});
  const gm=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.03,8,16),M(0xe8a020,0.8,0,{emissive:0x7a4a08,emissiveIntensity:0.8}));gm.rotation.x=Math.PI/2;g.add(gm);
  for(let i=0;i<6;i++){const a=i/6*Math.PI*2;sph(0.035,Math.cos(a)*0.12,0.02,Math.sin(a)*0.12,orange,g);}
  glowSprite(0,0.08,0,0.7,255,170,60,0.45,g);
  regPick({bit:INV.GARLAND,name:'มาลัยดอกดาวเรือง',x:1.45,y:0.7,z:-1.15,mesh:g,r:2.4});
  // kitchen: incense + note
  const kx=-9.5,kz=22,ty=GY+0.83;
  g=pgroup(kx-0.45,ty,kz+0.5);
  cyl(0.07,0.06,0.05,10,0,0.02,0,mats.dark,g);
  for(let i=0;i<7;i++){const a=i/7*Math.PI*2,st=cyl(0.004,0.004,0.28,4,Math.cos(a)*0.025,0.16,Math.sin(a)*0.025,M(0x6a3a1a),g);st.rotation.set(Math.sin(a)*0.18,0,-Math.cos(a)*0.18);sph(0.008,Math.cos(a)*0.05,0.3,Math.sin(a)*0.05,M(0xff3a10,0.5,0,{emissive:0xff3000,emissiveIntensity:2}),g);}
  glowSprite(0,0.2,0,0.55,255,140,60,0.4,g);
  regPick({bit:INV.INCENSE,name:'ธูป',x:kx-0.45,y:ty+0.15,z:kz+0.5,mesh:g});
  g=pgroup(kx+0.45,ty,kz+0.5);
  const paper=box(0.24,0.012,0.32,0,0.01,0,M(0xe0d4aa,0.9,0,{emissive:0x6a5a30,emissiveIntensity:0.7}),g);paper.rotation.y=0.3;
  glowSprite(0,0.08,0,0.6,255,210,120,0.5,g);
  regPick({bit:INV.NOTE,name:'ใบบันทึกในครัว',x:kx+0.45,y:ty+0.1,z:kz+0.5,mesh:g});
  // barn bench: rice + crank (only after barn opens)
  const bx=9.5,by=GY+0.56;
  g=pgroup(bx-0.4,by,19.6);
  cyl(0.1,0.06,0.07,12,0,0.03,0,M(0xe8e0c8,0.6),g);sph(0.09,0,0.08,0,M(0xf4f0e0,0.8),g,1,0.6,1);
  glowSprite(0,0.1,0,0.55,255,240,200,0.4,g);
  regPick({bit:INV.RICE,name:'ข้าวสาร',x:bx-0.4,y:by+0.1,z:19.6,mesh:g,req:FL.BARN});
  g=pgroup(bx+0.4,by,19.6);
  const iron=M(0x3a3a40,0.5,0.8);
  const c1=cyl(0.015,0.015,0.35,6,0,0.03,0,iron,g);c1.rotation.z=Math.PI/2;cyl(0.015,0.015,0.2,6,0.17,0.12,0,iron,g);sph(0.03,0.17,0.23,0,iron,g);
  glowSprite(0,0.1,0,0.55,200,220,255,0.4,g);
  regPick({bit:INV.CRANK,name:'คันโยกรอก',x:bx+0.4,y:by+0.1,z:19.6,mesh:g,req:FL.BARN});
}
function buildYard(){
  const stone=M(0x6d6a60,0.95),wood=mats.pillar,woodL=M(0x4a3020,0.9);
  const roofM=new THREE.MeshStandardMaterial({map:mats.roof.map,roughness:0.95,side:THREE.DoubleSide});
  for(let i=0;i<15;i++)box(1.1,0.05,0.85,rnd(-0.25,0.25),GY+0.025,11.6+i*1.0,stone);
  // fence
  const fp=[];
  for(let z=11.2;z<=26.45;z+=1.7){fp.push([-12.8,z]);fp.push([12.8,z]);}
  for(let x=-12.8;x<=12.9;x+=1.7){if(Math.abs(x)>1.8)fp.push([x,26.4]);}
  const fm=new THREE.InstancedMesh(new THREE.BoxGeometry(0.14,1.25,0.14),wood,fp.length),dm=new THREE.Object3D();
  fp.forEach((p,i)=>{dm.position.set(p[0],GY+0.62,p[1]);dm.updateMatrix();fm.setMatrixAt(i,dm.matrix);});
  fm.instanceMatrix.needsUpdate=true;fm.frustumCulled=false;scene.add(fm);
  [0.5,1.0].forEach(h=>{box(0.06,0.07,15.4,-12.8,GY+h,18.8,wood);box(0.06,0.07,15.4,12.8,GY+h,18.8,wood);box(11.1,0.07,0.06,-7.3,GY+h,26.4,wood);box(11.1,0.07,0.06,7.3,GY+h,26.4,wood);});
  // gate
  box(0.3,2.3,0.3,-1.75,GY+1.15,26.4,wood);box(0.3,2.3,0.3,1.75,GY+1.15,26.4,wood);box(3.8,0.18,0.3,0,GY+2.25,26.4,wood);
  const gr=box(4.2,0.08,0.8,0,GY+2.42,26.4,mats.gold);
  [-1,1].forEach(s=>{
    const hg=new THREE.Group();hg.position.set(s*1.55,GY,26.4);scene.add(hg);
    box(1.5,1.7,0.07,-s*0.75,0.9,0,wood,hg);box(1.5,0.08,0.09,-s*0.75,1.6,0,woodL,hg);box(1.5,0.08,0.09,-s*0.75,0.3,0,woodL,hg);box(0.08,1.7,0.09,-s*0.75,0.9,0,woodL,hg);
    if(s<0)YARD.gateL=hg;else YARD.gateR=hg;
  });
  YARD.gateGlow=glowSprite(0,GY+1.2,26.1,4.5,255,200,120,0,scene);
  items.push({kind:'gate',id:'gate',name:'ประตูรั้ว',verb:'เปิด',focus:{x:0,y:GY+1.2,z:26.2},r:3.4,taken:false,flash:0,glow:[]});

  // spirit house (ศาลพระภูมิ)
  const sx=-7.5,sz=16;
  box(0.9,0.2,0.9,sx,GY+0.1,sz,stone);
  box(0.2,1.5,0.2,sx,GY+0.95,sz,M(0xd9d0b8,0.8));
  box(0.9,0.5,0.9,sx,GY+2.0,sz,M(0xb23a2a,0.7,0,{emissive:0x2a0a05}));
  const rf=new THREE.Mesh(new THREE.ConeGeometry(0.85,0.5,4),mats.gold);rf.position.set(sx,GY+2.5,sz);rf.rotation.y=Math.PI/4;scene.add(rf);
  cyl(0.01,0.03,0.2,6,sx,GY+2.85,sz,mats.gold);
  box(1.4,0.06,0.6,sx,GY+0.62,sz+0.8,wood);[-0.6,0.6].forEach(x=>box(0.06,0.6,0.06,sx+x,GY+0.3,sz+1.05,wood));
  YARD.offer=[];
  [0xd9d0b8,0xf0ead0,0x3a6a9a,0xe8a020].forEach((c,i)=>{
    const m=M(c,0.7,0,{emissive:0xffa030,emissiveIntensity:0});
    const d=cyl(0.09,0.08,0.05,12,sx-0.48+i*0.32,GY+0.68,sz+0.82,m);YARD.offer.push(m);
  });
  YARD.shrineGlow=glowSprite(sx,GY+2.0,sz,3.4,255,200,120,0,scene);
  glowSprite(sx-0.5,GY+0.9,sz+0.85,0.5,255,170,70,0.5,scene);
  items.push({kind:'shrine',id:'shrine',name:'ศาลพระภูมิ',verb:'บูชา',focus:{x:sx,y:GY+1.3,z:sz+0.5},r:3.3,taken:false,flash:0,glow:YARD.offer});
  col(sx,sz+0.3,0.75,0.8);

  // well (บ่อน้ำ)
  const wx=7.5,wz=15;
  const ring=new THREE.Mesh(new THREE.CylinderGeometry(0.78,0.82,0.85,18,1,true),new THREE.MeshStandardMaterial({color:0x77746a,roughness:0.95,side:THREE.DoubleSide}));ring.position.set(wx,GY+0.42,wz);scene.add(ring);
  const rim=new THREE.Mesh(new THREE.TorusGeometry(0.8,0.08,8,20),stone);rim.rotation.x=Math.PI/2;rim.position.set(wx,GY+0.85,wz);scene.add(rim);
  const wat=new THREE.Mesh(new THREE.CircleGeometry(0.72,18),M(0x0a1a2a,0.2,0.6,{emissive:0x0a2a4a,emissiveIntensity:0.6}));wat.rotation.x=-Math.PI/2;wat.position.set(wx,GY+0.3,wz);scene.add(wat);
  [-0.95,0.95].forEach(x=>box(0.12,1.9,0.12,wx+x,GY+0.95,wz,wood));
  box(2.2,0.12,0.14,wx,GY+1.9,wz,wood);
  cyl(0.012,0.012,1.0,4,wx,GY+1.35,wz,mats.cream);cyl(0.12,0.1,0.18,10,wx,GY+0.82,wz,woodL);
  const wc=pgroup(wx+1.0,GY+1.45,wz);const iron2=M(0x3a3a40,0.5,0.8);
  const w1=cyl(0.02,0.02,0.3,6,0,0,0,iron2,wc);w1.rotation.z=Math.PI/2;cyl(0.02,0.02,0.25,6,0.15,-0.12,0,iron2,wc);sph(0.035,0.15,-0.26,0,iron2,wc);
  YARD.wellCrank=wc;
  items.push({kind:'well',id:'well',name:'บ่อน้ำ',verb:'หมุน',focus:{x:wx,y:GY+1.0,z:wz},r:3.2,taken:false,flash:0,glow:[]});
  col(wx,wz,0.95,0.95);

  // rice barn (ยุ้งข้าว)
  const bx=9.5,bz=22.2;
  [[-1.1,-0.9],[1.1,-0.9],[-1.1,0.9],[1.1,0.9]].forEach(p=>box(0.2,1.0,0.2,bx+p[0],GY+0.5,bz+p[1],wood));
  box(2.6,0.15,2.2,bx,GY+1.05,bz,mats.floor);box(2.4,1.3,2.0,bx,GY+1.78,bz,mats.wall);
  const ang=Math.atan2(0.85,1.5),Lb=Math.hypot(1.5,0.85);
  slopeBox(Lb,0.08,2.7,bx-0.75,GY+2.78,bz,roofM,'z',ang);slopeBox(Lb,0.08,2.7,bx+0.75,GY+2.78,bz,roofM,'z',-ang);
  box(1.6,0.35,0.5,bx,GY+0.18,bz-1.45,stone);
  const bd=pgroup(bx-0.5,GY+1.75,bz-1.03);box(1.0,1.15,0.06,0.5,0,0,woodL,bd);YARD.barnDoor=bd;
  const lk=pgroup(bx+0.35,GY+1.72,bz-1.09);box(0.14,0.18,0.06,0,-0.05,0,mats.gold,lk);const sh=new THREE.Mesh(new THREE.TorusGeometry(0.05,0.012,6,12,Math.PI),mats.gold);sh.position.y=0.06;lk.add(sh);
  box(0.3,0.2,0.04,-0.12,0.0,0,mats.dark,lk);
  for(let i=0;i<4;i++)sph(0.012,-0.22+i*0.06,0,0.03,M(0xffb040,0.4,0,{emissive:0xffa020,emissiveIntensity:2}),lk);
  YARD.lock=lk;glowSprite(bx,GY+1.75,bz-1.2,0.9,255,190,90,0.5,scene);
  items.push({kind:'lock',id:'lock',name:'กุญแจยุ้งข้าว',verb:'ใส่รหัส',focus:{x:bx,y:GY+1.75,z:bz-1.1},r:3.6,taken:false,flash:0,glow:[]});
  col(bx,bz-0.3,1.35,1.55);
  box(1.4,0.06,0.5,bx,GY+0.5,19.6,wood);[[-0.6,-0.18],[0.6,-0.18],[-0.6,0.18],[0.6,0.18]].forEach(p=>box(0.05,0.5,0.05,bx+p[0],GY+0.25,19.6+p[1],wood));
  col(bx,19.6,0.8,0.32);

  // kitchen hut (เรือนครัว)
  const kx=-9.5,kz=22;
  box(3.6,0.1,2.8,kx,GY+0.05,kz,mats.floor);
  [[-1.7,-1.3],[1.7,-1.3],[-1.7,1.3],[1.7,1.3]].forEach(p=>box(0.14,2.2,0.14,kx+p[0],GY+1.1,kz+p[1],wood));
  const ang2=Math.atan2(0.85,1.5);
  slopeBox(3.9,0.08,Lb,kx,GY+2.78,kz-0.75,roofM,'x',-ang2);slopeBox(3.9,0.08,Lb,kx,GY+2.78,kz+0.75,roofM,'x',ang2);
  tableAt(kx,kz+0.5,1.4,0.7,0.8,GY);col(kx,kz+0.5,0.78,0.42);
  box(0.9,0.55,0.6,kx-1.35,GY+0.38,kz-0.4,M(0x7a4a38,0.95));
  box(0.6,0.04,0.35,kx-1.35,GY+0.67,kz-0.4,M(0xff5a10,0.6,0,{emissive:0xff4a00,emissiveIntensity:2}));
  glowSprite(kx-1.35,GY+0.9,kz-0.4,1.4,255,120,40,0.5,scene);
  const jp=[[0.001,0],[0.14,0.02],[0.2,0.15],[0.14,0.3],[0.15,0.34],[0.001,0.34]];
  const pot=new THREE.Mesh(new THREE.LatheGeometry(jp.map(p=>new THREE.Vector2(p[0],p[1])),12),M(0x3b2a1d,0.5,0.2));pot.position.set(kx-1.35,GY+0.7,kz-0.4);scene.add(pot);
  col(kx-1.35,kz-0.4,0.55,0.38);
}
function buildMarkers(){
  const tex=softTex(255,255,255);
  items.forEach(it=>{
    const c=it.kind==='scroll'?0xffd060:it.kind==='instr'?0x66ccff:it.kind==='pick'?0x66ff99:0xff7766;
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,color:c,transparent:true,opacity:0.95,depthTest:false,depthWrite:false,fog:false}));
    sp.scale.set(0.34,0.34,1);sp.position.set(it.focus.x,it.focus.y+0.1,it.focus.z);sp.renderOrder=999;sp.visible=false;scene.add(sp);it.marker=sp;
  });
}
