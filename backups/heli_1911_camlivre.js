// (19/11) MODO HELICÓPTERO — ataque isométrico (gênero "helicóptero de ataque com câmera de cima"), offline como o tutorial.
// Carregado depois do jogo.js e usa as mesmas funções (cena, EU, OUT, relevo, visada, bala, misLocal, explosao, radarC...).
// Objetivos: destruir radares e estações SAM, afundar lanchas, resgatar pilotos com o guincho e levar p/ a base. Combustível acaba!
const HELI={on:false,vel:new V3(),yaw:0,agl:32,comb:100,blind:100,vidas:3,bordo:0,salvos:0,tTiro:0,misAnt:false,tMorte:0,coisas:[],fogos:[],pausa:false,brief:false,mapa:null,pilotos:[],caixas:[],alvos:[],tGuincho:0,fim:false,idN:-5000,rotor:null,cauda:null};
const _hP=new V3();
const HELI_CASA=4, HELI_VMAX=72, HELI_CAP=4, HELI_CAM=new V3(-95,165,95);   // base de origem, ~260 km/h, pilotos a bordo, câmera isométrica

// ---------- modelo: helicóptero de ataque (cabine em tandem, asinhas com casulos, rotor de 4 pás), frente = +x, ~17 m
function criarHeli(cor='#4d5a3c'){const g=new THREE.Group(),ve=M(cor,0.7),ve2=M('#3c4730',0.7),esc_=M('#22282b',0.6),vid=M('#1a2733',0.15),pre=M('#2b2f33',0.5);
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
  cil(0.15,0.15,1.6,pre,7.3,0.8,0,g,6).rotation.z=Math.PI/2;                                      // canhão no queixo
  cil(0.25,0.25,1.1,pre,0.4,4.1,0,g,8);                                                         // mastro do rotor
  const rotor=new THREE.Group();rotor.position.set(0.4,4.7,0);g.add(rotor);esf(0.4,pre,0,0,0,rotor);
  const pa=new THREE.MeshStandardMaterial({color:0x1d2124,roughness:0.6,transparent:true,opacity:0.85});
  for(let i=0;i<4;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(7.2,0.08,0.45),pa);b.position.x=3.6;const h=new THREE.Group();h.rotation.y=i*Math.PI/2;h.add(b);rotor.add(h);}
  const disco=new THREE.Mesh(new THREE.CircleGeometry(7.3,32),new THREE.MeshBasicMaterial({color:0x222222,transparent:true,opacity:0.12,depthWrite:false,side:THREE.DoubleSide}));disco.rotation.x=-Math.PI/2;rotor.add(disco);
  const cauda=new THREE.Group();cauda.position.set(-11.3,3.6,0.35);g.add(cauda);for(let i=0;i<2;i++){const b=new THREE.Mesh(new THREE.BoxGeometry(0.15,2.6,0.2),pa);b.rotation.x=i*Math.PI/2;cauda.add(b);}
  g.userData.rotor=rotor;g.userData.cauda=cauda;g.scale.setScalar(1.5);cena.add(g);return g;}   /* 1,5x: aparece melhor de cima */

// ---------- objetos do mapa
function heliPiloto(){const g=new THREE.Group(),lar=M('#ff7a1a',0.7);cil(0.35,0.4,1.2,lar,0,0.8,0,g,8);esf(0.3,M('#e0b090',0.7),0,1.65,0,g);
  const raio=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,60,8,1,true),new THREE.MeshBasicMaterial({color:0xffb030,transparent:true,opacity:0.35,depthWrite:false,side:THREE.DoubleSide}));raio.position.y=30;g.add(raio);
  const fum=new THREE.Mesh(new THREE.RingGeometry(4,5,24),new THREE.MeshBasicMaterial({color:0xffb030,transparent:true,opacity:0.7,side:THREE.DoubleSide}));fum.rotation.x=-Math.PI/2;fum.position.y=0.3;g.add(fum);
  cena.add(g);return g;}
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
  for(let i=0;i<4;i++){const p=heliPonto(1200,5600,true,rng);const g=heliPiloto();g.position.copy(p);HELI.pilotos.push({g,p,ok:false});}
  for(const [tipo,n] of[['comb',4],['mun',3],['blind',2]])for(let i=0;i<n;i++){const p=heliPonto(900,5600,true,rng);const g=heliCaixa(tipo);g.position.copy(p);HELI.caixas.push({g,p,tipo,ok:false});}
  heliNascer();setTimeout(()=>heliMapaAbre(true),300);}
