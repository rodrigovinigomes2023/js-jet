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
const mar=new THREE.Mesh(new THREE.PlaneGeometry(60000,60000),new THREE.MeshStandardMaterial({color:new THREE.Color('#1f6f9f').convertSRGBToLinear(),roughness:0.35,metalness:0.1}));
mar.rotation.x=-Math.PI/2;cena.add(mar);
const BASES0=[45,135,225,315].map(g=>[Math.cos(g*Math.PI/180)*18600,Math.sin(g*Math.PI/180)*18600]);   // centro das bases (= BASE_R)
const ILHAS=[];{const r=rnd(20251109);ILHAS.push({x:300,z:-200,r:1100,h:420});
  for(let i=0;i<16;i++){const a=r()*Math.PI*2,d=900+r()*4200;ILHAS.push({x:Math.cos(a)*d,z:Math.sin(a)*d,r:220+r()*700,h:60+r()*330});}
  for(let i=0;i<40;i++){const a=r()*Math.PI*2,d=5600+r()*10200,x=Math.cos(a)*d,z=Math.sin(a)*d;   // (10/11) arena 4x: ilhas no anel de fora, longe das bases
    if(BASES0.some(([bx,bz])=>Math.hypot(x-bx,z-bz)<3200))continue;ILHAS.push({x,z,r:220+r()*700,h:60+r()*330});}}
// (10/11) bases da sala sem bots: as mesmas do servidor (anel de 18,6 km — arena 4x maior, 4 no máximo), cada uma numa ilha plana com pista apontada p/ o centro
const BASE_R=18600,BASE_H=18,BASE_PLANO=760,BASE_ILHA=1050,PISTA=1300;
// (11/11) + 4 bases da sala com bots (deathmatch) a 5,8 km, no mar livre (iguais ao servidor); 4 baterias cada
const BASE_R_BOTS=5800,LANC_PVP=[[-320,-120],[320,-120],[0,-190]],LANC_BOTS=[...LANC_PVP,[380,160]];
const BASES=[...[45,135,225,315].map(g=>[g,BASE_R,'pvp']),...[75,165,255,345].map(g=>[g,BASE_R_BOTS,'bots'])].map(([g,R,sala],i)=>{const a=g*Math.PI/180,x=Math.cos(a)*R,z=Math.sin(a)*R;
  return{i,x,z,sala,rsam:sala==='bots'?2500:3000,lpos:sala==='bots'?LANC_BOTS:LANC_PVP,dx:-Math.cos(a),dz:-Math.sin(a),yaw:Math.atan2(z,-x)};});
const salaBases=()=>SALA==='treino'?'pvp':SALA;   // treino usa as bases da sala sem bots
let SALA='bots',MINHA_BASE=null,ZONA=15200,R_SAM=3000,LIMITE=5200;
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
let mNuvem=null;   // (10/11) nuvens: o sprite gira junto com a câmera; desfaz o giro (rolagem) a cada quadro
{const r=rnd(77),mN=mNuvem=new THREE.SpriteMaterial({map:texFumo(),color:0xffffff,transparent:true,opacity:0.85,depthWrite:false,fog:true});
  for(let i=0;i<160;i++){const a=r()*Math.PI*2,d=i<70?r()*6500:6500+r()*11000,y=900+r()*900;for(let k=0;k<3;k++){const s=new THREE.Sprite(mN),e=260+r()*380;
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
    B.lanc=[];B.samOn=true;   // (10/11) 3 lançadores SAM: bomba destrói (volta em 90 s); sem nenhum de pé, a base fica sem defesa
    for(const [x,z] of B.lpos){const L=new THREE.Group();L.position.set(x,0,z);g.add(L);box(9,2.2,6,mOl,0,1.1,0,L);
      for(let k=0;k<4;k++){const t=cil(0.7,0.7,7,mOl,k%2?1.6:-1.6,4.6,k<2?1.3:-1.3,L,8);t.rotation.z=-0.75;}
      const q=new THREE.Mesh(G('queim',()=>new THREE.CircleGeometry(16,16)),po(M('#1d1d1d',1)));q.rotation.x=-Math.PI/2;q.position.set(x,0.3,z);q.visible=false;g.add(q);
      B.lanc.push({L,q,vivo:true});}}
  // anéis no mar: zona de combate (amarelo) e alcance dos SAM de cada base (vermelho; o da minha base fica verde)
  const anel=(r,cor,x,z)=>{const m=new THREE.Mesh(new THREE.RingGeometry(r-14,r+14,160),new THREE.MeshBasicMaterial({color:cor,transparent:true,opacity:0.45,depthWrite:false,side:THREE.DoubleSide}));
    m.rotation.x=-Math.PI/2;m.position.set(x,1.5,z);m.visible=false;cena.add(m);return m;};
  BASES.zonaAnel=anel(ZONA,0xffd23a,0,0);for(const B of BASES)B.anel=anel(B.rsam,0xff3b30,B.x,B.z);}
function mostrarBases(){const pvp=SALA==='pvp'||SALA==='treino',sb=salaBases();BASES.zonaAnel.visible=pvp;BASES.zonaAnel.geometry.dispose();BASES.zonaAnel.geometry=new THREE.RingGeometry(ZONA-14,ZONA+14,160);
  for(const B of BASES){B.anel.visible=(pvp||SALA==='bots')&&B.sala===sb&&B.samOn!==false;B.anel.material.color.set(B.i===MINHA_BASE?0x3cd070:0xff3b30);B.g.visible=true;}}
function corBandeiras(l){for(const B of BASES){const d=l.find(x=>x.base===B.i);B.mBand.color.set(d?d.cor:'#888888');B.dono=d||null;}}

// ------------------------------------------------ o caça (o mesmo delta-canard do show do ônibus; nariz em +x, asa direita em +z)
function texCocar(){const c=cv(128,128),g=c.getContext('2d');[['#1f9a3d',62],['#ffd21a',44],['#1f4fb3',27]].forEach(([cor,r])=>{g.fillStyle=cor;g.beginPath();g.arc(64,64,r,0,7);g.fill();});
  g.fillStyle='#fff';g.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?7:17;g.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}g.fill();return tex(c);}
let _mCo=null;
// (10/11) Gripen (STL do Gomes, sem a base, simplificado p/ ~13 mil triângulos: fonte/gripen.json, gerado por scripts/gripen_stl.py)
let GRIPEN=null;
fetch('gripen.json').then(r=>r.json()).then(d=>{const g={cocar:d.cocar};
  for(const [k,x] of Object.entries(d)){if(k==='cocar')continue;const geo=new THREE.BufferGeometry(),v=new Float32Array(x.v.length);for(let i=0;i<v.length;i++)v[i]=x.v[i]/1000;
    geo.setAttribute('position',new THREE.BufferAttribute(v,3));geo.setIndex(x.f);geo.computeVertexNormals();   // normais com a malha inteira (suave)
    if(k==='corpo'){   // pinta por triângulo (sem borrar): 0 = fuselagem, 1 = canopi, 2 = saída do motor
      const f=x.f,cls=[[],[],[]];for(let t=0;t<f.length;t+=3){let cx=0,cy=0,cz=0;for(let n=0;n<3;n++){cx+=v[f[t+n]*3];cy+=v[f[t+n]*3+1];cz+=v[f[t+n]*3+2];}cx/=3;cy/=3;cz/=3;
        const c=cx>2.3&&cx<5.3&&cy>0.5+Math.max(0,cx-4.6)*0.5?1:cx<-6.15?2:0;cls[c].push(f[t],f[t+1],f[t+2]);}
      geo.setIndex([...cls[0],...cls[1],...cls[2]]);geo.addGroup(0,cls[0].length,0);geo.addGroup(cls[0].length,cls[1].length,1);geo.addGroup(cls[0].length+cls[1].length,cls[2].length,2);}
    g[k]=geo;}GRIPEN=g;
  if(JATO&&JATO.userData.antigo){const j=criarJato(JATO.userData.cor);j.position.copy(JATO.position);j.quaternion.copy(JATO.quaternion);j.visible=JATO.visible;cena.remove(JATO);JATO=j;}
  for(const o of OUT.values())if(o.g.userData.antigo){const j=criarJato(o.g.userData.cor);j.visible=o.g.visible;cena.remove(o.g);o.g=j;}}).catch(e=>console.warn('gripen',e));
function criarGripen(cor){const J=new THREE.Group();
  const mG=[new THREE.MeshStandardMaterial({color:new THREE.Color('#8a939c').convertSRGBToLinear(),roughness:0.45,metalness:0.35}),
    new THREE.MeshStandardMaterial({color:new THREE.Color('#1c2a36').convertSRGBToLinear(),roughness:0.08,metalness:0.6}),   // canopi
    new THREE.MeshStandardMaterial({color:new THREE.Color('#3b342e').convertSRGBToLinear(),roughness:0.7,metalness:0.5,side:THREE.DoubleSide})];   // saída do motor (metal queimado)
  const mA=new THREE.MeshStandardMaterial({color:new THREE.Color('#8a939c').convertSRGBToLinear(),roughness:0.45,metalness:0.35,side:THREE.DoubleSide});
  const mC=new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),roughness:0.5,metalness:0.2,side:THREE.DoubleSide});
  const partes=[new THREE.Mesh(GRIPEN.corpo,mG),new THREE.Mesh(GRIPEN.asas,mA),new THREE.Mesh(GRIPEN.canards,mC),new THREE.Mesh(GRIPEN.deriva,mC)];   // deriva e canards na cor do piloto
  for(const m of partes)J.add(m);
  const pc=new THREE.Mesh(G('pc',()=>new THREE.ConeGeometry(0.42,3.2,14,1,true)),new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:0.75,blending:THREE.AdditiveBlending,depthWrite:false}));
  pc.rotation.z=Math.PI/2;pc.position.set(-8.7,0.03,0);J.add(pc);J.userData.pc=pc;   // pós-combustor
  _mCo=_mCo||new THREE.MeshStandardMaterial({map:texCocar(),transparent:true,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-2});
  for(const [x,y,z] of GRIPEN.cocar||[[-3.4,0.09,3],[-3.4,0.09,-3]]){const c=new THREE.Mesh(G('pCo',()=>new THREE.PlaneGeometry(1.5,1.5)),_mCo);c.rotation.x=-Math.PI/2;c.position.set(x,y,z);J.add(c);}   // cocar da FAB nas asas (altura medida no modelo)
  // (10/11) trem de pouso: bequilha no nariz + 2 principais; cada perna gira p/ frente p/ dentro da fuselagem
  const mT=M('#c9ccd0',0.5),mP=M('#1b1b1d',0.9),pernas=[];
  for(const [x,y,z,L,rr] of[[4.3,-0.42,0,0.85,0.2],[-1.6,-0.5,0.85,0.75,0.3],[-1.6,-0.5,-0.85,0.75,0.3]]){const pv=new THREE.Group();pv.position.set(x,y,z);J.add(pv);
    cil(0.06,0.06,L,mT,0,-L/2,0,pv,6);const rd=cil(rr,rr,0.18,mP,0,-L,0,pv,14);rd.rotation.x=Math.PI/2;cil(rr*0.5,rr*0.5,0.2,mT,0,-L,0,pv,8).rotation.x=Math.PI/2;
    pv.userData.y0=y;pernas.push(pv);}
  J.userData.pernas=pernas;J.userData.tremK=-1;
  J.userData.cab=[partes[0],partes[2]];   // na visão da cabine some o corpo (o painel é desenhado por cima)
  J.scale.setScalar(1.25);cena.add(J);return J;}
function poeTrem(J,k){if(!J||!J.userData.pernas||J.userData.tremK===k)return;J.userData.tremK=k;   // k: 1 = baixado, 0 = recolhido
  for(const pv of J.userData.pernas){pv.rotation.z=(1-k)*Math.PI/2;pv.position.y=pv.userData.y0+(1-k)*0.22;pv.visible=k>0.02;}}
