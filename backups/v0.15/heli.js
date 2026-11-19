// (19/11) MODO HELICÓPTERO — ataque isométrico (gênero "helicóptero de ataque com câmera de cima"), offline como o tutorial.
// Carregado depois do jogo.js e usa as mesmas funções (cena, EU, OUT, relevo, visada, bala, misLocal, explosao, radarC...).
// Objetivos: destruir radares e estações SAM, afundar lanchas, resgatar pilotos com o guincho e levar p/ a base. Combustível acaba!
const HELI={on:false,vel:new V3(),vs:0,yaw:0,agl:32,comb:100,blind:100,vidas:3,bordo:0,salvos:0,tTiro:0,misAnt:false,tMorte:0,coisas:[],fogos:[],pausa:false,brief:false,mapa:null,pilotos:[],caixas:[],alvos:[],tGuincho:0,fim:false,idN:-5000,rotor:null,cauda:null};
const _hC1=new V3(),_hC2=new V3(),_hY=new V3(0,1,0),_hP=new V3(),_hT=new V3(),_hX=new V3(1,0,0),_hQ2=new QT();
const HELI_CASA=4, HELI_VMAX=72, HELI_CAP=8, HELI_CAM=new V3(-95,165,95);   // base de origem, ~260 km/h, pilotos a bordo, câmera isométrica

// ---------- modelo: helicóptero de ataque (cabine em tandem, asinhas com casulos, rotor de 4 pás), frente = +x, ~17 m
function criarHeliSimples(cor='#4d5a3c'){const g=new THREE.Group(),ve=M(cor,0.7),ve2=M('#3c4730',0.7),esc_=M('#22282b',0.6),vid=M('#1a2733',0.15),pre=M('#2b2f33',0.5);
  const fus=new THREE.Mesh(new THREE.CylinderGeometry(1.15,1.35,9,12),ve);fus.rotation.z=Math.PI/2;fus.scale.set(1,1,0.8);fus.position.set(1.5,1.6,0);g.add(fus);
  esf(1.15,ve,6.2,1.4,0,g,1.6,0.9,0.8);                                                         // nariz
  const cab=new THREE.Mesh(new THREE.CylinderGeometry(0.85,1.05,5,10),vid);cab.rotation.z=Math.PI/2;cab.scale.set(1,1,0.8);cab.position.set(3.6,2.6,0);g.add(cab);   // cabine em tandem
  box(0.25,1.1,1.5,ve,2.4,2.8,0,g);box(0.25,1.1,1.5,ve,4.7,2.8,0,g);                              // molduras
  const cone=new THREE.Mesh(new THREE.CylinderGeometry(0.35,1.05,8.5,10),ve);cone.rotation.z=Math.PI/2;cone.position.set(-6.8,1.9,0);g.add(cone);   // cone de cauda
  box(1.4,3.6,0.25,ve2,-11,3.4,0,g).rotation.z=-0.3;box(2.6,0.15,3.4,ve2,-10.4,1.9,0,g);         // deriva + estabilizador
  box(3.2,1.3,3.6,ve,0.2,2.9,0,g);for(const z of[-1,1]){cil(0.55,0.6,2.4,pre,0.6,2.9,z*1.6,g,10).rotation.z=Math.PI/2;}   // motores nas laterais
  for(const z of[-1,1]){box(1.6,0.2,2.6,ve2,1.2,1.4,z*2.1,g);                                     // asinhas
    for(const k of[-1,1]){const c=cil(0.32,0.32,2.2,ve2,1.1,0.9,z*(2.1+k*0.75),g,8);c.rotation.z=Math.PI/2;}}   // casulos de foguete
  for(const z of[-1,1])cil(0.35,0.35,0.3,esc_,3.2,0.35,z*1.1,g,10).rotation.x=Math.PI/2;cil(0.25,0.25,0.25,esc_,-8.6,0.9,0,g,8).rotation.x=Math.PI/2;   // rodas
  const tor=new THREE.Group();tor.position.set(6.4,0.75,0);g.add(tor);esf(0.42,pre,0,0,0,tor);const cn=cil(0.13,0.13,2,pre,1.1,0,0,tor,6);cn.rotation.z=Math.PI/2;   // canhão giratório no queixo
  g.userData.torre=tor;
  cil(0.25,0.25,1.1,pre,0.4,4.1,0,g,8);                                                         // mastro do rotor
  const rotor=new THREE.Group();rotor.position.set(0.4,4.7,0);g.add(rotor);esf(0.4,pre,0,0,0,rotor);
  const pa=new THREE.MeshStandardMaterial({color:0x1d2124,roughness:0.6,transparent:true,opacity:0.85});
  for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(7.2,0.08,0.45),pa);b.position.x=3.6;const h=new THREE.Group();h.rotation.y=i*Math.PI/2;h.add(b);rotor.add(h);}
  const disco=new THREE.Mesh(new THREE.CircleGeometry(7.3,32),new THREE.MeshBasicMaterial({color:0x222222,transparent:true,opacity:0.12,depthWrite:false,side:THREE.DoubleSide}));disco.rotation.x=-Math.PI/2;rotor.add(disco);
  const cauda=new THREE.Group();cauda.position.set(-11.3,3.6,0.35);g.add(cauda);for(let i=0;i<2;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.15,2.6,0.2),pa);b.rotation.x=i*Math.PI/2;cauda.add(b);}
  g.userData.rotor=rotor;g.userData.cauda=cauda;g.scale.setScalar(1.5);cena.add(g);return g;}   /* 1,5x: aparece melhor de cima */

