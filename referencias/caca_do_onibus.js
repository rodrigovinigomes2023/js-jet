
// ------------------------------------------------ show do caça da FAB (09/11, pedido do Gomes)
// Presente de 1.000 moedas ou mais (Galáxia em diante): quem mandou vira piloto de um caça delta-canard (estilo Gripen, feito no Brasil)
// com o cocar da FAB. ~29 s: cabine (piloto com o avatar e o nome sob a cabine) -> perseguição baixa na avenida -> passagem lateral
// -> tonneau -> de frente, passa por cima do ônibus, sobe na vertical soltando flares. Vários presentes grandes = fila de voos.
const CACA_MIN=+(Q.get('cacamin')||1000);
const SHOWS=[];let SHOW=null,JET=null;
function pedirCaca(nome,avatar){if(SHOWS.length<5)SHOWS.push({nome,avatar});}
function texCocar(){const c=cv(128,128),g=c.getContext('2d');[['#1f9a3d',62],['#ffd21a',44],['#1f4fb3',27]].forEach(([cor,r])=>{g.fillStyle=cor;g.beginPath();g.arc(64,64,r,0,7);g.fill();});
  g.fillStyle='#fff';g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?7:17;g.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}g.fill();return tex(c);}
function criarCaca(){const J=new THREE.Group(),mG=new THREE.MeshStandardMaterial({color:new THREE.Color('#8a939c').convertSRGBToLinear(),roughness:0.45,metalness:0.35}),mE=M('#4a5058',0.4);
  const fus=new THREE.LatheGeometry([[0.01,0],[0.5,0.15],[0.6,0.5],[0.66,2],[0.72,6],[0.7,9],[0.56,11],[0.36,12.5],[0.13,13.6],[0.01,14.1]].map(([r,y])=>new THREE.Vector2(r,y)),20);
  fus.rotateZ(-Math.PI/2);fus.translate(-7,0,0);J.add(new THREE.Mesh(fus,mG));   // nariz em +x, 14 m
  esf(1,new THREE.MeshPhysicalMaterial({color:0xd8b860,roughness:0.05,metalness:0.4,transparent:true,opacity:0.5}),3.6,0.55,0,J,1.7,0.55,0.48);   // canopi
  const asa=(pts,y,esp)=>{const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))sh.lineTo(q[0],q[1]);
    const g=new THREE.ExtrudeGeometry(sh,{depth:esp,bevelEnabled:false});g.rotateX(Math.PI/2);g.translate(0,y+esp/2,0);J.add(new THREE.Mesh(g,mG));};
  asa([[1.5,0.6],[-4.4,4.3],[-5.3,4.3],[-6.3,0.6],[-6.3,-0.6],[-5.3,-4.3],[-4.4,-4.3],[1.5,-0.6]],-0.2,0.12);   // asa delta
  asa([[3.7,0.55],[2.2,2.1],[1.7,2.1],[1.9,0.55],[1.9,-0.55],[1.7,-2.1],[2.2,-2.1],[3.7,-0.55]],0.25,0.07);    // canards
  {const sh=new THREE.Shape();[[-3.0,0.5],[-6.5,3.3],[-7.3,3.3],[-7.0,0.5]].forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));
   const g=new THREE.ExtrudeGeometry(sh,{depth:0.1,bevelEnabled:false});g.translate(0,0,-0.05);J.add(new THREE.Mesh(g,mG));}   // deriva
  for(const s of[-1,1])box(2.6,0.75,0.45,mG,1.0,-0.15,s*0.72,J);   // entradas de ar
  const bo=cil(0.52,0.46,0.8,mE,-7.3,0,0,J,16);bo.rotation.z=Math.PI/2;
  const pc=new THREE.Mesh(new THREE.ConeGeometry(0.42,3.2,14,1,true),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false}));
  pc.rotation.z=Math.PI/2;pc.position.x=-9.3;J.add(pc);J.userData.pc=pc;   // pós-combustor
  // piloto: capacete branco com viseira escura
  esf(0.17,M('#f2f2f2',0.4),3.55,0.82,0,J);esf(0.13,M('#1a1a1e',0.1),3.69,0.8,0,J,0.9,0.75,1);box(0.3,0.35,0.42,M('#5b6b4a',0.8),3.45,0.5,0,J);
  // cocar da FAB: em cima das asas e nos lados da fuselagem; faixa verde-amarela na deriva
  const mCo=new THREE.MeshStandardMaterial({map:texCocar(),transparent:true,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-2});
  const fl=cv(64,32),gf=fl.getContext('2d');gf.fillStyle='#1f9a3d';gf.fillRect(0,0,32,32);gf.fillStyle='#ffd21a';gf.fillRect(32,0,32,32);
  const mFl=new THREE.MeshStandardMaterial({map:tex(fl),roughness:0.6,polygonOffset:true,polygonOffsetFactor:-2});
  for(const s of[-1,1]){const c=new THREE.Mesh(new THREE.PlaneGeometry(1.5,1.5),mCo);c.rotation.x=-Math.PI/2;c.position.set(-4.0,-0.13,s*3.0);J.add(c);
    const c2=new THREE.Mesh(new THREE.PlaneGeometry(1.0,1.0),mCo);c2.position.set(-3.6,0.05,s*0.73);if(s<0)c2.rotation.y=Math.PI;J.add(c2);
    const f=new THREE.Mesh(new THREE.PlaneGeometry(1.0,0.7),mFl);f.position.set(-6.3,2.5,s*0.06);f.rotation.z=0.35;if(s<0)f.rotation.y=Math.PI;J.add(f);}
  // plaquinha sob a cabine com o avatar e o nome do piloto (redesenhada a cada voo)
  const cN=cv(512,128),mN=new THREE.MeshStandardMaterial({map:tex(cN),transparent:true,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-2});J.userData.cN=cN;J.userData.mN=mN;
  for(const s of[-1,1]){const n=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.65),mN);n.position.set(3.0,0.12,s*0.715);if(s<0)n.rotation.y=Math.PI;J.add(n);}
  // rastro de vapor nas pontas das asas
  const mR=new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0.35,depthWrite:false});
  for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.ConeGeometry(0.12,14,6,1,true),mR);r.rotation.z=Math.PI/2;r.position.set(-12,-0.15,s*4.3);J.add(r);}
  J.visible=false;cena.add(J);return J;}