function criarJato(cor){if(GRIPEN)return criarGripen(cor);const J0=criarJatoAntigo(cor);J0.userData.antigo=true;J0.userData.cor=cor;return J0;}
function criarJatoAntigo(cor){const J=new THREE.Group(),mG=new THREE.MeshStandardMaterial({color:new THREE.Color('#8a939c').convertSRGBToLinear(),roughness:0.45,metalness:0.35}),mE=M('#4a5058',0.4);
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
    ok(){tom('sine',880,0.12,0.09);setTimeout(()=>tom('sine',1320,0.22,0.09),110);},
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

// ------------------------------------------------ (11/11) queda em chamas, piloto ejetando, rastro de vapor nas pontas das asas
const DESTROCOS=[],PILOTOS=[],FUMOS=[];let MEU_DESTROCO=null;
// avião abatido: a carcaça cai girando, pegando fogo e soltando fumaça; no chão explode, na água espirra e afunda
function queda(g,pos,q,vel,{navio=false,meu=false,esc=1}={}){
  if(DESTROCOS.length>=8){const v=DESTROCOS.shift();cena.remove(v.g);}
  const c=g.clone();c.visible=true;c.position.copy(pos);c.quaternion.copy(q);if(c.userData.pc)c.userData.pc.visible=false;
  c.traverse(m=>{if(m.isMesh&&m.material&&m.material.blending===THREE.AdditiveBlending)m.visible=false;});cena.add(c);
  const D={g:c,pos:pos.clone(),vel:vel.clone(),t:0,tFx:0,navio,esc,
    giro:new V3((Math.random()<0.5?-1:1)*(2+Math.random()*3),(Math.random()-0.5)*0.6,(Math.random()-0.5)*1.2)};
  if(navio){D.vel.set(0,0,0);D.giro.set((Math.random()<0.5?-1:1)*0.25,0,0.12);}
  DESTROCOS.push(D);if(meu)MEU_DESTROCO=D;
  if(!navio&&Math.random()<0.85)ejetar(pos,vel,q);
  return D;}
function passoDestrocos(dt){
  for(const D of [...DESTROCOS]){D.t+=dt;
    if(D.navio){D.g.position.y-=dt*(D.t<2?1.2:3.5);D.g.rotateX(D.giro.x*dt);D.g.rotateZ(D.giro.z*dt);D.pos.copy(D.g.position);
      D.tFx-=dt;if(D.tFx<=0&&D.t<6){D.tFx=0.12;fx(_v1.copy(D.pos).setY(4),0xff8a30,16,0.6,2);fx(_v1.setY(8),0x2a2a2a,26,3,2.5,false,10);}
      if(D.t>9){cena.remove(D.g);DESTROCOS.splice(DESTROCOS.indexOf(D),1);}continue;}
    D.vel.y-=14*dt;D.vel.multiplyScalar(1-0.06*dt);D.pos.addScaledVector(D.vel,dt);D.g.position.copy(D.pos);
    D.g.rotateX(D.giro.x*dt);D.g.rotateY(D.giro.y*dt);D.g.rotateZ(D.giro.z*dt-0.4*dt);   // gira e o nariz vai caindo
    D.tFx-=dt;if(D.tFx<=0){D.tFx=0.09;_v1.set(-3*D.esc,0,0).applyQuaternion(D.g.quaternion).add(D.pos);
      fx(_v1,Math.random()<0.5?0xff7a20:0xffc040,(5+Math.random()*4)*D.esc,0.35,2.2);fx(_v1,0x262626,(10+Math.random()*5)*D.esc,1.8,3.2,false,4);}
    const h=relevo(D.pos.x,D.pos.z);
    if(D.pos.y<=h+1||D.t>30){const agua=h<0.5,perto=D.pos.distanceTo(EU.pos)<900;
      if(agua)espirro(D.pos,D.esc,perto);else{explosao(D.pos.setY(h+2),perto);fumaceira(D.pos,h);for(let i=0;i<10;i++)estilhaco(D.pos);}
      cena.remove(D.g);DESTROCOS.splice(DESTROCOS.indexOf(D),1);if(MEU_DESTROCO===D)MEU_DESTROCO={pos:D.pos.clone(),fim:true};}}}
// água: coluna de espuma branca + anel
function espirro(p,esc=1,perto){const y=0.5;
  for(let i=0;i<14;i++){_v1.set(p.x+(Math.random()-0.5)*14*esc,y+Math.random()*10,p.z+(Math.random()-0.5)*14*esc);fx(_v1,0xf2f8ff,(14+Math.random()*16)*esc,1.6+Math.random(),2.4,false,18+Math.random()*22);}
  for(let k=0;k<16;k++){const a=k/16*Math.PI*2;_v1.set(p.x+Math.cos(a)*18*esc,y+2,p.z+Math.sin(a)*18*esc);fx(_v1,0xe6f2ff,12*esc,1.4,3,false,3);}
  SOM.boom(perto);}
// chão: fogo que fica queimando + coluna de fumaça por um tempo
function fumaceira(p,h){FUMOS.push({p:new V3(p.x,h+3,p.z),t:0,tFx:0});if(FUMOS.length>6)FUMOS.shift();}
function estilhaco(p){const v=new V3((Math.random()-0.5)*60,20+Math.random()*40,(Math.random()-0.5)*60),q=_v2.copy(p);
  for(let k=0;k<5;k++){q.addScaledVector(v,0.08);v.y-=14*0.08;fx(q,0xffa040,3,0.5+k*0.1,1.4);}}
function passoFumos(dt){for(const F of [...FUMOS]){F.t+=dt;F.tFx-=dt;
    if(F.tFx<=0){F.tFx=0.12;_v1.set(F.p.x+(Math.random()-0.5)*8,F.p.y,F.p.z+(Math.random()-0.5)*8);
      if(F.t<5)fx(_v1,0xff8a30,10+Math.random()*6,0.5,1.8);fx(_v1,F.t<5?0x1f1f1f:0x4a4a4a,18+Math.random()*10,4,3.5,false,14);}
    if(F.t>14)FUMOS.splice(FUMOS.indexOf(F),1);}}
// piloto: assento sobe com o foguete, separa e abre o paraquedas
const mPara=new THREE.MeshStandardMaterial({color:new THREE.Color('#ff7a1a').convertSRGBToLinear(),roughness:0.8,side:THREE.DoubleSide});
function ejetar(pos,vel,q){if(PILOTOS.length>=6){const v=PILOTOS.shift();cena.remove(v.g);}
  const g=new THREE.Group(),up=_v3.set(0,1,0).applyQuaternion(q);
  const corpo=new THREE.Group();g.add(corpo);box(0.5,0.9,0.4,M('#4b5a3a',0.9),0,0,0,corpo);const cab=cil(0.16,0.16,0.3,M('#e8e8e8',0.4),0,0.6,0,corpo,8);
  const pq=new THREE.Group();pq.visible=false;g.add(pq);
  const dom=new THREE.Mesh(G('para',()=>new THREE.SphereGeometry(4,14,6,0,Math.PI*2,0,Math.PI/2)),mPara);dom.position.y=6;dom.scale.y=0.55;pq.add(dom);
  for(const [x,z] of[[3.6,0],[-3.6,0],[0,3.6],[0,-3.6]]){const L=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new V3(0,0.5,0),new V3(x,6.1,z)]),new THREE.LineBasicMaterial({color:0xdddddd}));pq.add(L);}
  g.position.copy(pos).addScaledVector(up,3);cena.add(g);
  PILOTOS.push({g,pq,vel:vel.clone().multiplyScalar(0.35).addScaledVector(up,45),t:0,aberto:false,deriva:new V3((Math.random()-0.5)*3,0,(Math.random()-0.5)*3)});}
function passoPilotos(dt){for(const P of [...PILOTOS]){P.t+=dt;
    if(!P.aberto){P.vel.y-=14*dt;P.vel.multiplyScalar(1-0.6*dt);if(P.t<0.35)fx(_v1.copy(P.g.position).y-=1,0xffc060,3,0.3,1.5);if(P.t>1.6){P.aberto=true;P.pq.visible=true;P.pq.scale.setScalar(0.2);}}
    else{P.vel.lerp(_v1.set(P.deriva.x,-6,P.deriva.z),1-Math.exp(-2*dt));const s=Math.min(1,P.pq.scale.x+dt*2.5);P.pq.scale.setScalar(s);P.g.rotation.z=Math.sin(P.t*1.3)*0.08;}
    P.g.position.addScaledVector(P.vel,dt);const h=relevo(P.g.position.x,P.g.position.z);
    if(P.g.position.y<h+0.6||P.t>90){if(h<0.5&&P.g.position.distanceTo(EU.pos)<2500)fx(_v1.copy(P.g.position).setY(1),0xf2f8ff,6,1,2,false,4);cena.remove(P.g);PILOTOS.splice(PILOTOS.indexOf(P),1);}}}
// rastro de vapor nas pontas das asas: aparece em curva fechada (G alto) e em alta velocidade
const N_TR=44,mTrilha=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,
  vertexShader:'attribute float alfa;varying float vA;void main(){vA=alfa;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader:'varying float vA;void main(){gl_FragColor=vec4(1.0,1.0,1.0,vA);}'});
const _idxTr=(()=>{const a=[];for(let i=0;i<N_TR-1;i++){const k=i*2;a.push(k,k+1,k+2,k+1,k+3,k+2);}return a;})();
function novaFita(){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(new Float32Array(N_TR*6),3));g.setAttribute('alfa',new THREE.BufferAttribute(new Float32Array(N_TR*2),1));
  g.setIndex(_idxTr);const m=new THREE.Mesh(g,mTrilha);m.frustumCulled=false;cena.add(m);return{m,a:new Float32Array(N_TR),cheia:false};}
const TRILHAS=new Map(),_fwAnt=new Map(),PONTA=[new V3(-4.76,-0.12,4.59),new V3(-4.76,-0.12,-4.59)];
function intensidadeG(chave,q,vel,dt){const fw=frente(q,_v3).clone(),ant=_fwAnt.get(chave);_fwAnt.set(chave,fw);if(!ant||dt<=0)return 0;
  const g=Math.acos(Math.min(1,fw.dot(ant)))/dt*vel/9.8;return Math.max(0,Math.min(1,(g-2.2)/3.5))+Math.max(0,Math.min(0.6,(vel-205)/40));}
function rastroAsa(chave,g,pos,q,vel,vivo,esc,dt){let T=TRILHAS.get(chave);if(!T){T={f:[novaFita(),novaFita()],k:0};TRILHAS.set(chave,T);}
  const alvo=vivo?Math.min(1,intensidadeG(chave,q,vel,dt)):0;T.k+=(alvo-T.k)*Math.min(1,dt*6);
  const up=_v4.set(0,1,0).applyQuaternion(q);
  T.f.forEach((F,lado)=>{const P=F.m.geometry.attributes.position.array,A=F.m.geometry.attributes.alfa.array;
    P.copyWithin(6,0,(N_TR-1)*6);F.a.copyWithin(1,0,N_TR-1);
    _v1.copy(PONTA[lado]).multiplyScalar(1.25*esc).applyQuaternion(q).add(pos);
    if(!F.cheia){for(let i=0;i<N_TR;i++){P.set([_v1.x,_v1.y,_v1.z,_v1.x,_v1.y,_v1.z],i*6);}F.cheia=true;}
    const w=0.18*esc;P.set([_v1.x+up.x*w,_v1.y+up.y*w,_v1.z+up.z*w,_v1.x-up.x*w,_v1.y-up.y*w,_v1.z-up.z*w],0);F.a[0]=T.k*0.55;
    for(let i=0;i<N_TR;i++){const a=F.a[i]*(1-i/N_TR);A[i*2]=A[i*2+1]=a;}
    F.m.geometry.attributes.position.needsUpdate=true;F.m.geometry.attributes.alfa.needsUpdate=true;F.m.visible=T.k>0.01||F.a.some(x=>x>0.01);});}
function trilhas(dt){if(JATO)rastroAsa('eu',JATO,EU.pos,EU.q,EU.vel,EU.vivo&&!EU.solo,1,dt);
  for(const [id,o] of OUT){if(o.navio)continue;rastroAsa(id,o.g,o.pos,o.q,o.vel.length(),o.vivo,o.esc||1,dt);}
  for(const [k,T] of TRILHAS)if(k!=='eu'&&!OUT.has(k)){for(const F of T.f){cena.remove(F.m);F.m.geometry.dispose();}TRILHAS.delete(k);_fwAnt.delete(k);}}
function efeitosQueda(dt){passoDestrocos(dt);passoPilotos(dt);passoFumos(dt);trilhas(dt);}
function fx(p,cor,tam,dur,cresce,aditivo=true,sobe=0){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:aditivo?texBrilho():texFumo(),color:cor,transparent:true,depthWrite:false,blending:aditivo?THREE.AdditiveBlending:THREE.NormalBlending}));
  s.position.copy(p);s.scale.setScalar(tam);cena.add(s);FX.push({s,t:0,dur,tam,cresce,sobe});}
function explosao(p,perto){for(let i=0;i<10;i++){_v1.set(Math.random()-0.5,Math.random()-0.5,Math.random()-0.5).multiplyScalar(26).add(p);fx(_v1,i<6?0xffb040:0xffe9a0,18+Math.random()*16,0.5+Math.random()*0.5,3);}
  for(let i=0;i<8;i++){_v1.set(Math.random()-0.5,Math.random()-0.3,Math.random()-0.5).multiplyScalar(30).add(p);fx(_v1,0x3a3a3a,20,2.4+Math.random(),2.5,false,8);}
  SOM.boom(perto);}
function efeitos(dt){for(let i=FX.length-1;i>=0;i--){const f=FX[i];f.t+=dt;const u=f.t/f.dur;if(u>=1){cena.remove(f.s);f.s.material.dispose();FX.splice(i,1);continue;}
  f.s.scale.setScalar(f.tam*(1+u*f.cresce));f.s.material.opacity=(1-u)*(f.s.material.blending===THREE.AdditiveBlending?1:0.7);f.s.position.y+=f.sobe*dt;if(f.vel){f.s.position.addScaledVector(f.vel,dt);f.vel.y-=9*dt;}}}

// ------------------------------------------------ estado
const EU={id:0,cor:'#ffd23a',nome:'',pos:new V3(),q:new QT(),vel:130,vida:100,vivo:false,turbo:1,mortoEm:0,porQuem:null,fora:0,
  trem:0,tremAlvo:0,acel:1,yawSolo:0,tParado:0,reab:false};   // (10/11) trem 0..1 (anima), acel = manete 0..1 (W/S)
let JATO=null;   // meu caça
const OUT=new Map();   // id -> {g,pos,vel,q,alvoP,alvoQ,tRec,vida,vivo,nome,cor,bot,rot}
const MISV=new Map();   // mísseis em voo (o servidor simula; aqui só desenha): id -> {g,pos,alvoP,vel,tRec,alvo,tFumo}
const TRAVA={id:0,t:0,beep:0};let BALAS_N=-1,misAnt=false,bombAnt=false,BOMBAS=4,tBomba=0,MUN=2,flarePronto=0,tAlarme=0,tMissilLoc=0;
let PLACAR=[],ws=null,conectado=false,jogando=false,tEnvio=0,proxTiro=0,ladoArma=1,tAcerto=0;
const _v1=new V3(),_v2=new V3(),_v3=new V3(),_v4=new V3(),_f=new V3(),_u=new V3(),_r=new V3(),_dq=new QT(),_eu=new THREE.Euler();