// ---------- (19/11) AH-2 Sabre (Mi-35M da FAB): modelo 3D de 42manako (Sketchfab, CC-BY-4.0), convertido por scripts/mi35/converter.py -> mi35.js (carrega sob demanda)
const SABRE_INV={value:new THREE.Matrix4()};let SABRE_GEO=null,SABRE_CARREGANDO=false;
function sabreCamo(){const m=new THREE.MeshStandardMaterial({color:0xffffff,roughness:0.75});   // camuflagem FAB: ruído 3D no referencial do helicóptero (não escorrega quando voa)
  m.onBeforeCompile=s=>{const C=c=>({value:new THREE.Color(c).convertSRGBToLinear()});Object.assign(s.uniforms,{cA:C('#56653f'),cB:C('#8b7b56'),cC:C('#353d2e'),cG:C('#8f979a'),uInv:SABRE_INV});
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vOP;uniform mat4 uInv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOP=(uInv*modelMatrix*vec4(position,1.0)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('#include <common>',`#include <common>
varying vec3 vOP;uniform vec3 cA,cB,cC,cG;
float h3(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
float n3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
 return mix(mix(mix(h3(i),h3(i+vec3(1,0,0)),f.x),mix(h3(i+vec3(0,1,0)),h3(i+vec3(1,1,0)),f.x),f.y),mix(mix(h3(i+vec3(0,0,1)),h3(i+vec3(1,0,1)),f.x),mix(h3(i+vec3(0,1,1)),h3(i+vec3(1,1,1)),f.x),f.y),f.z);}`)
     .replace('vec4 diffuseColor = vec4( diffuse, opacity );',`vec3 q=vOP*0.3;float a=n3(q)+0.5*n3(q*2.1+7.3),b=n3(q+vec3(31.,7.,13.))+0.5*n3(q*2.3+3.1);
 vec3 cc=cA;if(a>0.8)cc=cB;if(b>0.86)cc=cC;if(vOP.y<1.15&&vOP.x>-3.5)cc=cG;vec4 diffuseColor=vec4(cc,opacity);`);};
  return m;}
function sabreGeo(){if(SABRE_GEO)return SABRE_GEO;const d=window.MI35;if(!d)return null;const b64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
  const p=new Int16Array(b64(d.pos).buffer),nn=new Int8Array(b64(d.nor).buffer),ix=d.i32?new Uint32Array(b64(d.idx).buffer):new Uint16Array(b64(d.idx).buffer),pt=b64(d.parte);
  const pos=new Float32Array(p.length),nor=new Float32Array(nn.length);for(let i=0;i<p.length;i++){pos[i]=p[i]/1000;nor[i]=nn[i]/127;}
  const pa=new THREE.BufferAttribute(pos,3),na=new THREE.BufferAttribute(nor,3),L=[[],[],[],[],[],[],[]];for(let t=0;t<ix.length;t+=3)L[pt[ix[t]]].push(ix[t],ix[t+1],ix[t+2]);
  return SABRE_GEO=L.map(l=>{const g=new THREE.BufferGeometry();g.setAttribute('position',pa);g.setAttribute('normal',na);g.setIndex(l);g.computeBoundingSphere();return g;});}
function carregaSabre(){if(SABRE_CARREGANDO||window.MI35)return;SABRE_CARREGANDO=true;const s=document.createElement('script');s.src='mi35.js';
  s.onload=()=>{if(SALA==='heli'&&HELI.on&&JATO&&JATO.userData.simples){const n=criarHeli();n.position.copy(JATO.position);n.quaternion.copy(JATO.quaternion);n.visible=JATO.visible;cena.remove(JATO);JATO=n;}};
  document.head.appendChild(s);}
function criarHeli(){const G_=sabreGeo();if(!G_){carregaSabre();const g=criarHeliSimples();g.userData.simples=true;return g;}
  const g=new THREE.Group(),d=window.MI35,pa=new THREE.MeshStandardMaterial({color:0x2a2e30,roughness:0.6,side:THREE.DoubleSide});
  const mt=[sabreCamo(),new THREE.MeshStandardMaterial({color:0x5d7a8c,roughness:0.05,metalness:0.5,transparent:true,opacity:0.65,side:THREE.DoubleSide}),M('#3a4136',0.6),M('#22262a',0.9)];
  for(let i=0;i<4;i++)g.add(new THREE.Mesh(G_[i],mt[i]));g.add(new THREE.Mesh(G_[6],M('#141414',0.9)));   // rodas pretas
  const rotor=new THREE.Group();rotor.position.fromArray(d.rotor);g.add(rotor);const mr=new THREE.Mesh(G_[4],pa);mr.position.fromArray(d.rotor).negate();rotor.add(mr);
  const disco=new THREE.Mesh(new THREE.CircleGeometry(8.6,32),new THREE.MeshBasicMaterial({color:0x222222,transparent:true,opacity:0.1,depthWrite:false,side:THREE.DoubleSide}));disco.rotation.x=-Math.PI/2;rotor.add(disco);
  const cauda=new THREE.Group();cauda.position.fromArray(d.cauda);g.add(cauda);const mc=new THREE.Mesh(G_[5],pa);mc.position.fromArray(d.cauda).negate();cauda.add(mc);
  // marcas da FAB coladas no casco (raio de fora p/ dentro acha a superfície)
  const fus=g.children[0],rc=new THREE.Raycaster(),_a=new V3(),cola=(x,y,z,obj)=>{rc.set(new V3(x,y,z*6),new V3(0,0,-Math.sign(z)));const h=rc.intersectObject(fus)[0];if(!h)return;
    obj.position.copy(h.point).addScaledVector(h.face.normal,0.03);obj.lookAt(_a.copy(h.point).add(h.face.normal));g.add(obj);};
  for(const z of[-1,1]){const c=new THREE.Group();[['#1e8a3c',0.6],['#f2c230',0.43],['#1f4fa8',0.27],['#ffffff',0.09]].forEach(([k,r],i)=>{const dd=new THREE.Mesh(new THREE.CircleGeometry(r,24),M(k,0.6));dd.position.z=i*0.006;c.add(dd);});cola(-4.6,2.6,z,c);
    const f=new THREE.Group();box(0.5,0.9,0.01,M('#1e8a3c',0.6),-0.25,0,0,f);box(0.5,0.9,0.01,M('#f2c230',0.6),0.25,0,0,f);cola(-12.2,4.2,z,f);}
  const tor=new THREE.Group();tor.position.set(7.2,0.9,0);g.add(tor);   // ponto do canhão do nariz (a torre gira invisível: o tiro sai dela)
  g.userData.rotor=rotor;g.userData.cauda=cauda;g.userData.torre=tor;g.scale.setScalar(1.4);cena.add(g);return g;}   /* 1,4x: aparece melhor de cima */

// ---------- objetos do mapa
// (19/11) piloto abatido em escala real (1,8 m × 1,4 = mesma escala do Sabre): macacão de voo verde, colete, capacete, acenando com os 2 braços
// por cima da cabeça; painel de sinalização laranja no chão e fumaça laranja (o facho e o anel continuam p/ achar de longe)
function heliMilitar(){const h=new THREE.Group(),mac=M('#5b6b45',0.9),col=M('#3b4630',0.85),bot=M('#1c1c1a',0.8),pele=M('#c99470',0.8),cap=M('#c3c7c0',0.5),vis=M('#1d2a33',0.2),luv=M('#2b2b26',0.9);
  for(const z of[-0.1,0.1]){box(0.27,0.11,0.12,bot,0.04,0.055,z,h);cil(0.07,0.065,0.42,mac,0,0.32,z,h,8);cil(0.08,0.07,0.42,mac,0,0.74,z,h,8);}   // botas, canelas, coxas
  box(0.2,0.12,0.36,col,0,0.98,0,h);box(0.22,0.5,0.38,mac,0,1.2,0,h);box(0.25,0.32,0.4,col,0.01,1.24,0,h);   // quadril, tronco, colete
  box(0.05,0.12,0.14,M('#d8c040',0.6),0.14,1.3,0.08,h);box(0.04,0.06,0.18,M('#2f5f9f',0.7),0.13,1.4,-0.1,h);   // rádio + bandeirinha
  cil(0.05,0.06,0.08,pele,0,1.49,0,h,8);esf(0.105,pele,0,1.6,0,h);esf(0.125,cap,-0.01,1.64,0,h,1,0.95,1);box(0.04,0.07,0.17,vis,0.11,1.63,0,h);   // pescoço, cabeça, capacete, viseira
  const bracos=[];for(const z of[-1,1]){const o=new THREE.Group();o.position.set(0,1.42,z*0.23);h.add(o);cil(0.055,0.05,0.3,mac,0,-0.15,0,o,8);
    const c=new THREE.Group();c.position.y=-0.3;o.add(c);cil(0.05,0.045,0.28,mac,0,-0.14,0,c,8);esf(0.05,luv,0,-0.3,0,c);bracos.push({o,c,z});}
  h.userData.bracos=bracos;h.scale.setScalar(1.4);return h;}
function heliPiloto(){const g=new THREE.Group();const mil=heliMilitar();g.add(mil);g.userData.mil=mil;
  const pan=box(2.6,0.04,0.9,M('#ff6a1a',0.8),3.2,0.03,1.6,g);pan.rotation.y=0.6;box(0.32,0.5,0.32,M('#3b4630',0.8),1.4,0.25,-1.2,g);   // painel de sinalização + mochila de sobrevivência
  g.userData.lata=new V3(-1.6,0.2,1.2);const lata=cil(0.07,0.07,0.3,M('#e06a20',0.6),-1.6,0.15,1.2,g,8);lata.rotation.z=1.4;   // lata de fumaça
  const raio=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,60,8,1,true),new THREE.MeshBasicMaterial({color:0xffb030,transparent:true,opacity:0.35,depthWrite:false,side:THREE.DoubleSide}));raio.position.set(-1.6,30,1.2);g.add(raio);   /* facho sai da lata de fumaça, não do militar */
  const fum=new THREE.Mesh(new THREE.RingGeometry(4,5,24),new THREE.MeshBasicMaterial({color:0xffb030,transparent:true,opacity:0.7,side:THREE.DoubleSide}));fum.rotation.x=-Math.PI/2;fum.position.y=0.3;g.add(fum);
  const anel=g.children[g.children.length-1];g.userData.anel=anel;g.userData.raio=raio;raio.material.opacity=0.22;cena.add(g);return g;}
