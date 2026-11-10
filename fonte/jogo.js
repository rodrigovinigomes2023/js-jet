// js-jet — combate aéreo multiplayer (09/11/2026). three.js r128, script clássico.
// Cada cliente voa o próprio caça e manda o estado ao servidor; o servidor guarda vida/pontos e voa os bots.
'use strict';
const $=s=>document.querySelector(s);
const V3=THREE.Vector3,QT=THREE.Quaternion;
const Q=new URLSearchParams(location.search);
const TOQUE=('ontouchstart' in window)||navigator.maxTouchPoints>0||Q.has('toque');
if(TOQUE)document.body.classList.add('toque');

// ------------------------------------------------ cena
const R=new THREE.WebGLRenderer({canvas:$('#tela'),antialias:!TOQUE,powerPreference:'high-performance'});
R.setPixelRatio(Math.min(devicePixelRatio,TOQUE?1.5:2));R.outputEncoding=THREE.sRGBEncoding;
const CEU=0x9cc9ec;
const cena=new THREE.Scene();cena.background=new THREE.Color(CEU);cena.fog=new THREE.Fog(CEU,1800,8000);
const cam=new THREE.PerspectiveCamera(62,1,1,14000);
cena.add(new THREE.HemisphereLight(0xdcefff,0x2a4a3a,0.9));
const sol=new THREE.DirectionalLight(0xfff1d6,1.25);sol.position.set(-0.5,1,0.35);cena.add(sol);
function tamanho(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.fov=w<h?78:62;cam.updateProjectionMatrix();}
addEventListener('resize',tamanho);tamanho();

// ------------------------------------------------ utilidades de modelagem (as mesmas do jogo do ônibus)
const mats={},geos={};
function M(cor,r=0.8){return mats[cor+'/'+r]||(mats[cor+'/'+r]=new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),roughness:r}));}
function G(k,f){return geos[k]||(geos[k]=f());}
function box(w,h,d,mat,x,y,z,pai){const m=new THREE.Mesh(G('b'+w+','+h+','+d,()=>new THREE.BoxGeometry(w,h,d)),mat);m.position.set(x,y,z);pai.add(m);return m;}
function esf(r,mat,x,y,z,pai,sx=1,sy=1,sz=1){const m=new THREE.Mesh(G('s'+r,()=>new THREE.SphereGeometry(r,14,10)),mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);pai.add(m);return m;}
function cil(rt,rb,h,mat,x,y,z,pai,seg=10){const m=new THREE.Mesh(G('c'+rt+','+rb+','+h+','+seg,()=>new THREE.CylinderGeometry(rt,rb,h,seg)),mat);m.position.set(x,y,z);pai.add(m);return m;}
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function tex(c){const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
function rnd(s){return()=>(s=(s*16807)%2147483647)/2147483647;}
let _brilho=null;function texBrilho(){if(_brilho)return _brilho;const c=cv(64,64),g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(0.25,'rgba(255,230,150,.9)');r.addColorStop(1,'rgba(255,140,40,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return _brilho=tex(c);}
let _fumo=null;function texFumo(){if(_fumo)return _fumo;const c=cv(64,64),g=c.getContext('2d'),r=g.createRadialGradient(32,32,0,32,32,32);
  r.addColorStop(0,'rgba(255,255,255,.9)');r.addColorStop(0.6,'rgba(255,255,255,.35)');r.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=r;g.fillRect(0,0,64,64);return _fumo=tex(c);}

// ------------------------------------------------ mundo: mar, ilhas (o mesmo relevo serve p/ colisão) e nuvens
const mar=new THREE.Mesh(new THREE.PlaneGeometry(40000,40000),new THREE.MeshStandardMaterial({color:new THREE.Color('#1f6f9f').convertSRGBToLinear(),roughness:0.35,metalness:0.1}));
mar.rotation.x=-Math.PI/2;cena.add(mar);
const ILHAS=[];{const r=rnd(20251109);ILHAS.push({x:300,z:-200,r:1100,h:420});
  for(let i=0;i<16;i++){const a=r()*Math.PI*2,d=900+r()*4200;ILHAS.push({x:Math.cos(a)*d,z:Math.sin(a)*d,r:220+r()*700,h:60+r()*330});}}
// (10/11) bases da sala sem bots: as mesmas do servidor (anel de 7,2 km, 4 no máximo), cada uma numa ilha plana com pista apontada p/ o centro
const BASE_R=7200,BASE_H=18,BASE_PLANO=760,BASE_ILHA=1050,PISTA=1300;
const BASES=[45,135,225,315].map((g,i)=>{const a=g*Math.PI/180,x=Math.cos(a)*BASE_R,z=Math.sin(a)*BASE_R;return{i,x,z,dx:-Math.cos(a),dz:-Math.sin(a),yaw:Math.atan2(z,-x)};});
let SALA='bots',MINHA_BASE=null,ZONA=3800,R_SAM=3000,LIMITE=5200;
function alturaBase(d){return d<BASE_PLANO?BASE_H:d<BASE_ILHA?BASE_H*(0.5+0.5*Math.cos(Math.PI*(d-BASE_PLANO)/(BASE_ILHA-BASE_PLANO))):0;}
function relevo(x,z){let h=0;for(const I of ILHAS){const d=Math.hypot(x-I.x,z-I.z);if(d<I.r)h=Math.max(h,I.h*(0.5+0.5*Math.cos(Math.PI*d/I.r)));}
  for(const B of BASES){const d=Math.hypot(x-B.x,z-B.z);if(d<BASE_ILHA)h=Math.max(h,alturaBase(d));}return h;}
{const cA=new THREE.Color('#d9c48f'),cV=new THREE.Color('#3f8a3c'),cE=new THREE.Color('#2c5e2c'),cP=new THREE.Color('#7a7466');
  for(const I of ILHAS){const pts=[];for(let k=0;k<=18;k++){const d=I.r*1.04*(1-k/18);pts.push(new THREE.Vector2(d,Math.max(-4,I.h*(0.5+0.5*Math.cos(Math.PI*Math.min(1,d/I.r)))-(d>I.r?4:0))));}
    const g=new THREE.LatheGeometry(pts,40),pos=g.attributes.position,cor=new Float32Array(pos.count*3),c=new THREE.Color();
    for(let i=0;i<pos.count;i++){const y=pos.getY(i),u=y/I.h;if(y<7)c.copy(cA);else if(u<0.55)c.copy(cV).lerp(cE,u/0.55);else c.copy(cE).lerp(cP,(u-0.55)/0.45*(I.h>250?1:0.3));
      c.convertSRGBToLinear();cor[i*3]=c.r;cor[i*3+1]=c.g;cor[i*3+2]=c.b;}
    g.setAttribute('color',new THREE.BufferAttribute(cor,3));g.computeVertexNormals();
    const m=new THREE.Mesh(g,new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95,flatShading:true,side:THREE.DoubleSide}));m.position.set(I.x,0,I.z);cena.add(m);}
  // ilhas planas das bases
  const mB=new THREE.MeshStandardMaterial({color:new THREE.Color('#4f8a45').convertSRGBToLinear(),roughness:0.95,flatShading:true,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-8});
  const mBa=new THREE.MeshStandardMaterial({color:new THREE.Color('#d9c48f').convertSRGBToLinear(),roughness:0.95,flatShading:true});
  for(const B of BASES){const pts=[];for(let k=0;k<=14;k++){const d=BASE_ILHA*1.03*(1-k/14);pts.push(new THREE.Vector2(d,Math.max(-4,alturaBase(d)-(d>BASE_ILHA?4:0))));}
    const praia=new THREE.Mesh(new THREE.LatheGeometry(pts,48),mBa);praia.position.set(B.x,0,B.z);cena.add(praia);
    const topo=new THREE.Mesh(new THREE.CircleGeometry(BASE_PLANO+20,48),mB);topo.rotation.x=-Math.PI/2;topo.position.set(B.x,BASE_H+0.05,B.z);cena.add(topo);}}
{const r=rnd(77),mN=new THREE.SpriteMaterial({map:texFumo(),color:0xffffff,transparent:true,opacity:0.85,depthWrite:false,fog:true});
  for(let i=0;i<70;i++){const a=r()*Math.PI*2,d=r()*6500,y=900+r()*900;for(let k=0;k<3;k++){const s=new THREE.Sprite(mN),e=260+r()*380;
    s.scale.set(e*1.6,e*0.7,1);s.position.set(Math.cos(a)*d+(r()-0.5)*400,y+(r()-0.5)*80,Math.sin(a)*d+(r()-0.5)*400);cena.add(s);}}}

// ------------------------------------------------ (10/11) as bases: pista, pátio, hangares, torre, bandeira do dono e lançadores SAM
{const po=(m)=>{m=m.clone();m.polygonOffset=true;m.polygonOffsetFactor=-4;m.polygonOffsetUnits=-16;return m;};
  const mAs=po(M('#3a3d42',0.9)),mBr=po(M('#f2f2f2',0.6)),mPa=po(M('#6b6f73',0.9)),mHa=M('#8d969c',0.6),mTe=M('#5a6066',0.7),mVi=M('#9fd4ff',0.2),mOl=M('#55603f',0.8),mPo=M('#cfcfcf',0.5);
  for(const B of BASES){const g=new THREE.Group();g.position.set(B.x,BASE_H,B.z);g.rotation.y=B.yaw;cena.add(g);B.g=g;
    box(PISTA,0.3,42,mAs,0,0.15,0,g);
    for(let x=-590;x<=590;x+=50)box(22,0.34,1.2,mBr,x,0.17,0,g);   // faixa central
    for(const s of[-1,1])for(let k=-3;k<=3;k++)if(k)box(30,0.34,2.4,mBr,s*615,0.17,k*5,g);   // cabeceiras
    box(320,0.26,120,mPa,-40,0.13,150,g);box(40,0.26,70,mPa,100,0.13,62,g);   // pátio + taxiway
    for(let i=0;i<3;i++){box(62,14,42,mHa,-150+i*80,7,195,g);box(64,1.2,44,mTe,-150+i*80,14.6,195,g);box(40,10,0.4,M('#2a2d31',0.8),-150+i*80,5,173.8,g);}
    const tr=cil(4,5,26,mHa,160,13,-90,g);box(12,6,12,mVi,160,29,-90,g);box(13,0.8,13,mTe,160,32.4,-90,g);
    cil(0.35,0.35,24,mPo,60,12,-70,g);B.mBand=new THREE.MeshStandardMaterial({color:0x888888,roughness:0.7,side:THREE.DoubleSide});
    const band=new THREE.Mesh(new THREE.PlaneGeometry(9,5.5),B.mBand);band.position.set(64.5,21,-70);g.add(band);
    for(const [x,z] of[[-320,-120],[320,-120],[0,-190]]){box(9,2.2,6,mOl,x,1.1,z,g);
      for(let k=0;k<4;k++){const t=cil(0.7,0.7,7,mOl,x+(k%2?1.6:-1.6),4.6,z+(k<2?1.3:-1.3),g,8);t.rotation.z=-0.75;}}}
  // anéis no mar: zona de combate (amarelo) e alcance dos SAM de cada base (vermelho; o da minha base fica verde)
  const anel=(r,cor,x,z)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r-14,r+14,160),new THREE.MeshBasicMaterial({color:cor,transparent:true,opacity:0.45,depthWrite:false,side:THREE.DoubleSide}));
    m.rotation.x=-Math.PI/2;m.position.set(x,1.5,z);m.visible=false;cena.add(m);return m;};
  BASES.zonaAnel=anel(3800,0xffd23a,0,0);for(const B of BASES)B.anel=anel(3000,0xff3b30,B.x,B.z);}