// ------------------------------------------------ entrada: teclado + joystick flutuante + botões
const TEC={};
let TOQUE_B=false;   // toque rápido no B não se perde entre quadros
addEventListener('keydown',e=>{if(e.code==='Escape'&&jogando){sair();return;}if(e.code==='KeyB'&&!e.repeat)TOQUE_B=true;if(e.code==='KeyG'&&!e.repeat&&jogando)trocaTrem();if(e.code==='KeyV'&&jogando&&!e.repeat)trocaVisao();TEC[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&jogando)e.preventDefault();});
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
const BT={fogo:false,turbo:false,missil:false,flare:false,freio:false,bomba:false};
// (10/11) leme no celular: barra à direita, perto dos botões; arrasta p/ os lados e volta ao centro ao soltar
const LEME={id:null,x:0};
{const l=$('#leme'),k=$('#lemeK');
  const mexe=e=>{const b=l.getBoundingClientRect(),m=(b.width-44)/2;let dx=e.clientX-(b.left+b.width/2);dx=Math.max(-m,Math.min(m,dx));LEME.x=dx/m;k.style.transform=`translateX(${dx}px)`;};
  l.addEventListener('pointerdown',e=>{if(LEME.id!==null)return;LEME.id=e.pointerId;l.setPointerCapture(e.pointerId);l.classList.add('on');mexe(e);});
  l.addEventListener('pointermove',e=>{if(e.pointerId===LEME.id)mexe(e);});
  const solta=e=>{if(e.pointerId!==LEME.id)return;LEME.id=null;LEME.x=0;k.style.transform='';l.classList.remove('on');};
  l.addEventListener('pointerup',solta);l.addEventListener('pointercancel',solta);}
for(const [id,ch] of [['#bFogo','fogo'],['#bTurbo','turbo'],['#bMissil','missil'],['#bFlare','flare'],['#bFreio','freio'],['#bBomba','bomba']]){const b=$(id);
  b.addEventListener('pointerdown',e=>{BT[ch]=true;b.classList.add('on');b.setPointerCapture(e.pointerId);});
  for(const ev of['pointerup','pointercancel'])b.addEventListener(ev,()=>{BT[ch]=false;b.classList.remove('on');});}
function entrada(){const inv=$('#inverter').checked?1:-1;   // (09/11) padrão de avião: empurrar p/ cima = nariz desce
  let p=0,r=0,y=0;
  if(TEC.ArrowUp)p+=1;if(TEC.ArrowDown)p-=1;   // (10/11) W/S agora é a manete (acelera/desacelera)
  if(TEC.ArrowLeft)r-=1;if(TEC.ArrowRight)r+=1;
  if(TEC.KeyA)y+=1;if(TEC.KeyD)y-=1;   // (10/11) leme: A esquerda, D direita (girar asas fica nas setas ← →)
  // joystick: curva suave perto do centro (ajuda a mirar)
  const cx=Math.sign(JOY.x)*JOY.x*JOY.x,cy=Math.sign(JOY.y)*JOY.y*JOY.y;
  p-=cy;r+=cx;y-=cx*0.35;y-=LEME.x;   // leme: direita = nariz p/ direita
  return{p:Math.max(-1,Math.min(1,p))*inv,r:Math.max(-1,Math.min(1,r)),y,fogo:!!(TEC.Space||TEC.KeyJ||BT.fogo),turbo:!!(TEC.ShiftLeft||TEC.ShiftRight||BT.turbo),missil:!!(TEC.KeyF||TEC.KeyR||BT.missil),flare:!!(TEC.KeyX||TEC.KeyC||BT.flare),freio:!!(TEC.KeyE||BT.freio),bomba:!!(TEC.KeyB||BT.bomba||TOQUE_B),ac:(TEC.KeyW?1:0)-(TEC.KeyS?1:0)};}

// ------------------------------------------------ voo (modelo arcade) e tiro
function frente(q,v=_f){return v.set(1,0,0).applyQuaternion(q);}
let ULT_I=null;const VSTALL=62,VMIN=34;   // (10/11) stall abaixo de ~223 km/h; com o freio (E) dá p/ chegar perto de 120 km/h
// (10/11) decolagem: nasce parado na cabeceira da pista; acelera sozinho (turbo acelera mais), com 230 km/h puxa o manche e sobe.
// Se ninguém puxar, a 360 km/h o avião levanta o nariz sozinho (no celular ninguém bate no fim da pista).
// (10/11) no chão (decolagem e pouso): manete W/S (turbo acelera mais), freio E/🪂 (ou S com a manete zerada), leme/manche esterçam a bequilha.
// Com 230 km/h puxa o manche e sobe; com a manete cheia, a 360 km/h o nariz sobe sozinho (no celular ninguém bate no fim da pista).
function emPlano(x,z){return BASES.some(B=>Math.hypot(x-B.x,z-B.z)<BASE_PLANO+150);}   // pátio/pista das bases: único chão onde dá p/ pousar
function trocaTrem(){if(!EU.vivo||EU.solo)return;EU.tremAlvo=EU.tremAlvo?0:1;SOM.trava(EU.tremAlvo>0);}   // no chão a trava de peso nas rodas não deixa recolher
function rolar(dt,I){
  const turbo=I.turbo&&EU.turbo>0.02,freio=I.freio||(I.ac<0&&EU.acel<=0.01);
  EU.vel=Math.max(0,Math.min(200,EU.vel+((turbo?30:18*EU.acel)-(freio?14:EU.acel<0.05?6:EU.vel>1?1.2:0))*dt));   // manete zerada = freio automático
  if(turbo)EU.turbo=Math.max(0,EU.turbo-0.28*dt);
  const est=(I.y-I.r)*0.55*Math.min(1,EU.vel/8)*(EU.vel>60?0.35:1);EU.yawSolo+=est*dt;   // esterçar no chão
  const podeSubir=EU.vel>=64;let alvoArf=0;
  if(podeSubir&&(I.p>0.2||(EU.vel>=100&&(EU.acel>0.9||turbo))))alvoArf=0.22;
  EU.arf+=(alvoArf-EU.arf)*Math.min(1,dt*2.5);
  EU.q.setFromAxisAngle(_v1.set(0,1,0),EU.yawSolo).multiply(_dq.setFromAxisAngle(_v2.set(0,0,1),EU.arf));
  const fw=frente(EU.q);EU.pos.addScaledVector(fw,EU.vel*dt);
  const h=relevo(EU.pos.x,EU.pos.z),chao=h+1.9;
  if(EU.pos.y<chao-0.5&&EU.pos.y<chao-3){morrer(null,true);return;}   // bateu num morro
  if(EU.pos.y<chao)EU.pos.y=chao;
  if(EU.pos.y<chao+0.6&&h<0.5){morrer(null,true);return;}   // rolou p/ dentro do mar
  if(EU.pos.y>chao+8){EU.solo=false;$('#dicaDec').style.display='none';}   // decolou: daqui em diante é voo normal
  // parado na pista: reabastece (sala sem bots: só na própria base; tutorial: em qualquer base)
  if(EU.vel<3){EU.tParado+=dt;const B=BASES[MINHA_BASE];const casa=B&&Math.hypot(EU.pos.x-B.x,EU.pos.z-B.z)<800;
    if(EU.tParado>2.5&&!EU.reab&&(SALA==='treino'||(SALA==='pvp'&&casa))){EU.reab=true;
      if(SALA==='treino')reabastecido();else envia({t:'reabastecer'});}}else{EU.tParado=0;if(EU.vel>20)EU.reab=false;}
  JATO.position.copy(EU.pos);JATO.quaternion.copy(EU.q);JATO.userData.pc.visible=turbo;JATO.userData.pc.scale.y=0.8+Math.random()*0.4;
  SOM.motor(EU.vel,turbo,true);}
// (10/11) corredor de aproximação: anéis verdes numa rampa de 4° até a cabeceira da pista da minha base (com trem baixado)
const ILS={aneis:[],base:-1};
{const mI=new THREE.MeshBasicMaterial({color:0x3cd070,transparent:true,opacity:0.5,fog:false,depthWrite:false});
  for(let k=0;k<9;k++){const m=new THREE.Mesh(G('ils',()=>new THREE.TorusGeometry(34,2.2,8,32)),mI.clone());m.visible=false;cena.add(m);ILS.aneis.push(m);}}
function atualizaILS(){const B=BASES[MINHA_BASE],on=B&&(SALA==='pvp'||SALA==='treino'||SALA==='bots')&&EU.vivo&&!EU.solo&&EU.tremAlvo===1&&Math.hypot(EU.pos.x-B.x,EU.pos.z-B.z)<10000;
  ILS.aneis.forEach((m,k)=>{if(!on){m.visible=false;return;}const s=350+k*450,x=B.x-B.dx*(PISTA/2+s-250),z=B.z-B.dz*(PISTA/2+s-250);
    m.position.set(x,BASE_H+6+s*Math.tan(4*Math.PI/180),z);m.lookAt(x+B.dx,m.position.y,z+B.dz);m.visible=true;
    const d=Math.hypot(EU.pos.x-x,EU.pos.z-z);m.material.opacity=d<300?0.15:0.5;});}
function reabastecido(){EU.vida=100;MUN=2;BOMBAS=4;if(BALAS_N>=0)BALAS_N=500;EU.turbo=1;SOM.ok();
  const div=document.createElement('div');div.innerHTML='🔧 reabastecido: vida, mísseis e bombas cheios!';$('#feed').prepend(div);setTimeout(()=>div.remove(),3500);}
// toque no chão vindo do ar: com trem baixado, no pátio/pista, descendo devagar, asas niveladas e até ~340 km/h = pouso; senão, acidente
function tocou(fw,up){const vy=fw.y*EU.vel;
  if(EU.trem>0.98&&emPlano(EU.pos.x,EU.pos.z)&&vy>-12&&up.y>0.75&&fw.y>-0.22&&fw.y<0.45&&EU.vel<115){   // (10/11) tolerante: arcade
    EU.solo=true;EU.yawSolo=Math.atan2(-fw.z,fw.x);EU.q.setFromAxisAngle(_v1.set(0,1,0),EU.yawSolo);EU.arf=Math.max(0,Math.asin(fw.y));EU.pos.y=relevo(EU.pos.x,EU.pos.z)+1.9;EU.acel=0;EU.stall=0;EU.tParado=0;
    SOM.dor();fx(_v1.copy(EU.pos).setY(EU.pos.y-1.5),0xdddddd,10,1.2,3,false,2);
    const div=document.createElement('div');div.innerHTML=`🛬 pouso! descendo a ${(-vy).toFixed(1)} m/s ${-vy<2.5?'— manteiga 🧈':''}`;$('#feed').prepend(div);setTimeout(()=>div.remove(),3000);return true;}
  return false;}
function voar(dt){const I=entrada();ULT_I=I;
  EU.acel=Math.max(0,Math.min(1,EU.acel+I.ac*0.6*dt));   // manete
  if(EU.solo){rolar(dt,I);return;}
  const fw=frente(EU.q),up=_u.set(0,1,0).applyQuaternion(EU.q),dir=_r.set(0,0,1).applyQuaternion(EU.q);
  // (10/11) stall: abaixo de VSTALL os comandos perdem força, o nariz cai sozinho e o avião afunda; abaixar o nariz recupera
  const stall=Math.max(0,Math.min(1,(VSTALL-EU.vel)/(VSTALL-VMIN))),aut=1-0.7*stall;
  let roll=I.r*2.5*aut;if(Math.abs(I.r)<0.1&&up.y>0)roll+=dir.y*1.4*aut;   // sem comando, nivela as asas sozinho
  _dq.setFromEuler(_eu.set(roll*dt,I.y*0.75*aut*dt,I.p*1.3*aut*dt,'XYZ'));EU.q.multiply(_dq).normalize();
  if(stall>0){_v1.crossVectors(fw,_v2.set(0,-1,0));const s=_v1.length();   // gira o nariz p/ baixo (em torno do eixo horizontal)
    if(s>1e-3)EU.q.premultiply(_dq.setFromAxisAngle(_v1.multiplyScalar(1/s),Math.min(Math.acos(Math.max(-1,-fw.y)),(0.4+1.4*stall)*dt))).normalize();}
  const turbo=I.turbo&&!I.freio&&EU.turbo>0.02;EU.turbo=Math.max(0,Math.min(1,EU.turbo+(turbo?-0.28:0.12)*dt));
  let alvo=I.freio?45:turbo?215:45+EU.acel*90;if(EU.trem>0.3&&!I.freio)alvo=Math.min(alvo,turbo?150:88);   // trem baixado = arrasto (≈ 320 km/h: já é velocidade de pouso)
  EU.vel+=(alvo-EU.vel)*Math.min(1,dt*(I.freio?0.7:0.9))-fw.y*32*dt;EU.vel=Math.max(VMIN,Math.min(260,EU.vel));
  EU.pos.addScaledVector(fw,EU.vel*dt);EU.pos.y-=stall*38*dt;EU.stall=stall;
  JATO.position.copy(EU.pos);JATO.quaternion.copy(EU.q);JATO.userData.pc.visible=turbo;JATO.userData.pc.scale.y=0.8+Math.random()*0.4;
  // colisão com mar/ilha e limite da arena
  if(EU.trem>0.98&&!I.turbo){const hP=EU.pos.y-relevo(EU.pos.x,EU.pos.z);   // (10/11) ajuda no pouso: abaixo de 15 m sobre a base, arredonda e nivela sozinho
    if(hP<15&&emPlano(EU.pos.x,EU.pos.z)){const k=1-hP/15,fyA=-(1.5+hP*0.45)/Math.max(EU.vel,40);   // desce cada vez mais devagar: ~1,5 m/s no toque
      if(fw.y<fyA)EU.q.multiply(_dq.setFromAxisAngle(_v2.set(0,0,1),Math.min(1.2*dt,fyA-fw.y)));
      if(Math.abs(dir.y)>0.02)EU.q.multiply(_dq.setFromAxisAngle(_v2.set(1,0,0),dir.y*2.5*k*dt));EU.q.normalize();frente(EU.q,fw);up.set(0,1,0).applyQuaternion(EU.q);}}
  if(EU.pos.y<relevo(EU.pos.x,EU.pos.z)+(EU.trem>0.98?1.9:3)){if(tocou(fw,up))return;morrer(null,true);return;}
  const rh=Math.hypot(EU.pos.x,EU.pos.z);EU.fora=rh>LIMITE||EU.pos.y>4500?EU.fora+dt:0;
  const hSolo=EU.pos.y-relevo(EU.pos.x,EU.pos.z),tremAv=EU.tremAlvo===0&&hSolo<120&&EU.vel<100&&fw.y<0&&emPlano(EU.pos.x,EU.pos.z);
  let aviso=EU.stall>0?'⚠️ STALL! Abaixe o nariz e acelere':tremAv?'⚠️ TREM RECOLHIDO! Aperte G / 🛞':EU.fora>0?'⚠️ Volte para a área de combate!':'';
  if((SALA==='pvp'||SALA==='bots')&&(!aviso||EU.stall>0))for(const B of BASES){if(B.i===MINHA_BASE||!B.samOn||B.sala!==SALA||(SALA==='bots'&&!B.dono))continue;const d=Math.hypot(EU.pos.x-B.x,EU.pos.z-B.z);
    if(d<B.rsam){aviso='🛡️ DEFESA ANTIAÉREA INIMIGA! Saia já';break;}if(d<B.rsam+700)aviso='⚠️ Perto da base inimiga';}
  if(SALA==='bots'&&!aviso&&BALAS_N>=0&&(BALAS_N===0||(BALAS_N<100&&MUN===0)))aviso=BALAS_N===0?'⛽ SEM MUNIÇÃO! Rasante na sua base (abaixo de 130 m)':'⛽ Munição acabando — rasante na sua base';
  const av=$('#aviso');av.style.display=aviso?'block':'none';if(av.textContent!==aviso)av.textContent=aviso;
  if(EU.fora>6){morrer(null,true);return;}
  if(I.fogo&&performance.now()>=proxTiro&&BALAS_N!==0){proxTiro=performance.now()+80;atirar(fw);if(BALAS_N>0)BALAS_N--;}
  travar(dt,fw);
  if(I.missil&&!misAnt&&TRAVA.t>=1&&MUN>0&&performance.now()>tMissilLoc){tMissilLoc=performance.now()+400;if(SALA==='treino')treinoMissil(TRAVA.id);else envia({t:'missil',alvo:TRAVA.id});}misAnt=I.missil;   // um por toque
  if(I.flare&&performance.now()>flarePronto){flarePronto=performance.now()+500;if(SALA==='treino')treinoFlare();else envia({t:'flare'});}
  if(I.bomba&&!bombAnt&&BOMBAS>0&&performance.now()>tBomba){tBomba=performance.now()+300;   // (10/11) bomba: uma por toque
    const p=_v1.set(0,-2.5,0).applyQuaternion(EU.q).add(EU.pos),v=_v2.copy(fw).multiplyScalar(EU.vel);v.y-=3;
    if(SALA==='treino'){BOMBAS--;soltaBomba(--TREINO.idB,p,v,true);}else envia({t:'bomba',p:arr(p,1),v:arr(v,1)});}
  bombAnt=I.bomba&&!TOQUE_B;TOQUE_B=false;
  SOM.motor(EU.vel,turbo,true);}