function heliCaixa(tipo){const g=new THREE.Group();
  if(tipo==='comb'){cil(1.1,1.1,2.4,M('#c0392b',0.5),0,1.2,0,g,12);cil(1.12,1.12,0.2,M('#e8e8e8',0.5),0,1.8,0,g,12);}
  else if(tipo==='mun'){box(3,1.6,2,M('#556b2f',0.8),0,0.8,0,g);box(3.05,0.3,2.05,M('#c9b037',0.6),0,1.2,0,g);}
  else{box(2.4,2.4,2.4,M('#f0f0f0',0.6),0,1.2,0,g);box(1.6,0.5,2.45,M('#d32f2f',0.6),0,1.2,0,g);box(0.5,1.6,2.45,M('#d32f2f',0.6),0,1.2,0,g);}
  const anel=new THREE.Mesh(new THREE.RingGeometry(5,5.8,24),new THREE.MeshBasicMaterial({color:tipo==='comb'?0xff5040:tipo==='mun'?0xd8c040:0xffffff,transparent:true,opacity:0.6,side:THREE.DoubleSide}));anel.rotation.x=-Math.PI/2;anel.position.y=0.3;g.add(anel);
  cena.add(g);return g;}
function heliAA(){const g=new THREE.Group(),o=M('#5d6b4a',0.8),e=M('#2f363c',0.6);cil(2.2,2.6,1.6,o,0,0.8,0,g,10);const t=new THREE.Group();t.position.y=2;g.add(t);
  box(2.2,1.4,2.4,o,0,0.4,0,t);for(const z of[-0.5,0.5]){const c=cil(0.15,0.15,3.6,e,1.6,1,z,t,6);c.rotation.z=Math.PI/2-0.5;}g.userData.torre=t;cena.add(g);return g;}

function heliPonto(r0,r1,terra,rng){for(let i=0;i<300;i++){const a=rng()*Math.PI*2,r=r0+rng()*(r1-r0),x=Math.cos(a)*r,z=Math.sin(a)*r,h=relevo(x,z);
    if(terra?(h>6&&h<380):h<0.5){let plano=true;for(const [dx,dz] of[[12,0],[-12,0],[0,12],[0,-12]])if(Math.abs(relevo(x+dx,z+dz)-h)>9)plano=false;if(plano||!terra)return new V3(x,Math.max(0,h),z);}}
  return new V3(0,0,0);}
// (19/11) piloto abatido longe de TODAS as bases (senão pega e entrega na hora) e longe dos outros pilotos: das ilhas, a mais afastada
// altura do chão DESENHADO (a malha é mais grosseira que relevo(): sem isso o militar afunda ou flutua na encosta)
const _rcC=new THREE.Raycaster();function chaoMalha(x,z){_rcC.set(_hC1.set(x,3000,z),_hC2.set(0,-1,0));const ilhas=cena.children.filter(o=>o.userData.ilha);const h=_rcC.intersectObjects(ilhas)[0];return h?h.point.y:relevo(x,z);}
function heliPontoResgate(rng){const bases=BASES.filter(B=>Math.hypot(B.x,B.z)<9000);let melhor=null,nota=-1;
  for(let k=0;k<70;k++){const p=heliPonto(1500,6800,true,rng);if(!p.lengthSq())continue;
    const dB=Math.min(...bases.map(B=>Math.hypot(B.x-p.x,B.z-p.z))),dP=Math.min(1e9,...HELI.pilotos.map(o=>o.p.distanceTo(p)));
    if(dP<1300||[[6,0],[-6,0],[0,6],[0,-6]].some(([dx,dz])=>Math.abs(relevo(p.x+dx,p.z+dz)-p.y)>1.2))continue;   /* só lugar plano (o militar e o painel no chão) */const n=dB+0.3*Math.min(dP,3000);if(dB>2200&&n>nota){nota=n;melhor=p;}}
  return melhor||heliPonto(1500,6800,true,rng);}
function heliAlvo(nome,cor,g,p,vida,tipo){const id=HELI.idN--,o={g,pos:p.clone(),vel:new V3(),q:new QT(),alvoP:p.clone(),alvoQ:new QT(),tRec:performance.now(),vida,vidaMax:vida,vivo:true,
    nome,cor,navio:true,esc:1,tipo,t:0,id};g.position.copy(p);g.visible=true;
  o.rot=document.createElement('div');o.rot.className='rot';o.rot.innerHTML='<span></span><b><i></i></b>';o.rot.style.color=cor;$('#rotulos').appendChild(o.rot);
  OUT.set(id,o);HELI.alvos.push(o);return o;}

// ---------- começar / sair
function heliIniciar(){const rng=rnd(4242);HELI.on=true;HELI.fim=false;HELI.vidas=3;HELI.salvos=0;HELI.bordo=0;HELI.alvos=[];HELI.pilotos=[];HELI.caixas=[];HELI.coisas=[];HELI.fogos=[];HELI.mapa=null;HELI.pausa=false;
  for(let i=0;i<3;i++){const p=heliPonto(1500,5200,true,rng);heliAlvo(`📡 Radar ${i+1}`,'#ff7f2a',(i%2?radarB:radarA)('#ff7f2a'),p,60,'radar');}
  for(let i=0;i<2;i++){const p=heliPonto(2000,5500,true,rng);const o=heliAlvo(`🚀 SAM ${i+1}`,'#ff3b30',radarC('#ff3b30'),p,80,'sam');o.tSam=4+i*2;}
  for(let i=0;i<6;i++){const p=heliPonto(800,6000,true,rng);const g=heliAA();const o=heliAlvo(`🔫 Antiaérea ${i+1}`,'#e8443a',g,p,40,'aa');}
  for(let i=0;i<2;i++){const p=heliPonto(1500,4500,false,rng);const o=heliAlvo(`🚤 Lancha ${i+1}`,'#e8443a',navioB('#8a96a8'),p,120,'lancha');o.g.scale.setScalar(0.45);o.c=p.clone();o.ang=rng()*6;}
  for(const o of HELI.alvos)cena.add(o.g);
  for(let i=0;i<4;i++){const p=heliPontoResgate(rng);const g=heliPiloto();g.position.copy(p);g.rotation.y=rng()*6.28;g.updateMatrixWorld();
    for(const c of g.children){if(c===g.userData.raio)continue;c.getWorldPosition(_v1);const ch=chaoMalha(_v1.x,_v1.z);c.position.y+=ch-p.y;}   /* tudo em cima do chão (encosta) */
    g.userData.lata.y+=chaoMalha(...(()=>{_v1.copy(g.userData.lata).applyAxisAngle(_hY,g.rotation.y).add(p);return[_v1.x,_v1.z];})())-p.y;
    HELI.pilotos.push({g,p,ok:false});}
  for(const [tipo,n] of[['comb',4],['mun',3],['blind',2]])for(let i=0;i<n;i++){const p=heliPonto(900,5600,true,rng);const g=heliCaixa(tipo);g.position.copy(p);HELI.caixas.push({g,p,tipo,ok:false});}
  heliNascer();setTimeout(()=>heliMapaAbre(true),300);}
function heliNascer(){const B=BASES[HELI_CASA];EU.pos.set(B.x,BASE_H+30,B.z);HELI.yaw=Math.atan2(B.z,-B.x);HELI.vel.set(0,0,0);HELI.vs=0;HELI.comb=100;EU.vida=100;HELI.bordo=0;
  BALAS_N=1200;MUN=8;BOMBAS=0;EU.vivo=true;EU.vel=0;EU.turbo=1;JATO.visible=true;document.body.classList.remove('morto');$('#morte').style.display='none';TRAVA.id=0;TRAVA.t=0;
  EU.q.setFromAxisAngle(_v1.set(0,1,0),HELI.yaw);}
function heliSair(){if(!HELI.on)return;HELI.on=false;for(const p of HELI.pilotos)cena.remove(p.g);for(const c of HELI.caixas)cena.remove(c.g);for(const c of HELI.coisas)cena.remove(c);for(const o of HELI.alvos)cena.remove(o.g);HELI.pausa=false;$('#heliMapa').style.display='none';
  for(const m of TREINO.mis){cena.remove(m.g);MISV.delete(m.id);}TREINO.mis.length=0;document.body.classList.remove('heli');$('#heliMsg').style.display='none';$('#fimMis').style.display='none';}
let tHeliMsg=0;function heliMsg(t,ms=4000){const e=$('#heliMsg');e.innerHTML=t;e.style.display='block';clearTimeout(tHeliMsg);tHeliMsg=setTimeout(()=>e.style.display='none',ms);}