function placaPiloto(nome,img){const c=JET.userData.cN,g=c.getContext('2d');g.clearRect(0,0,512,128);g.fillStyle='rgba(20,24,30,.85)';rr(g,4,8,504,112,20);g.fill();
  g.save();g.beginPath();g.arc(64,64,48,0,7);g.fillStyle='#ffd21a';g.fill();g.beginPath();g.arc(64,64,42,0,7);g.clip();
  if(img&&img.naturalWidth){const k=Math.max(84/img.width,84/img.height);g.drawImage(img,64-img.width*k/2,64-img.height*k/2,img.width*k,img.height*k);}else{g.fillStyle='#1f4fb3';g.fillRect(0,0,128,128);}
  g.restore();g.fillStyle='#fff';g.font='800 44px "Nunito Sans",Arial,sans-serif';g.textBaseline='middle';const n=nome.length>14?nome.slice(0,13)+'…':nome;g.fillText(n,128,66);
  JET.userData.mN.map.needsUpdate=true;}
const FLARES=[];const _jv=new THREE.Vector3();
function poeJato(x,y,z,yaw,pitch,roll){JET.position.set(x,y,z);JET.rotation.set(roll,yaw,pitch,'YZX');}
function caca(dt){
  for(let i=FLARES.length-1;i>=0;i--){const f=FLARES[i];f.vida-=dt;f.v.y-=9.8*dt*0.35;f.m.position.addScaledVector(f.v,dt);f.m.material.opacity=Math.max(0,f.vida/2.5);if(f.vida<=0){cena.remove(f.m);f.m.material.dispose();FLARES.splice(i,1);}}
  if(!SHOW){if(SHOWS.length&&!close&&!CURVA&&!SOBRA){const s0=SHOWS.shift();if(!JET)JET=criarCaca();SHOW={...s0,t:0,fase:-1,tf:0,img:null,fov:cam.fov};
      placaPiloto(s0.nome,null);if(s0.avatar){const im=new Image();im.onload=()=>placaPiloto(s0.nome,im);im.src=s0.avatar;}
      JET.visible=true;aviso(`✈️ ${s0.nome} virou piloto de caça da FAB!`);}
    return;}
  const S2=SHOW;S2.t+=dt;const t=S2.t,pc=JET.userData.pc;pc.scale.set(1,0.85+Math.random()*0.3,1);
  const fase=t<5?0:t<11?1:t<16?2:t<20.5?3:t<29?4:5;
  if(fase!==S2.fase){S2.fase=fase;S2.tf=0;
    if(fase===0)SOM.jato(5,0.5,900,900,0.1);
    if(fase===1)SOM.jato(6,0.8,600,1400,0.18);
    if(fase===2)SOM.jato(5,0.47,3000,500,0.35);
    if(fase===3)SOM.jato(4.5,0.5,1000,1000,0.15);
    if(fase===4){SOM.jato(8.5,0.54,3500,400,0.45);S2.pos=new THREE.Vector3(320,16,-2.9);S2.pitch=0;S2.flares=0;}
    if(fase===5){JET.visible=false;cam.fov=S2.fov;cam.updateProjectionMatrix();aviso(`✈️ Valeu pelo voo, ${S2.nome}!`);SHOW=null;return;}}
  S2.tf+=dt;const u=S2.tf;
  if(fase===0)poeJato(260-25*t,45,-3,Math.PI,0,Math.sin(t*0.8)*0.06);
  if(fase===1)poeJato(-160+32*u,24+Math.sin(u*1.3)*1.2,-2.9+Math.sin(u*0.7)*1.5,0,0,Math.sin(u*1.1)*0.18);
  if(fase===2)poeJato(-140+60*u,20,-3,0,0,-0.25);
  if(fase===3){const k=Math.min(1,Math.max(0,(u-0.8)/2.5)),e=k*k*(3-2*k);poeJato(60+15*u,30,-3,0,0.05,e*Math.PI*2);}
  if(fase===4){const P=S2.pos;if(P.x<-25)S2.pitch=Math.min(1.45,S2.pitch+dt*1.3);
    _jv.set(-Math.cos(S2.pitch),Math.sin(S2.pitch),0);P.addScaledVector(_jv,70*dt);poeJato(P.x,P.y,P.z,Math.PI,S2.pitch,0);
    if(S2.pitch>0.6&&S2.flares<16&&u>S2.flares*0.09+4.8){S2.flares++;if(S2.flares%3===1)SOM.flare();
      for(const s of[-1,1]){const m=new THREE.Sprite(new THREE.SpriteMaterial({color:0xffe9a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.scale.set(1.6,1.6,1);
        JET.localToWorld(m.position.set(-5,-0.3,s*1.2));cena.add(m);FLARES.push({m,vida:2.5,v:new THREE.Vector3(10*_jv.x+(Math.random()-0.5)*6,-6+Math.random()*3,s*(10+Math.random()*6))});}}}}
const _cA=new THREE.Vector3(),_cB=new THREE.Vector3();
function camCaca(dt){const S2=SHOW;if(!S2||!JET||S2.fase<0)return;const f=S2.fase,u=S2.tf||0;let fov=50;
  if(f===0){JET.localToWorld(_cA.set(6.8,1.5+Math.sin(u)*0.15,2.7));JET.localToWorld(_cB.set(3.4,0.7,0));cam.position.copy(_cA);cam.lookAt(_cB);fov=42;}
  else if(f===1){JET.localToWorld(_cA.set(-22,4.5,3+Math.sin(u*0.6)*2));JET.localToWorld(_cB.set(10,0,0));cam.position.lerp(_cA,u<0.1?1:Math.min(1,dt*5));cam.lookAt(_cB);fov=55;}
  else if(f===2){cam.position.set(40,3,-13);cam.lookAt(JET.position);fov=45;}
  else if(f===3){const a=-1.9+u*0.45;cam.position.set(JET.position.x+Math.cos(a)*16,JET.position.y+3,JET.position.z+Math.sin(a)*16);cam.lookAt(JET.position);fov=50;}
  else if(f===4){if(u<3.1){cam.position.set(30,1.0,-4.6);if(u<1.2)cam.lookAt(200,14,-3);else cam.lookAt(JET.position);fov=48;}
    else{cam.position.set(2,4.1,1.6);cam.lookAt(JET.position);fov=62;}}
  if(cam.fov!==fov){cam.fov=fov;cam.updateProjectionMatrix();}}