function atirar(fw){ladoArma=-ladoArma;
  const boca=_v2.set(3,-0.2,ladoArma*1.1).multiplyScalar(1.25).applyQuaternion(EU.q).add(EU.pos);
  // (11/11) sem mira assistida: a rajada sai reta do nariz — quem compensa é o piloto, com a mira de compensação (◇)
  const dir=_v3.copy(fw);
  const v=_v1.copy(dir).multiplyScalar(VEL_BALA).addScaledVector(fw,EU.vel);
  bala(boca,v,true);SOM.tiro(false);
  envia({t:'tiro',p:arr(boca,1),d:arr(dir,3)});}
function balas(dt){for(const b of BALAS){if(!b.ativa)continue;b.t+=dt;b.ant.copy(b.p);b.p.addScaledVector(b.v,dt);b.m.position.copy(b.p);
  if(b.t>VIDA_BALA){b.ativa=false;b.m.visible=false;continue;}
  if(b.p.y<relevo(b.p.x,b.p.z)){b.ativa=false;b.m.visible=false;if(b.minha&&b.p.distanceTo(EU.pos)<900)fx(b.p,0xffffff,6,0.4,2,false);continue;}
  if(!b.minha)continue;
  for(const [id,o] of OUT){if(!o.vivo||o.aliado)continue;if(distSeg(o.navio?_v4.copy(o.pos).setY(8):o.pos,b.ant,b.p)<(o.navio?24:10*(o.esc||1))){b.ativa=false;b.m.visible=false;if(id<0)treinoAcerto(id,o);else envia({t:'acerto',alvo:id});
    fx(b.p,0xffd070,7,0.25,2);SOM.acerto();tAcerto=0.15;break;}}}}
function distSeg(c,a,b){_v1.subVectors(b,a);const l2=_v1.lengthSq()||1;let t=_v2.subVectors(c,a).dot(_v1)/l2;t=Math.max(0,Math.min(1,t));return _v2.copy(a).addScaledVector(_v1,t).distanceTo(c);}
const arr=(v,d)=>{const k=10**d;return[Math.round(v.x*k)/k,Math.round(v.y*k)/k,Math.round(v.z*k)/k];};

// ------------------------------------------------ mísseis: trava (1 s com o alvo na frente), desenho, rastro e flares
function travar(dt,fw){let melhor=null,mc=Math.cos(22*Math.PI/180);
  for(const [id,o] of OUT){if(!o.vivo||o.aliado||o.navio)continue;_v1.subVectors(o.pos,EU.pos);const d=_v1.length();if(d>2800)continue;const c=_v1.dot(fw)/d;if(c>mc){mc=c;melhor=id;}}
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

// ------------------------------------------------ (10/11) bombas: queda balística igual à do servidor; quem soltou avisa onde bateu
const G_BOMBA=14,ARRASTO_BOMBA=0.04,BOMBV=new Map();
const mBomba=M('#4b5320',0.6);
function criarBomba(){const g=new THREE.Group();const c=cil(0.45,0.45,2.6,mBomba,0,0,0,g,10);c.rotation.z=Math.PI/2;const n=esf(0.45,mBomba,1.3,0,0,g,1.5,1,1);
  for(let i=0;i<4;i++){const a=box(0.7,0.05,1.3,M('#3a3f1a',0.6),-1.3,0,0,g);a.rotation.x=i*Math.PI/4;}g.scale.setScalar(1.3);cena.add(g);return g;}
function soltaBomba(id,p,v,minha){const b={g:criarBomba(),p:new V3().copy(p),v:new V3().copy(v),minha,tU:performance.now()};BOMBV.set(id,b);if(p.distanceTo(EU.pos)<600)SOM.flare();}
function passoBomba(p,v,dt){v.y-=G_BOMBA*dt;const k=1-ARRASTO_BOMBA*dt;v.x*=k;v.z*=k;p.addScaledVector(v,dt);}
function bombas(){const agora=performance.now();for(const [id,b] of BOMBV){let tr=Math.min(2,(agora-b.tU)/1000);b.tU=agora;   // relógio real (igual ao servidor), mesmo com o celular lento
    while(tr>0){const h=Math.min(0.05,tr);passoBomba(b.p,b.v,h);tr-=h;}b.g.position.copy(b.p);b.g.quaternion.setFromUnitVectors(_x,_v2.copy(b.v).normalize());
    const chao=relevo(b.p.x,b.p.z);if(b.p.y>chao)continue;
    b.p.y=chao;cena.remove(b.g);BOMBV.delete(id);(window.JJ.impactos||(window.JJ.impactos=[])).push([Math.round(b.p.x),Math.round(b.p.z)]);const perto=b.p.distanceTo(EU.pos)<1200;explosao(b.p,perto);
    if(chao<1)for(let i=0;i<8;i++){_v1.set((Math.random()-0.5)*30,2,(Math.random()-0.5)*30).add(b.p);fx(_v1,0xffffff,26,1.6,2.5,false,26);}   // coluna d'água
    else for(let i=0;i<6;i++){_v1.set((Math.random()-0.5)*40,4,(Math.random()-0.5)*40).add(b.p);fx(_v1,0x6b5a3a,28,2.2,2.5,false,10);}   // terra
    if(b.minha){if(SALA==='treino')treinoBomba(b.p);else envia({t:'impacto',id,p:arr(b.p,1)});}}}
// CCIP: onde a bomba cairia se soltasse agora (anel no chão)
const ccip=new THREE.Mesh(new THREE.RingGeometry(20,28,32),new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true,opacity:0.85,depthWrite:false,depthTest:false,fog:false,side:THREE.DoubleSide}));
ccip.rotation.x=-Math.PI/2;ccip.renderOrder=5;ccip.visible=false;cena.add(ccip);
{const c=new THREE.Mesh(new THREE.CircleGeometry(5,12),ccip.material);c.position.z=0.01;ccip.add(c);}
const _cp=new V3(),_cv=new V3();
function mostraCcip(){ccip.visible=false;if(!EU.vivo||EU.solo||BOMBAS<=0||EU.pos.y>3000||EU.tremAlvo)return;   // com trem baixado (pousando) não mostra
  if(frente(EU.q,_v3).y>-0.05&&!(SALA==='treino'&&TREINO.barcos.length))return;   // só aparece com o nariz um pouco p/ baixo (ou no treino de bombardeio)
  _cp.set(0,-2.5,0).applyQuaternion(EU.q).add(EU.pos);_cv.copy(frente(EU.q,_v3)).multiplyScalar(EU.vel);_cv.y-=3;
  for(let i=0;i<200;i++){passoBomba(_cp,_cv,0.1);if(_cp.y<450){const h=relevo(_cp.x,_cp.z);if(_cp.y<=h){
    const d=_cp.distanceTo(EU.pos);if(d>5000)return;ccip.position.set(_cp.x,h+1.5,_cp.z);ccip.scale.setScalar(Math.max(1,d/700));ccip.visible=true;return;}}}}
function recebeSams(l){l.forEach((base,i)=>{const B=BASES[i];if(!B)return;base.forEach((v,k)=>{const Lc=B.lanc[k];if(!Lc)return;const vivo=!!v;
    if(Lc.vivo&&!vivo){Lc.L.getWorldPosition(_v1);explosao(_v1,_v1.distanceTo(EU.pos)<1500);}Lc.vivo=vivo;Lc.L.visible=vivo;Lc.q.visible=!vivo;});
  B.samOn=B.lanc.some(x=>x.vivo);B.anel.visible=(SALA==='pvp'||SALA==='bots')&&B.sala===salaBases()&&B.samOn;});}

// ------------------------------------------------ morte / renascer
function morrer(porQuem,caiu,arma){if(!EU.vivo)return;EU.vivo=false;EU.solo=false;EU.mortoEm=performance.now();EU.porQuem=porQuem;JATO.visible=false;explosao(EU.pos,true);
  MEU_DESTROCO=null;if(!caiu)queda(JATO,EU.pos,EU.q,frente(EU.q,_v3).multiplyScalar(EU.vel).clone(),{meu:true});else{const h=relevo(EU.pos.x,EU.pos.z);if(h<0.5)espirro(EU.pos,1,true);else fumaceira(EU.pos,h);}
  if(caiu)envia({t:'caiu'});SOM.motor(0,false,false);$('#dicaDec').style.display='none';$('#aviso').style.display='none';
  const m=$('#morte');m.style.display='block';KC=null;document.body.classList.add('morto');
  if(SALA==='live'&&porQuem&&OUT.get(porQuem.id)){const o=OUT.get(porQuem.id);KC={id:porQuem.id,ate:performance.now()+4400};
    m.innerHTML=`<div class="kc">${avHTML(porQuem.av,porQuem.nome,'g')}<div><div class="kcN" style="color:${porQuem.cor}">${esc(porQuem.nome)}</div>`+
      `<div class="kcT">${o.navio?'🚢 te afundou na metralhadora!':arma==='missil'?'🚀 te pegou de míssil!':'🔥 te derrubou!'} 💀</div>`+
      `<div class="kcC">🎯 ${KH_ULT||1}× em você nesta live</div></div></div>`+liveTop();return;}
  m.innerHTML=(caiu?'💥 Você caiu!':arma==='sam'?'🛡️ Abatido pela defesa antiaérea!':'💥 Abatido por <span style="color:'+(porQuem?.cor||'#fff')+'">'+esc(porQuem?.nome||'?')+'</span>')+'<small>'+(SALA==='pvp'?'voltando para a pista…':'renascendo…')+'</small>'+liveTop();}
function nascer(){KC=null;MEU_DESTROCO=null;document.body.classList.remove('morto');EU.vel=140;EU.solo=false;EU.stall=0;EU.acel=1;EU.tParado=0;EU.reab=false;EU.trem=EU.tremAlvo=0;EU.arf=0;
  if(SALA==='treino'&&TREINO.passo>=2){const B=BASES[0];   // tutorial: depois da decolagem, volta já no ar, perto da base
    EU.pos.set(B.x+B.dx*1800,900,B.z+B.dz*1800);EU.q.setFromAxisAngle(_v1.set(0,1,0),B.yaw);}
  else if((SALA==='pvp'||SALA==='treino'||SALA==='bots')&&MINHA_BASE!==null){const B=BASES[MINHA_BASE];   // (10/11) salas com base: sempre na cabeceira da pista da minha base
    EU.pos.set(B.x-B.dx*(PISTA/2-50),BASE_H+1.9,B.z-B.dz*(PISTA/2-50));EU.q.setFromAxisAngle(_v1.set(0,1,0),B.yaw);EU.vel=0;EU.solo=true;EU.yawSolo=B.yaw;EU.trem=EU.tremAlvo=1;$('#dicaDec').style.display=SALA==='treino'?'none':'block';}
  else{const a=Math.random()*Math.PI*2,r=2200+Math.random()*1200;EU.pos.set(Math.cos(a)*r,700+Math.random()*400,Math.sin(a)*r);
    const yaw=Math.atan2(EU.pos.z,-EU.pos.x);EU.q.setFromAxisAngle(_v1.set(0,1,0),yaw);}   // nariz (+x) apontando pro centro
  EU.vida=100;EU.turbo=1;MUN=2;BALAS_N=SALA==='bots'?500:-1;TRAVA.id=0;TRAVA.t=0;EU.vivo=true;EU.fora=0;JATO.visible=true;$('#morte').style.display='none';
  envia({t:'renascer',p:arr(EU.pos,1)});}