function mostrarBases(){const pvp=SALA==='pvp';BASES.zonaAnel.visible=pvp;BASES.zonaAnel.geometry.dispose();BASES.zonaAnel.geometry=new THREE.RingGeometry(ZONA-14,ZONA+14,160);
  for(const B of BASES){B.anel.visible=pvp;B.anel.material.color.set(B.i===MINHA_BASE?0x3cd070:0xff3b30);B.g.visible=true;}}
function corBandeiras(l){for(const B of BASES){const d=l.find(x=>x.base===B.i);B.mBand.color.set(d?d.cor:'#888888');B.dono=d||null;}}

// ------------------------------------------------ o caça (o mesmo delta-canard do show do ônibus; nariz em +x, asa direita em +z)
function texCocar(){const c=cv(128,128),g=c.getContext('2d');[['#1f9a3d',62],['#ffd21a',44],['#1f4fb3',27]].forEach(([cor,r])=>{g.fillStyle=cor;g.beginPath();g.arc(64,64,r,0,7);g.fill();});
  g.fillStyle='#fff';g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?7:17;g.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}g.fill();return tex(c);}
let _mCo=null;
function criarJato(cor){const J=new THREE.Group(),mG=new THREE.MeshStandardMaterial({color:new THREE.Color('#8a939c').convertSRGBToLinear(),roughness:0.45,metalness:0.35}),mE=M('#4a5058',0.4);
  const mC=new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),roughness:0.5,metalness:0.2});
  const fus=G('fus',()=>{const g=new THREE.LatheGeometry([[0.01,0],[0.5,0.15],[0.6,0.5],[0.66,2],[0.72,6],[0.7,9],[0.56,11],[0.36,12.5],[0.13,13.6],[0.01,14.1]].map(([r,y])=>new THREE.Vector2(r,y)),20);
    g.rotateZ(-Math.PI/2);g.translate(-7,0,0);return g;});J.add(new THREE.Mesh(fus,mG));
  J.userData.cab=[esf(1,new THREE.MeshPhysicalMaterial({color:0xd8b860,roughness:0.05,metalness:0.4,transparent:true,opacity:0.5}),3.6,0.55,0,J,1.7,0.55,0.48)];   // canopi
  const asa=(k,pts,y,esp,mat)=>{const g=G(k,()=>{const sh=new THREE.Shape();sh.moveTo(pts[0][0],pts[0][1]);for(const q of pts.slice(1))sh.lineTo(q[0],q[1]);
    const g=new THREE.ExtrudeGeometry(sh,{depth:esp,bevelEnabled:false});g.rotateX(Math.PI/2);g.translate(0,y+esp/2,0);return g;});J.add(new THREE.Mesh(g,mat));};
  asa('asa',[[1.5,0.6],[-4.4,4.3],[-5.3,4.3],[-6.3,0.6],[-6.3,-0.6],[-5.3,-4.3],[-4.4,-4.3],[1.5,-0.6]],-0.2,0.12,mG);   // asa delta
  asa('can',[[3.7,0.55],[2.2,2.1],[1.7,2.1],[1.9,0.55],[1.9,-0.55],[1.7,-2.1],[2.2,-2.1],[3.7,-0.55]],0.25,0.07,mG);    // canards
  J.add(new THREE.Mesh(G('der',()=>{const sh=new THREE.Shape();[[-3.0,0.5],[-6.5,3.3],[-7.3,3.3],[-7.0,0.5]].forEach(([x,y],i)=>i?sh.lineTo(x,y):sh.moveTo(x,y));
    const g=new THREE.ExtrudeGeometry(sh,{depth:0.1,bevelEnabled:false});g.translate(0,0,-0.05);return g;}),mC));   // deriva na cor do piloto
  for(const s of[-1,1]){box(2.6,0.75,0.45,mG,1.0,-0.15,s*0.72,J);box(0.9,0.06,0.5,mC,-4.85,-0.12,s*4.05,J);}   // entradas de ar + pontas de asa coloridas
  const bo=cil(0.52,0.46,0.8,mE,-7.3,0,0,J,16);bo.rotation.z=Math.PI/2;
  const pc=new THREE.Mesh(G('pc',()=>new THREE.ConeGeometry(0.42,3.2,14,1,true)),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false}));
  pc.rotation.z=Math.PI/2;pc.position.x=-9.3;J.add(pc);J.userData.pc=pc;   // pós-combustor
  J.userData.cab.push(esf(0.17,M('#f2f2f2',0.4),3.55,0.82,0,J),esf(0.13,M('#1a1a1e',0.1),3.69,0.8,0,J,0.9,0.75,1));   // capacete (some na visão da cabine)
  _mCo=_mCo||new THREE.MeshStandardMaterial({map:texCocar(),transparent:true,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-2});
  for(const s of[-1,1]){const c=new THREE.Mesh(G('pCo',()=>new THREE.PlaneGeometry(1.5,1.5)),_mCo);c.rotation.x=-Math.PI/2;c.position.set(-4.0,-0.13,s*3.0);J.add(c);}
  J.scale.setScalar(1.25);cena.add(J);return J;}

// ------------------------------------------------ som (Web Audio, tudo sintetizado)
const SOM=(()=>{let ctx=null,mestre,branco,mot=null;
  function ini(){if(ctx)return;try{ctx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){return;}mestre=ctx.createGain();mestre.gain.value=0.55;mestre.connect(ctx.destination);
    branco=ctx.createBuffer(1,ctx.sampleRate*2,ctx.sampleRate);const d=branco.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
    const s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain(),o=ctx.createOscillator(),lp=ctx.createBiquadFilter(),g2=ctx.createGain();
    s.buffer=branco;s.loop=true;f.type='bandpass';f.Q.value=0.8;f.frequency.value=600;g.gain.value=0;s.connect(f);f.connect(g);g.connect(mestre);s.start();
    o.type='sawtooth';o.frequency.value=60;lp.type='lowpass';lp.frequency.value=220;g2.gain.value=0;o.connect(lp);lp.connect(g2);g2.connect(mestre);o.start();
    mot={f,g,o,g2};}
  function ruido(dur,vol,tipo,freq,ataque=0.005){if(!ctx)return;const t=ctx.currentTime,s=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
    s.buffer=branco;f.type=tipo;f.frequency.value=freq;g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+ataque);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
    s.connect(f);f.connect(g);g.connect(mestre);s.start(t,Math.random());s.stop(t+dur+0.05);}
  function tom(tipo,fr,dur,vol,fr2){if(!ctx)return;const t=ctx.currentTime,o=ctx.createOscillator(),g=ctx.createGain();o.type=tipo;o.frequency.setValueAtTime(fr,t);if(fr2)o.frequency.exponentialRampToValueAtTime(fr2,t+dur);
    g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(0.0001,t+dur);o.connect(g);g.connect(mestre);o.start(t);o.stop(t+dur+0.05);}
  return{ini,
    motor(vel,turbo,vivo){if(!mot)return;const t=ctx.currentTime,k=vivo?1:0;mot.f.frequency.setTargetAtTime(380+vel*4+(turbo?500:0),t,0.15);mot.g.gain.setTargetAtTime(k*(turbo?0.16:0.09),t,0.2);
      mot.o.frequency.setTargetAtTime(40+vel*0.25,t,0.2);mot.g2.gain.setTargetAtTime(k*0.05,t,0.2);},
    tiro(longe){ruido(0.07,longe?0.05:0.13,'highpass',longe?1200:2200);},
    acerto(){tom('square',1300,0.06,0.06,900);},
    dor(){ruido(0.12,0.12,'lowpass',500);},
    trava(travado){tom('square',travado?1650:1100,travado?0.05:0.07,0.035);},
    alarme(){tom('sawtooth',880,0.12,0.05,620);},
    lanca(perto){ruido(1.1,perto?0.22:0.07,'bandpass',900,0.03);},
    flare(){ruido(0.25,0.1,'highpass',2000);tom('sine',900,0.2,0.05,300);},
    boom(perto){ruido(1.4,perto?0.9:0.35,'lowpass',perto?700:400,0.01);tom('sine',90,0.9,perto?0.4:0.15,30);}};})();

