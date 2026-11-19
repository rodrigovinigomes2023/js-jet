// (19/11) MODO HELICÓPTERO — ataque isométrico (gênero "helicóptero de ataque com câmera de cima"), offline como o tutorial.
// Carregado depois do jogo.js e usa as mesmas funções (cena, EU, OUT, relevo, visada, bala, misLocal, explosao, radarC...).
// Objetivos: destruir radares e estações SAM, afundar lanchas, resgatar pilotos com o guincho e levar p/ a base. Combustível acaba!
const HELI={on:false,vel:new V3(),yaw:0,agl:32,comb:100,blind:100,vidas:3,bordo:0,salvos:0,tTiro:0,misAnt:false,tMorte:0,coisas:[],pilotos:[],caixas:[],alvos:[],tGuincho:0,fim:false,idN:-5000,rotor:null,cauda:null};
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
function heliIniciar(){const rng=rnd(4242);HELI.on=true;HELI.fim=false;HELI.vidas=3;HELI.salvos=0;HELI.bordo=0;HELI.alvos=[];HELI.pilotos=[];HELI.caixas=[];HELI.coisas=[];
  for(let i=0;i<3;i++){const p=heliPonto(1500,5200,true,rng);heliAlvo(`📡 Radar ${i+1}`,'#ff7f2a',(i%2?radarB:radarA)('#ff7f2a'),p,60,'radar');}
  for(let i=0;i<2;i++){const p=heliPonto(2000,5500,true,rng);const o=heliAlvo(`🚀 SAM ${i+1}`,'#ff3b30',radarC('#ff3b30'),p,80,'sam');o.tSam=4+i*2;}
  for(let i=0;i<6;i++){const p=heliPonto(800,6000,true,rng);const g=heliAA();const o=heliAlvo(`🔫 Antiaérea ${i+1}`,'#e8443a',g,p,40,'aa');}
  for(let i=0;i<2;i++){const p=heliPonto(1500,4500,false,rng);const o=heliAlvo(`🚤 Lancha ${i+1}`,'#e8443a',navioB('#8a96a8'),p,120,'lancha');o.g.scale.setScalar(0.45);o.c=p.clone();o.ang=rng()*6;}
  for(const o of HELI.alvos)cena.add(o.g);
  for(let i=0;i<4;i++){const p=heliPonto(1200,5600,true,rng);const g=heliPiloto();g.position.copy(p);HELI.pilotos.push({g,p,ok:false});}
  for(const [tipo,n] of[['comb',4],['mun',3],['blind',2]])for(let i=0;i<n;i++){const p=heliPonto(900,5600,true,rng);const g=heliCaixa(tipo);g.position.copy(p);HELI.caixas.push({g,p,tipo,ok:false});}
  heliNascer();heliMsg('🚁 Destrua os radares e as estações SAM, resgate os 4 pilotos e traga-os p/ a base. De olho no combustível!',7000);}
function heliNascer(){const B=BASES[HELI_CASA];EU.pos.set(B.x,BASE_H+30,B.z);HELI.yaw=Math.atan2(B.z,-B.x);HELI.vel.set(0,0,0);HELI.agl=32;HELI.comb=100;EU.vida=100;HELI.bordo=0;
  BALAS_N=1200;MUN=8;BOMBAS=0;EU.vivo=true;EU.vel=0;EU.turbo=1;JATO.visible=true;document.body.classList.remove('morto');$('#morte').style.display='none';TRAVA.id=0;TRAVA.t=0;
  EU.q.setFromAxisAngle(_v1.set(0,1,0),HELI.yaw);}
function heliSair(){if(!HELI.on)return;HELI.on=false;for(const p of HELI.pilotos)cena.remove(p.g);for(const c of HELI.caixas)cena.remove(c.g);
  for(const m of TREINO.mis){cena.remove(m.g);MISV.delete(m.id);}TREINO.mis.length=0;document.body.classList.remove('heli');$('#heliMsg').style.display='none';$('#fimMis').style.display='none';}
let tHeliMsg=0;function heliMsg(t,ms=4000){const e=$('#heliMsg');e.innerHTML=t;e.style.display='block';clearTimeout(tHeliMsg);tHeliMsg=setTimeout(()=>e.style.display='none',ms);}

// ---------- dano
function heliAcerto(id,o){fx(o.pos,0xffd070,7,0.25,2);SOM.acerto();tAcerto=0.15;o.vida-=o.tipo==='lancha'?6:8;if(o.vida<=0)heliDestroi(o);}
function heliMissilAcertou(o){o.vida-=100;if(o.vida<=0)heliDestroi(o);}
function heliDestroi(o){if(!o.vivo)return;o.vivo=false;o.g.visible=false;o.rot.style.display='none';explosao(_v1.copy(o.pos).setY(o.pos.y+6),true);
  for(let i=0;i<5;i++)fx(_v2.copy(o.pos).add(_v3.set((Math.random()-0.5)*20,4+i*5,(Math.random()-0.5)*20)),0x333333,30,3+i,2,false,6);
  const n={radar:'Radar destruído! 📡',sam:'Estação SAM destruída! 🚀',aa:'Antiaérea destruída!',lancha:'Lancha afundada! 🚤'}[o.tipo];heliMsg('✅ '+n,2200);heliChecaFim();}
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
function heliPasso(dt){if(!HELI.on)return;const agora=performance.now();
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
  SOM.motor(60+sp,false,true);}
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