// ------------------------------------------------ rede
function envia(m){if(ws&&ws.readyState===1)ws.send(JSON.stringify(m));}
function conectar(){const url=(location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws';
  ws=new WebSocket(url);
  ws.onopen=()=>{conectado=true;envia({t:'entrar',nome:EU.nome,sala:SALA,token:CONTA?CONTA.token:null});};
  ws.onclose=()=>{const era=conectado;conectado=false;if(jogando){jogando=false;document.body.classList.remove('jogando');$('#menu').style.display='flex';
      $('#erro').textContent=EXPULSO||(era?'⚠️ Conexão perdida. Escolha a sala para voltar.':'⚠️ Não consegui falar com o servidor.');EXPULSO='';}};
  ws.onmessage=e=>{let d;try{d=JSON.parse(e.data);}catch{return;}
    if(d.t==='expulso'){EXPULSO='⚠️ '+d.msg;}
    if(d.t==='bemvindo'){EU.id=d.id;EU.cor=d.cor;if(d.nome)EU.nome=d.nome;SALA=d.sala||'bots';MINHA_BASE=d.base??null;if(d.zona)ZONA=d.zona;if(d.rsam)R_SAM=d.rsam;LIMITE=SALA==='pvp'?20900:SALA==='bots'?7600:5200;MEU_TIME=SALA==='live'?'azul':null;VS_ANT=null;placarVs(SALA==='live'?[0,0]:null);mostrarBases();
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
    else if(d.t==='mun'){MUN=d.m;if(d.g!==undefined)BALAS_N=d.g;}
    else if(d.t==='bombas'){BOMBAS=d.n;}
    else if(d.t==='reabastecido')reabastecido();
    else if(d.t==='bomba'){_v1.fromArray(d.p);_v2.fromArray(d.v);soltaBomba(d.id,_v1,_v2,d.dono===EU.id);}
    else if(d.t==='sams')recebeSams(d.l);
    else if(d.t==='live')liveAlerta(d);
    else if(d.t==='fala')liveFala(d);
    else if(d.t==='liverank'){LIVE_RANK=d;placarVs(d.vs);}
    else if(d.t==='flareok'){flarePronto=performance.now()+d.espera*1000;}
    if(d.t==='snap'&&d.m)recebeMisseis(d.m);};}
function recebePlacar(l){PLACAR=l;const ids=new Set(l.map(x=>x.id));corBandeiras(l);
  for(const x of l){if(x.id===EU.id)continue;let o=OUT.get(x.id);
    if(!o){o={g:x.navio?criarNavio(x.cor):criarJato(x.cor),navio:!!x.navio,pos:new V3(),vel:new V3(),q:new QT(),alvoP:new V3(),alvoQ:new QT(),tRec:0,vida:100,vivo:false,novo:true};
      o.rot=document.createElement('div');o.rot.className='rot';o.rot.innerHTML='<span></span><b><i></i></b>';$('#rotulos').appendChild(o.rot);o.g.visible=false;OUT.set(x.id,o);}
    if(o.cor&&o.cor!==x.cor&&!o.navio){const j=criarJato(x.cor);j.visible=o.g.visible;cena.remove(o.g);o.g=j;}   // (10/11) live: seguiu = vira dourado
    o.nome=(x.time&&x.time===MEU_TIME?'🟦 ':'')+x.nome;o.cor=x.cor;o.bot=x.bot;o.aliado=!!(x.time&&x.time===MEU_TIME);o.esc=x.esc||1;o.vidaMax=o.esc>1?400:100;o.g.scale.setScalar(o.navio?1:1.25*o.esc);if(o.navio&&!o.anel){o.anel=anelNavio(x.time===MEU_TIME);}
    o.rot.firstChild.textContent=o.nome;o.rot.style.color=x.cor;o.kh=x.kh||0;
    if(SALA==='live'&&o.bot&&x.time!==MEU_TIME&&o.avK!==(x.av||x.nome)){o.avK=x.av||x.nome;o.av=x.av;o.rav?.remove();o.rav=document.createElement('span');o.rav.className='rav';o.rav.innerHTML=avHTML(x.av,x.nome);o.rot.insertBefore(o.rav,o.rot.lastChild);}}
  for(const [id,o] of OUT)if(!ids.has(id)){cena.remove(o.g);if(o.anel)cena.remove(o.anel);o.rot.remove();OUT.delete(id);}
  const ord=[...l].filter(x=>SALA!=='live'||!x.bot||x.pontos>0||x.id===EU.id).sort((a,b)=>b.pontos-a.pontos||a.mortes-b.mortes);
  $('#placar').innerHTML=ord.map(x=>`<div class="${x.id===EU.id?'eu':''}"><span style="color:${x.cor}">${SALA==='live'&&x.bot?(x.time===MEU_TIME?'🟦':'🟥'):x.bot?'🤖':'✈️'} ${esc(x.nome)}</span><span>${x.pontos} 🏆</span></div>`).join('');}
function recebeSnap(j){const agora=performance.now();
  for(const a of j){const [id,px,py,pz,qx,qy,qz,qw,vx,vy,vz,vida,vivo,trem]=a;
    if(id===EU.id){if(vida<EU.vida&&EU.vivo){$('#dor').style.opacity=0.8;setTimeout(()=>$('#dor').style.opacity=0,180);SOM.dor();}EU.vida=EU.vivo?vida:EU.vida;continue;}
    const o=OUT.get(id);if(!o)continue;
    o.alvoP.set(px,py,pz);o.alvoQ.set(qx,qy,qz,qw);o.tremAlvo=trem?1:0;o.vel.set(vx,vy,vz);o.tRec=agora;o.vida=vida;
    const voltou=vivo&&!o.vivo;o.vivo=!!vivo;
    if(o.novo||voltou){o.pos.copy(o.alvoP);o.q.copy(o.alvoQ);o.novo=false;}
    o.g.visible=o.vivo;}}
function recebeAbate(d){KH_ULT=d.kh||0;const por=PLACAR.find(x=>x.id===d.por),alvo=PLACAR.find(x=>x.id===d.alvo);
  if(d.alvo===EU.id)morrer(por,false,d.arma);
  else{const o=OUT.get(d.alvo);if(o){const vivia=o.g.visible;o.vivo=false;o.g.visible=false;const p=(o.pos.lengthSq()?o.pos:new V3().fromArray(d.p)).clone();explosao(p,o.pos.distanceTo(EU.pos)<700);
      if(vivia&&(o.navio||p.y-relevo(p.x,p.z)>15))queda(o.g,p,o.q,o.vel,{navio:o.navio,esc:o.navio?1:(o.esc||1)});else if(vivia){fumaceira(p,relevo(p.x,p.z));}}}
  const n=x=>x?`<b style="color:${x.cor}">${esc(x.nome)}</b>`:'';
  const div=document.createElement('div');div.innerHTML=por?`${n(por)} ${d.arma==='missil'?'🚀':d.arma==='bomba'?'💣':'🔥'} abateu ${n(alvo)}`:d.arma==='sam'?`🛡️ a defesa antiaérea derrubou ${n(alvo)}`:`${n(alvo)} 💥 caiu`;$('#feed').prepend(div);
  setTimeout(()=>div.remove(),4000);while($('#feed').children.length>4)$('#feed').lastChild.remove();}
// (10/11) sala da LIVE: alertas grandes do chat/presentes e o pódio de quem mais derrubou o host
let MEU_TIME=null,LIVE_RANK=null;
let KC=null,KH_ULT=0;
// foto do perfil (TikTok); sem foto: bolinha colorida com a inicial
function avHTML(av,nome,tam=''){if(av)return`<img class="av ${tam}" src="${esc(av)}" referrerpolicy="no-referrer" alt="">`;
  const n=String(nome||'?').replace(/^[^\p{L}\p{N}]+/u,''),h=[...String(nome)].reduce((a,c)=>a*31+c.codePointAt(0)>>>0,7)%360;
  return`<span class="av ini ${tam}" style="background:hsl(${h},65%,42%)">${esc((n[0]||'?').toUpperCase())}</span>`;}
function liveFala(d){const o=OUT.get(d.id);
  if(o&&d.txt){if(!o.bal){o.bal=document.createElement('div');o.bal.className='bal';o.rot.insertBefore(o.bal,o.rot.lastChild);}
    o.bal.textContent=d.txt;o.bal.style.display='block';clearTimeout(o.tBal);o.tBal=setTimeout(()=>{if(o.bal)o.bal.style.display='none';},4500);}
  liveAlerta({k:'fala',av:d.av,nome:d.nome,txt:d.txt,html:`<b>${esc(d.nome)}</b> ${esc(d.txt)}`});}
function liveAlerta(d){const box=$('#liveA'),div=document.createElement('div');div.className='la '+(d.k||'');
  div.innerHTML=(d.av!==undefined||d.k==='fala'?avHTML(d.av,d.nome||d.txt.replace(/^\S+\s/,'')):'')+'<span>'+(d.html||esc(d.txt))+'</span>';box.prepend(div);
  const tempo=String(d.k).startsWith('presente')||d.k==='onda'?6000:d.k==='fala'?4000:3500;setTimeout(()=>div.remove(),tempo);while(box.children.length>4)box.lastChild.remove();
  if(String(d.k).startsWith('presente')||d.k==='onda')SOM.ok?.();}
let VS_ANT=null;
function placarVs(vs){const el=$('#vs');document.body.classList.toggle('sala-live',SALA==='live');if(SALA!=='live'||!vs){el.style.display='none';return;}el.style.display='flex';
  $('#vsNome').textContent=(EU.nome||'EU').slice(0,14);$('#vsEu').textContent=vs[0];$('#vsChat').textContent=vs[1];
  if(VS_ANT){for(const [i,id] of [[0,'#vsEu'],[1,'#vsChat']])if(vs[i]>VS_ANT[i]){const n=$(id);n.classList.remove('pulo');void n.offsetWidth;n.classList.add('pulo');}}
  VS_ANT=[...vs];}
function liveTop(){if(SALA!=='live'||!LIVE_RANK)return'';const m=['🥇','🥈','🥉'],f=l=>l.map((x,i)=>m[i]+' '+esc(x[0])+' <b>'+x[1]+'</b>').join(' · ');
  return (LIVE_RANK.derrubou.length?'<small>💀 quem mais te derrubou: '+f(LIVE_RANK.derrubou)+'</small>':'')+(LIVE_RANK.moedas.length?'<small>🎁 '+f(LIVE_RANK.moedas)+' 🪙</small>':'');}
// (10/11) navio do chat: casco + ponte + metralhadora antiaérea; anel vermelho na água = alcance da metralhadora (900 m)
const ALC_NAVIO=900;
function criarNavio(cor){const g=new THREE.Group(),mC=M('#5f6a72',0.7),mE=M('#8a949b',0.6),mR=M('#9e2b25',0.8),mF=M(cor,0.6);
  box(70,6,16,mR,0,1,0,g);box(70,5,16,mC,0,6.5,0,g);box(18,9,11,mE,-12,13,0,g);box(8,4,8,mF,-12,19.5,0,g);cil(1.6,1.6,8,mC,6,13,0,g);
  const t=new THREE.Group();t.position.set(20,10,0);g.add(t);cil(3,3.5,3,mE,0,0,0,t);box(9,1,1,mC,4,2.2,1.2,t);box(9,1,1,mC,4,2.2,-1.2,t);t.rotation.z=0.6;
  cena.add(g);return g;}
function anelNavio(aliado){const m=new THREE.Mesh(new THREE.RingGeometry(ALC_NAVIO-24,ALC_NAVIO,72),new THREE.MeshBasicMaterial({color:aliado?0x4aa3ff:0xff3030,transparent:true,opacity:0.55,side:THREE.DoubleSide,depthWrite:false}));
  m.rotation.x=-Math.PI/2;cena.add(m);return m;}
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

// ------------------------------------------------ outros aviões: suavização entre os pacotes (20/s)
function outros(dt){const agora=performance.now(),k=1-Math.exp(-10*dt);
  for(const o of OUT.values()){if(!o.vivo)continue;const ad=Math.min(0.35,(agora-o.tRec)/1000);
    _v1.copy(o.alvoP).addScaledVector(o.vel,ad);o.pos.lerp(_v1,k);o.pos.addScaledVector(o.vel,dt*(1-k));o.q.slerp(o.alvoQ,k);
    o.g.position.copy(o.pos);o.g.quaternion.copy(o.q);if(o.anel)o.anel.position.set(o.pos.x,1.5,o.pos.z);}
  for(const o of OUT.values())if(o.anel)o.anel.visible=o.vivo;}

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
  else if(KC&&OUT.get(KC.id)?.vivo){const o=OUT.get(KC.id),k=o.navio?1:(o.esc||1),dist=o.navio?95:24*k;camAng+=dt*0.45;
    _v1.set(o.pos.x+Math.cos(camAng)*dist,o.pos.y+(o.navio?30:6*k),o.pos.z+Math.sin(camAng)*dist);camP.addScaledVector(o.vel,dt).lerp(_v1,1-Math.exp(-5*dt));
    cam.position.copy(camP);cam.up.set(0,1,0);cam.lookAt(_v2.copy(o.pos).setY(o.pos.y+(o.navio?8:0)));if(Math.abs(cam.fov-55)>0.2){cam.fov+=(55-cam.fov)*Math.min(1,dt*3);cam.updateProjectionMatrix();}}
  else{camAng+=dt*0.25;cam.up.set(0,1,0);const P=MEU_DESTROCO?MEU_DESTROCO.pos:EU.pos;   // (11/11) segue a minha carcaça caindo
    _v1.set(P.x+Math.cos(camAng)*70,Math.max(P.y+25,relevo(P.x,P.z)+20),P.z+Math.sin(camAng)*70);if(camP.distanceTo(_v1)>400)camP.copy(_v1);else camP.lerp(_v1,1-Math.exp(-4*dt));cam.position.copy(camP);cam.lookAt(P);}}

// ------------------------------------------------ HUD: mira, rótulos, seta do inimigo mais perto, radar, barras
const rctx=$('#radar').getContext('2d');let tRadar=0;
// (11/11) mira de compensação: onde o alvo VAI estar quando a bala chegar. Alinhe a mira (○) no losango (◇) e atire.
const _lp=new V3();let LEADD=0;
function compensacao(W,H){const el=$('#lead');LEADD=0;if(!EU.vivo){el.style.display='none';return;}
  const fw=frente(EU.q,_v4),vb=VEL_BALA+EU.vel;let alvo=TRAVA.id&&OUT.get(TRAVA.id),mc=Math.cos(40*Math.PI/180);
  if(!alvo?.vivo||alvo.aliado){alvo=null;for(const o of OUT.values()){if(!o.vivo||o.aliado)continue;_v1.subVectors(o.pos,EU.pos);const d=_v1.length();if(d>1600||d<30)continue;const c=_v1.dot(fw)/d;if(c>mc){mc=c;alvo=o;}}}
  if(!alvo){el.style.display='none';return;}
  let t=alvo.pos.distanceTo(EU.pos)/vb;for(let k=0;k<3;k++){_lp.copy(alvo.pos).addScaledVector(alvo.vel,t);if(alvo.navio)_lp.y+=8;t=_lp.distanceTo(EU.pos)/vb;}
  const d=_lp.distanceTo(EU.pos);if(d>1600){el.style.display='none';return;}LEADD=d;
  _v1.copy(_lp).project(cam);if(_v1.z>=1){el.style.display='none';return;}
  el.style.display='block';el.style.left=((_v1.x+1)/2*W)+'px';el.style.top=((1-_v1.y)/2*H)+'px';el.style.color=alvo.cor||'#fff';
  _v1.subVectors(_lp,EU.pos).normalize();const erro=Math.acos(Math.min(1,_v1.dot(fw)))*d;el.classList.toggle('ok',erro<(alvo.navio?22:9*(alvo.esc||1)));}
function hud(dt){const W=innerWidth,H=innerHeight;compensacao(W,H);
  const mira=$('#mira');if(EU.vivo){_v1.copy(EU.pos).addScaledVector(frente(EU.q),LEADD||700).project(cam);mira.style.display=CABINE?'none':'block';mira.style.left=((_v1.x+1)/2*W)+'px';mira.style.top=((1-_v1.y)/2*H)+'px';}else mira.style.display='none';
  tAcerto-=dt;mira.classList.toggle('acertou',tAcerto>0);
  let perto=null,dP=1e9;
  const agoraH=performance.now();
  for(const o of OUT.values()){const d=o.pos.distanceTo(EU.pos);
    if(!o.vivo||agoraH-o.tRec>2500){o.rot.style.display='none';o.vis=false;continue;}if(d<dP&&!o.aliado){dP=d;perto=o;}
    _v1.copy(o.pos).y+=o.navio?34:9;_v1.project(cam);
    if(_v1.z<1&&Math.abs(_v1.x)<1.1&&Math.abs(_v1.y)<1.1&&d<4500){o.rot.style.display='block';o.rot.style.left=((_v1.x+1)/2*W)+'px';o.rot.style.top=((1-_v1.y)/2*H)+'px';
      o.rot.firstChild.textContent=o.nome+' · '+Math.round(d)+'m';o.rot.lastChild.firstChild.style.width=Math.min(100,o.vida*100/(o.vidaMax||100))+'%';o.vis=true;}else{o.rot.style.display='none';o.vis=false;}}
  const tv=$('#trava'),ot=TRAVA.id&&OUT.get(TRAVA.id);
  if(ot&&ot.vis&&EU.vivo&&MUN>0){_v1.copy(ot.pos).project(cam);tv.style.display='block';tv.style.left=((_v1.x+1)/2*W)+'px';tv.style.top=((1-_v1.y)/2*H)+'px';
    const ok=TRAVA.t>=1;tv.className='hud'+(ok?' ok':'');tv.style.transform=`translate(-50%,-50%) scale(${ok?1:1.6-0.6*Math.min(1,TRAVA.t)}) rotate(${ok?0:45*(1-Math.min(1,TRAVA.t))}deg)`;}else tv.style.display='none';
  $('#bMissil').textContent='🚀'+MUN;$('#bMissil').classList.toggle('vazio',MUN<=0);$('#bMissil').classList.toggle('pronto',TRAVA.t>=1&&MUN>0);
  const fp=performance.now()>=flarePronto;$('#bFlare').classList.toggle('vazio',!fp);
  $('#tMis').textContent=(BALAS_N>=0?'🔫 '+BALAS_N+'  ':'')+'🚀 '+MUN+'  💣 '+BOMBAS+'  ✨ '+(fp?'ok':Math.ceil((flarePronto-performance.now())/1000)+'s');$('#bBomba').textContent='💣'+BOMBAS;$('#bBomba').classList.toggle('vazio',BOMBAS<=0);
  const seta=$('#seta');
  const naArena=SALA!=='pvp'||Math.hypot(EU.pos.x,EU.pos.z)<ZONA;   // (10/11) sala sem bots: seta só liga dentro do círculo da arena
  let alvoS=perto&&!perto.vis&&naArena?perto.pos:null,corS=perto?.cor;
  const casa=SALA==='bots'&&MINHA_BASE!==null&&(BALAS_N===0||(BALAS_N<100&&MUN===0)||EU.vida<35)?_v4.set(BASES[MINHA_BASE].x,BASE_H,BASES[MINHA_BASE].z):null;
  const fT=SALA==='treino'?(TREINO.alvo?TREINO.alvo.m.position:TREINO.foco):casa;
  if(fT){_v1.copy(fT).project(cam);alvoS=_v1.z<1&&Math.abs(_v1.x)<0.95&&Math.abs(_v1.y)<0.9?null:fT;corS=casa?'#3cd070':'#ffd23a';}
  if(alvoS&&EU.vivo){_v1.copy(alvoS).applyMatrix4(cam.matrixWorldInverse);let x=_v1.x,y=_v1.y;if(Math.hypot(x,y)<1e-3)y=-1;
    const a=Math.atan2(y,x),rx=W/2-40,ry=H/2-40;seta.style.display='block';seta.style.borderBottomColor=corS;
    seta.style.left=(W/2+Math.cos(a)*rx-11)+'px';seta.style.top=(H/2-Math.sin(a)*ry-11)+'px';seta.style.transform=`rotate(${Math.PI/2-a}rad)`;}else seta.style.display='none';
  $('#bVida i').style.width=Math.max(0,EU.vida)+'%';$('#bTurboB i').style.width=(EU.turbo*100)+'%';
  $('#tVel').textContent='💨 '+Math.round(EU.vel*3.6)+' km/h · 🎚️'+Math.round(EU.acel*100)+'%';$('#tAlt').textContent=(EU.trem>0.98?'🛞▼ ':EU.trem<0.02?'':'🛞… ')+'⛰️ '+Math.round(EU.pos.y)+' m';
  const bt=$('#bTrem');bt.textContent=EU.tremAlvo?'🛞▼':'🛞▲';bt.classList.toggle('on',EU.tremAlvo===1);
  tRadar-=dt;if(tRadar>0)return;tRadar=0.1;if(CABINE&&EU.vivo)setTimeout(atualizaMFD,0);
  const S=236,c=S/2,esc2=c/3500;rctx.clearRect(0,0,S,S);
  rctx.strokeStyle='#7fd3ff33';rctx.lineWidth=2;for(const r of[0.33,0.66])rctx.beginPath(),rctx.arc(c,c,c*r,0,7),rctx.stroke();
  const fw=frente(EU.q,_v3),hd=Math.atan2(fw.z,fw.x);
  const ponto=(x,z,cor,r)=>{const dx=x-EU.pos.x,dz=z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.min(c-6,Math.hypot(dx,dz)*esc2);
    rctx.fillStyle=cor;rctx.beginPath();rctx.arc(c+Math.sin(a)*d,c-Math.cos(a)*d,r,0,7);rctx.fill();};
  rctx.fillStyle='#3f8a3c88';for(const I of ILHAS){const dx=I.x-EU.pos.x,dz=I.z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.hypot(dx,dz)*esc2;if(d<c+I.r*esc2){rctx.beginPath();rctx.arc(c+Math.sin(a)*d,c-Math.cos(a)*d,Math.max(2,I.r*esc2),0,7);rctx.fill();}}
  if(SALA==='treino')for(const B of TREINO.barcos)if(B.vivo)ponto(B.g.position.x,B.g.position.z,'#ff8a3a',5);
  if(SALA==='treino')for(const A of TREINO.aneis)if(!A.feito)ponto(A.m.position.x,A.m.position.z,A===TREINO.alvo?'#ffd23a':'#ffd23a77',5);
  if(SALA==='pvp'||SALA==='treino'){   // (10/11) zona de combate e bases (a minha em verde; as outras em vermelho com o alcance dos SAM)
    const anelR=(x,z,r,cor)=>{const dx=x-EU.pos.x,dz=z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.hypot(dx,dz)*esc2;rctx.strokeStyle=cor;rctx.lineWidth=2;rctx.beginPath();rctx.arc(c+Math.sin(a)*d,c-Math.cos(a)*d,r*esc2,0,7);rctx.stroke();};
    rctx.save();rctx.beginPath();rctx.arc(c,c,c-1,0,7);rctx.clip();anelR(0,0,ZONA,'#ffd23a99');
    for(const B of BASES)if(B.i!==MINHA_BASE&&B.samOn&&B.sala===salaBases())anelR(B.x,B.z,B.rsam,'#ff3b3099');rctx.restore();
    for(const B of BASES){if(B.sala!==salaBases())continue;const dx=B.x-EU.pos.x,dz=B.z-EU.pos.z,a=Math.atan2(dz,dx)-hd,d=Math.min(c-8,Math.hypot(dx,dz)*esc2);
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
  if(jogando&&JATO){if(EU.vivo)voar(dt);else if(agora-EU.mortoEm>(KC?4600:3200)&&(conectado||SALA==='treino'))nascer();
    if(SALA==='treino')treino(dt);
    tEnvio-=dt;if(tEnvio<=0&&EU.vivo){tEnvio=0.05;envia({t:'e',p:arr(EU.pos,1),q:[EU.q.x,EU.q.y,EU.q.z,EU.q.w].map(x=>Math.round(x*1e4)/1e4),v:arr(frente(EU.q,_v3).multiplyScalar(EU.vel),1),tr:EU.tremAlvo});}
    else if(tEnvio<=0){tEnvio=1;envia({t:'p'});}}
  EU.trem+=Math.sign(EU.tremAlvo-EU.trem)*Math.min(Math.abs(EU.tremAlvo-EU.trem),0.4*dt);poeTrem(JATO,Math.round(EU.trem*50)/50);
  for(const o of OUT.values()){o.trem=(o.trem||0)+Math.sign((o.tremAlvo||0)-(o.trem||0))*Math.min(Math.abs((o.tremAlvo||0)-(o.trem||0)),0.4*dt);poeTrem(o.g,Math.round(o.trem*50)/50);}
  if(jogando)atualizaILS();else ILS.aneis.forEach(m=>m.visible=false);
  outros(dt);balas(dt);misseis(dt);bombas(dt);efeitos(dt);efeitosQueda(dt);if(jogando)mostraCcip();else ccip.visible=false;
  if(jogando&&JATO){camera(dt);hud(dt);}
  if(Q.has('foto')&&GRIPEN){if(!window.__fJ){window.__fJ=criarJato('#3cd070');window.__fJ.position.set(0,3000,0);}   // ?foto: Gripen parado p/ conferir o modelo
    const f=window.__foto||[-20,6,14];cam.position.set(f[0],3000+f[1],f[2]);cam.up.set(0,1,0);cam.lookAt(0,3000,0);}
  cam.updateMatrixWorld();_v1.set(0,1,0).transformDirection(cam.matrixWorldInverse);mNuvem.rotation=Math.atan2(-_v1.x,_v1.y);   // nuvem deitada no horizonteelse{camAng+=dt*0.05;cam.up.set(0,1,0);cam.position.set(Math.cos(camAng)*2600,700,Math.sin(camAng)*2600);cam.lookAt(0,250,0);}
  const dentro=CABINE&&EU.vivo&&jogando&&JATO;document.body.classList.toggle('cabine',!!dentro);if(JATO)for(const m of JATO.userData.cab)m.visible=!dentro;
  R.autoClear=true;R.render(cena,cam);
  if(dentro){cabine(ULT_I);R.autoClear=false;R.clearDepth();R.render(cenaCab,camCab);R.autoClear=true;}
  hudCabine();}
requestAnimationFrame(quadro);

// ------------------------------------------------ menu
try{$('#nome').value=localStorage.getItem('jsjet-nome')||'';$('#inverter').checked=localStorage.getItem('jsjet-inv')==='1';}catch(e){}
// (10/11) conta (nome + senha) e ranking. Token fica no navegador; convidado joga mas fica fora do ranking.
let CONTA=null,EXPULSO='';try{const t=localStorage.getItem('jsjet-token');if(t)CONTA={token:t,nome:localStorage.getItem('jsjet-conta')||''};}catch(e){}
function mostraSalas(){$('#pLogin').style.display='none';$('#pSalas').style.display='block';
  $('#ola').innerHTML=CONTA?'👤 '+esc(CONTA.nome)+' <a id="bTrocar">sair da conta</a>':'👤 Convidado <small>(fora do ranking)</small> <a id="bTrocar">entrar / criar conta</a>';
  $('#bTrocar').addEventListener('click',()=>{if(CONTA)fetch('api/conta/sair',{method:'POST',body:JSON.stringify({token:CONTA.token})}).catch(()=>{});
    CONTA=null;try{localStorage.removeItem('jsjet-token');localStorage.removeItem('jsjet-conta');}catch(e){}$('#pSalas').style.display='none';$('#pLogin').style.display='block';$('#senha').value='';});}
async function login(acao){const nome=$('#nome').value.trim(),senha=$('#senha').value;$('#erro').textContent='';
  if(!nome||!senha){$('#erro').textContent='Preencha nome e senha.';return;}
  try{const r=await fetch('api/conta/'+acao,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome,senha})}),d=await r.json();
    if(!r.ok||!d.token){$('#erro').textContent='⚠️ '+(d.erro||'Não deu certo.');return;}
    CONTA={token:d.token,nome:d.nome};try{localStorage.setItem('jsjet-token',d.token);localStorage.setItem('jsjet-conta',d.nome);localStorage.setItem('jsjet-nome',d.nome);}catch(e){}
    $('#senha').value='';mostraSalas();}catch(e){$('#erro').textContent='⚠️ Não consegui falar com o servidor.';}}