// ---------- dano
function heliAcerto(id,o){fx(o.pos,0xffd070,7,0.25,2);SOM.acerto();tAcerto=0.15;o.vida-=o.tipo==='lancha'?6:8;if(o.vida<=0)heliDestroi(o);}
function heliMissilAcertou(o){o.vida-=100;if(o.vida<=0)heliDestroi(o);}
function heliDestroi(o){if(!o.vivo)return;o.vivo=false;o.rot.style.display='none';if(o.aq)o.aq.style.display='none';explosao(_v1.copy(o.pos).setY(o.pos.y+6),true);
  const F={p:o.pos.clone().setY(o.pos.y+FOGO_ALT[o.tipo]),t:0,e:0,esc:FOGO_TAM[o.tipo],tv:0};HELI.fogos.push(F);
  if(o.tipo==='lancha')o.afunda={t:0,v:9,ex:0.6,lado:Math.random()<0.5?-1:1,F};else heliCarboniza(o);
  for(let i=0;i<5;i++)fx(_v2.copy(o.pos).add(_v3.set((Math.random()-0.5)*20,4+i*5,(Math.random()-0.5)*20)),0x333333,30,3+i,2,false,6);
  const n={radar:'Radar destruído! 📡',sam:'Estação SAM destruída! 🚀',aa:'Antiaérea destruída!',lancha:'Lancha atingida! Está afundando… 🚤🔥'}[o.tipo];heliMsg('✅ '+n,2200);heliChecaFim();}
function heliDano(d){if(!EU.vivo)return;EU.vida-=d*(HELI.blind>0?1:1);$('#dor').style.opacity=0.8;setTimeout(()=>$('#dor').style.opacity=0,180);SOM.dor();
  if(EU.vida<=0){EU.vida=0;heliCaiu('💥 Abatido!');}}
function heliCaiu(txt){if(!EU.vivo)return;HELI.vidas--;HELI.tMorte=performance.now();HELI.bordo=0;morrer(null,true);
  $('#morte').innerHTML=txt+`<small>${HELI.vidas>0?'helicópteros restantes: '+'🚁'.repeat(HELI.vidas):'acabaram os helicópteros'}</small>`;
  for(const p of HELI.pilotos)if(p.aBordo){p.aBordo=false;p.g.visible=true;}}
function heliChecaFim(){const vivos=HELI.alvos.filter(o=>o.vivo&&(o.tipo==='radar'||o.tipo==='sam')).length;
  if(!vivos&&HELI.salvos>=HELI.pilotos.length&&!HELI.fim){HELI.fim=true;heliFim(true);}}
function heliFim(ok){const box=$('#fimMis');const est=ok?1+(HELI.vidas>=3?1:0)+(HELI.alvos.every(o=>!o.vivo)?1:0):0;
  box.innerHTML=`<div class="card"><small class="mk">MODO HELICÓPTERO</small><h2>${ok?'🏆 Operação concluída!':'❌ Fim de jogo'}</h2>
    ${ok?`<div class="fe">${'⭐'.repeat(est)}<i>${'☆'.repeat(3-est)}</i></div><div class="fl"><div>✅ Radares, SAMs e pilotos</div><div>${HELI.vidas>=3?'✅':'▫️'} Sem perder helicóptero</div><div>${HELI.alvos.every(o=>!o.vivo)?'✅':'▫️'} Destruiu tudo (antiaéreas e lanchas também)</div></div>`
       :'<p>Acabaram os helicópteros.</p>'}
    <button id="hDeNovo">🔁 JOGAR DE NOVO</button><button id="hMenu" class="sec">MENU</button></div>`;
  setTimeout(()=>box.style.display='flex',1500);$('#hDeNovo').onclick=()=>{sair();iniciaHeli();};$('#hMenu').onclick=()=>{sair();};}