// ------------------------------------------------ efeitos: balas, explosões, faíscas
const BALAS=[],FX=[];const VEL_BALA=950,VIDA_BALA=1.25;
const mBala=new THREE.MeshBasicMaterial({color:0xffe27a,transparent:true,opacity:0.95,blending:THREE.AdditiveBlending,depthWrite:false});
const gBala=new THREE.BoxGeometry(14,0.35,0.35);const _x=new V3(1,0,0);
function bala(p,v,minha){let b=BALAS.find(b=>!b.ativa);if(!b){if(BALAS.length>260)return;b={m:new THREE.Mesh(gBala,mBala),p:new V3(),v:new V3(),ant:new V3()};cena.add(b.m);BALAS.push(b);}
  b.ativa=true;b.minha=minha;b.t=0;b.p.copy(p);b.v.copy(v);b.m.visible=true;b.m.position.copy(p);b.m.quaternion.setFromUnitVectors(_x,_v1.copy(v).normalize());}
function fx(p,cor,tam,dur,cresce,aditivo=true,sobe=0){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:aditivo?texBrilho():texFumo(),color:cor,transparent:true,depthWrite:false,blending:aditivo?THREE.AdditiveBlending:THREE.NormalBlending}));
  s.position.copy(p);s.scale.setScalar(tam);cena.add(s);FX.push({s,t:0,dur,tam,cresce,sobe});}
function explosao(p,perto){for(let i=0;i<10;i++){_v1.set(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5).multiplyScalar(26).add(p);fx(_v1,i<6?0xffb040:0xffe9a0,18+Math.random()*16,0.5+Math.random()*0.5,3);}
  for(let i=0;i<8;i++){_v1.set(Math.random()-0.5,Math.random()-0.3,Math.random()-0.5).multiplyScalar(30).add(p);fx(_v1,0x3a3a3a,20,2.4+Math.random(),2.5,false,8);}
  SOM.boom(perto);}
function efeitos(dt){for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.t+=dt;const u=f.t/f.dur;if(u>=1){cena.remove(f.s);f.s.material.dispose();FX.splice(i,1);continue;}
  f.s.scale.setScalar(f.tam*(1+u*f.cresce));f.s.material.opacity=(1-u)*(f.s.material.blending===THREE.AdditiveBlending?1:0.7);f.s.position.y+=f.sobe*dt;if(f.vel){f.s.position.addScaledVector(f.vel,dt);f.vel.y-=9*dt;}}}

// ------------------------------------------------ estado
const EU={id:0,cor:'#ffd23a',nome:'',pos:new V3(),q:new QT(),vel:130,vida:100,vivo:false,turbo:1,mortoEm:0,porQuem:null,fora:0};
let JATO=null;   // meu caça
const OUT=new Map();   // id -> {g,pos,vel,q,alvoP,alvoQ,tRec,vida,vivo,nome,cor,bot,rot}
const MISV=new Map();   // mísseis em voo (o servidor simula; aqui só desenha): id -> {g,pos,alvoP,vel,tRec,alvo,tFumo}
const TRAVA={id:0,t:0,beep:0};let misAnt=false,MUN=2,flarePronto=0,tAlarme=0,tMissilLoc=0;
let PLACAR=[],ws=null,conectado=false,jogando=false,tEnvio=0,proxTiro=0,ladoArma=1,tAcerto=0;
const _v1=new V3(),_v2=new V3(),_v3=new V3(),_f=new V3(),_u=new V3(),_r=new V3(),_dq=new QT(),_eu=new THREE.Euler();

// ------------------------------------------------ entrada: teclado + joystick flutuante + botões
const TEC={};
addEventListener('keydown',e=>{if(e.code==='Escape'&&jogando){sair();return;}if(e.code==='KeyV'&&jogando&&!e.repeat)trocaVisao();TEC[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&jogando)e.preventDefault();});
addEventListener('keyup',e=>{TEC[e.code]=false;});
addEventListener('blur',()=>{for(const k in TEC)TEC[k]=false;});
const JOY={id:null,ox:0,oy:0,x:0,y:0};
{const z=$('#zonaJoy'),j=$('#joy'),k=$('#joyK'),RAIO=60;
  z.addEventListener('pointerdown',e=>{if(JOY.id!==null)return;JOY.id=e.pointerId;JOY.ox=e.clientX;JOY.oy=e.clientY;JOY.x=JOY.y=0;
    j.style.left=e.clientX+'px';j.style.top=e.clientY+'px';j.style.display='block';k.style.transform='';z.setPointerCapture(e.pointerId);});
  z.addEventListener('pointermove',e=>{if(e.pointerId!==JOY.id)return;let dx=e.clientX-JOY.ox,dy=e.clientY-JOY.oy;const d=Math.hypot(dx,dy);if(d>RAIO){dx*=RAIO/d;dy*=RAIO/d;}
    JOY.x=dx/RAIO;JOY.y=dy/RAIO;k.style.transform=`translate(${dx}px,${dy}px)`;});
  const solta=e=>{if(e.pointerId!==JOY.id)return;JOY.id=null;JOY.x=JOY.y=0;j.style.display='none';};
  z.addEventListener('pointerup',solta);z.addEventListener('pointercancel',solta);}
const BT={fogo:false,turbo:false,missil:false,flare:false};
for(const [id,ch] of [['#bFogo','fogo'],['#bTurbo','turbo'],['#bMissil','missil'],['#bFlare','flare']]){const b=$(id);
  b.addEventListener('pointerdown',e=>{BT[ch]=true;b.classList.add('on');b.setPointerCapture(e.pointerId);});
  for(const ev of['pointerup','pointercancel'])b.addEventListener(ev,()=>{BT[ch]=false;b.classList.remove('on');});}
function entrada(){const inv=$('#inverter').checked?1:-1;   // (09/11) padrão de avião: empurrar p/ cima = nariz desce
  let p=0,r=0,y=0;
  if(TEC.KeyW||TEC.ArrowUp)p+=1;if(TEC.KeyS||TEC.ArrowDown)p-=1;
  if(TEC.KeyA||TEC.ArrowLeft)r-=1;if(TEC.KeyD||TEC.ArrowRight)r+=1;
  if(TEC.KeyQ)y+=1;if(TEC.KeyE)y-=1;
  // joystick: curva suave perto do centro (ajuda a mirar)
  const cx=Math.sign(JOY.x)*JOY.x*JOY.x,cy=Math.sign(JOY.y)*JOY.y*JOY.y;
  p-=cy;r+=cx;y-=cx*0.35;
  return{p:Math.max(-1,Math.min(1,p))*inv,r:Math.max(-1,Math.min(1,r)),y,fogo:!!(TEC.Space||TEC.KeyJ||BT.fogo),turbo:!!(TEC.ShiftLeft||TEC.ShiftRight||BT.turbo),missil:!!(TEC.KeyF||TEC.KeyR||BT.missil),flare:!!(TEC.KeyX||TEC.KeyC||BT.flare)};}