$('#bEntrar').addEventListener('click',()=>login('entrar'));$('#bCriar').addEventListener('click',()=>login('criar'));
$('#senha').addEventListener('keydown',e=>{if(e.key==='Enter')login('entrar');});
$('#nome').addEventListener('keydown',e=>{if(e.key==='Enter')$('#senha').focus();});
$('#bConvidado').addEventListener('click',()=>{CONTA=null;$('#erro').textContent='';mostraSalas();});
if(CONTA)fetch('api/eu?token='+encodeURIComponent(CONTA.token)).then(r=>r.json()).then(d=>{if(d.nome){CONTA.nome=d.nome;mostraSalas();}else{CONTA=null;try{localStorage.removeItem('jsjet-token');}catch(e){}}}).catch(()=>{});
let SALA_RANK='pvp';
async function abreRank(){$('#rank').style.display='flex';$('#tRank').innerHTML='<div class="vazio">carregando…</div>';
  for(const b of document.querySelectorAll('#rank .abas button'))b.classList.toggle('on',b.dataset.s===SALA_RANK);
  try{const d=await(await fetch('api/rank?sala='+SALA_RANK)).json();
    if(!d.l.length){$('#tRank').innerHTML='<div class="vazio">Ninguém pontuou ainda nesta sala. Seja o primeiro! ✈️</div>';return;}
    const med=['🥇','🥈','🥉'],hm=t=>{const m=Math.round(t/60);return m<60?m+' min':Math.floor(m/60)+'h'+String(m%60).padStart(2,'0');};
    $('#tRank').innerHTML='<table><tr><th>#</th><th style="text-align:left">Piloto</th><th>🎯 Abates</th><th>💀 Mortes</th><th>⚖️ A/M</th><th>🔥 Seguidos</th><th>⏱️ Voo</th></tr>'+
      d.l.map((x,i)=>`<tr class="${CONTA&&x.nome===CONTA.nome?'eu':''}"><td>${med[i]||i+1}</td><td class="n">${esc(x.nome)}</td><td><b>${x.abates}</b></td><td>${x.mortes}</td><td>${(x.abates/Math.max(1,x.mortes)).toFixed(2)}</td><td>${x.melhor_seq}</td><td>${hm(x.tempo)}</td></tr>`).join('')+'</table>';}
  catch(e){$('#tRank').innerHTML='<div class="vazio">⚠️ Não consegui buscar o ranking.</div>';}}
