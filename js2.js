
/* ============================ SCENE ============================ */
let renderer,scene,camera,hemi,moonSprite,stars,mistGroup;
const stage=$('stage'),canvas=$('gl');
const items=[],colliders=[],mats={},L={};
const H=3.4,R=7.0;

function M(color,rough,metal,extra){return new THREE.MeshStandardMaterial(Object.assign({color:color,roughness:rough==null?0.85:rough,metalness:metal||0},extra||{}));}
function put(parent,m){(parent||scene).add(m);return m;}
function box(w,h,d,x,y,z,mat,parent){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return put(parent,m);}
function cyl(rt,rb,h,seg,x,y,z,mat,parent){const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,seg),mat);m.position.set(x,y,z);return put(parent,m);}
function sph(r,x,y,z,mat,parent,sx,sy,sz){const m=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),mat);m.position.set(x,y,z);if(sx)m.scale.set(sx,sy,sz);return put(parent,m);}
function col(x,z,hw,hd){colliders.push({x0:x-hw,x1:x+hw,z0:z-hd,z1:z+hd});}

/* ---------- textures ---------- */
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function mkTex(c){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function woodTex(base,planks,seam){
  const c=cv(512,512),g=c.getContext('2d'),pw=512/planks;
  for(let i=0;i<planks;i++){
    const tn=rnd(-12,12);
    g.fillStyle='rgb('+Math.round(base[0]+tn)+','+Math.round(base[1]+tn*0.75)+','+Math.round(base[2]+tn*0.5)+')';
    g.fillRect(i*pw,0,pw+1,512);
    for(let k=0;k<22;k++){
      let x=i*pw+rnd(2,pw-2);
      g.strokeStyle='rgba(0,0,0,'+rnd(0.05,0.2).toFixed(3)+')';g.lineWidth=rnd(0.5,1.6);g.beginPath();g.moveTo(x,0);
      for(let y=32;y<=512;y+=32){x+=rnd(-1.4,1.4);x=clamp(x,i*pw+1,(i+1)*pw-1);g.lineTo(x,y);}
      g.stroke();
    }
    if(Math.random()<0.55){g.fillStyle='rgba(0,0,0,0.18)';g.beginPath();g.ellipse(i*pw+rnd(8,pw-8),rnd(40,470),rnd(3,6),rnd(7,14),0,0,7);g.fill();}
    g.fillStyle='rgba(0,0,0,'+seam+')';g.fillRect(i*pw,0,2,512);
  }
  for(let j=0;j<3;j++){g.fillStyle='rgba(0,0,0,'+(seam*0.7)+')';g.fillRect(Math.floor(rnd(0,512-pw)),Math.floor(rnd(60,450)),pw,2);}
  return mkTex(c);
}
function strawTex(){
  const c=cv(256,256),g=c.getContext('2d');g.fillStyle='#8f7448';g.fillRect(0,0,256,256);
  for(let y=0;y<256;y+=8)for(let x=0;x<256;x+=8){g.fillStyle=(((x+y)/8)%2===0)?'rgba(255,230,170,.16)':'rgba(0,0,0,.18)';g.fillRect(x,y,8,8);}
  g.strokeStyle='rgba(70,22,12,.6)';g.lineWidth=10;g.strokeRect(5,5,246,246);
  return mkTex(c);
}
function groundTex(){
  const c=cv(256,256),g=c.getContext('2d');g.fillStyle='#16210f';g.fillRect(0,0,256,256);
  for(let i=0;i<2600;i++){g.fillStyle='rgba('+Math.floor(rnd(10,50))+','+Math.floor(rnd(30,70))+','+Math.floor(rnd(8,30))+','+rnd(0.2,0.7).toFixed(2)+')';g.fillRect(rnd(0,256),rnd(0,256),rnd(1,3),rnd(2,6));}
  return mkTex(c);
}
function softTex(r,gc,b){
  const c=cv(128,128),g=c.getContext('2d'),gr=g.createRadialGradient(64,64,0,64,64,64);
  gr.addColorStop(0,'rgba('+r+','+gc+','+b+',1)');gr.addColorStop(0.35,'rgba('+r+','+gc+','+b+',0.45)');gr.addColorStop(1,'rgba('+r+','+gc+','+b+',0)');
  g.fillStyle=gr;g.fillRect(0,0,128,128);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;
}
function moonTex(){
  const c=cv(256,256),g=c.getContext('2d'),gr=g.createRadialGradient(128,128,20,128,128,128);
  gr.addColorStop(0,'rgba(220,230,255,.55)');gr.addColorStop(1,'rgba(120,150,220,0)');g.fillStyle=gr;g.fillRect(0,0,256,256);
  g.fillStyle='#e8eefc';g.beginPath();g.arc(128,128,46,0,7);g.fill();
  g.fillStyle='rgba(120,130,160,.35)';[[112,116,12],[142,134,9],[126,148,7],[146,108,6]].forEach(a=>{g.beginPath();g.arc(a[0],a[1],a[2],0,7);g.fill();});
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;
}
function portraitTex(redEyes){
  const c=cv(256,340),g=c.getContext('2d');
  g.fillStyle='#4a3a28';g.fillRect(0,0,256,340);
  const gr=g.createRadialGradient(128,150,20,128,150,200);gr.addColorStop(0,'#a58c63');gr.addColorStop(1,'#2c2114');g.fillStyle=gr;g.fillRect(0,0,256,340);
  g.fillStyle='#1b120b';g.beginPath();g.ellipse(128,170,58,78,0,0,7);g.fill();
  g.fillStyle='#d8c7a2';g.beginPath();g.ellipse(128,168,38,52,0,0,7);g.fill();
  g.fillStyle='#caa44a';g.beginPath();g.moveTo(88,126);g.lineTo(128,20);g.lineTo(168,126);g.closePath();g.fill();
  g.fillStyle='#8f6d22';g.fillRect(90,118,76,10);
  g.fillStyle='#6b1d28';g.fillRect(60,250,136,90);
  g.fillStyle=redEyes?'#d01818':'#241912';
  g.beginPath();g.ellipse(112,166,7,4,0,0,7);g.ellipse(144,166,7,4,0,0,7);g.fill();
  g.strokeStyle='#5a1a1a';g.lineWidth=3;g.beginPath();g.moveTo(116,196);g.quadraticCurveTo(128,204,140,196);g.stroke();
  g.globalAlpha=0.22;for(let i=0;i<500;i++){g.fillStyle=Math.random()<0.5?'#000':'#fff';g.fillRect(rnd(0,256),rnd(0,340),1,1);}
  return mkTex(c);
}
function labelTex(text,color){
  const c=cv(256,64),g=c.getContext('2d');g.clearRect(0,0,256,64);
  g.font='600 30px Sarabun, sans-serif';g.textAlign='center';g.textBaseline='middle';
  g.lineWidth=6;g.strokeStyle='rgba(0,0,0,.85)';g.strokeText(text,128,34);g.fillStyle=color||'#eadfc6';g.fillText(text,128,34);
  const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;return t;
}

/* polygon helper: planar convex polygon, UVs in metres/tile */
function poly(pts,mat,tile){
  tile=tile||2.4;
  const P0=new THREE.Vector3(pts[0][0],pts[0][1],pts[0][2]),P1=new THREE.Vector3(pts[1][0],pts[1][1],pts[1][2]),P2=new THREE.Vector3(pts[2][0],pts[2][1],pts[2][2]);
  const e1=P1.clone().sub(P0).normalize();
  const nrm=new THREE.Vector3().crossVectors(P1.clone().sub(P0),P2.clone().sub(P0)).normalize();
  const e2=new THREE.Vector3().crossVectors(nrm,e1);
  const pos=[],uv=[],idx=[];
  pts.forEach(p=>{const d=new THREE.Vector3(p[0]-P0.x,p[1]-P0.y,p[2]-P0.z);pos.push(p[0],p[1],p[2]);uv.push(d.dot(e1)/tile,d.dot(e2)/tile);});
  for(let i=1;i<pts.length-1;i++)idx.push(0,i,i+1);
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  g.setIndex(idx);g.computeVertexNormals();
  const m=new THREE.Mesh(g,mat);scene.add(m);return m;
}

function initRenderer(){
  renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,powerPreference:'high-performance'});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.6));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  scene=new THREE.Scene();scene.background=new THREE.Color(NIGHT_BG);scene.fog=new THREE.FogExp2(NIGHT_BG,0.03);
  camera=new THREE.PerspectiveCamera(72,1,0.05,140);camera.rotation.order='YXZ';
  resize();
}
function resize(){
  if(!renderer)return;
  const w=stage.clientWidth||window.innerWidth,h=stage.clientHeight||window.innerHeight;
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w/h<1?84:72;camera.updateProjectionMatrix();
}