// ------------------------------------------------ voo (modelo arcade) e tiro
function frente(q,v=_f){return v.set(1,0,0).applyQuaternion(q);}
let ULT_I=null;
// (10/11) decolagem: nasce parado na cabeceira da pista; acelera sozinho (turbo acelera mais), com 230 km/h puxa o manche e sobe.
// Se ninguém puxar, a 360 km/h o avião levanta o nariz sozinho (no celular ninguém bate no fim da pista).
function decolar(dt,I){const B=BASES[MINHA_BASE];
  EU.vel=Math.min(EU.vel+(I.turbo?30:18)*dt,200);
  const podeSubir=EU.vel>=64;let alvoArf=0;
  if(podeSubir&&(I.p>0.2||EU.vel>=100))alvoArf=0.22;
  EU.arf+=(alvoArf-EU.arf)*Math.min(1,dt*2.5);
  EU.q.setFromAxisAngle(_v1.set(0,1,0),B.yaw).multiply(_dq.setFromAxisAngle(_v2.set(0,0,1),EU.arf));
  const fw=frente(EU.q);EU.pos.addScaledVector(fw,EU.vel*dt);
  const chao=relevo(EU.pos.x,EU.pos.z)+1.9;
  if(EU.pos.y<chao)EU.pos.y=chao;
  if(EU.pos.y>chao+8){EU.solo=false;$('#dicaDec').style.display='none';}   // decolou: daqui em diante é voo normal
  JATO.position.copy(EU.pos);JATO.quaternion.copy(EU.q);JATO.userData.pc.visible=!!I.turbo;JATO.userData.pc.scale.y=0.8+Math.random()*0.4;
  SOM.motor(EU.vel,I.turbo,true);}
function voar(dt){const I=entrada();ULT_I=I;
  if(EU.solo){decolar(dt,I);return;}
  const fw=frente(EU.q),up=_u.set(0,1,0).applyQuaternion(EU.q),dir=_r.set(0,0,1).applyQuaternion(EU.q);
  let roll=I.r*2.5;if(Math.abs(I.r)<0.1&&up.y>0)roll+=dir.y*1.4;   // sem comando, nivela as asas sozinho
  _dq.setFromEuler(_eu.set(roll*dt,I.y*0.5*dt,I.p*1.3*dt,'XYZ'));EU.q.multiply(_dq).normalize();
  const turbo=I.turbo&&EU.turbo>0.02;EU.turbo=Math.max(0,Math.min(1,EU.turbo+(turbo?-0.28:0.12)*dt));
  const alvo=turbo?215:135;EU.vel+=(alvo-EU.vel)*Math.min(1,dt*0.9)-fw.y*32*dt;EU.vel=Math.max(75,Math.min(260,EU.vel));
  EU.pos.addScaledVector(fw,EU.vel*dt);
  JATO.position.copy(EU.pos);JATO.quaternion.copy(EU.q);JATO.userData.pc.visible=turbo;JATO.userData.pc.scale.y=0.8+Math.random()*0.4;
  // colisão com mar/ilha e limite da arena
  if(EU.pos.y<relevo(EU.pos.x,EU.pos.z)+3){morrer(null,true);return;}
  const rh=Math.hypot(EU.pos.x,EU.pos.z);EU.fora=rh>LIMITE||EU.pos.y>4500?EU.fora+dt:0;
  let aviso=EU.fora>0?'⚠️ Volte para a área de combate!':'';
  if(SALA==='pvp'&&!aviso)for(const B of BASES){if(B.i===MINHA_BASE)continue;const d=Math.hypot(EU.pos.x-B.x,EU.pos.z-B.z);
    if(d<R_SAM){aviso='🛡️ DEFESA ANTIAÉREA INIMIGA! Saia já';break;}if(d<R_SAM+700)aviso='⚠️ Perto da base inimiga';}
  const av=$('#aviso');av.style.display=aviso?'block':'none';if(av.textContent!==aviso)av.textContent=aviso;
  if(EU.fora>6){morrer(null,true);return;}
  if(I.fogo&&performance.now()>=proxTiro){proxTiro=performance.now()+80;atirar(fw);}
  travar(dt,fw);
  if(I.missil&&!misAnt&&TRAVA.t>=1&&MUN>0&&performance.now()>tMissilLoc){tMissilLoc=performance.now()+400;envia({t:'missil',alvo:TRAVA.id});}misAnt=I.missil;   // um por toque
  if(I.flare&&performance.now()>flarePronto){flarePronto=performance.now()+500;envia({t:'flare'});}
  SOM.motor(EU.vel,turbo,true);}
function atirar(fw){ladoArma=-ladoArma;
  const boca=_v2.set(3,-0.2,ladoArma*1.1).multiplyScalar(1.25).applyQuaternion(EU.q).add(EU.pos);
  // mira assistida: se tem alguém quase na frente do nariz, a rajada vai no ponto de interceptação
  let dir=_v3.copy(fw),melhor=Math.cos(4.5*Math.PI/180);
  for(const o of OUT.values()){if(!o.vivo)continue;_v1.subVectors(o.pos,EU.pos);const d=_v1.length();if(d>1150)continue;
    const c=_v1.dot(fw)/d;if(c>melhor){melhor=c;const t=d/VEL_BALA;_v1.copy(o.pos).addScaledVector(o.vel,t).sub(boca).normalize();dir.copy(_v1);}}
  const v=_v1.copy(dir).multiplyScalar(VEL_BALA).addScaledVector(fw,EU.vel);
  bala(boca,v,true);SOM.tiro(false);
  envia({t:'tiro',p:arr(boca,1),d:arr(dir,3)});}
function balas(dt){for(const b of BALAS){if(!b.ativa)continue;b.t+=dt;b.ant.copy(b.p);b.p.addScaledVector(b.v,dt);b.m.position.copy(b.p);
  if(b.t>VIDA_BALA){b.ativa=false;b.m.visible=false;continue;}
  if(b.p.y<relevo(b.p.x,b.p.z)){b.ativa=false;b.m.visible=false;if(b.minha&&b.p.distanceTo(EU.pos)<900)fx(b.p,0xffffff,6,0.4,2,false);continue;}
  if(!b.minha)continue;
  for(const [id,o] of OUT){if(!o.vivo)continue;if(distSeg(o.pos,b.ant,b.p)<10){b.ativa=false;b.m.visible=false;envia({t:'acerto',alvo:id});
    fx(b.p,0xffd070,7,0.25,2);SOM.acerto();tAcerto=0.15;break;}}}}
function distSeg(c,a,b){_v1.subVectors(b,a);const l2=_v1.lengthSq()||1;let t=_v2.subVectors(c,a).dot(_v1)/l2;t=Math.max(0,Math.min(1,t));return _v2.copy(a).addScaledVector(_v1,t).distanceTo(c);}
const arr=(v,d)=>{const k=10**d;return[Math.round(v.x*k)/k,Math.round(v.y*k)/k,Math.round(v.z*k)/k];};

// ------------------------------------------------ mísseis: trava (1 s com o alvo na frente), desenho, rastro e flares
function travar(dt,fw){let melhor=null,mc=Math.cos(22*Math.PI/180);
  for(const [id,o] of OUT){if(!o.vivo)continue;_v1.subVectors(o.pos,EU.pos);const d=_v1.length();if(d>2800)continue;const c=_v1.dot(fw)/d;if(c>mc){mc=c;melhor=id;}}
  if(melhor!==TRAVA.id){TRAVA.id=melhor||0;TRAVA.t=0;}else if(melhor)TRAVA.t+=dt;
  TRAVA.beep-=dt;if(TRAVA.id&&MUN>0&&TRAVA.beep<=0){const ok=TRAVA.t>=1;SOM.trava(ok);TRAVA.beep=ok?0.09:0.28;}}
