
/* ============================ GHOST MODEL ============================ */
const ghostMats=[];
const GH={};
function gmat(color,emi,ei,op,extra){
  const m=new THREE.MeshStandardMaterial(Object.assign({color:color,emissive:emi,emissiveIntensity:ei,roughness:0.85,transparent:true,opacity:op},extra||{}));
  ghostMats.push({m:m,base:op});return m;
}
function makeArm(parent,sign,mat,nailM){
  const sh=new THREE.Group();sh.position.set(sign*0.2,1.46,0);parent.add(sh);
  const ug=new THREE.CylinderGeometry(0.034,0.027,0.3,8);ug.translate(0,-0.15,0);sh.add(new THREE.Mesh(ug,mat));
  const el=new THREE.Group();el.position.y=-0.3;sh.add(el);
  const fg=new THREE.CylinderGeometry(0.027,0.02,0.26,8);fg.translate(0,-0.13,0);el.add(new THREE.Mesh(fg,mat));
  const hand=new THREE.Group();hand.position.y=-0.26;el.add(hand);
  const palm=new THREE.Mesh(new THREE.SphereGeometry(0.04,8,6),mat);palm.scale.set(1,1.2,0.5);hand.add(palm);
  for(let i=0;i<4;i++){
    const f=new THREE.Group();f.position.set((i-1.5)*0.02,-0.04,0);f.rotation.z=(i-1.5)*0.18;f.rotation.x=-0.5;hand.add(f);
    const fgm=new THREE.CylinderGeometry(0.007,0.006,0.09,5);fgm.translate(0,-0.045,0);f.add(new THREE.Mesh(fgm,mat));
    const ng=new THREE.ConeGeometry(0.008,0.2,5);ng.rotateX(Math.PI);ng.translate(0,-0.19,0);f.add(new THREE.Mesh(ng,nailM));
  }
  return {sh:sh,el:el,hand:hand};
}
function buildGhost(){
  const root=new THREE.Group();scene.add(root);
  const body=new THREE.Group();root.add(body);
  const dress=gmat(0xdfeee6,0x5aa89a,0.55,0.88);
  const skin=gmat(0xcfe0d8,0x6aa392,0.5,0.95);
  const hairM=gmat(0x050505,0x000000,0,0.96,{side:THREE.DoubleSide});
  const gold=gmat(0xd9b24a,0x6b4a10,0.7,0.95,{metalness:0.6,roughness:0.4});
  const maroon=gmat(0x8a2b3b,0x3a0a14,0.35,0.9,{side:THREE.DoubleSide});
  const black=gmat(0x000000,0x000000,0,0.98);
  const eyeM=new THREE.MeshBasicMaterial({color:0xff2a2a,transparent:true,opacity:1});ghostMats.push({m:eyeM,base:1});
  const prof=[[0.001,-0.35],[0.05,-0.15],[0.12,0.2],[0.2,0.5],[0.24,0.8],[0.2,1.0],[0.14,1.12],[0.15,1.28],[0.17,1.42],[0.15,1.52],[0.06,1.58],[0.001,1.6]];
  body.add(new THREE.Mesh(new THREE.LatheGeometry(prof.map(p=>new THREE.Vector2(p[0],p[1])),18),dress));
  const neck=new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.06,0.16,8),skin);neck.position.y=1.62;body.add(neck);
  const head=new THREE.Group();head.position.y=1.8;body.add(head);
  const skull=new THREE.Mesh(new THREE.SphereGeometry(0.12,16,12),skin);skull.scale.set(1,1.18,1);head.add(skull);
  [-1,1].forEach(s=>{
    const sock=new THREE.Mesh(new THREE.SphereGeometry(0.032,8,6),black);sock.position.set(s*0.045,0.02,0.1);sock.scale.set(1,1.3,0.6);head.add(sock);
    const pu=new THREE.Mesh(new THREE.SphereGeometry(0.011,6,5),eyeM);pu.position.set(s*0.045,0.02,0.118);head.add(pu);
    const br=new THREE.Mesh(new THREE.BoxGeometry(0.055,0.009,0.01),black);br.position.set(s*0.047,0.075,0.105);br.rotation.z=-s*0.3;head.add(br);
  });
  const nose=new THREE.Mesh(new THREE.ConeGeometry(0.015,0.04,5),skin);nose.rotation.x=Math.PI/2;nose.position.set(0,-0.02,0.125);head.add(nose);
  const mouth=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),black);mouth.position.set(0,-0.075,0.112);mouth.scale.set(1.3,0.35,0.3);head.add(mouth);
  const hair=new THREE.Group();body.add(hair);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(0.135,14,10),hairM);cap.position.set(0,1.82,-0.035);cap.scale.set(1.02,1.15,1);hair.add(cap);
  const longH=new THREE.Mesh(new THREE.CylinderGeometry(0.14,0.06,1.1,12,1,true),hairM);longH.position.set(0,1.25,-0.1);hair.add(longH);
  [[-0.1,0.08],[0.1,0.08],[-0.13,0.0],[0.13,0.0]].forEach(p=>{const c=new THREE.Mesh(new THREE.ConeGeometry(0.035,0.85,5),hairM);c.rotation.x=Math.PI;c.position.set(p[0],1.45,p[1]);hair.add(c);});
  const cp=[[0.125,0],[0.13,0.04],[0.1,0.09],[0.115,0.14],[0.07,0.2],[0.08,0.26],[0.03,0.35],[0.005,0.5]];
  const crown=new THREE.Mesh(new THREE.LatheGeometry(cp.map(p=>new THREE.Vector2(p[0],p[1])),14),gold);crown.position.y=1.9;body.add(crown);
  [-1,1].forEach(s=>{const f=new THREE.Mesh(new THREE.SphereGeometry(0.03,8,6),gold);f.position.set(s*0.13,1.8,0);body.add(f);});
  const sash=new THREE.Mesh(new THREE.TorusGeometry(0.18,0.035,6,18),maroon);sash.position.y=1.38;sash.rotation.set(1.2,0,0.5);body.add(sash);
  const tg=new THREE.PlaneGeometry(0.14,0.9);tg.translate(0,-0.45,0);
  const tail=new THREE.Mesh(tg,maroon);tail.position.set(0.15,1.5,-0.12);body.add(tail);
  const armA=makeArm(body,1,skin,gold),armB=makeArm(body,-1,skin,gold);
  const light=new THREE.PointLight(0x7fe0cf,0,7,1.5);scene.add(light);
  Object.assign(GH,{root:root,body:body,hair:hair,tail:tail,armA:armA,armB:armB,mouth:mouth,head:head,light:light,eye:eyeM});
  root.visible=false;
}