function initMats(){
  mats.floor=new THREE.MeshStandardMaterial({map:woodTex([104,64,36],12,0.6),roughness:0.78,side:THREE.DoubleSide});
  mats.wall=new THREE.MeshStandardMaterial({map:woodTex([78,48,29],8,0.55),roughness:0.9,side:THREE.DoubleSide});
  mats.roof=new THREE.MeshStandardMaterial({map:woodTex([58,36,22],6,0.5),roughness:0.95,side:THREE.DoubleSide});
  mats.pillar=M(0x2b190d,0.8);mats.beam=M(0x35200f,0.85);mats.dark=M(0x1b0f08,0.9);
  mats.straw=new THREE.MeshStandardMaterial({map:strawTex(),roughness:1});
  mats.gold=M(0xc99a3a,0.35,0.8,{emissive:0x3a2808});
  mats.red=M(0x7a1f26,0.9);mats.cream=M(0xd8c9a2,0.9);
}

/* ---------- house ---------- */
function buildHouse(){
  const F=mats.floor,Wl=mats.wall,Rf=mats.roof;
  poly([[-6,0,-4],[6,0,-4],[6,0,4],[-6,0,4]],F);
  poly([[-6,0,4],[6,0,4],[6,0,8.4],[-6,0,8.4]],F);
  poly([[-6,0,-4],[6,0,-4],[6,H,-4],[-6,H,-4]],Wl);
  poly([[-6,H,-4],[6,H,-4],[0,R,-4]],Wl);
  poly([[-6,0,4],[-1.3,0,4],[-1.3,H,4],[-6,H,4]],Wl);
  poly([[1.3,0,4],[6,0,4],[6,H,4],[1.3,H,4]],Wl);
  poly([[-1.3,2.6,4],[1.3,2.6,4],[1.3,H,4],[-1.3,H,4]],Wl);
  poly([[-6,H,4],[6,H,4],[0,R,4]],Wl);
  [-6,6].forEach(x=>{
    poly([[x,0,-4],[x,0,-0.8],[x,H,-0.8],[x,H,-4]],Wl);
    poly([[x,0,0.8],[x,0,4],[x,H,4],[x,H,0.8]],Wl);
    poly([[x,0,-0.8],[x,0,0.8],[x,1.2,0.8],[x,1.2,-0.8]],Wl);
    poly([[x,2.5,-0.8],[x,2.5,0.8],[x,H,0.8],[x,H,-0.8]],Wl);
    box(0.12,0.1,1.7,x,1.2,0,mats.pillar);box(0.12,0.1,1.7,x,2.5,0,mats.pillar);
    box(0.12,1.4,0.1,x,1.85,-0.8,mats.pillar);box(0.12,1.4,0.1,x,1.85,0.8,mats.pillar);
    [-0.5,-0.17,0.17,0.5].forEach(k=>box(0.05,1.3,0.05,x,1.85,k,mats.pillar));
  });
  poly([[-6.8,2.92,-4.8],[-6.8,2.92,4.8],[0,R,4.8],[0,R,-4.8]],Rf,2.4);
  poly([[6.8,2.92,-4.8],[0,R,-4.8],[0,R,4.8],[6.8,2.92,4.8]],Rf,2.4);
  const th=Math.atan2(R-2.92,6.8),Lr=Math.hypot(6.8,R-2.92);
  for(let z=-4;z<=4;z+=1){[-1,1].forEach(s=>{const r=box(Lr,0.1,0.16,s*3.4,4.89,z,mats.beam);r.rotation.z=-s*th;});}
  box(0.24,0.24,9.8,0,R-0.12,0,mats.beam);
  [0.33,0.66].forEach(f=>{const x=6.8-6.8*f,y=2.92+4.08*f-0.1;box(0.14,0.14,9.6,-x,y,0,mats.beam);box(0.14,0.14,9.6,x,y,0,mats.beam);});
  [-3,-1,1,3].forEach(z=>box(12.2,0.2,0.22,0,3.3,z,mats.beam));
  // skirting + rails on interior walls
  box(12,0.3,0.05,0,0.15,-3.97,mats.dark);box(12,0.1,0.06,0,1.1,-3.97,mats.pillar);
  box(0.05,0.3,8,-5.97,0.15,0,mats.dark);box(0.05,0.3,8,5.97,0.15,0,mats.dark);
  // pillars
  [[-5.85,-3.85],[5.85,-3.85],[-5.85,3.85],[5.85,3.85],[-5.85,-2],[5.85,-2],[-5.85,2],[5.85,2]].forEach(p=>box(0.3,H,0.3,p[0],H/2,p[1],mats.pillar));
  box(0.25,H,0.25,-1.38,H/2,3.95,mats.pillar);box(0.25,H,0.25,1.38,H/2,3.95,mats.pillar);box(2.9,0.18,0.25,0,2.68,3.95,mats.pillar);
  [-1.3,1.3].forEach(hx=>{
    const grp=new THREE.Group();grp.position.set(hx,0,4.1);grp.rotation.y=hx;scene.add(grp);
    box(1.3,2.6,0.07,-Math.sign(hx)*0.65,1.3,0,mats.wall,grp);
  });
  // veranda
  const bal=[];
  for(let x=-6;x<=6.01;x+=0.35){if(Math.abs(x)>1.25)bal.push([x,8.4]);}
  for(let z=4.4;z<=8.4;z+=0.35){bal.push([-6,z]);bal.push([6,z]);}
  const bg=new THREE.BoxGeometry(0.05,0.75,0.05),im=new THREE.InstancedMesh(bg,mats.pillar,bal.length),dm=new THREE.Object3D();
  bal.forEach((b,i)=>{dm.position.set(b[0],0.5,b[1]);dm.updateMatrix();im.setMatrixAt(i,dm.matrix);});
  im.instanceMatrix.needsUpdate=true;im.frustumCulled=false;scene.add(im);
  [0.9,0.2].forEach(y=>{box(4.7,0.07,0.09,-3.65,y,8.4,mats.pillar);box(4.7,0.07,0.09,3.65,y,8.4,mats.pillar);box(0.09,0.07,4.0,-6,y,6.4,mats.pillar);box(0.09,0.07,4.0,6,y,6.4,mats.pillar);});
  box(0.18,1.0,0.18,-1.3,0.5,8.4,mats.pillar);box(0.18,1.0,0.18,1.3,0.5,8.4,mats.pillar);
  // stilts
  const stp=[];[-6,-3,0,3,6].forEach(x=>[-4,0,4,8.4].forEach(z=>stp.push([x,z])));
  const sg=new THREE.CylinderGeometry(0.17,0.2,2.6,8),sm=new THREE.InstancedMesh(sg,mats.pillar,stp.length);
  stp.forEach((p,i)=>{dm.position.set(p[0],-1.3,p[1]);dm.updateMatrix();sm.setMatrixAt(i,dm.matrix);});
  sm.instanceMatrix.needsUpdate=true;sm.frustumCulled=false;scene.add(sm);
  // stairs
  for(let i=0;i<8;i++){box(2.4,0.12,0.38,0,-0.32*(i+1)-0.06,8.4+0.35*(i+0.5),mats.floor);}
  const sl=Math.hypot(0.35*8,0.32*8),sa=Math.atan2(0.32*8,0.35*8);
  [-1.2,1.2].forEach(x=>{const s=box(0.1,0.3,sl,x,-1.3,8.4+1.4,mats.pillar);s.rotation.x=sa;});
  // ground
  const gt=groundTex();gt.repeat.set(70,70);
  const gm=new THREE.Mesh(new THREE.PlaneGeometry(300,300),new THREE.MeshLambertMaterial({map:gt}));gm.rotation.x=-Math.PI/2;gm.position.y=-2.52;scene.add(gm);
}