const mMis=new THREE.MeshStandardMaterial({color:0xeeeeee,roughness:0.5}),mMisP=M('#c0392b',0.6);
function criarMissil(){const g=new THREE.Group();const c=cil(0.22,0.22,3.4,mMis,0,0,0,g,8);c.rotation.z=Math.PI/2;const n=cil(0,0.22,0.6,mMisP,2.0,0,0,g,8);n.rotation.z=-Math.PI/2;
  for(let i=0;i<4;i++){const a=box(0.6,0.04,0.9,mMis,-1.4,0,0,g);a.rotation.x=i*Math.PI/4;}
  const b=new THREE.Sprite(new THREE.SpriteMaterial({map:texBrilho(),color:0xffc060,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));b.position.x=-2.2;b.scale.setScalar(4.5);g.add(b);
  g.scale.setScalar(1.3);cena.add(g);return g;}
function recebeMisseis(lista){const agora=performance.now(),vistos=new Set();
  for(const [id,x,y,z,vx,vy,vz,alvo] of lista){vistos.add(id);let m=MISV.get(id);
    if(!m){m={g:criarMissil(),pos:new V3(x,y,z),alvoP:new V3(),vel:new V3(),tFumo:0};MISV.set(id,m);}
    m.alvoP.set(x,y,z);m.vel.set(vx,vy,vz);m.tRec=agora;m.alvo=alvo;}
  for(const [id,m] of MISV)if(!vistos.has(id)){cena.remove(m.g);MISV.delete(id);}}
function misseis(dt){const agora=performance.now(),k=1-Math.exp(-10*dt);let contraMim=false;
  for(const m of MISV.values()){const ad=Math.min(0.3,(agora-m.tRec)/1000);_v1.copy(m.alvoP).addScaledVector(m.vel,ad);m.pos.lerp(_v1,k);m.pos.addScaledVector(m.vel,dt*(1-k));
    m.g.position.copy(m.pos);if(m.vel.lengthSq()>1)m.g.quaternion.setFromUnitVectors(_x,_v2.copy(m.vel).normalize());
    m.tFumo-=dt;if(m.tFumo<=0){m.tFumo=0.035;fx(_v3.copy(m.pos).addScaledVector(_v2,-3),0xdddddd,4,2.6,3.5,false,2);}
    if(m.alvo===EU.id&&EU.vivo)contraMim=true;}
  const al=$('#alerta');al.style.display=contraMim?'block':'none';
  if(contraMim){tAlarme-=dt;if(tAlarme<=0){tAlarme=0.3;SOM.alarme();}}}
function flares(id){const o=id===EU.id?{pos:EU.pos,q:EU.q}:OUT.get(id);if(!o)return;const fw=frente(o.q,_v3);
  for(let i=0;i<6;i++){_v1.copy(o.pos).addScaledVector(fw,-10-i*4);const f={s:null};
    _v2.set((Math.random()-0.5)*30,-12-Math.random()*10,(Math.random()-0.5)*30);
    const s=new THREE.Sprite(new THREE.SpriteMaterial({map:texBrilho(),color:0xffe9a0,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));
    s.position.copy(_v1);s.scale.setScalar(5);cena.add(s);FX.push({s,t:0,dur:2.2,tam:5,cresce:0.6,sobe:0,vel:_v2.clone().addScaledVector(fw,-30)});}
  if(o.pos.distanceTo(EU.pos)<1500)SOM.flare();}

// ------------------------------------------------ morte / renascer
function morrer(porQuem,caiu,arma){if(!EU.vivo)return;EU.vivo=false;EU.solo=false;EU.mortoEm=performance.now();EU.porQuem=porQuem;JATO.visible=false;explosao(EU.pos,true);
  if(caiu)envia({t:'caiu'});SOM.motor(0,false,false);$('#dicaDec').style.display='none';$('#aviso').style.display='none';
  const m=$('#morte');m.style.display='block';m.innerHTML=(caiu?'💥 Você caiu!':arma==='sam'?'🛡️ Abatido pela defesa antiaérea!':'💥 Abatido por <span style="color:'+(porQuem?.cor||'#fff')+'">'+esc(porQuem?.nome||'?')+'</span>')+'<small>'+(SALA==='pvp'?'voltando para a pista…':'renascendo…')+'</small>';}
function nascer(){EU.vel=140;EU.solo=false;EU.arf=0;
  if(SALA==='pvp'&&MINHA_BASE!==null){const B=BASES[MINHA_BASE];   // (10/11) sala sem bots: sempre na cabeceira da pista da minha base
    EU.pos.set(B.x-B.dx*(PISTA/2-50),BASE_H+1.9,B.z-B.dz*(PISTA/2-50));EU.q.setFromAxisAngle(_v1.set(0,1,0),B.yaw);EU.vel=0;EU.solo=true;$('#dicaDec').style.display='block';}
  else{const a=Math.random()*Math.PI*2,r=2200+Math.random()*1200;EU.pos.set(Math.cos(a)*r,700+Math.random()*400,Math.sin(a)*r);
    const yaw=Math.atan2(EU.pos.z,-EU.pos.x);EU.q.setFromAxisAngle(_v1.set(0,1,0),yaw);}   // nariz (+x) apontando pro centro
  EU.vida=100;EU.turbo=1;MUN=2;TRAVA.id=0;TRAVA.t=0;EU.vivo=true;EU.fora=0;JATO.visible=true;$('#morte').style.display='none';
  envia({t:'renascer',p:arr(EU.pos,1)});}

// ------------------------------------------------ rede
function envia(m){if(ws&&ws.readyState===1)ws.send(JSON.stringify(m));}
function conectar(){const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';
  ws=new WebSocket(url);
  ws.onopen=()=>{conectado=true;envia({t:'entrar',nome:EU.nome,sala:SALA});};
  ws.onclose=()=>{const era=conectado;conectado=false;if(jogando){jogando=false;document.body.classList.remove('jogando');$('#menu').style.display='flex';
      $('#erro').textContent=era?'⚠️ Conexão perdida. Toque em DECOLAR para voltar.':'⚠️ Não consegui falar com o servidor.';}};
  ws.onmessage=e=>{let d;try{d=JSON.parse(e.data);}catch{return;}
    if(d.t==='bemvindo'){EU.id=d.id;EU.cor=d.cor;SALA=d.sala||'bots';MINHA_BASE=d.base??null;if(d.zona)ZONA=d.zona;if(d.rsam)R_SAM=d.rsam;LIMITE=SALA==='pvp'?9500:5200;mostrarBases();
      if(JATO)cena.remove(JATO);JATO=criarJato(d.cor);nascer();}
    else if(d.t==='placar')recebePlacar(d.l);
    else if(d.t==='snap')recebeSnap(d.j);
    else if(d.t==='tiro'){const o=OUT.get(d.id);_v1.fromArray(d.p);_v2.fromArray(d.d).multiplyScalar(VEL_BALA);if(o)_v2.add(o.vel);bala(_v1,_v2,false);
      const dist=_v1.distanceTo(EU.pos);if(dist<1400)SOM.tiro(true);}
    else if(d.t==='abate')recebeAbate(d);
    else if(d.t==='missil'){if(d.base!==undefined){const B=BASES[d.base];if(B){_v1.set(B.x,BASE_H,B.z);SOM.lanca(_v1.distanceTo(EU.pos)<1500);fx(_v1.setY(BASE_H+8),0xffc060,30,0.8,2);}}
      else{const o=d.dono===EU.id?EU:OUT.get(d.dono);if(o)SOM.lanca(d.dono===EU.id||o.pos.distanceTo(EU.pos)<800);}}
    else if(d.t==='boom'){_v1.fromArray(d.p);const dd=_v1.distanceTo(EU.pos);if(d.acertou)explosao(_v1,dd<700);else fx(_v1,0xffb040,14,0.6,2.5);}
    else if(d.t==='flare')flares(d.id);
    else if(d.t==='mun'){MUN=d.m;}
    else if(d.t==='flareok'){flarePronto=performance.now()+d.espera*1000;}
    if(d.t==='snap'&&d.m)recebeMisseis(d.m);};}
function recebePlacar(l){PLACAR=l;const ids=new Set(l.map(x=>x.id));corBandeiras(l);
  for(const x of l){if(x.id===EU.id)continue;let o=OUT.get(x.id);
    if(!o){o={g:criarJato(x.cor),pos:new V3(),vel:new V3(),q:new QT(),alvoP:new V3(),alvoQ:new QT(),tRec:0,vida:100,vivo:false,novo:true};
      o.rot=document.createElement('div');o.rot.className='rot';o.rot.innerHTML='<span></span><b><i></i></b>';$('#rotulos').appendChild(o.rot);o.g.visible=false;OUT.set(x.id,o);}
    o.nome=x.nome;o.cor=x.cor;o.bot=x.bot;o.rot.firstChild.textContent=x.nome;o.rot.style.color=x.cor;}
  for(const [id,o] of OUT)if(!ids.has(id)){cena.remove(o.g);o.rot.remove();OUT.delete(id);}
  const ord=[...l].sort((a,b)=>b.pontos-a.pontos||a.mortes-b.mortes);
  $('#placar').innerHTML=ord.map(x=>`<div class="${x.id===EU.id?'eu':''}"><span style="color:${x.cor}">${x.bot?'🤖':'✈️'} ${esc(x.nome)}</span><span>${x.pontos} 🏆</span></div>`).join('');}
function recebeSnap(j){const agora=performance.now();
  for(const a of j){const [id,px,py,pz,qx,qy,qz,qw,vx,vy,vz,vida,vivo]=a;
    if(id===EU.id){if(vida<EU.vida&&EU.vivo){$('#dor').style.opacity=0.8;setTimeout(()=>$('#dor').style.opacity=0,180);SOM.dor();}EU.vida=EU.vivo?vida:EU.vida;continue;}
    const o=OUT.get(id);if(!o)continue;
    o.alvoP.set(px,py,pz);o.alvoQ.set(qx,qy,qz,qw);o.vel.set(vx,vy,vz);o.tRec=agora;o.vida=vida;
    const voltou=vivo&&!o.vivo;o.vivo=!!vivo;
    if(o.novo||voltou){o.pos.copy(o.alvoP);o.q.copy(o.alvoQ);o.novo=false;}
    o.g.visible=o.vivo;}}
function recebeAbate(d){const por=PLACAR.find(x=>x.id===d.por),alvo=PLACAR.find(x=>x.id===d.alvo);
  if(d.alvo===EU.id)morrer(por,false,d.arma);
  else{const o=OUT.get(d.alvo);if(o){o.vivo=false;o.g.visible=false;_v1.fromArray(d.p);explosao(o.pos.lengthSq()?o.pos:_v1,o.pos.distanceTo(EU.pos)<700);}}
  const n=x=>x?`<b style="color:${x.cor}">${esc(x.nome)}</b>`:'';
  const div=document.createElement('div');div.innerHTML=por?`${n(por)} ${d.arma==='missil'?'🚀':'🔥'} abateu ${n(alvo)}`:d.arma==='sam'?`🛡️ a defesa antiaérea derrubou ${n(alvo)}`:`${n(alvo)} 💥 caiu`;$('#feed').prepend(div);
  setTimeout(()=>div.remove(),4000);while($('#feed').children.length>4)$('#feed').lastChild.remove();}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

// ------------------------------------------------ outros aviões: suavização entre os pacotes (20/s)
function outros(dt){const agora=performance.now(),k=1-Math.exp(-10*dt);
  for(const o of OUT.values()){if(!o.vivo)continue;const ad=Math.min(0.35,(agora-o.tRec)/1000);
    _v1.copy(o.alvoP).addScaledVector(o.vel,ad);o.pos.lerp(_v1,k);o.pos.addScaledVector(o.vel,dt*(1-k));o.q.slerp(o.alvoQ,k);
    o.g.position.copy(o.pos);o.g.quaternion.copy(o.q);}}

// ------------------------------------------------ câmera de perseguição
const camP=new V3(0,800,0),camUp=new V3(0,1,0);let camAng=0;
// (09/11) visão da cabine: câmera na cabeça do piloto, gira junto com o caça (V ou 👁️ troca)
let CABINE=false;try{CABINE=localStorage.getItem('jsjet-cab')==='1';}catch(e){}
const _cabQ=new QT().setFromAxisAngle(new V3(0,1,0),-Math.PI/2),_cabOff=new V3(3.15,1.0,0).multiplyScalar(1.25);   // olho do piloto
function trocaVisao(){CABINE=!CABINE;try{localStorage.setItem('jsjet-cab',CABINE?'1':'0');}catch(e){}camP.copy(cam.position);}
function camera(dt){if(EU.vivo&&CABINE){cam.position.copy(_cabOff).applyQuaternion(EU.q).add(EU.pos);cam.quaternion.copy(EU.q).multiply(_cabQ);camUp.set(0,1,0).applyQuaternion(EU.q);
    const fov=(innerWidth<innerHeight?82:70)+(EU.vel-135)*0.08;if(Math.abs(cam.fov-fov)>0.2){cam.fov+=(fov-cam.fov)*Math.min(1,dt*3);cam.updateProjectionMatrix();}return;}
  if(EU.vivo){const fw=frente(EU.q),up=_u.set(0,1,0).applyQuaternion(EU.q);
    _v1.copy(EU.pos).addScaledVector(fw,-30).addScaledVector(up,7.5);camP.lerp(_v1,1-Math.exp(-9*dt));cam.position.copy(camP);
    camUp.lerp(_v2.copy(up).lerp(_v3.set(0,1,0),0.45).normalize(),1-Math.exp(-6*dt));cam.up.copy(camUp);
    cam.lookAt(_v1.copy(EU.pos).addScaledVector(fw,60));
    const fov=(innerWidth<innerHeight?78:62)+(EU.vel-135)*0.08;if(Math.abs(cam.fov-fov)>0.2){cam.fov+=(fov-cam.fov)*Math.min(1,dt*3);cam.updateProjectionMatrix();}}
  else{camAng+=dt*0.25;cam.up.set(0,1,0);cam.position.set(EU.pos.x+Math.cos(camAng)*90,Math.max(EU.pos.y+30,relevo(EU.pos.x,EU.pos.z)+20),EU.pos.z+Math.sin(camAng)*90);cam.lookAt(EU.pos);}}

// ------------------------------------------------ HUD: mira, rótulos, seta do inimigo mais perto, radar, barras
const rctx=$('#radar').getContext('2d');let tRadar=0;
function hud(dt){const W=innerWidth,H=innerHeight;
  const mira=$('#mira');if(EU.vivo){_v1.copy(EU.pos).addScaledVector(frente(EU.q),700).project(cam);mira.style.display=CABINE?'none':'block';mira.style.left=((_v1.x+1)/2*W)+'px';mira.style.top=((1-_v1.y)/2*H)+'px';}else mira.style.display='none';
  tAcerto-=dt;mira.classList.toggle('acertou',tAcerto>0);
  let perto=null,dP=1e9;
  for(const o of OUT.values()){const d=o.pos.distanceTo(EU.pos);
    if(!o.vivo){o.rot.style.display='none';continue;}if(d<dP){dP=d;perto=o;}
    _v1.copy(o.pos).y+=9;_v1.project(cam);
    if(_v1.z<1&&Math.abs(_v1.x)<1.1&&Math.abs(_v1.y)<1.1&&d<4500){o.rot.style.display='block';o.rot.style.left=((_v1.x+1)/2*W)+'px';o.rot.style.top=((1-_v1.y)/2*H)+'px';
      o.rot.firstChild.textContent=o.nome+' · '+Math.round(d)+'m';o.rot.lastChild.firstChild.style.width=o.vida+'%';o.vis=true;}else{o.rot.style.display='none';o.vis=false;}}
  const tv=$('#trava'),ot=TRAVA.id&&OUT.get(TRAVA.id);
  if(ot&&ot.vis&&EU.vivo&&MUN>0){_v1.copy(ot.pos).project(cam);tv.style.display='block';tv.style.left=((_v1.x+1)/2*W)+'px';tv.style.top=((1-_v1.y)/2*H)+'px';
    const ok=TRAVA.t>=1;tv.className='hud'+(ok?' ok':'');tv.style.transform=`translate(-50%,-50%) scale(${ok?1:1.6-0.6*Math.min(1,TRAVA.t)}) rotate(${ok?0:45*(1-Math.min(1,TRAVA.t))}deg)`;}else tv.style.display='none';
  $('#bMissil').textContent='🚀'+MUN;$('#bMissil').classList.toggle('vazio',MUN<=0);$('#bMissil').classList.toggle('pronto',TRAVA.t>=1&&MUN>0);
  const fp=performance.now()>=flarePronto;$('#bFlare').classList.toggle('vazio',!fp);
  $('#tMis').textContent='🚀 '+MUN+'  ✨ '+(fp?'ok':Math.ceil((flarePronto-performance.now())/1000)+'s');
  const seta=$('#seta');
  if(perto&&!perto.vis&&EU.vivo){_v1.copy(perto.pos).project(cam);let x=_v1.x,y=_v1.y;if(_v1.z>1){x=-x;y=-y;}
    const a=Math.atan2(y,x),rx=W/2-40,ry=H/2-40;seta.style.display='block';seta.style.borderBottomColor=perto.cor;
    seta.style.left=(W/2+Math.cos(a)*rx-11)+'px';seta.style.top=(H/2-Math.sin(a)*ry-11)+'px';seta.style.transform=`rotate(${Math.PI/2-a}rad)`;}else seta.style.display='none';
  $('#bVida i').style.width=Math.max(0,EU.vida)+'%';$('#bTurboB i').style.width=(EU.turbo*100)+'%';
  $('#tVel').textContent='💨 '+Math.round(EU.vel*3.6)+' km/h';$('#tAlt').textContent='⛰️ '+Math.round(EU.pos.y)+' m';
  tRadar-=dt;if(tRadar>0)return;tRadar=0.1;if(CABINE&&EU.vivo)setTimeout(atualizaMFD,0);
  const S=236,c=S/2,esc2=c/3500;rctx.clearRect(0,0,S,S);
  rctx.strokeStyle='#7fd3ff33';rctx.lineWidth=2;for(const r of[0.33,0.66])rctx.beginPath(),rctx.arc(c,c,c*r,0,7),rctx.stroke();
  const fw=frente(EU.q,_v3),hd=Math.atan2(fw.z,fw.x);
  const ponto=(x,z,cor,r)=>{const dx=x-EU.pos.x,dz=z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.min(c-6,Math.hypot(dx,dz)*esc2);
    rctx.fillStyle=cor;rctx.beginPath();rctx.arc(c+Math.sin(a)*d,c-Math.cos(a)*d,r,0,7);rctx.fill();};
  rctx.fillStyle='#3f8a3c88';for(const I of ILHAS){const dx=I.x-EU.pos.x,dz=I.z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.hypot(dx,dz)*esc2;if(d<c+I.r*esc2){rctx.beginPath();rctx.arc(c+Math.sin(a)*d,c-Math.cos(a)*d,Math.max(2,I.r*esc2),0,7);rctx.fill();}}
  if(SALA==='pvp'){   // (10/11) zona de combate e bases (a minha em verde; as outras em vermelho com o alcance dos SAM)
    const anelR=(x,z,r,cor)=>{const dx=x-EU.pos.x,dz=z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.hypot(dx,dz)*esc2;rctx.strokeStyle=cor;rctx.lineWidth=2;rctx.beginPath();rctx.arc(c+Math.sin(a)*d,c-Math.cos(a)*d,r*esc2,0,7);rctx.stroke();};
    rctx.save();rctx.beginPath();rctx.arc(c,c,c-1,0,7);rctx.clip();anelR(0,0,ZONA,'#ffd23a99');
    for(const B of BASES)if(B.i!==MINHA_BASE)anelR(B.x,B.z,R_SAM,'#ff3b3099');rctx.restore();
    for(const B of BASES){const dx=B.x-EU.pos.x,dz=B.z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.min(c-8,Math.hypot(dx,dz)*esc2);
      rctx.fillStyle=B.i===MINHA_BASE?'#3cd070':'#ff3b30';rctx.fillRect(c+Math.sin(a)*d-5,c-Math.cos(a)*d-5,10,10);}}
  for(const o of OUT.values())if(o.vivo)ponto(o.pos.x,o.pos.z,o.cor,6);
  for(const m of MISV.values())ponto(m.pos.x,m.pos.z,m.alvo===EU.id?'#ff2020':'#ffffff',3);
  rctx.fillStyle='#fff';rctx.beginPath();rctx.moveTo(c,c-9);rctx.lineTo(c+6,c+6);rctx.lineTo(c-6,c+6);rctx.fill();}

// ------------------------------------------------ (09/11) cabine por dentro: painel com 3 telas, HUD verde, canopi, e o piloto (pernas, braços, manche e acelerador)
// Fica numa cena separada desenhada por cima (sem briga de profundidade com o mundo); acompanha o caça a cada quadro.
const cenaCab=new THREE.Scene(),camCab=new THREE.PerspectiveCamera(70,1,0.02,30);
cenaCab.add(new THREE.HemisphereLight(0xdcefff,0x2a2a2a,0.85));{const l=new THREE.DirectionalLight(0xfff1d6,0.9);l.position.copy(sol.position);cenaCab.add(l);}
const CAB=new THREE.Group();CAB.scale.setScalar(1.25);cenaCab.add(CAB);
const mCv=(c)=>new THREE.MeshBasicMaterial({map:tex(c),toneMapped:false});
function seg(a,b,r,mat,pai){const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r*0.9,1,10),mat);pai.add(m);poeSeg(m,a,b);return m;}
function poeSeg(m,a,b){_v1.subVectors(b,a);m.scale.set(1,_v1.length(),1);m.position.copy(a).addScaledVector(_v1,0.5);m.quaternion.setFromUnitVectors(_v2.set(0,1,0),_v1.normalize());}
const MFD={};
{const mP=M('#25292e',0.85),mF=M('#3b4046',0.6),mT=M('#1c1f23',0.95),mS=M('#55654a',0.9),mL=M('#3a3a2e',0.8),mB=M('#15171a',0.6);
  // painel inclinado + aba anti-reflexo em cima + paredes laterais
  const pn=box(0.1,0.38,0.9,mP,3.98,0.62,0,CAB);pn.rotation.z=0.18;
  const ab=box(0.24,0.035,0.9,mT,3.93,0.82,0,CAB);ab.rotation.z=-0.06;
  for(const s of[-1,1])box(0.24,0.4,0.03,mP,3.9,0.62,s*0.45,CAB);   // abas laterais do painel
  for(const s of[-1,1]){box(0.8,0.12,0.14,mP,3.5,0.56,s*0.4,CAB);box(1.4,0.035,0.04,mF,3.35,0.66,s*0.48,CAB);   // consoles e trilho do canopi
    for(let i=0;i<5;i++)box(0.05,0.025,0.05,i%2?M('#e0a020',0.5):M('#9aa3ad',0.5),3.25+i*0.12,0.63,s*0.4,CAB);}   // botões
  // arco do para-brisa
  // vidro do HUD (combinador) com as hastes
  const vg=new THREE.Mesh(new THREE.PlaneGeometry(0.2,0.16),new THREE.MeshBasicMaterial({color:0x7dffb0,transparent:true,opacity:0.12,depthWrite:false,side:THREE.DoubleSide}));
  vg.position.set(3.9,0.91,0);vg.rotation.y=-Math.PI/2;vg.rotation.x=0;vg.rotateX(0);CAB.add(vg);
  for(const s of[-1,1])seg(new V3(3.89,0.83,s*0.1),new V3(3.9,0.99,s*0.1),0.004,mB,CAB);box(0.03,0.012,0.21,mB,3.9,0.99,0,CAB);
  // 3 telas (MFD): radar | horizonte artificial | estado
  for(const [k,z] of [['rad',-0.27],['hor',0],['est',0.27]]){const c=cv(k==='rad'?236:160,k==='rad'?236:160);MFD[k]=c;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(0.19,0.19),k==='rad'?new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture($('#radar')),toneMapped:false}):mCv(c));
    if(k==='rad')MFD.texRad=m.material.map;else MFD['tex_'+k]=m.material.map;
    m.position.set(3.885,0.62,z);m.rotation.y=-Math.PI/2;m.rotateX(0.18);CAB.add(m);
    const mol=box(0.02,0.23,0.23,mB,3.897,0.62,z,CAB);mol.rotation.z=0.18;}
  // piloto: coxas, canelas, botas
  for(const s of[-1,1]){const q=new V3(3.0,0.4,s*0.13),j=new V3(3.58,0.53,s*0.2),p=new V3(3.88,0.12,s*0.21);
    seg(q,j,0.075,mS,CAB);esf(0.078,mS,j.x,j.y,j.z,CAB);seg(j,p,0.065,mS,CAB);box(0.2,0.1,0.11,mL,p.x+0.04,p.y,p.z,CAB);
    box(0.16,0.012,0.07,M('#d8d8d8',0.7),3.35,0.535,s*0.17,CAB);}   // fita de ajuste na perna
  // manche entre os joelhos (pivô no chão) com a luva direita
  const st=new THREE.Group();st.position.set(3.6,0.3,0.0);CAB.add(st);CAB.userData.manche=st;
  cil(0.018,0.022,0.34,mB,0,0.17,0,st);const pg=cil(0.035,0.032,0.11,M('#2d2d2d',0.7),0,0.38,0,st);pg.rotation.z=0.25;
  box(0.012,0.02,0.02,M('#c0392b',0.5),-0.015,0.44,0,st);   // gatilho do canhão
  const mD=esf(0.045,mL,0.0,0.37,0.02,st,1.1,1.3,1);CAB.userData.maoD=mD;
  // acelerador no console esquerdo com a luva esquerda
  const ac=new THREE.Group();ac.position.set(3.5,0.64,-0.38);CAB.add(ac);CAB.userData.acel=ac;
  box(0.05,0.08,0.04,mB,0,0.03,0,ac);esf(0.05,mL,0,0.08,0.01,ac,1.2,1,1.1);
  // braços (atualizados a cada quadro p/ seguir as mãos)
  CAB.userData.bD=[seg(new V3(),new V3(1,0,0),0.05,mS,CAB),seg(new V3(),new V3(1,0,0),0.045,mS,CAB)];
  CAB.userData.bE=[seg(new V3(),new V3(1,0,0),0.05,mS,CAB),seg(new V3(),new V3(1,0,0),0.045,mS,CAB)];}