// ---------- quadro a quadro
const _hF=new V3(),_hR=new V3(),_hD=new V3(),_hQ=new QT(),_hE=new THREE.Euler(0,0,0,'YXZ');
function heliPasso(dt){if(!HELI.on||HELI.pausa)return;const agora=performance.now();heliFogos(dt);heliAfunda(dt);
  // rotor sempre girando (mais devagar morto)
  const ud=JATO&&JATO.userData;if(ud&&ud.rotor){ud.rotor.rotation.y+=dt*(EU.vivo?28:4);ud.cauda.rotation.z+=dt*(EU.vivo?45:5);}
  misseisTreino(dt);
  if(!EU.vivo){if(!HELI.fim&&agora-HELI.tMorte>3500){if(HELI.vidas>0)heliNascer();else{HELI.fim=true;heliFim(false);}}return;}
  // controle relativo à tela (câmera isométrica): frente = p/ onde a câmera olha, no chão
  _hF.copy(HELI_CAM).negate().setY(0).normalize();_hR.set(-_hF.z,0,_hF.x);
  const ix=((TEC.KeyD||TEC.ArrowRight)?1:0)-((TEC.KeyA||TEC.ArrowLeft)?1:0)+(JOY.x||0),iy=((TEC.KeyW||TEC.ArrowUp)?1:0)-((TEC.KeyS||TEC.ArrowDown)?1:0)-(JOY.y||0);
  _hD.copy(_hF).multiplyScalar(iy).addScaledVector(_hR,ix);if(_hD.lengthSq()>1)_hD.normalize();
  // (19/11) ALTITUDE MANTIDA (não segue mais o relevo): E/🔥 sobe, C/🪂 desce, solto = segura a altura.
  // Subir pede potência: devagar (13 m/s), tira velocidade e gasta mais combustível; descer é a 9 m/s. O morro é obstáculo: bate e machuca.
  const agl=EU.pos.y-Math.max(0,relevo(EU.pos.x,EU.pos.z));   /* (19/11) mais rápido p/ jogabilidade: sobe 20, desce 15; perto do chão (<25 m) a descida amacia p/ 6 m/s */
  const vsAlvo=(TEC.KeyE||BT.turbo)?20:(TEC.KeyC||BT.freio)?(agl<25?-6:-15):0;HELI.vs+=(vsAlvo-HELI.vs)*Math.min(1,(vsAlvo>HELI.vs?2.2:3)*dt);
  const subindo=Math.max(0,HELI.vs)/20,k=1-Math.exp(-1.8*dt);HELI.vel.lerp(_v1.copy(_hD).multiplyScalar(HELI_VMAX*(1-0.4*subindo)),k);
  const vh0=Math.hypot(HELI.vel.x,HELI.vel.z),nx=EU.pos.x+HELI.vel.x*dt,nz=EU.pos.z+HELI.vel.z*dt;
  const chN=Math.max(0,relevo(nx,nz),vh0>1?relevo(nx+HELI.vel.x/vh0*10,nz+HELI.vel.z/vh0*10)-2:0)+2;   // chão sob o helicóptero e sob o disco do rotor à frente
  if(chN>EU.pos.y+0.5&&vh0>3){   // encosta na frente mais alta que o helicóptero: bate
    if(vh0>14&&performance.now()-(HELI.tBate||0)>800){HELI.tBate=performance.now();heliDano(Math.min(30,vh0*0.35));heliMsg('💥 Bateu no morro! Suba antes (E / 🔥)',2500);fx(_v1.copy(EU.pos).addScaledVector(HELI.vel,0.15),0xb39872,10,1,2,false,2);}
    HELI.vel.multiplyScalar(-0.25);}
  else{EU.pos.x=nx;EU.pos.z=nz;}
  EU.pos.y=Math.min(900,EU.pos.y+HELI.vs*dt);
  const chao=Math.max(0,relevo(EU.pos.x,EU.pos.z))+2;
  if(EU.pos.y<chao){if(HELI.vs<-7&&performance.now()-(HELI.tBate||0)>800){HELI.tBate=performance.now();heliDano(Math.min(40,(-HELI.vs-7)*8));heliMsg('💥 Pouso duro!',1800);}
    EU.pos.y=chao;if(HELI.vs<0)HELI.vs=0;}
  // aviso de terreno: morro à frente nos próximos ~3 s acima da altura atual
  if(vh0>15){const ah=Math.max(relevo(EU.pos.x+HELI.vel.x*1.5,EU.pos.z+HELI.vel.z*1.5),relevo(EU.pos.x+HELI.vel.x*3,EU.pos.z+HELI.vel.z*3));
    if(ah+4>EU.pos.y&&agora-(HELI.tAvisoT||0)>1200){HELI.tAvisoT=agora;heliMsg("⚠️ MORRO À FRENTE — SUBA! (E / 🔥)",1100);}}
  const sp=Math.hypot(HELI.vel.x,HELI.vel.z);EU.vel=sp;
  // nariz vira p/ onde está indo (ou p/ o alvo travado quando parado)
  const ot=TRAVA.id&&OUT.get(TRAVA.id);let yawAlvo=HELI.yaw;
  if(sp>6)yawAlvo=Math.atan2(-HELI.vel.z,HELI.vel.x);else if(ot)yawAlvo=Math.atan2(-(ot.pos.z-EU.pos.z),ot.pos.x-EU.pos.x);
  let dy=((yawAlvo-HELI.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;HELI.yaw+=dy*Math.min(1,3*dt);
  /* (19/11) câmera trava atrás do nariz quando anda p/ frente (W / joystick p/ cima); arrastar a tela solta por 2 s */
  if(iy>0.2&&sp>10&&!_arr&&agora-(HCAM.tMan||0)>2000){const az=Math.PI-HELI.yaw,da=((az-HCAM.az+Math.PI*3)%(Math.PI*2))-Math.PI;HCAM.az+=da*Math.min(1,1.6*dt);heliCamAplica();}
  // inclina na direção do movimento (pitch p/ frente, roll na curva)
  const fwdV=HELI.vel.x*Math.cos(HELI.yaw)-HELI.vel.z*Math.sin(HELI.yaw);_hE.set(0,HELI.yaw,0);_hQ.setFromEuler(_hE);
  EU.q.copy(_hQ).multiply(_v4q.setFromEuler(_hE2.set(-dy*0.5,0,-fwdV/HELI_VMAX*0.28)));
  JATO.position.copy(EU.pos);JATO.quaternion.copy(EU.q);   // o modelo acompanha
  // combustível
  HELI.comb-=dt*100/300*(1+0.7*Math.max(0,HELI.vs)/20);EU.turbo=Math.max(0,HELI.comb/100);if(HELI.comb<=0){heliCaiu('⛽ Sem combustível!');return;}
  if(HELI.comb<20&&Math.floor(agora/600)%2)$('#aviso').style.display='block',$('#aviso').textContent='⛽ COMBUSTÍVEL ACABANDO! Pegue um barril vermelho';else if(HELI.comb>=20)$('#aviso').style.display='none';
  // trava (Hellfire): o mais perto na frente, só se já aparece na tela (19/11: antes travava fora da vista)
  let melhor=null,dm=1600;frente(EU.q,_v2).setY(0).normalize();
  for(const o of HELI.alvos){if(!o.vivo)continue;_v3.subVectors(o.pos,EU.pos);const d=_v3.length();_v3.y=0;_v3.normalize();_hP.copy(o.pos).project(cam);if(d<dm&&_v3.dot(_v2)>0.8&&Math.abs(_hP.x)<0.85&&Math.abs(_hP.y)<0.85&&_hP.z<1&&visada(EU.pos,_v1.copy(o.pos).setY(o.pos.y+10))){dm=d;melhor=o;}}
  if(!melhor){TRAVA.id=0;TRAVA.t=0;}else if(TRAVA.id!==melhor.id){TRAVA.id=melhor.id;TRAVA.t=0;}else TRAVA.t+=dt*1.6;
  // canhão giratório (19/11): a torre do queixo segue sozinha o alvo mais perto que aparece na tela (até 750 m, ±100° do nariz); sem alvo, aponta p/ frente
  let alvoC=null,dc=750;for(const o of HELI.alvos){if(!o.vivo)continue;_v3.subVectors(o.pos,EU.pos);const d=_v3.length();_v3.y=0;_v3.normalize();if(d>=dc||_v3.dot(_v2)<-0.2)continue;
    _hP.copy(o.pos).project(cam);if(Math.abs(_hP.x)<0.95&&Math.abs(_hP.y)<0.95&&_hP.z<1&&visada(EU.pos,_v1.copy(o.pos).setY(o.pos.y+6))){dc=d;alvoC=o;}}
  const tor=JATO.userData.torre;if(tor){JATO.updateMatrixWorld();if(alvoC)_hT.copy(alvoC.pos).setY(alvoC.pos.y+5);else _hT.copy(frente(EU.q,_v1)).multiplyScalar(160).add(EU.pos).setY(EU.pos.y-25);
    tor.parent.worldToLocal(_v1.copy(_hT));_v1.sub(tor.position).normalize();_v4q.setFromUnitVectors(_hX,_v1);tor.quaternion.slerp(_v4q,Math.min(1,dt*10));}
  HELI.tTiro-=dt;const fogo=TEC.Space||TEC.KeyJ||BT.fogo;
  if(fogo&&HELI.tTiro<=0&&BALAS_N>0){HELI.tTiro=0.09;BALAS_N--;const boca=tor?tor.localToWorld(_v1.set(2.2,0,0)):_v1.set(7.4,0.8,0).applyQuaternion(EU.q).add(EU.pos);
    const mira=tor?_v3.set(1,0,0).applyQuaternion(tor.getWorldQuaternion(_hQ2)).multiplyScalar(300).add(boca):_v3.copy(_hT);
    _v2.subVectors(mira,boca).normalize();_v2.x+=(Math.random()-0.5)*0.02;_v2.y+=(Math.random()-0.5)*0.02;_v2.z+=(Math.random()-0.5)*0.02;bala(boca,_v2.normalize().multiplyScalar(VEL_BALA),true);SOM.tiro(false);}
  // Hellfire: F/🚀 com trava
  const mis=TEC.KeyF||TEC.KeyR||BT.missil;if(mis&&!HELI.misAnt&&MUN>0&&melhor&&TRAVA.t>=1){MUN--;SOM.lanca(true);misLocal(_v1.set(0,-0.5,2.2).applyQuaternion(EU.q).add(EU.pos),frente(EU.q,_v2),melhor,90,300);}HELI.misAnt=mis;
  if((TEC.KeyX||BT.flare)&&agora>flarePronto)treinoFlare();
  // inimigos
  for(const o of HELI.alvos){if(!o.vivo)continue;o.tRec=agora;o.alvoP.copy(o.pos);const d=o.pos.distanceTo(EU.pos);
    if(o.tipo==='lancha'){o.ang+=dt*0.04;o.pos.set(o.c.x+Math.cos(o.ang)*350,0,o.c.z+Math.sin(o.ang)*350);if(relevo(o.pos.x,o.pos.z)>0.5)o.ang-=dt*0.08;o.g.position.copy(o.pos);
      o.q.setFromAxisAngle(_v1.set(0,1,0),-o.ang-Math.PI/2);o.alvoQ.copy(o.q);o.g.quaternion.copy(o.q);}
    if((o.tipo==='aa'||o.tipo==='lancha')&&d<900&&visada(_v1.copy(o.pos).setY(o.pos.y+4),EU.pos)){o.t-=dt;
      if(o.tipo==='aa'){const t=o.g.userData.torre;t.rotation.y=Math.atan2(-(EU.pos.z-o.pos.z),EU.pos.x-o.pos.x);}
      if(o.t<=0){o.t=0.16;const boca=_v1.copy(o.pos).setY(o.pos.y+4);_v2.subVectors(EU.pos,boca).normalize();_v2.x+=(Math.random()-0.5)*0.05;_v2.y+=(Math.random()-0.5)*0.05;_v2.z+=(Math.random()-0.5)*0.05;
        bala(boca,_v2.normalize().multiplyScalar(VEL_BALA),false);if(Math.random()<0.16*(1-d/900))heliDano(3);}}
    if(o.tipo==='sam'&&d<2400&&EU.pos.y-relevo(EU.pos.x,EU.pos.z)>12&&visada(_v1.copy(o.pos).setY(o.pos.y+20),EU.pos)){o.tSam-=dt;
      if(o.tSam<=0){o.tSam=7;SOM.lanca(d<1500);heliMsg('🚀 MÍSSIL! solte flare (X / ✨) ou se esconda atrás do morro',2500);const m=misLocal(_v1.copy(o.pos).setY(o.pos.y+12),_v2.set(0,1,0),EU,80,260);m.L.samHeli=true;}}}
  // pilotos: paire baixinho em cima (guincho)
  let guinchando=false;
  for(const p of HELI.pilotos){if(p.ok||p.aBordo)continue;const dh=Math.hypot(p.p.x-EU.pos.x,p.p.z-EU.pos.z),agl=EU.pos.y-p.p.y;
    if(dh<22&&agl<30&&sp<18&&HELI.bordo<HELI_CAP){guinchando=true;HELI.tGuincho+=dt;if(HELI.tGuincho>1.6){p.aBordo=true;p.g.visible=false;HELI.bordo++;HELI.tGuincho=0;SOM.ok();heliMsg(`🪝 Piloto a bordo! (${HELI.bordo}/${HELI_CAP}) Leve p/ a base`,2500);}}}
  if(!guinchando)HELI.tGuincho=0;else if(Math.floor(agora/250)%2)heliMsg(`🪝 Guinchando… ${Math.round(HELI.tGuincho/1.6*100)}% (fique parado e baixo)`,400);
  // entrega na base
  // (19/11) qualquer base amiga: entrega pilotos e, pairando baixo e devagar, reabastece/rearma/conserta aos poucos
  const B=BASES.find(B=>Math.hypot(B.x-EU.pos.x,B.z-EU.pos.z)<400)&&EU.pos.y-BASE_H<45?BASES.find(B=>Math.hypot(B.x-EU.pos.x,B.z-EU.pos.z)<400):null;
  if(B&&HELI.bordo){for(const p of HELI.pilotos)if(p.aBordo){p.aBordo=false;p.ok=true;}
    HELI.salvos+=HELI.bordo;heliMsg(`🏥 ${HELI.bordo} piloto${HELI.bordo>1?'s':''} entregue${HELI.bordo>1?'s':''}! (${HELI.salvos}/${HELI.pilotos.length})`,3000);HELI.bordo=0;SOM.ok();heliChecaFim();}
  if(B&&sp<20&&(HELI.comb<99.5||EU.vida<99.5||BALAS_N<1200||MUN<8)){HELI.comb=Math.min(100,HELI.comb+dt*30);EU.vida=Math.min(100,EU.vida+dt*25);BALAS_N=Math.min(1200,BALAS_N+Math.ceil(dt*500));
    HELI.tRearma=(HELI.tRearma||0)+dt;if(HELI.tRearma>0.6&&MUN<8){MUN++;HELI.tRearma=0;}
    if(Math.floor(agora/300)%2)heliMsg(`🛠️ Na base: ⛽ ${Math.round(HELI.comb)}% · 🛡️ ${Math.round(EU.vida)}% · 🚀 ${MUN}/8`,500);}
  // caixas
  for(const c of HELI.caixas){if(c.ok)continue;c.g.rotation.y+=dt;if(Math.hypot(c.p.x-EU.pos.x,c.p.z-EU.pos.z)<20&&EU.pos.y-c.p.y<30){c.ok=true;c.g.visible=false;SOM.ok();
    if(c.tipo==='comb'){HELI.comb=100;heliMsg('⛽ Tanque cheio!',2000);}else if(c.tipo==='mun'){BALAS_N=1200;MUN=8;heliMsg('🔫 Munição recarregada!',2000);}else{EU.vida=100;heliMsg('🛡️ Blindagem consertada!',2000);}}}
  for(const p of HELI.pilotos){if(p.ok||p.aBordo)continue;const u=p.g.userData;u.anel.scale.setScalar(1+0.25*Math.sin(agora/200));
    const d=p.p.distanceTo(EU.pos);if(d>3000)continue;const t=agora/1000,mil=u.mil;
    mil.rotation.y=Math.atan2(-(EU.pos.z-p.p.z),EU.pos.x-p.p.x)-p.g.rotation.y;   // vira p/ o helicóptero
    for(const B of mil.userData.bracos){const a=2.55+0.5*Math.sin(t*5.5);B.o.rotation.x=-B.z*a;B.c.rotation.x=-B.z*0.25;}   // acena c/ os 2 braços por cima da cabeça
    p.tF=(p.tF||0)+dt*(d<1600?7:3);while(p.tF>1){p.tF--;_v1.copy(u.lata).applyAxisAngle(_hY,p.g.rotation.y).add(p.p);
      fx(_v1.add(_v2.set((Math.random()-0.5)*0.6,0.4,(Math.random()-0.5)*0.6)),Math.random()<0.5?0xff7a22:0xff9a3a,2.5+Math.random()*2,3.5+Math.random()*1.5,4,false,4+Math.random()*3);}}
  // painel
  const radar=HELI.alvos.filter(o=>o.tipo==='radar'),sam=HELI.alvos.filter(o=>o.tipo==='sam');
  $('#placar').innerHTML=`<div class="eu obj"><span>📡 ${radar.filter(o=>!o.vivo).length}/${radar.length} · 🚀 ${sam.filter(o=>!o.vivo).length}/${sam.length} · 🪂 ${HELI.salvos}/${HELI.pilotos.length}${HELI.bordo?' (a bordo '+HELI.bordo+')':''} · ⛽ ${Math.round(HELI.comb)}% · 🚁×${HELI.vidas}</span></div>`;
  heliPoeira(dt);SOM.motor(60+sp+Math.max(0,HELI.vs)*6,false,true);}
const _v4q=new QT(),_hE2=new THREE.Euler(0,0,0,'XYZ');

// câmera isométrica: segue o helicóptero de longe, sempre do mesmo ângulo
// zoom (19/11): roda do mouse, + / - no teclado, pinça ou botões 🔍 no celular
let HELI_ZOOM=1;function heliZoom(f){HELI_ZOOM=Math.min(3,Math.max(0.45,HELI_ZOOM*f));}
addEventListener('wheel',e=>{if(SALA==='heli'&&HELI.on){heliZoom(e.deltaY>0?1.12:1/1.12);e.preventDefault();}},{passive:false});
addEventListener('keydown',e=>{if(SALA!=='heli'||!HELI.on)return;if(e.code==='Equal'||e.code==='NumpadAdd')heliZoom(1/1.15);else if(e.code==='Minus'||e.code==='NumpadSubtract')heliZoom(1.15);});
let _pinca=0;addEventListener('touchmove',e=>{if(SALA!=='heli'||!HELI.on||e.touches.length!==2){_pinca=0;return;}
  const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);if(_pinca)heliZoom(_pinca/d);_pinca=d;},{passive:true});
addEventListener('touchend',()=>{_pinca=0;});
for(const[id,f]of[['#bZoomMais',1/1.25],['#bZoomMenos',1.25]]){const b=$(id);if(b)b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();heliZoom(f);});}
// câmera livre (19/11): arraste na tela (metade direita no celular / qualquer lugar no PC) p/ girar e inclinar; 🎥 ou duplo clique volta ao padrão
const HCAM0={az:Math.atan2(95,-95),el:Math.atan2(165,Math.hypot(95,95)),R:Math.hypot(95,95,165)},HCAM={az:HCAM0.az,el:HCAM0.el};
function heliCamAplica(){const c=Math.cos(HCAM.el)*HCAM0.R;HELI_CAM.set(c*Math.cos(HCAM.az),Math.sin(HCAM.el)*HCAM0.R,c*Math.sin(HCAM.az));}
function heliCamPadrao(){HCAM.az=HCAM0.az;HCAM.el=HCAM0.el;heliCamAplica();}
let _arr=null;
addEventListener('pointerdown',e=>{if(SALA!=='heli'||!HELI.on||HELI.pausa||e.target.closest('button,#zonaJoy,#heliMapa,#fimMis,#menu'))return;_arr={id:e.pointerId,x:e.clientX,y:e.clientY};});
addEventListener('pointermove',e=>{if(!_arr||e.pointerId!==_arr.id||_pinca)return;const dx=e.clientX-_arr.x,dy=e.clientY-_arr.y;_arr.x=e.clientX;_arr.y=e.clientY;
  HCAM.tMan=performance.now();HCAM.az+=dx*0.006;HCAM.el=Math.min(1.45,Math.max(0.3,HCAM.el+dy*0.005));heliCamAplica();});