/* ============================ AVATARS (friends) ============================ */
const avatars={};
function makeAvatar(colorStr){
  const g=new THREE.Group();scene.add(g);
  const c=new THREE.Color(colorStr);
  const cloth=new THREE.MeshStandardMaterial({color:c,roughness:0.8,emissive:c,emissiveIntensity:0.22});
  const cloth2=new THREE.MeshStandardMaterial({color:0xcfc2a4,roughness:0.85,emissive:0x443820,emissiveIntensity:0.3});
  const skin=new THREE.MeshStandardMaterial({color:0xd9b08c,roughness:0.8,emissive:0x442818,emissiveIntensity:0.25});
  cyl(0.22,0.28,0.78,10,0,0.45,0,cloth,g);
  cyl(0.2,0.22,0.55,10,0,1.1,0,cloth2,g);
  sph(0.13,0,1.58,0,skin,g,1,1.1,1);
  const hair=new THREE.Mesh(new THREE.SphereGeometry(0.135,10,8,0,Math.PI*2,0,Math.PI*0.55),new THREE.MeshStandardMaterial({color:0x0b0b0b,roughness:0.9}));hair.position.set(0,1.6,-0.01);g.add(hair);
  const arms=[-1,1].map(s=>{const a=new THREE.Group();a.position.set(s*0.26,1.32,0);g.add(a);const m=new THREE.Mesh(new THREE.CylinderGeometry(0.045,0.04,0.5,6),cloth2);m.position.y=-0.25;a.add(m);return a;});
  const lbl=new THREE.Sprite(new THREE.SpriteMaterial({transparent:true,depthWrite:false,fog:false}));lbl.position.y=2.05;lbl.scale.set(1.3,0.33,1);g.add(lbl);
  return {group:g,label:lbl,arms:arms,x:0,z:0,yaw:0,name:'',color:colorStr,init:false,phase:0,mv:0};
}
function setAvatarName(av,name){
  if(av.name===name)return;av.name=name;
  if(av.label.material.map)av.label.material.map.dispose();
  av.label.material.map=labelTex(name,av.color);av.label.material.needsUpdate=true;
}
function removeAvatar(id){
  const av=avatars[id];if(!av)return;
  scene.remove(av.group);delete avatars[id];
}