const _ombD=new V3(3.1,0.8,0.24),_cotD=new V3(3.3,0.5,0.24),_ombE=new V3(3.1,0.8,-0.24),_cotE=new V3(3.3,0.56,-0.36),_mao=new V3();
function cabine(I){CAB.position.copy(JATO.position);CAB.quaternion.copy(JATO.quaternion);
  const st=CAB.userData.manche;st.rotation.z+=((I?I.p:0)*0.28-st.rotation.z)*0.3;st.rotation.x+=((I?I.r:0)*0.28-st.rotation.x)*0.3;
  const ac=CAB.userData.acel;ac.position.x+=((I&&I.turbo?3.6:3.5)-ac.position.x)*0.2;
  CAB.updateMatrixWorld(true);
  CAB.userData.maoD.getWorldPosition(_mao);CAB.worldToLocal(_mao);poeSeg(CAB.userData.bD[0],_ombD,_cotD);poeSeg(CAB.userData.bD[1],_cotD,_mao);
  _mao.set(ac.position.x,ac.position.y+0.06,ac.position.z);poeSeg(CAB.userData.bE[0],_ombE,_cotE);poeSeg(CAB.userData.bE[1],_cotE,_mao);
  camCab.position.copy(cam.position);camCab.quaternion.copy(cam.quaternion);camCab.fov=cam.fov;camCab.aspect=cam.aspect;camCab.updateProjectionMatrix();}