function heliNascer(){const B=BASES[HELI_CASA];EU.pos.set(B.x,BASE_H+30,B.z);HELI.yaw=Math.atan2(B.z,-B.x);HELI.vel.set(0,0,0);HELI.agl=32;HELI.comb=100;EU.vida=100;HELI.bordo=0;
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
  const k=1-Math.exp(-1.8*dt);HELI.vel.lerp(_v1.copy(_hD).multiplyScalar(HELI_VMAX),k);
  // altura: E/🔥 sobe, C/🪂 desce; segue o terreno (olha também à frente p/ não bater no morro)
  if(TEC.KeyE||BT.turbo)HELI.agl=Math.min(160,HELI.agl+40*dt);if(TEC.KeyC||BT.freio)HELI.agl=Math.max(6,HELI.agl-40*dt);
  const chao=Math.max(relevo(EU.pos.x,EU.pos.z),relevo(EU.pos.x+HELI.vel.x*1.5,EU.pos.z+HELI.vel.z*1.5),relevo(EU.pos.x+HELI.vel.x*3,EU.pos.z+HELI.vel.z*3)*0.9,0);
  const alvoY=chao+HELI.agl;EU.pos.x+=HELI.vel.x*dt;EU.pos.z+=HELI.vel.z*dt;EU.pos.y+=(alvoY-EU.pos.y)*Math.min(1,2.5*dt);EU.pos.y=Math.max(EU.pos.y,relevo(EU.pos.x,EU.pos.z)+3);
  const sp=Math.hypot(HELI.vel.x,HELI.vel.z);EU.vel=sp;
  // nariz vira p/ onde está indo (ou p/ o alvo travado quando parado)
  const ot=TRAVA.id&&OUT.get(TRAVA.id);let yawAlvo=HELI.yaw;
  if(sp>6)yawAlvo=Math.atan2(-HELI.vel.z,HELI.vel.x);else if(ot)yawAlvo=Math.atan2(-(ot.pos.z-EU.pos.z),ot.pos.x-EU.pos.x);
  let dy=((yawAlvo-HELI.yaw+Math.PI*3)%(Math.PI*2))-Math.PI;HELI.yaw+=dy*Math.min(1,3*dt);
  // inclina na direção do movimento (pitch p/ frente, roll na curva)
  const fwdV=HELI.vel.x*Math.cos(HELI.yaw)-HELI.vel.z*Math.sin(HELI.yaw);_hE.set(0,HELI.yaw,0);_hQ.setFromEuler(_hE);
  EU.q.copy(_hQ).multiply(_v4q.setFromEuler(_hE2.set(-dy*0.5,0,-fwdV/HELI_VMAX*0.28)));
  JATO.position.copy(EU.pos);JATO.quaternion.copy(EU.q);   // o modelo acompanha
  // combustível
  HELI.comb-=dt*100/300;EU.turbo=Math.max(0,HELI.comb/100);if(HELI.comb<=0){heliCaiu('⛽ Sem combustível!');return;}
  if(HELI.comb<20&&Math.floor(agora/600)%2)$('#aviso').style.display='block',$('#aviso').textContent='⛽ COMBUSTÍVEL ACABANDO! Pegue um barril vermelho';else if(HELI.comb>=20)$('#aviso').style.display='none';
  // trava (Hellfire): o mais perto na frente, só se já aparece na tela (19/11: antes travava fora da vista)
  let melhor=null,dm=1600;frente(EU.q,_v2).setY(0).normalize();
  for(const o of HELI.alvos){if(!o.vivo)continue;_v3.subVectors(o.pos,EU.pos);const d=_v3.length();_v3.y=0;_v3.normalize();_hP.copy(o.pos).project(cam);if(d<dm&&_v3.dot(_v2)>0.8&&Math.abs(_hP.x)<0.85&&Math.abs(_hP.y)<0.85&&_hP.z<1&&visada(EU.pos,_v1.copy(o.pos).setY(o.pos.y+10))){dm=d;melhor=o;}}
  if(!melhor){TRAVA.id=0;TRAVA.t=0;}else if(TRAVA.id!==melhor.id){TRAVA.id=melhor.id;TRAVA.t=0;}else TRAVA.t+=dt*1.6;
  // canhão: atira reto p/ frente, no chão a 160 m
  HELI.tTiro-=dt;const fogo=TEC.Space||TEC.KeyJ||BT.fogo;
  if(fogo&&HELI.tTiro<=0&&BALAS_N>0){HELI.tTiro=0.09;BALAS_N--;const boca=_v1.set(7.4,0.8,0).applyQuaternion(EU.q).add(EU.pos);
    const mira=_v3.copy(frente(EU.q,_v2).setY(0).normalize()).multiplyScalar(160).add(EU.pos).setY(Math.max(0,relevo(EU.pos.x+_v2.x*160,EU.pos.z+_v2.z*160)));   /* 19/11: sem mira automática, atira p/ frente */
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
  const B=BASES[HELI_CASA];if(HELI.bordo&&Math.hypot(B.x-EU.pos.x,B.z-EU.pos.z)<350&&EU.pos.y-BASE_H<45){for(const p of HELI.pilotos)if(p.aBordo){p.aBordo=false;p.ok=true;}
    HELI.salvos+=HELI.bordo;heliMsg(`🏥 ${HELI.bordo} piloto${HELI.bordo>1?'s':''} entregue${HELI.bordo>1?'s':''}! (${HELI.salvos}/${HELI.pilotos.length})`,3000);HELI.bordo=0;HELI.comb=100;SOM.ok();heliChecaFim();}
  // caixas
  for(const c of HELI.caixas){if(c.ok)continue;c.g.rotation.y+=dt;if(Math.hypot(c.p.x-EU.pos.x,c.p.z-EU.pos.z)<20&&EU.pos.y-c.p.y<30){c.ok=true;c.g.visible=false;SOM.ok();
    if(c.tipo==='comb'){HELI.comb=100;heliMsg('⛽ Tanque cheio!',2000);}else if(c.tipo==='mun'){BALAS_N=1200;MUN=8;heliMsg('🔫 Munição recarregada!',2000);}else{EU.vida=100;heliMsg('🛡️ Blindagem consertada!',2000);}}}
  for(const p of HELI.pilotos)if(!p.ok&&!p.aBordo)p.g.children[3].scale.setScalar(1+0.25*Math.sin(agora/200));
  // painel
  const radar=HELI.alvos.filter(o=>o.tipo==='radar'),sam=HELI.alvos.filter(o=>o.tipo==='sam');
  $('#placar').innerHTML=`<div class="eu obj"><span>📡 ${radar.filter(o=>!o.vivo).length}/${radar.length} · 🚀 ${sam.filter(o=>!o.vivo).length}/${sam.length} · 🪂 ${HELI.salvos}/${HELI.pilotos.length}${HELI.bordo?' (a bordo '+HELI.bordo+')':''} · ⛽ ${Math.round(HELI.comb)}% · 🚁×${HELI.vidas}</span></div>`;
  heliPoeira(dt);SOM.motor(60+sp,false,true);}
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
function heliCamera(dt){const alvo=_v1.copy(EU.pos);cam.up.set(0,1,0);_v2.copy(alvo).addScaledVector(HELI_CAM,HELI_ZOOM);_v2.y=Math.max(_v2.y,relevo(_v2.x,_v2.z)+80,relevo((_v2.x+alvo.x)/2,(_v2.z+alvo.z)/2)+120);   /* não entra no morro */cam.position.lerp(_v2,Math.min(1,dt*4));if(cam.position.distanceTo(_v2)>600*HELI_ZOOM)cam.position.copy(_v2);
  cam.lookAt(alvo);if(Math.abs(cam.fov-40)>0.5){cam.fov=40;cam.updateProjectionMatrix();}cam.updateMatrixWorld();}

function iniciaHeli(){SALA='heli';SOM.ini();$('#erro').textContent='';
  if(ws)try{ws.onclose=null;ws.close();}catch(e){}ws=null;conectado=false;
  for(const o of OUT.values()){cena.remove(o.g);o.rot.remove();o.aq?.remove();}OUT.clear();
  $('#menu').style.display='none';jogando=true;document.body.classList.add('jogando','heli');
  EU.id=-1;EU.cor='#4d5a3c';EU.nome=CONTA?CONTA.nome:'Piloto';MINHA_BASE=HELI_CASA;ZONA=15200;LIMITE=20900;mostrarBases();
  if(JATO)cena.remove(JATO);JATO=criarHeli();heliIniciar();}
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
  if(!HELI.mapa){const B=BASES[HELI_CASA],pts=[[B.x,B.z],...HELI.alvos.map(o=>[o.c?o.c.x:o.pos.x,o.c?o.c.z:o.pos.z]),...HELI.pilotos.map(p=>[p.p.x,p.p.z]),...HELI.caixas.map(c=>[c.p.x,c.p.z])];
    let a=1e9,b=-1e9,c=1e9,d=-1e9;for(const[x,z]of pts){const u=x*_hR.x+z*_hR.z,v=-(x*_hF.x+z*_hF.z);a=Math.min(a,u);b=Math.max(b,u);c=Math.min(c,v);d=Math.max(d,v);}
    const span=Math.max(b-a,d-c)+1400;HELI.mapa={cu:(a+b)/2,cv:(c+d)/2,s:W/span,W};HELI.mapa.fundo=heliMapaFundo(HELI.mapa);}
  const T=HELI.mapa;g.imageSmoothingEnabled=true;g.drawImage(T.fundo,0,0,W,W);g.textAlign='center';g.textBaseline='middle';
  const icone=(x,z,em,tam,feito,cor)=>{const[px,py]=heliMapaXY(x,z,T);g.globalAlpha=feito?0.45:1;if(cor){g.fillStyle=cor;g.beginPath();g.arc(px,py,tam*0.75,0,7);g.fill();}
    g.font=`${tam}px sans-serif`;g.fillText(em,px,py+1);g.globalAlpha=1;if(feito){g.strokeStyle='#111';g.lineWidth=3;g.beginPath();g.moveTo(px-tam*0.6,py-tam*0.6);g.lineTo(px+tam*0.6,py+tam*0.6);g.moveTo(px+tam*0.6,py-tam*0.6);g.lineTo(px-tam*0.6,py+tam*0.6);g.stroke();}};
  const B=BASES[HELI_CASA];icone(B.x,B.z,'🏠',22,false,'#2e7d32cc');
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
    <h3>📦 SUPRIMENTOS</h3><div class="leg">⛽ combustível · 🔫 munição · 🛡️ blindagem · 🏠 base (entrega e reabastece)</div>`;}
function heliMapaAbre(brief){if(!HELI.on||HELI.fim)return;HELI.pausa=true;heliMapa();
  $('#hmTit').innerHTML=brief?'🚁 OPERAÇÃO ARQUIPÉLAGO<small>Inteligência: radares e baterias SAM protegem as ilhas. Pilotos nossos foram abatidos. Destrua as defesas, resgate todos e volte p/ a base.</small>':'🗺️ MAPA<small>jogo pausado</small>';
  $('#hmOk').textContent=brief?'🚁 DECOLAR':'▶️ VOLTAR (M)';$('#heliMapa').style.display='flex';HELI.brief=brief;}
function heliMapaFecha(){$('#heliMapa').style.display='none';HELI.pausa=false;for(const k in TEC)TEC[k]=false;
  if(HELI.brief){HELI.brief=false;heliMsg('🚁 Prioridade: 📡 radares e 🚀 SAMs. Resgate os 🪂 pilotos. <b>M</b> / 🗺️ abre o mapa.',6000);}}
$('#hmOk').addEventListener('click',heliMapaFecha);
$('#bMapa').addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();HELI.pausa?heliMapaFecha():heliMapaAbre(false);});
addEventListener('keydown',e=>{if(SALA!=='heli'||!HELI.on||e.code!=='KeyM'||e.repeat)return;HELI.pausa?heliMapaFecha():heliMapaAbre(false);});