/* ---------- lanterns & props ---------- */
function lantern(x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  cyl(0.012,0.012,0.7,4,0,0.55,0,mats.dark,g);
  const glow=M(0xffb35a,0.5,0,{emissive:0xffa030,emissiveIntensity:1.6});
  cyl(0.12,0.12,0.3,10,0,0,0,glow,g);
  const cap=new THREE.Mesh(new THREE.ConeGeometry(0.2,0.14,10),mats.gold);cap.position.y=0.22;g.add(cap);
  cyl(0.14,0.1,0.06,10,0,-0.17,0,mats.gold,g);
  return g;
}
function glowSprite(x,y,z,s,r,g,b,op,parent){
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex(r,g,b),transparent:true,opacity:op,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));
  sp.position.set(x,y,z);sp.scale.set(s,s,1);put(parent,sp);return sp;
}
function addScroll(idx,x,y,z){
  const g=new THREE.Group();g.position.set(x,y,z);scene.add(g);
  const m=M(0xd9c487,0.8,0,{emissive:0x8a5a18,emissiveIntensity:0.9});
  const c=cyl(0.035,0.035,0.34,10,0,0,0,m,g);c.rotation.z=Math.PI/2;c.rotation.y=0.5;
  const cord=new THREE.Mesh(new THREE.TorusGeometry(0.037,0.006,6,12),mats.red);cord.rotation.y=Math.PI/2;g.add(cord);
  const gs=glowSprite(0,0.05,0,0.9,255,190,90,0.55,g);
  items.push({kind:'scroll',idx:idx,id:'sc'+idx,name:'ใบลาน',verb:'เก็บ',focus:{x:x,y:y,z:z},r:2.3,mesh:g,taken:false,flash:0,glow:[],sprite:gs});
}
function addTable(x,z,w,d,h){
  box(w,0.06,d,x,h,z,mats.pillar);
  [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s=>box(0.07,h,0.07,x+s[0]*(w/2-0.06),h/2,z+s[1]*(d/2-0.06),mats.pillar));
}
function buildProps(){
  // reed mat + cushions
  const mat=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.4),mats.straw);mat.rotation.x=-Math.PI/2;mat.position.set(0,0.012,0.3);scene.add(mat);
  [[-1.0,-0.4,0.3],[0.8,-0.5,-0.2],[0.1,1.0,0.1]].forEach(p=>{
    const c=new THREE.Mesh(new THREE.CylinderGeometry(0.2,0.2,0.5,3),mats.red);c.rotation.z=Math.PI/2;c.rotation.y=p[2];c.position.set(p[0],0.2,p[1]);scene.add(c);
  });
  // lanterns
  lantern(-2.8,2.55,-1.2);lantern(2.8,2.55,1.0);lantern(0,2.4,6.2);lantern(-4.4,2.45,3.0);
  // altar
  box(2.2,0.1,0.6,0,1.9,-3.65,mats.pillar);box(0.1,0.5,0.4,-0.95,1.62,-3.7,mats.pillar);box(0.1,0.5,0.4,0.95,1.62,-3.7,mats.pillar);
  const bp=[];[[0,0],[0.18,0.02],[0.17,0.04],[0.12,0.09],[0.14,0.16],[0.12,0.26],[0.1,0.32],[0.07,0.38],[0.07,0.48],[0.035,0.56],[0.0,0.62]];
  const bud=new THREE.Mesh(new THREE.LatheGeometry(bp.map(p=>new THREE.Vector2(p[0]+0.001,p[1])),14),M(0xd7a83a,0.35,0.75,{emissive:0x5a3c08,emissiveIntensity:0.7}));bud.position.set(0,1.95,-3.7);scene.add(bud);
  [-0.65,0.65].forEach(x=>{cyl(0.03,0.03,0.2,8,x,2.05,-3.65,mats.cream);sph(0.025,x,2.2,-3.65,M(0xffe0a0,0.5,0,{emissive:0xffa020,emissiveIntensity:2}));});
  const gar=new THREE.Mesh(new THREE.TorusGeometry(0.28,0.03,6,16),M(0xd8a020,0.8,0,{emissive:0x442200}));gar.position.set(0,2.3,-3.6);scene.add(gar);
  addTable(0,-3.3,1.7,0.7,0.7);
  cyl(0.12,0.1,0.08,12,0.55,0.77,-3.3,mats.gold);
  for(let i=0;i<5;i++){cyl(0.004,0.004,0.22,3,0.55+rnd(-0.03,0.03),0.9,-3.3+rnd(-0.03,0.03),M(0x5a2a10));}
  col(0,-3.3,0.95,0.45);
  // portraits
  [[-3.6,false],[3.6,true]].forEach(a=>{
    box(0.82,1.08,0.05,a[0],1.9,-3.95,mats.pillar);
    const p=new THREE.Mesh(new THREE.PlaneGeometry(0.7,0.95),new THREE.MeshStandardMaterial({map:portraitTex(a[1]),roughness:0.9}));
    p.position.set(a[0],1.9,-3.92);scene.add(p);
  });
  // chest (left wall)
  box(0.9,0.55,0.55,-5.35,0.275,-0.2,mats.pillar);box(0.95,0.06,0.6,-5.35,0.58,-0.2,mats.beam);
  [[-0.4,-0.25],[0.4,-0.25],[-0.4,0.25],[0.4,0.25]].forEach(c=>box(0.07,0.5,0.07,-5.35+c[0]*0.2*2.2,0.28,-0.2+c[1],mats.gold));
  col(-5.35,-0.2,0.5,0.32);
  // stool (right wall)
  cyl(0.28,0.26,0.07,12,5.3,0.45,0.2,mats.pillar);[0,1,2].forEach(i=>cyl(0.03,0.03,0.45,6,5.3+Math.cos(i*2.1)*0.18,0.22,0.2+Math.sin(i*2.1)*0.18,mats.pillar));
  col(5.3,0.2,0.35,0.35);
  // water jar on veranda
  const jp=[[0.001,0],[0.25,0.02],[0.36,0.25],[0.42,0.5],[0.36,0.78],[0.26,0.9],[0.28,0.94],[0.001,0.94]];
  const jar=new THREE.Mesh(new THREE.LatheGeometry(jp.map(p=>new THREE.Vector2(p[0],p[1])),16),M(0x3b2a1d,0.5,0.1));jar.position.set(4.4,0,6.2);scene.add(jar);
  col(4.4,6.2,0.5,0.5);
  // plants
  [[-5.2,7.6],[5.2,4.9],[-5.2,4.9]].forEach(p=>{
    cyl(0.2,0.15,0.3,10,p[0],0.15,p[1],M(0x6b3a22,0.8));
    for(let i=0;i<6;i++){const l=new THREE.Mesh(new THREE.PlaneGeometry(0.18,0.8),new THREE.MeshLambertMaterial({color:0x1f4a22,side:THREE.DoubleSide}));l.position.set(p[0],0.65,p[1]);l.rotation.set(0.3,i*1.05,0.5);scene.add(l);}
  });
  // scrolls
  addScroll(0,-0.55,0.76,-3.3);
  addScroll(1,4.4,0.97,6.2);
  addScroll(2,-5.35,0.64,-0.2);
  addScroll(3,5.3,0.52,0.2);
}