function atualizaMFD(){if(MFD.texRad)MFD.texRad.needsUpdate=true;
  const fw=frente(EU.q,_v3),up=_u.set(0,1,0).applyQuaternion(EU.q),rt=_r.set(0,0,1).applyQuaternion(EU.q);
  const arf=Math.asin(Math.max(-1,Math.min(1,fw.y))),ban=Math.atan2(-rt.y,up.y);
  {const c=MFD.hor,g=c.getContext('2d'),S=160;g.save();g.fillStyle='#000';g.fillRect(0,0,S,S);g.beginPath();g.arc(S/2,S/2,74,0,7);g.clip();
    g.translate(S/2,S/2);g.rotate(-ban);g.translate(0,arf*180/Math.PI*2.4);g.fillStyle='#2d7fd6';g.fillRect(-200,-400,400,400);g.fillStyle='#8a5a2b';g.fillRect(-200,0,400,400);
    g.strokeStyle='#fff';g.lineWidth=2;g.beginPath();g.moveTo(-200,0);g.lineTo(200,0);g.stroke();
    for(let p=-30;p<=30;p+=10){if(!p)continue;g.beginPath();g.moveTo(-18,-p*2.4);g.lineTo(18,-p*2.4);g.stroke();}
    g.restore();g.strokeStyle='#ffd23a';g.lineWidth=4;g.beginPath();g.moveTo(40,80);g.lineTo(68,80);g.lineTo(80,90);g.lineTo(92,80);g.lineTo(120,80);g.stroke();MFD.tex_hor.needsUpdate=true;}
  {const c=MFD.est,g=c.getContext('2d'),S=160;g.fillStyle='#000';g.fillRect(0,0,S,S);g.font='bold 20px monospace';
    const lin=[['VIDA',Math.round(EU.vida)+'%',EU.vida>40?'#5dff8a':'#ff5040'],['MSL',MUN+'/2',MUN?'#5dff8a':'#ff5040'],['FLR',performance.now()>=flarePronto?'OK':'...','#5dff8a'],['TRB',Math.round(EU.turbo*100)+'%','#ffd23a']];
    lin.forEach(([a,b,cor],i)=>{g.fillStyle='#5dff8a99';g.fillText(a,10,32+i*36);g.fillStyle=cor;g.fillText(b,84,32+i*36);});MFD.tex_est.needsUpdate=true;}}