$('#bRank').addEventListener('click',abreRank);$('#bFecharRank').addEventListener('click',()=>{$('#rank').style.display='none';});
for(const b of document.querySelectorAll('#rank .abas button'))b.addEventListener('click',()=>{SALA_RANK=b.dataset.s;abreRank();});
let SELFIE=null,CAM_I=-1;   // (10/11) 📷 alterna: câmera 1 → 2 → … (webcam USB entra na lista) → desliga
function paraCam(){if(SELFIE)SELFIE.getTracks().forEach(t=>t.stop());SELFIE=null;$('#selfie').style.display='none';$('#bCam').classList.remove('on');}
async function abreCam(id){const v=$('#selfie');paraCam();
  SELFIE=await navigator.mediaDevices.getUserMedia({video:id?{deviceId:{exact:id},width:{ideal:640},height:{ideal:480}}:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
  v.srcObject=SELFIE;v.style.display='block';await v.play().catch(()=>{});$('#bCam').classList.add('on');
  const tr=SELFIE.getVideoTracks()[0],st=tr.getSettings?.()||{};v.style.transform=st.facingMode==='environment'||/usb|uvc|webcam|extern/i.test(tr.label)?'none':'scaleX(-1)';   // só espelha a frontal
  return tr.label;}
$('#bCam').addEventListener('click',async()=>{
  if(!navigator.mediaDevices?.getUserMedia){liveAlerta({k:'info',txt:'📷 a câmera só abre pelo link https://'+location.hostname+':8793'});return;}
  try{if(CAM_I<0){const nome=await abreCam(null);CAM_I=0;   // 1º toque: pede permissão (frontal); depois a lista vem com os nomes
      const cams=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');
      CAM_I=Math.max(0,cams.findIndex(d=>d.label===nome));liveAlerta({k:'info',txt:`📷 ${nome||'câmera'} (${CAM_I+1}/${cams.length}) — toque de novo p/ trocar`});return;}
    const cams=(await navigator.mediaDevices.enumerateDevices()).filter(d=>d.kind==='videoinput');CAM_I++;
    if(CAM_I>=cams.length){paraCam();CAM_I=-1;liveAlerta({k:'info',txt:'📷 câmera desligada'});return;}
    const nome=await abreCam(cams[CAM_I].deviceId);liveAlerta({k:'info',txt:`📷 ${nome||'câmera '+(CAM_I+1)} (${CAM_I+1}/${cams.length})`});}
  catch(e){paraCam();CAM_I=-1;liveAlerta({k:'info',txt:'📷 não deu p/ abrir a câmera: '+(e.name==='NotAllowedError'?'permissão negada':e.message)});}});
$('#salaLive').addEventListener('click',()=>{$('#decolar').dataset.sala='live';$('#decolar').click();});
$('#salaPvp').addEventListener('click',()=>{SALA='pvp';$('#decolar').dataset.sala='pvp';$('#decolar').click();});
$('#decolar').addEventListener('click',async()=>{SALA=$('#decolar').dataset.sala||'bots';delete $('#decolar').dataset.sala;EU.nome=CONTA?CONTA.nome:'Convidado';
  try{localStorage.setItem('jsjet-inv',$('#inverter').checked?'1':'0');}catch(e){}
  SOM.ini();$('#erro').textContent='';
  if(TOQUE){try{await document.documentElement.requestFullscreen?.();}catch(e){}try{await screen.orientation?.lock?.('landscape');}catch(e){}}
  $('#menu').style.display='none';jogando=true;document.body.classList.add('jogando');
  for(const o of OUT.values()){cena.remove(o.g);o.rot.remove();}OUT.clear();
  if(ws)try{ws.onclose=null;ws.close();}catch(e){}
  conectar();});
// ------------------------------------------------ (10/11) tutorial de voo: offline (sem servidor, sem ranking), etapas com anéis no céu
const TREINO={passo:0,aneis:[],alvo:null,t:0,lados:0,leme:0,stallOk:false,idB:0,foco:null,barcos:[],mis:[],desviou:false,tMis:0,tRec:0};
const mAnel=new THREE.MeshBasicMaterial({color:0xffd23a,transparent:true,opacity:0.9,fog:false}),gAnel=new THREE.TorusGeometry(55,6,10,40);
function poeAnel(x,y,z,dx,dz){const m=new THREE.Mesh(gAnel,mAnel.clone());m.position.set(x,y,z);m.lookAt(x+dx,y,z+dz);cena.add(m);const A={m,feito:false};TREINO.aneis.push(A);return A;}
function limpaAneis(){for(const A of TREINO.aneis)cena.remove(A.m);TREINO.aneis=[];TREINO.alvo=null;
  for(const [id,o] of OUT)if(id<0){cena.remove(o.g);o.rot.remove();OUT.delete(id);}
  for(const B of TREINO.barcos)cena.remove(B.g);TREINO.barcos=[];TREINO.foco=null;
  for(const m of TREINO.mis){cena.remove(m.g);MISV.delete(m.id);}TREINO.mis=[];}
// (10/11) combate no tutorial (tudo local): drones voando em círculo, mísseis simulados aqui, barcos p/ bombardear
function pontoFrente(dist,lado=0){const f=frente(EU.q,_v3).setY(0).normalize();return new V3(EU.pos.x+f.x*dist-f.z*lado,0,EU.pos.z+f.z*dist+f.x*lado);}
function poeDrone(escudo){const c=pontoFrente(1600),id=-100-TREINO.passo,o={g:criarJato('#ff5a4a'),pos:new V3(),vel:new V3(),q:new QT(),alvoP:new V3(),alvoQ:new QT(),tRec:0,vida:100,vivo:true,
    nome:'🎯 Drone',cor:'#ff5a4a',bot:true,c,R:450,ang:Math.random()*6,y:Math.max(500,Math.min(1400,EU.pos.y)),escudo};
  o.rot=document.createElement('div');o.rot.className='rot';o.rot.innerHTML='<span></span><b><i></i></b>';o.rot.style.color=o.cor;$('#rotulos').appendChild(o.rot);
  OUT.set(id,o);voaDrone(o,0);o.pos.copy(o.alvoP);o.q.copy(o.alvoQ);}
function voaDrone(o,dt){o.ang+=70/o.R*dt;const ca=Math.cos(o.ang),sa=Math.sin(o.ang);o.alvoP.set(o.c.x+ca*o.R,o.y+Math.sin(o.ang*2)*40,o.c.z+sa*o.R);
  o.vel.set(-sa*70,0,ca*70);_v1.copy(o.vel).normalize();o.alvoQ.setFromUnitVectors(_x,_v1).multiply(_dq.setFromAxisAngle(_v2.set(1,0,0),-0.5));o.tRec=performance.now();}
function mataDrone(o,porMissil){o.vivo=false;o.g.visible=false;o.rot.style.display='none';explosao(o.pos,true);queda(o.g,o.pos,o.q,o.vel);o.porMissil=porMissil;
  const div=document.createElement('div');div.innerHTML=`${porMissil?'🚀':'🔥'} drone derrubado!`;$('#feed').prepend(div);setTimeout(()=>div.remove(),3000);}
function treinoAcerto(id,o){fx(o.pos,0xffd070,7,0.25,2);SOM.acerto();tAcerto=0.15;if(o.escudo){TREINO.dicaEscudo=2;return;}o.vida-=10;if(o.vida<=0)mataDrone(o,false);}
function misLocal(p,f,alvo,vel,max){const id=-1000-(TREINO.idB--),m={id,g:criarMissil(),pos:p.clone(),alvoP:p.clone(),vel:new V3(),tRec:0,tFumo:0,alvo:alvo===EU?EU.id:0,
    L:{p:p.clone(),f:f.clone().normalize(),v:vel,max,t:0,ob:alvo}};MISV.set(id,m);TREINO.mis.push(m);return m;}
function treinoMissil(id){const o=OUT.get(id);if(!o||MUN<=0)return;MUN--;TREINO.tRec=0;SOM.lanca(true);
  misLocal(_v1.set(0,-3,0).applyQuaternion(EU.q).add(EU.pos),frente(EU.q,_v2),o,Math.max(150,EU.vel),430);}
function treinoFlare(){flares(EU.id);flarePronto=performance.now()+3000;for(const m of TREINO.mis)if(m.L.ob===EU){m.L.ob=null;m.alvo=0;TREINO.desviou=true;}}
function misseisTreino(dt){for(const m of [...TREINO.mis]){const L=m.L;L.t+=dt;L.v=Math.min(L.max,L.v+180*dt);const ob=L.ob,op=ob===EU?EU.pos:ob?.pos;
    if(ob&&(ob===EU?EU.vivo:ob.vivo)){_v1.subVectors(op,L.p).normalize();L.f.lerp(_v1,Math.min(1,2.2*dt)).normalize();}
    L.p.addScaledVector(L.f,L.v*dt);m.alvoP.copy(L.p);m.vel.copy(L.f).multiplyScalar(L.v);m.tRec=performance.now();
    let fim=L.t>9||L.p.y<relevo(L.p.x,L.p.z);
    if(ob&&op&&L.p.distanceTo(op)<22){fim=true;explosao(L.p,true);
      if(ob===EU){EU.vida=Math.max(15,EU.vida-35);$('#dor').style.opacity=0.8;setTimeout(()=>$('#dor').style.opacity=0,180);SOM.dor();TREINO.levou=true;}else mataDrone(ob,true);}
    else if(fim)fx(L.p,0xffb040,14,0.6,2.5);
    if(fim){cena.remove(m.g);MISV.delete(m.id);TREINO.mis.splice(TREINO.mis.indexOf(m),1);}}}
function poeBarcos(){let c=pontoFrente(2600);for(let k=0;k<6&&relevo(c.x,c.z)>0;k++)c=pontoFrente(2600+k*500,(k%2?1:-1)*700);
  const mC=M('#5f6a72',0.7),mE=M('#8a949b',0.6),mR=M('#9e2b25',0.8);
  for(let i=0;i<3;i++){const g=new THREE.Group(),f=frente(EU.q,_v3).setY(0).normalize();g.position.set(c.x-f.z*(i-1)*150,0,c.z+f.x*(i-1)*150);g.rotation.y=Math.random()*3;
    box(70,6,16,mR,0,1,0,g);box(70,5,16,mC,0,6.5,0,g);box(18,9,11,mE,-12,13,0,g);box(8,4,8,mE,-12,19.5,0,g);cil(1.6,1.6,8,mC,6,13,0,g);
    cena.add(g);TREINO.barcos.push({g,vivo:true});}
  TREINO.foco=new V3(c.x,10,c.z);}
function treinoBomba(p){for(const B of TREINO.barcos)if(B.vivo&&Math.hypot(B.g.position.x-p.x,B.g.position.z-p.z)<45){B.vivo=false;B.g.rotation.z=0.5;B.g.position.y=-7;
    for(let i=0;i<10;i++){_v1.set((Math.random()-0.5)*50,5,(Math.random()-0.5)*50).add(B.g.position);fx(_v1,0x333333,30,4,3,false,18);}
    const div=document.createElement('div');div.innerHTML='💣 barco afundado!';$('#feed').prepend(div);setTimeout(()=>div.remove(),3000);}
  const vivos=TREINO.barcos.filter(B=>B.vivo);if(vivos.length)TREINO.foco.copy(vivos[0].g.position).setY(10);}
// aneis em sequência a partir de onde o avião está: lista de [frente, direita, altura extra] no referencial do rumo atual
function trilha(pts){const f=frente(EU.q,_v3).setY(0).normalize(),fx=f.x,fz=f.z,rx=-fz,rz=fx,y0=Math.max(450,EU.pos.y);let ant=[EU.pos.x,EU.pos.z];
  for(const [a,b,h] of pts){const x=EU.pos.x+fx*a+rx*b,z=EU.pos.z+fz*a+rz*b;poeAnel(x,y0+h,z,x-ant[0],z-ant[1]);ant=[x,z];}TREINO.alvo=TREINO.aneis[0];}
const T_=TOQUE;
const PASSOS=[
  {t:'🛫 Decolagem',d:T_?'Segure 🔥 turbo. Passando de 230 km/h, arraste o dedo p/ baixo (lado esquerdo) e o avião sobe.':'Segure <b>Shift</b> (turbo). Passando de 230 km/h, puxe o manche com <b>↓</b>. (W/S = acelerar/desacelerar)',ok:()=>!EU.solo},
  {t:'⬆️ Recolher o trem e subir',d:T_?'Toque <b>🛞</b> (à direita, ao lado do LEME) p/ recolher as rodas e suba até <b>600 m</b>.':'Aperte <b>G</b> p/ recolher as rodas (trem de pouso) e suba até <b>600 m</b>.',tic:()=>EU.tremAlvo?'':'✔️ trem recolhido',ok:()=>EU.pos.y>600&&!EU.tremAlvo},
  {t:'✈️ Inclinar as asas',d:T_?'Arraste p/ a <b>esquerda</b> e depois p/ a <b>direita</b>: o avião inclina e faz curva.':'Use <b>←</b> e depois <b>→</b>: o avião inclina e faz curva.',ini:()=>{TREINO.lados=0;},
    tic:()=>{const dy=_v2.set(0,0,1).applyQuaternion(EU.q).y;if(dy>0.5)TREINO.lados|=1;if(dy<-0.5)TREINO.lados|=2;return TREINO.lados===3?'':['','✔️ esquerda… agora direita','✔️ direita… agora esquerda'][TREINO.lados];},ok:()=>TREINO.lados===3},
  {t:'🟡 Curva pelos anéis',d:'Passe por dentro dos <b>3 anéis amarelos</b>. A seta amarela na borda mostra onde está o próximo.',ini:()=>trilha([[1100,0,0],[2000,700,60],[2300,1700,120]]),ok:()=>!TREINO.alvo},
  {t:'🧭 Leme',d:T_?'O leme vira o nariz <b>sem inclinar</b>: arraste a barra <b>LEME</b> (direita, em cima dos botões) e passe pelo anel.':'O leme vira o nariz <b>sem inclinar</b>: use <b>A</b> / <b>D</b> e passe pelo anel.',ini:()=>{TREINO.leme=0;trilha([[1300,-420,0]]);},
    tic:(dt)=>{TREINO.leme+=Math.abs(ULT_I?.y||0)*dt;return '';},ok:()=>!TREINO.alvo&&TREINO.leme>0.5},
  {t:'🪂 Desacelerar',d:T_?'Segure 🪂 até ficar abaixo de <b>300 km/h</b>.':'Segure <b>S</b> (manete) ou <b>E</b> (freio) até ficar abaixo de <b>300 km/h</b>.',ok:()=>EU.vel*3.6<300},
  {t:'⚠️ Stall',d:'Continue freando e puxe o nariz p/ cima até aparecer <b>STALL</b>. Depois <b>solte o freio e abaixe o nariz</b> p/ recuperar (passar de 350 km/h).',ini:()=>{TREINO.stallOk=false;},
    tic:()=>{if(EU.stall>0.05)TREINO.stallOk=true;return TREINO.stallOk?'✔️ entrou em stall… agora recupere':'';},ok:()=>TREINO.stallOk&&!EU.stall&&EU.vel*3.6>350},
  {t:'🔥 Turbo',d:T_?'Segure 🔥 até passar de <b>720 km/h</b> (a barra laranja é o combustível do turbo).':'Segure <b>Shift</b> até passar de <b>720 km/h</b> (a barra laranja é o combustível do turbo).',ok:()=>EU.vel*3.6>720},
  {t:'🔫 Canhão',d:T_?'Um <b>drone 🎯</b> voa em círculo. Chegue por trás dele e segure <b>🎯</b> p/ atirar (a mira ajuda quando ele está no centro).':'Um <b>drone 🎯</b> voa em círculo. Chegue por trás dele e segure <b>Espaço</b> p/ atirar (a mira ajuda quando ele está no centro).',
    ini:()=>poeDrone(false),ok:()=>![...OUT.values()].some(o=>o.vivo)},
  {t:'🚀 Míssil',d:T_?'Deixe o drone na frente do nariz até o <b>quadrado ficar vermelho</b> (1 s) e toque <b>🚀</b>.':'Deixe o drone na frente do nariz até o <b>quadrado ficar vermelho</b> (1 s) e aperte <b>F</b>.',
    ini:()=>{MUN=2;TREINO.dicaEscudo=0;poeDrone(true);},tic:(dt)=>{TREINO.dicaEscudo-=dt;TREINO.tRec+=dt;if(MUN<2&&TREINO.tRec>4){MUN++;TREINO.tRec=0;}return TREINO.dicaEscudo>0?'🛡️ esse drone tem blindagem: só o míssil derruba!':'';},ok:()=>![...OUT.values()].some(o=>o.vivo)},
  {t:'✨ Flare',d:T_?'Um <b>míssil inimigo</b> vai vir atrás de você! Quando aparecer o alerta <b>MÍSSIL</b>, toque <b>✨</b> p/ despistar.':'Um <b>míssil inimigo</b> vai vir atrás de você! Quando aparecer o alerta <b>MÍSSIL</b>, aperte <b>X</b> p/ despistar.',
    ini:()=>{TREINO.desviou=false;TREINO.levou=false;TREINO.tMis=2.5;},
    tic:(dt)=>{if(!TREINO.mis.some(m=>m.L.ob===EU)&&!TREINO.desviou){TREINO.tMis-=dt;if(TREINO.tMis<=0){TREINO.tMis=3;const f=frente(EU.q,_v2);
        misLocal(_v1.copy(EU.pos).addScaledVector(f,-1700).setY(EU.pos.y+100),f,EU,160,330);}}
      return TREINO.desviou?'✔️ despistou!':TREINO.levou?'💥 te acertou! vem outro… solte o flare quando o alerta aparecer':'';},ok:()=>TREINO.desviou},
  {t:'💣 Bombardeio',d:T_?'Afunde os <b>3 barcos 🚢</b> (siga a seta). O <b>anel vermelho</b> no mar mostra onde a bomba cai: ponha o anel no barco e toque <b>💣</b>. Voar mais baixo e devagar facilita.':'Afunde os <b>3 barcos 🚢</b> (siga a seta). O <b>anel vermelho</b> no mar mostra onde a bomba cai: ponha o anel no barco e aperte <b>B</b>. Voar mais baixo e devagar facilita.',
    ini:()=>{BOMBAS=4;TREINO.tRec=0;poeBarcos();},tic:(dt)=>{TREINO.tRec+=dt;if(BOMBAS<4&&TREINO.tRec>5){BOMBAS++;TREINO.tRec=0;}const n=TREINO.barcos.filter(B=>!B.vivo).length;return n?`✔️ ${n}/3 afundados`:'';},
    ok:()=>TREINO.barcos.length&&TREINO.barcos.every(B=>!B.vivo)},
  {t:'🛬 Rasante na pista',d:'Volte p/ a sua base (quadrado verde no radar) e passe pelo anel <b>em cima da pista</b>, bem baixinho! (pode subir o nariz e dar a volta depois)',ini:()=>{const B=BASES[0];TREINO.alvo=poeAnel(B.x,BASE_H+45,B.z,B.dx,B.dz);},ok:()=>!TREINO.alvo},
  {t:'🛞 Pouso',d:(T_?'Toque <b>🛞</b> p/ baixar as rodas':'Aperte <b>G</b> p/ baixar as rodas')+' (o avião já reduz p/ velocidade de pouso). Vá até a seta e siga os <b>anéis verdes</b>: eles descem até a pista. Perto do chão o avião <b>arredonda sozinho</b>; depois de tocar, freia sozinho e <b>reabastece</b>.',
    ini:()=>{const B=BASES[0],s=350+8*450;TREINO.foco=new V3(B.x-B.dx*(PISTA/2+s-250),BASE_H+s*0.07,B.z-B.dz*(PISTA/2+s-250));},
    tic:()=>{if(TREINO.foco&&EU.tremAlvo&&Math.hypot(EU.pos.x-TREINO.foco.x,EU.pos.z-TREINO.foco.z)<600){const B=BASES[0];TREINO.foco.set(B.x,BASE_H,B.z);}
      return EU.solo?(EU.vel>3?'✔️ tocou! freando…':''):EU.tremAlvo?'✔️ trem baixado — siga os anéis verdes':'';},ok:()=>EU.solo&&EU.vel<3&&EU.reab},
];
function mostraPasso(){const P=PASSOS[TREINO.passo],c=$('#treino');
  if(!P){c.innerHTML='<b>🏁 Tutorial completo!</b><span>Você já sabe voar. Agora é encarar os bots 😎</span><div><button id="tBots">🤖 SALA COM BOTS</button><button id="tMenu" class="sec">MENU</button></div>';
    $('#tBots').onclick=()=>{sair();$('#decolar').click();};$('#tMenu').onclick=sair;return;}
  c.innerHTML=`<small>${TREINO.passo+1}/${PASSOS.length}</small><b>${P.t}</b><span>${P.d}</span><i id="tExtra"></i>`+(TREINO.passo>0?'<a id="tPula">pular etapa ⏭️</a>':'');
  if($('#tPula'))$('#tPula').onclick=()=>{if(EU.vivo)avancaPasso();};}
function treino(dt){for(const [id,o] of OUT)if(id<0&&o.vivo)voaDrone(o,dt);misseisTreino(dt);
  const P=PASSOS[TREINO.passo];if(!P||!EU.vivo)return;
  if(TREINO.alvo&&EU.pos.distanceTo(TREINO.alvo.m.position)<60){TREINO.alvo.feito=true;TREINO.alvo.m.visible=false;SOM.acerto();
    TREINO.alvo=TREINO.aneis.find(A=>!A.feito)||null;}
  for(const A of TREINO.aneis)if(!A.feito)A.m.material.opacity=A===TREINO.alvo?0.55+0.4*Math.sin(performance.now()/180):0.35;
  const ex=P.tic?P.tic(dt):'';const e=$('#tExtra');if(e&&e.textContent!==ex)e.textContent=ex;
  if(P.ok())avancaPasso();}
function avancaPasso(){{SOM.ok();limpaAneis();TREINO.passo++;const N=PASSOS[TREINO.passo];if(N&&N.ini)N.ini();mostraPasso();
    const c=$('#treino');c.classList.remove('ok');void c.offsetWidth;c.classList.add('ok');}}
$('#bTreino').addEventListener('click',async()=>{SALA='treino';SOM.ini();$('#erro').textContent='';
  if(TOQUE){try{await document.documentElement.requestFullscreen?.();}catch(e){}try{await screen.orientation?.lock?.('landscape');}catch(e){}}
  if(ws)try{ws.onclose=null;ws.close();}catch(e){}ws=null;conectado=false;
  for(const o of OUT.values()){cena.remove(o.g);o.rot.remove();}OUT.clear();
  $('#menu').style.display='none';jogando=true;document.body.classList.add('jogando','treinando');
  EU.id=-1;EU.cor='#3cd070';EU.nome=CONTA?CONTA.nome:'Piloto';MINHA_BASE=0;ZONA=15200;LIMITE=20900;mostrarBases();corBandeiras([{base:0,cor:'#3cd070'}]);
  $('#placar').innerHTML='<div class="eu"><span>🎓 Tutorial de voo</span></div>';
  limpaAneis();TREINO.passo=0;mostraPasso();if(JATO)cena.remove(JATO);JATO=criarJato(EU.cor);nascer();$('#dicaDec').style.display='none';});
window.JJ={EU,OUT,PLACAR:()=>PLACAR,TREINO,ccip,BOMBV,BASES,envia,lead:()=>LEADD?_lp:null,BALAS,queda,morrer,JATO:()=>JATO,efeitosPasso:(n,dt)=>{for(let i=0;i<n;i++)efeitosQueda(dt);},nFX:()=>FX.length,efeitos:()=>({destrocos:DESTROCOS.map(D=>Math.round(D.pos.y)),pilotos:PILOTOS.length,para:PILOTOS.filter(P=>P.aberto).length,fumos:FUMOS.length,trilhaVis:[...TRILHAS.values()].some(T=>T.k>0.05)})};   // p/ testes headless

// (09/11) Esc sai da partida e volta ao menu
function sair(){for(const b of BOMBV.values())cena.remove(b.g);BOMBV.clear();ccip.visible=false;jogando=false;document.body.classList.remove('jogando','treinando');limpaAneis();
  if(ws){ws.onclose=null;try{ws.close();}catch(e){}ws=null;}conectado=false;EU.vivo=false;SOM.motor(0,false,false);
  for(const o of OUT.values()){cena.remove(o.g);o.rot.remove();}OUT.clear();for(const m of MISV.values())cena.remove(m.g);MISV.clear();
  if(JATO){cena.remove(JATO);JATO=null;}for(const k in TEC)TEC[k]=false;
  for(const id of['#mira','#seta','#trava','#alerta','#aviso','#morte','#dicaDec'])$(id).style.display='none';
  $('#placar').innerHTML='';$('#feed').innerHTML='';$('#erro').textContent='';$('#menu').style.display='flex';}
$('#bVisao').addEventListener('pointerdown',e=>{e.stopPropagation();trocaVisao();});
$('#bTrem').addEventListener('pointerdown',e=>{e.stopPropagation();e.preventDefault();trocaTrem();});