addEventListener('pointerup',e=>{if(_arr&&e.pointerId===_arr.id)_arr=null;});addEventListener('pointercancel',()=>{_arr=null;});
addEventListener('contextmenu',e=>{if(SALA==='heli')e.preventDefault();});
addEventListener('dblclick',e=>{if(SALA==='heli'&&HELI.on&&!e.target.closest('button,#heliMapa'))heliCamPadrao();});
$('#bCamPadrao').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();heliCamPadrao();});
function heliCamera(dt){if(JATO){JATO.updateMatrixWorld();SABRE_INV.value.copy(JATO.matrixWorld).invert();}   /* camuflagem presa ao helicóptero */
  const alvo=_v1.copy(EU.pos);cam.up.set(0,1,0);_v2.copy(alvo).addScaledVector(HELI_CAM,HELI_ZOOM);_v2.y=Math.max(_v2.y,relevo(_v2.x,_v2.z)+80,relevo((_v2.x+alvo.x)/2,(_v2.z+alvo.z)/2)+120);   /* não entra no morro */cam.position.lerp(_v2,Math.min(1,dt*4));if(cam.position.distanceTo(_v2)>600*HELI_ZOOM)cam.position.copy(_v2);
  else{_v3.subVectors(cam.position,alvo);const d=_v3.length(),dd=_v2.distanceTo(alvo);if(d>1)cam.position.copy(alvo).addScaledVector(_v3,dd/d);}   /* gira em volta sem encolher a distância */
  cam.lookAt(alvo);if(Math.abs(cam.fov-40)>0.5){cam.fov=40;cam.updateProjectionMatrix();}cam.updateMatrixWorld();}