// HUD verde desenhado na tela (escada de arfagem, velocidade, altitude, rumo, trava)
const hc=document.createElement('canvas');hc.id='hudCab';hc.className='hud';document.body.insertBefore(hc,$('#rotulos'));const hg=hc.getContext('2d');
function hudCabine(){const W=innerWidth,H=innerHeight;if(hc.width!==W||hc.height!==H){hc.width=W;hc.height=H;}hg.clearRect(0,0,W,H);
  if(!(CABINE&&EU.vivo&&jogando)){hc.style.display='none';return;}hc.style.display='block';
  const fw=frente(EU.q,_v3),up=_u.set(0,1,0).applyQuaternion(EU.q),rt=_r.set(0,0,1).applyQuaternion(EU.q);
  const arf=Math.asin(Math.max(-1,Math.min(1,fw.y)))*180/Math.PI,ban=Math.atan2(-rt.y,up.y),ppg=H/cam.fov,cx=W/2,cy=H/2,cor='#5dff8a';
  hg.strokeStyle=cor;hg.fillStyle=cor;hg.lineWidth=2;hg.font='bold 14px monospace';hg.textAlign='center';hg.textBaseline='middle';hg.shadowColor='#000c';hg.shadowBlur=4;
  hg.save();hg.translate(cx,cy);hg.rotate(-ban);hg.beginPath();hg.rect(-W*0.22,-H*0.3,W*0.44,H*0.6);hg.clip();
  for(let p=-90;p<=90;p+=10){const y=(arf-p)*ppg;if(Math.abs(y)>H*0.3)continue;const L=p===0?W*0.2:60,v=22;hg.beginPath();
    if(p<0)hg.setLineDash([8,6]);else hg.setLineDash([]);
    hg.moveTo(-L,y);hg.lineTo(-v,y);hg.moveTo(v,y);hg.lineTo(L,y);if(p){hg.moveTo(-L,y);hg.lineTo(-L,y+(p>0?8:-8));hg.moveTo(L,y);hg.lineTo(L,y+(p>0?8:-8));}hg.stroke();
    if(p){hg.fillText(Math.abs(p),-L-18,y);hg.fillText(Math.abs(p),L+18,y);}}
  hg.restore();hg.setLineDash([]);
  hg.beginPath();hg.arc(cx,cy,7,0,7);hg.moveTo(cx-22,cy);hg.lineTo(cx-7,cy);hg.moveTo(cx+7,cy);hg.lineTo(cx+22,cy);hg.moveTo(cx,cy-7);hg.lineTo(cx,cy-15);hg.stroke();   // símbolo do avião
  const bx=W*0.27;hg.strokeRect(cx-bx-70,cy-14,70,28);hg.strokeRect(cx+bx,cy-14,70,28);hg.fillText(Math.round(EU.vel*3.6),cx-bx-35,cy);hg.fillText(Math.round(EU.pos.y),cx+bx+35,cy);
  hg.font='bold 11px monospace';hg.fillText('KM/H',cx-bx-35,cy+26);hg.fillText('ALT',cx+bx+35,cy+26);
  const rumo=((Math.atan2(fw.x,-fw.z)*180/Math.PI)+360)%360,ty=H*0.13;hg.font='bold 13px monospace';
  for(let d=-30;d<=30;d+=5){const g=Math.round(rumo/5)*5+d,x=cx+(g-rumo)*6;hg.beginPath();hg.moveTo(x,ty);hg.lineTo(x,ty+(g%10?5:10));hg.stroke();if(g%10===0)hg.fillText(String(((g%360)+360)%360).padStart(3,'0'),x,ty-10);}
  hg.beginPath();hg.moveTo(cx,ty+14);hg.lineTo(cx-6,ty+22);hg.lineTo(cx+6,ty+22);hg.closePath();hg.fill();
  hg.font='bold 15px monospace';hg.textAlign='left';hg.fillText('MSL '+MUN,cx-bx-70,cy+H*0.2);hg.fillText('G '+(1+Math.abs(ULT_I?ULT_I.p:0)*4).toFixed(1),cx-bx-70,cy+H*0.2+22);
  if(TRAVA.id&&MUN>0&&TRAVA.t>=1&&(performance.now()%400<250)){hg.textAlign='center';hg.font='bold 22px monospace';hg.fillText('LOCK',cx,cy+H*0.17);}
  hg.shadowBlur=0;}

// ------------------------------------------------ laço principal
let tAnt=performance.now();
function quadro(){requestAnimationFrame(quadro);const agora=performance.now(),dt=Math.min(0.05,(agora-tAnt)/1000);tAnt=agora;
  if(jogando&&JATO){if(EU.vivo)voar(dt);else if(agora-EU.mortoEm>3200&&conectado)nascer();
    tEnvio-=dt;if(tEnvio<=0&&EU.vivo){tEnvio=0.05;envia({t:'e',p:arr(EU.pos,1),q:[EU.q.x,EU.q.y,EU.q.z,EU.q.w].map(x=>Math.round(x*1e4)/1e4),v:arr(frente(EU.q,_v3).multiplyScalar(EU.vel),1)});}}
  outros(dt);balas(dt);misseis(dt);efeitos(dt);
  if(jogando&&JATO){camera(dt);hud(dt);}else{camAng+=dt*0.05;cam.up.set(0,1,0);cam.position.set(Math.cos(camAng)*2600,700,Math.sin(camAng)*2600);cam.lookAt(0,250,0);}
  const dentro=CABINE&&EU.vivo&&jogando&&JATO;document.body.classList.toggle('cabine',!!dentro);if(JATO)for(const m of JATO.userData.cab)m.visible=!dentro;
  R.autoClear=true;R.render(cena,cam);
  if(dentro){cabine(ULT_I);R.autoClear=false;R.clearDepth();R.render(cenaCab,camCab);R.autoClear=true;}
  hudCabine();}
requestAnimationFrame(quadro);

// ------------------------------------------------ menu
try{$('#nome').value=localStorage.getItem('jsjet-nome')||'';$('#inverter').checked=localStorage.getItem('jsjet-inv')==='1';}catch(e){}
$('#salaPvp').addEventListener('click',()=>{SALA='pvp';$('#decolar').dataset.sala='pvp';$('#decolar').click();});
$('#decolar').addEventListener('click',async()=>{SALA=$('#decolar').dataset.sala||'bots';delete $('#decolar').dataset.sala;const nome=$('#nome').value.trim()||'Piloto '+Math.floor(Math.random()*900+100);EU.nome=nome;
  try{localStorage.setItem('jsjet-nome',$('#nome').value.trim());localStorage.setItem('jsjet-inv',$('#inverter').checked?'1':'0');}catch(e){}
  SOM.ini();$('#erro').textContent='';
  if(TOQUE){try{await document.documentElement.requestFullscreen?.();}catch(e){}try{await screen.orientation?.lock?.('landscape');}catch(e){}}
  $('#menu').style.display='none';jogando=true;document.body.classList.add('jogando');
  for(const o of OUT.values()){cena.remove(o.g);o.rot.remove();}OUT.clear();
  if(ws)try{ws.onclose=null;ws.close();}catch(e){}
  conectar();});
$('#nome').addEventListener('keydown',e=>{if(e.key==='Enter')$('#decolar').click();});
window.JJ={EU,OUT,PLACAR:()=>PLACAR};   // p/ testes headless

// (09/11) Esc sai da partida e volta ao menu
function sair(){jogando=false;document.body.classList.remove('jogando');
  if(ws){ws.onclose=null;try{ws.close();}catch(e){}ws=null;}conectado=false;EU.vivo=false;SOM.motor(0,false,false);
  for(const o of OUT.values()){cena.remove(o.g);o.rot.remove();}OUT.clear();for(const m of MISV.values())cena.remove(m.g);MISV.clear();
  if(JATO){cena.remove(JATO);JATO=null;}for(const k in TEC)TEC[k]=false;
  for(const id of['#mira','#seta','#trava','#alerta','#aviso','#morte','#dicaDec'])$(id).style.display='none';
  $('#placar').innerHTML='';$('#feed').innerHTML='';$('#erro').textContent='';$('#menu').style.display='flex';$('#nome').focus();}
$('#bVisao').addEventListener('pointerdown',e=>{e.stopPropagation();trocaVisao();});