/* ---------- instruments ---------- */
function regInstr(id,group,x,z,fy,glow){
  group.position.set(x,0,z);scene.add(group);
  items.push({kind:'instr',id:id,name:INSTR[id].name,verb:INSTR[id].verb,focus:{x:x,y:fy,z:z},r:2.7,group:group,taken:false,flash:0,glow:glow});
}
function buildRanad(){
  const g=new THREE.Group(),wood=M(0x5a2f16,0.7),bar=M(0x8a4a22,0.55,0,{emissive:0xffa040,emissiveIntensity:0});
  box(2.2,0.2,0.55,0,0.5,0,wood,g);
  [-1,1].forEach(s=>{const e=box(0.14,0.38,0.55,s*1.08,0.64,0,wood,g);e.rotation.z=-s*0.35;});
  [-0.8,0.8].forEach(x=>box(0.14,0.4,0.5,x,0.2,0,wood,g));
  for(let i=0;i<21;i++){const t=i/20;box(0.075,0.035,lerp(0.5,0.34,t),lerp(-0.95,0.95,t),0.63,0,bar,g);}
  [-0.12,0.12].forEach(z=>{const s=cyl(0.01,0.01,0.34,6,0.2,0.69,z,mats.cream,g);s.rotation.z=Math.PI/2;sph(0.035,0.04,0.69,z,mats.red,g);});
  regInstr('ranad',g,-3.8,-2.3,0.75,[bar]);col(-3.8,-2.3,1.15,0.4);
}
function buildGong(){
  const g=new THREE.Group(),wood=M(0x6b3a1a,0.7),brass=M(0xc99a3a,0.35,0.85,{emissive:0xffb040,emissiveIntensity:0});
  const ring=new THREE.Group();ring.rotation.y=-2.04;g.add(ring);
  const tr=new THREE.Mesh(new THREE.TorusGeometry(0.78,0.045,8,40,Math.PI*1.7),wood);tr.rotation.x=Math.PI/2;tr.position.y=0.5;ring.add(tr);
  for(let i=0;i<16;i++){
    const a=0.12*Math.PI+i*(Math.PI*1.46)/15,x=Math.cos(a)*0.78,z=Math.sin(a)*0.78;
    cyl(0.125,0.125,0.07,14,x,0.58,z,brass,ring);sph(0.05,x,0.62,z,brass,ring,1,0.6,1);
  }
  for(let i=0;i<5;i++){const a=0.1*Math.PI+i*(Math.PI*1.5)/4;cyl(0.04,0.05,0.5,6,Math.cos(a)*0.78,0.25,Math.sin(a)*0.78,wood,ring);}
  const t2=new THREE.Mesh(new THREE.TorusGeometry(0.78,0.03,6,40,Math.PI*1.7),wood);t2.rotation.x=Math.PI/2;t2.position.y=0.12;ring.add(t2);
  [-0.1,0.1].forEach(x=>{const s=cyl(0.01,0.01,0.4,6,x,0.7,0.1,mats.cream,g);s.rotation.x=1.2;sph(0.04,x,0.68,0.28,mats.red,g);});
  regInstr('gong',g,3.8,-2.3,0.8,[brass]);col(3.8,-2.3,1.0,1.0);
}
function buildSaw(){
  const g=new THREE.Group(),wood=M(0x4a2a12,0.7),skin=M(0xe0d0a8,0.8,0,{emissive:0xffa040,emissiveIntensity:0});
  box(0.7,0.06,0.7,0,0.45,0,mats.pillar,g);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s=>box(0.06,0.45,0.06,s[0]*0.3,0.22,s[1]*0.3,mats.pillar,g));
  const inst=new THREE.Group();inst.position.set(0,0.65,0);inst.rotation.z=0.05;g.add(inst);
  sph(0.11,0,0,0,wood,inst,1,1,0.85);
  const face=new THREE.Mesh(new THREE.CircleGeometry(0.095,14),skin);face.position.z=0.095;inst.add(face);
  cyl(0.018,0.018,0.95,8,0,0.55,-0.02,mats.pillar,inst);
  box(0.03,0.12,0.03,-0.03,1.03,0,wood,inst);box(0.03,0.12,0.03,0.03,0.98,0,wood,inst);
  [-0.008,0.008].forEach(x=>cyl(0.003,0.003,0.9,3,x,0.52,0.03,mats.cream,inst));
  const bow=cyl(0.008,0.008,0.75,6,0.18,0.5,0.1,mats.cream,g);bow.rotation.z=0.5;
  regInstr('saw',g,-4.7,2.2,0.8,[skin]);col(-4.7,2.2,0.45,0.45);
}
function buildDrum(){
  const g=new THREE.Group(),lac=M(0x7a1612,0.45,0.1),skin=M(0xe6dcc0,0.85,0,{emissive:0xffa040,emissiveIntensity:0});
  [-0.3,0.3].forEach(z=>{box(1.1,0.08,0.1,0,0.4,z,mats.pillar,g);[-0.5,0.5].forEach(x=>box(0.08,0.42,0.08,x,0.2,z,mats.pillar,g));});
  const dr=new THREE.Group();dr.position.set(0,0.98,0);dr.rotation.x=Math.PI/2;g.add(dr);
  const prof=[[0.001,-0.5],[0.36,-0.5],[0.42,-0.4],[0.5,-0.15],[0.52,0],[0.5,0.15],[0.42,0.4],[0.36,0.5],[0.001,0.5]];
  dr.add(new THREE.Mesh(new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),20),lac));
  [0.505,-0.505].forEach(y=>{const d=new THREE.Mesh(new THREE.CircleGeometry(0.35,20),skin);d.rotation.x=y>0?-Math.PI/2:Math.PI/2;d.position.y=y;dr.add(d);});
  [-0.25,0.25].forEach(y=>{const t=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.015,6,24),mats.gold);t.rotation.x=Math.PI/2;t.position.y=y;dr.add(t);});
  for(let i=0;i<20;i++){const a=i/20*Math.PI*2;[0.5,-0.5].forEach(y=>sph(0.018,Math.cos(a)*0.38,y,Math.sin(a)*0.38,mats.gold,dr));}
  regInstr('drum',g,4.6,2.2,1.0,[skin]);col(4.6,2.2,0.6,0.7);
}
function buildFlute(){
  const g=new THREE.Group();
  box(0.7,0.04,0.7,0,0.55,0,mats.pillar,g);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(s=>box(0.05,0.55,0.05,s[0]*0.3,0.27,s[1]*0.3,mats.pillar,g));
  box(0.5,0.01,0.3,0,0.58,0,mats.red,g);
  const fm=M(0xb89a4a,0.6,0,{emissive:0xffa040,emissiveIntensity:0});
  const f=cyl(0.016,0.016,0.5,8,0,0.61,0,fm,g);f.rotation.z=Math.PI/2;f.rotation.y=0.4;
  for(let i=0;i<6;i++)sph(0.005,-0.15+i*0.06,0.63,0.0,mats.dark,g);
  regInstr('khlui',g,1.6,-1.0,0.7,[fm]);col(1.6,-1.0,0.45,0.45);
}