function iniciaHeli(){SALA='heli';SOM.ini();$('#erro').textContent='';
  if(ws)try{ws.onclose=null;ws.close();}catch(e){}ws=null;conectado=false;
  for(const o of OUT.values()){cena.remove(o.g);o.rot.remove();o.aq?.remove();}OUT.clear();
  $('#menu').style.display='none';jogando=true;document.body.classList.add('jogando','heli');
  EU.id=-1;EU.cor='#4d5a3c';EU.nome=CONTA?CONTA.nome:'Piloto';MINHA_BASE=HELI_CASA;ZONA=15200;LIMITE=20900;mostrarBases();
  if(JATO)cena.remove(JATO);JATO=criarHeli();heliCamPadrao();heliIniciar();}
$('#bHeli').addEventListener('click',iniciaHeli);

// ---------- (19/11) DRAMA: destroços pegando fogo, lancha afundando devagar, poeira/spray do rotor
const FOGO_ALT={radar:8,sam:4,aa:3,lancha:5},FOGO_TAM={radar:1.4,sam:1.2,aa:0.8,lancha:1};
function heliCarboniza(o){   // escurece, tomba e "amassa" o que foi destruído (fica no mapa queimando)
  o.g.traverse(m=>{if(!m.isMesh)return;m.onBeforeRender=()=>{};const mt=m.material.clone();if(mt.color)mt.color.multiplyScalar(0.16);if(mt.emissive)mt.emissive.setRGB(0,0,0);m.material=mt;});
  o.g.scale.y*=o.tipo==='radar'?0.45:0.7;o.g.rotation.z+=(Math.random()-0.5)*0.25;o.g.rotation.x+=(Math.random()-0.5)*0.25;}
function heliFogos(dt){if(FX.length>700)return;
  for(const F of HELI.fogos){if(F.fim)continue;F.t+=dt;const d2=F.p.distanceToSquared(EU.pos);if(d2>3200*3200)continue;
    const k=F.vapor?Math.max(0,1-F.tv/30):F.t<25?1:Math.max(0.4,1-(F.t-25)/150);if(k<=0){F.fim=true;continue;}   // fogo diminui com o tempo mas não apaga
    F.e+=dt*(d2<1500*1500?16:6)*k;
    while(F.e>1){F.e--;const r=4*F.esc;
      if(!F.vapor&&Math.random()<0.45)fx(_v1.copy(F.p).add(_v2.set((Math.random()-0.5)*r,Math.random()*2,(Math.random()-0.5)*r)),Math.random()<0.5?0xff6a18:0xffb040,(2.5+Math.random()*4)*F.esc,0.45+Math.random()*0.4,0.5,true,5+Math.random()*5);
      else fx(_v1.copy(F.p).add(_v2.set((Math.random()-0.5)*r,2+Math.random()*3,(Math.random()-0.5)*r)),F.vapor?0xb8bcc0:(Math.random()<0.5?0x1e1e1e:0x3c3c3c),(5+Math.random()*5)*F.esc,4+Math.random()*2.5,3,false,8+Math.random()*6);}
    if(F.vapor)F.tv+=dt;}}
function heliAfunda(dt){   // lancha: perde velocidade, aderna, explosões secundárias, proa sobe e vai p/ o fundo (~16 s)
  for(const o of HELI.alvos){const A=o.afunda;if(!A||A.fim)continue;A.t+=dt;const u=A.t;
    A.v=Math.max(0,A.v-dt*1.4);o.ang+=dt*A.v/350;o.pos.set(o.c.x+Math.cos(o.ang)*350,0,o.c.z+Math.sin(o.ang)*350);o.q.setFromAxisAngle(_v1.set(0,1,0),-o.ang-Math.PI/2);
    const y=-Math.pow(Math.max(0,u-3)/12,2)*18;
    o.g.position.set(o.pos.x,y,o.pos.z);o.g.quaternion.copy(o.q).multiply(_v4q.setFromEuler(_hE2.set(A.lado*Math.min(0.5,u*0.045),0,Math.min(0.38,Math.max(0,u-5)*0.045))));
    A.F.p.set(o.pos.x,y+5,o.pos.z);if(y<-7&&!A.F.vapor){A.F.vapor=true;A.F.p.y=0.5;}
    A.ex-=dt;if(A.ex<=0&&u<11){A.ex=1+Math.random()*1.8;const p=_v3.copy(o.pos).add(_v2.set((Math.random()-0.5)*24,4,(Math.random()-0.5)*24));
      for(let i=0;i<5;i++)fx(_v1.copy(p).add(_v2.set((Math.random()-0.5)*8,Math.random()*6,(Math.random()-0.5)*8)),0xffa030,8+Math.random()*8,0.5,2.5);SOM.boom(o.pos.distanceTo(EU.pos)<1200);}
    if(u>3&&Math.random()<dt*14){const a=Math.random()*6.28;fx(_v1.set(o.pos.x+Math.cos(a)*14,0.6,o.pos.z+Math.sin(a)*14),0xe8f0f4,4+Math.random()*3,1.3,2,false,1.5);}   // borbulha e espuma em volta
    if(u>16){A.fim=true;o.g.visible=false;heliMsg('🌊 A lancha foi pro fundo!',2200);
      const mancha=new THREE.Mesh(new THREE.CircleGeometry(26,24),new THREE.MeshBasicMaterial({color:0x101418,transparent:true,opacity:0.45,depthWrite:false}));mancha.rotation.x=-Math.PI/2;mancha.position.set(o.pos.x,0.25,o.pos.z);cena.add(mancha);HELI.coisas.push(mancha);}}}
function heliPoeira(dt){   // rotor perto do chão/água levanta poeira ou spray (suba com E / 🔥 p/ evitar)
  const ch=relevo(EU.pos.x,EU.pos.z),agua=ch<0.5,h=EU.pos.y-Math.max(0,ch);if(h>50||FX.length>700){HELI.ePo=0;return;}
  const k=1-h/50;HELI.ePo=(HELI.ePo||0)+dt*70*k;
  while(HELI.ePo>1){HELI.ePo--;const a=Math.random()*Math.PI*2,r=3+Math.random()*9,x=EU.pos.x+Math.cos(a)*r,z=EU.pos.z+Math.sin(a)*r;
    fx(_v1.set(x,Math.max(0,relevo(x,z))+0.8,z),agua?0xeef5f9:0xb39872,(agua?3.5:5)+Math.random()*4,0.9+Math.random()*0.7,2.4,false,agua?0.5:1.5);
    const v=16+k*22;FX[FX.length-1].vel=new V3(Math.cos(a)*v,agua?6:3.5,Math.sin(a)*v);}}

// ---------- (19/11) MAPA + BRIEFING: prioritárias, resgate, secundárias (M / 🗺️ abre e pausa)
function heliMapaXY(x,z,T){const u=x*_hR.x+z*_hR.z,v=-(x*_hF.x+z*_hF.z);return[(u-T.cu)*T.s+T.W/2,(v-T.cv)*T.s+T.W/2];}
function heliMapaFundo(T){const c=document.createElement('canvas'),N=140;c.width=c.height=N;const g=c.getContext('2d'),img=g.createImageData(N,N);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const u=(i+0.5)/N*T.W,v=(j+0.5)/N*T.W,uu=(u-T.W/2)/T.s+T.cu,vv=(v-T.W/2)/T.s+T.cv;
    const x=uu*_hR.x-vv*_hF.x,z=uu*_hR.z-vv*_hF.z,h=relevo(x,z),o=(j*N+i)*4;let r,gg,b;
    if(h<0.5){const p=Math.min(1,-h/60);r=40-20*p;gg=110-50*p;b=160-40*p;}
    else if(h<6){r=196;gg=184;b=140;}else{const t=Math.min(1,h/420);r=84+90*t;gg=120+40*t;b=70+80*t;}
    img.data[o]=r;img.data[o+1]=gg;img.data[o+2]=b;img.data[o+3]=255;}
  g.putImageData(img,0,0);return c;}
function heliMapa(){const cv_=$('#hmCv'),W=cv_.width,g=cv_.getContext('2d');_hF.copy(HELI_CAM).negate().setY(0).normalize();_hR.set(-_hF.z,0,_hF.x);
  if(HELI.mapa&&HELI.mapa.az!==HCAM.az)HELI.mapa=null;   /* câmera girou: mapa gira junto (cima do mapa = W) */
  if(!HELI.mapa){const B=BASES[HELI_CASA],pts=[[B.x,B.z],...BASES.filter(B=>Math.hypot(B.x,B.z)<9000).map(B=>[B.x,B.z]),...HELI.alvos.map(o=>[o.c?o.c.x:o.pos.x,o.c?o.c.z:o.pos.z]),...HELI.pilotos.map(p=>[p.p.x,p.p.z]),...HELI.caixas.map(c=>[c.p.x,c.p.z])];
    let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const[x,z]of pts){const u=x*_hR.x+z*_hR.z,v=-(x*_hF.x+z*_hF.z);a=Math.min(a,u);b=Math.max(b,u);c=Math.min(c,v);d=Math.max(d,v);}
    const span=Math.max(b-a,d-c)+1400;HELI.mapa={cu:(a+b)/2,cv:(c+d)/2,s:W/span,W,az:HCAM.az};HELI.mapa.fundo=heliMapaFundo(HELI.mapa);}
  const T=HELI.mapa;g.imageSmoothingEnabled=true;g.drawImage(T.fundo,0,0,W,W);g.textAlign='center';g.textBaseline='middle';
  const icone=(x,z,em,tam,feito,cor)=>{const[px,py]=heliMapaXY(x,z,T);g.globalAlpha=feito?0.45:1;if(cor){g.fillStyle=cor;g.beginPath();g.arc(px,py,tam*0.75,0,7);g.fill();}
    g.font=`${tam}px sans-serif`;g.fillText(em,px,py+1);g.globalAlpha=1;if(feito){g.strokeStyle='#111';g.lineWidth=3;g.beginPath();g.moveTo(px-tam*0.6,py-tam*0.6);g.lineTo(px+tam*0.6,py+tam*0.6);g.moveTo(px+tam*0.6,py-tam*0.6);g.lineTo(px-tam*0.6,py+tam*0.6);g.stroke();}};
  for(const B of BASES)if(Math.hypot(B.x,B.z)<9000)icone(B.x,B.z,'🏠',22,false,'#2e7d32cc');
  for(const c of HELI.caixas)if(!c.ok)icone(c.p.x,c.p.z,c.tipo==='comb'?'⛽':c.tipo==='mun'?'🔫':'🛡️',13,false);
  for(const o of HELI.alvos){const pri=o.tipo==='radar'||o.tipo==='sam';icone(o.pos.x,o.pos.z,{radar:'📡',sam:'🚀',aa:'🔺',lancha:'🚤'}[o.tipo],pri?22:14,!o.vivo,pri&&o.vivo?'#ff3b30aa':null);}
  for(const p of HELI.pilotos)if(!p.ok&&!p.aBordo)icone(p.p.x,p.p.z,'🪂',19,false,'#ffb030aa');
  const[px,py]=heliMapaXY(EU.pos.x,EU.pos.z,T),f=frente(EU.q,_v2),ang=Math.atan2(-(f.x*_hF.x+f.z*_hF.z),f.x*_hR.x+f.z*_hR.z);
  g.save();g.translate(px,py);g.rotate(ang);g.fillStyle='#fff';g.strokeStyle='#000';g.lineWidth=2;g.beginPath();g.moveTo(12,0);g.lineTo(-8,-8);g.lineTo(-4,0);g.lineTo(-8,8);g.closePath();g.fill();g.stroke();g.restore();
  const rad=HELI.alvos.filter(o=>o.tipo==='radar'),sam=HELI.alvos.filter(o=>o.tipo==='sam'),aa=HELI.alvos.filter(o=>o.tipo==='aa'),lan=HELI.alvos.filter(o=>o.tipo==='lancha');
  const n=(l)=>l.filter(o=>!o.vivo).length,li=(ok,txt)=>`<div class="${ok?'ok':''}">${ok?'✅':'⬜'} ${txt}</div>`;
  $('#hmObj').innerHTML=`<h3>🎯 PRIORITÁRIAS</h3>${li(n(rad)===rad.length,`📡 Radares <b>${n(rad)}/${rad.length}</b>`)}${li(n(sam)===sam.length,`🚀 Estações SAM <b>${n(sam)}/${sam.length}</b>`)}
    <h3>🪂 RESGATE</h3>${li(HELI.salvos>=HELI.pilotos.length,`Pilotos na base <b>${HELI.salvos}/${HELI.pilotos.length}</b>${HELI.bordo?` · a bordo ${HELI.bordo}`:''}`)}
    <h3>⭐ SECUNDÁRIAS</h3>${li(n(aa)===aa.length,`🔺 Antiaéreas <b>${n(aa)}/${aa.length}</b>`)}${li(n(lan)===lan.length,`🚤 Lanchas <b>${n(lan)}/${lan.length}</b>`)}${li(HELI.vidas>=3,'🚁 Não perder helicóptero')}
    <h3>📦 SUPRIMENTOS</h3><div class="leg">⛽ combustível · 🔫 munição · 🛡️ blindagem · 🏠 bases (entrega pilotos; pairando baixo e devagar: combustível, munição e blindagem)</div>`;}
function heliMapaAbre(brief){if(!HELI.on||HELI.fim)return;HELI.pausa=true;heliMapa();
  $('#hmTit').innerHTML=brief?'🚁 OPERAÇÃO ARQUIPÉLAGO<small>Inteligência: radares e baterias SAM protegem as ilhas. Pilotos nossos foram abatidos. Destrua as defesas, resgate todos e volte p/ a base. Aeronave: 🇧🇷 AH-2 Sabre (cabem 8 resgatados).<br><i style="font-size:11px;opacity:.7">Modelo 3D do Sabre: "Russian Mil Mi-35M" por 42manako (Sketchfab, CC-BY-4.0)</i></small>':'🗺️ MAPA<small>jogo pausado</small>';
  $('#hmOk').textContent=brief?'🚁 DECOLAR':'▶️ VOLTAR (M)';$('#heliMapa').style.display='flex';HELI.brief=brief;}
function heliMapaFecha(){$('#heliMapa').style.display='none';HELI.pausa=false;for(const k in TEC)TEC[k]=false;
  if(HELI.brief){HELI.brief=false;heliMsg('🚁 Prioridade: 📡 radares e 🚀 SAMs. Resgate os 🪂 pilotos. <b>M</b> / 🗺️ abre o mapa.',6000);}}
$('#hmOk').addEventListener('click',heliMapaFecha);
$('#bMapa').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();HELI.pausa?heliMapaFecha():heliMapaAbre(false);});
addEventListener('keydown',e=>{if(SALA!=='heli'||!HELI.on||e.code!=='KeyM'||e.repeat)return;HELI.pausa?heliMapaFecha():heliMapaAbre(false);});