/* ---------- outside ---------- */
function buildOutside(){
  const pts=[],N=700,pos=new Float32Array(N*3);
  for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2,e=Math.acos(rnd(0.05,1)),r=120;pos[i*3]=Math.sin(e)*Math.cos(a)*r;pos[i*3+1]=Math.cos(e)*r;pos[i*3+2]=Math.sin(e)*Math.sin(a)*r;}
  const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.BufferAttribute(pos,3));
  stars=new THREE.Points(sg,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,color:0xdfe8ff,fog:false,transparent:true,opacity:0.9}));scene.add(stars);
  moonSprite=new THREE.Sprite(new THREE.SpriteMaterial({map:moonTex(),fog:false,transparent:true,depthWrite:false}));
  moonSprite.position.set(-30,34,24);moonSprite.scale.set(22,22,1);scene.add(moonSprite);
  const leafM=new THREE.MeshLambertMaterial({color:0x1d3a1c,side:THREE.DoubleSide}),trunkM=new THREE.MeshLambertMaterial({color:0x3a3a20});
  function banana(x,z){
    const g=new THREE.Group();g.position.set(x,-2.6,z);scene.add(g);
    cyl(0.1,0.13,2.4,7,0,1.2,0,trunkM,g);
    for(let i=0;i<7;i++){const gg=new THREE.Group();gg.position.y=2.3;gg.rotation.y=i*0.9;g.add(gg);const geo=new THREE.PlaneGeometry(0.7,2.4);geo.translate(0,1.2,0);const l=new THREE.Mesh(geo,leafM);l.rotation.x=-1.15;gg.add(l);}
  }
  function palm(x,z){
    const g=new THREE.Group();g.position.set(x,-2.6,z);scene.add(g);
    const t=cyl(0.17,0.27,9,7,0,4.5,0,trunkM,g);t.rotation.z=rnd(-0.08,0.08);
    for(let i=0;i<10;i++){const gg=new THREE.Group();gg.position.y=9;gg.rotation.y=i*0.63;g.add(gg);const geo=new THREE.PlaneGeometry(0.5,3.4);geo.translate(0,1.7,0);const l=new THREE.Mesh(geo,leafM);l.rotation.x=-1.2+rnd(-0.2,0.3);gg.add(l);}
  }
  function bamboo(x,z){
    for(let i=0;i<6;i++)cyl(0.04,0.05,9,5,x+rnd(-0.6,0.6),1.9,z+rnd(-0.6,0.6),new THREE.MeshLambertMaterial({color:0x4f6a2a}));
  }
  const spots=[];
  for(let i=0;i<95;i++){
    const x=rnd(-50,50),z=rnd(-40,64);
    if(Math.abs(x)<15.5&&z>-8&&z<30.5)continue;
    spots.push([x,z]);
  }
  spots.forEach((s,i)=>{const k=i%3;if(k===0)banana(s[0],s[1]);else if(k===1)palm(s[0],s[1]);else bamboo(s[0],s[1]);});
  mistGroup=new THREE.Group();scene.add(mistGroup);
  for(let i=0;i<8;i++){
    const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:softTex(200,215,230),transparent:true,opacity:0.5,depthWrite:false}));
    sp.position.set(rnd(-1,1),rnd(0.5,1.7),8.9+rnd(-0.1,0.2));sp.scale.set(2.6,2.2,1);sp.userData.b=[sp.position.x,sp.position.y];sp.userData.p=rnd(0,6);mistGroup.add(sp);
  }
}

function buildLights(){
  hemi=new THREE.HemisphereLight(0x3a4a68,0x1a110a,0.55);scene.add(hemi);
  function pl(c,i,d,dec,x,y,z){const l=new THREE.PointLight(c,i,d,dec);l.position.set(x,y,z);scene.add(l);return l;}
  L.l1=pl(0xffa24a,1.15,10,1.6,-2.8,2.5,-1.2);L.l2=pl(0xffa24a,1.15,10,1.6,2.8,2.5,1.0);
  L.alt=pl(0xff9a3a,0.7,6,1.6,0,2.3,-3.2);
  L.mL=pl(0x7f9fd8,0.7,12,1.4,-8.5,3,0.5);L.mR=pl(0x7f9fd8,0.7,12,1.4,8.5,3,-0.5);
  L.verd=pl(0xffa24a,0.55,7,1.6,0,2.2,6.0);
  const dl=new THREE.DirectionalLight(0x7f9fd8,0.32);dl.position.set(-20,40,12);scene.add(dl);
  L.base={l1:1.15,l2:1.15,alt:0.7,verd:0.55};
  L.house={l1:[-2.8,2.5,-1.2],l2:[2.8,2.5,1.0],alt:[0,2.3,-3.2],mL:[-8.5,3,0.5],mR:[8.5,3,-0.5],verd:[0,2.2,6.0]};
  L.yard={l1:[-7.5,-0.5,15.4],l2:[-9.5,-1.0,22.0],alt:[9.5,-0.7,20.0],mL:[-4,2,13],mR:[4,2,24],verd:[0,-0.4,24.8]};
  L.mode='house';
}

function setLightMode(m){
  if(L.mode===m||!L.l1)return;L.mode=m;const set=L[m];
  ['l1','l2','alt','mL','mR','verd'].forEach(k=>L[k].position.set(set[k][0],set[k][1],set[k][2]));
}
