/* (21/11) js-jet · MODELOS REALISTAS (lotes 1-3 aprovados nas prévias): defesas, base, navios, lancha, caixas e árvores.
   Texturas CC0 (ambientCG) em tex/. Tudo dentro de um bloco: não colide com os nomes do jogo (M, box, cil, tex...).
   Cada modelo é montado com peças, as caixas de colisão das peças grandes ficam em userData.caixas e depois as malhas
   são FUNDIDAS por material (poucas chamadas de desenho). Celular (LEVE): só textura de cor, sem balaústres e detalhes finos. */
const MOD=(()=>{const V3=THREE.Vector3,PI=Math.PI,LEVE=('ontouchstart' in window)||navigator.maxTouchPoints>0||new URLSearchParams(location.search).has('toque');
function giraM(o,v){o.userData.vivo=true;if(typeof gira==='function')gira(o,v);}
// ---------- PROPOSTA: materiais PBR com UV em metros ----------
const TL=new THREE.TextureLoader(),TX={};
function tex(nome,tile){const k=nome+'@'+tile;if(TX[k])return TX[k];
  const mk=(s,srgb)=>{const t=TL.load('tex/'+nome+'_'+s+'.jpg');t._nome=nome+'_'+s;t._tile=tile;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(1/tile,1/tile);t.anisotropy=8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;};
  return TX[k]=LEVE?{map:mk('c',true)}:{map:mk('c',true),normalMap:mk('n'),roughnessMap:mk('r')};}   // celular: só a cor
const PM={};
function P(nome,cor,o={}){const k=nome+cor+JSON.stringify(o);if(PM[k])return PM[k];const t=tex(nome,o.tile||2);
  return PM[k]=new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),...t,roughness:o.r??1,metalness:o.m??0,normalScale:new THREE.Vector2(o.ns??1,o.ns??1),side:o.dupla?THREE.DoubleSide:THREE.FrontSide});}
function S(cor,r=0.6,m=0){return new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),roughness:r,metalness:m});}
const VIDRO=new THREE.MeshStandardMaterial({color:0x0e1a22,roughness:0.08,metalness:0.7});
const BORRACHA=S('#1a1b1c',0.92),ACO=()=>P('metal','#8d949a',{tile:1,r:0.55,m:0.6});
function sombra(m){m.castShadow=m.receiveShadow=true;return m;}
function bx(w,h,d,mat,x,y,z,pai){const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,D=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let f=0;f<6;f++)for(let i=0;i<4;i++){const k=f*4+i;uv.setXY(k,uv.getX(k)*D[f][0],uv.getY(k)*D[f][1]);}
  const m=sombra(new THREE.Mesh(g,mat));m.position.set(x,y,z);pai.add(m);return m;}
function cl(rt,rb,h,mat,x,y,z,pai,seg=20,aberto=false){if(LEVE)seg=Math.max(6,Math.round(seg/2));const g=new THREE.CylinderGeometry(rt,rb,h,seg,1,aberto),uv=g.attributes.uv,C=2*PI*Math.max(rt,rb);
  for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*C,uv.getY(k)*h);const m=sombra(new THREE.Mesh(g,mat));m.position.set(x,y,z);pai.add(m);return m;}
function haste(a,b,r,mat,pai,seg=8){const d=new V3().subVectors(b,a),L=d.length(),m=cl(r,r,L,mat,0,0,0,pai,LEVE?Math.min(seg,6):seg);if(r<0.07)m.userData.det=true;m.position.copy(a).addScaledVector(d,0.5);m.quaternion.setFromUnitVectors(new V3(0,1,0),d.normalize());return m;}
function roda(r,lg,pai,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);pai.add(g);const p=cl(r,r,lg,BORRACHA,0,0,0,g,18);p.rotation.x=PI/2;
  const a=cl(r*0.55,r*0.55,lg+0.04,S('#4c5446',0.6,0.3),0,0,0,g,12);a.rotation.x=PI/2;for(let i=0;i<8;i++){const t=bx(0.06,0.08,lg+0.02,BORRACHA,Math.cos(i/8*PI*2)*r,Math.sin(i/8*PI*2)*r,0,g);t.rotation.z=i/8*PI*2;}return g;}
function canvasTex(w,h,f,srgb=true){const c=document.createElement('canvas');c.width=w;c.height=h;f(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=8;if(srgb)t.encoding=THREE.sRGBEncoding;return t;}
function rnd(s){return()=>(s=(s*16807)%2147483647)/2147483647;}

// sacos de areia instanciados num anel/arco
function sacos(pai,R,a0,a1,camadas,cor='#a8956a'){if(LEVE)camadas=Math.min(2,camadas);const geo=new THREE.SphereGeometry(1,LEVE?5:7,LEVE?3:4);   /* jogo: saco com menos faces */const mat=P('reboco',cor,{tile:0.7,r:1,ns:1.6});
  const L=Math.abs(a1-a0)*R,n=Math.max(3,Math.floor(L/0.62)),inst=new THREE.InstancedMesh(geo,mat,n*camadas),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),r=rnd(7+Math.round(R*13));let i=0;
  for(let c=0;c<camadas;c++)for(let k=0;k<n;k++){const a=a0+(a1-a0)*(k+(c%2)*0.5)/n,rr=R-c*0.06;q.setFromAxisAngle(new V3(0,1,0),-a+(r()-0.5)*0.12);
    m4.compose(new V3(Math.cos(a)*rr,0.13+c*0.25,Math.sin(a)*rr),q,new V3(0.24,0.13,0.34+r()*0.03));inst.setMatrixAt(i++,m4);}
  inst.castShadow=inst.receiveShadow=true;pai.add(inst);return inst;}
// rede de camuflagem: malha caída com folhas recortadas
const TEX_REDE=canvasTex(512,512,(g,w,h)=>{const r=rnd(99);g.clearRect(0,0,w,h);for(let i=0;i<2600;i++){const x=r()*w,y=r()*h,s=6+r()*16;g.fillStyle=['#3f4a2c','#56603a','#2f3825','#6b6a45'][i%4];g.beginPath();g.ellipse(x,y,s,s*0.45,r()*PI,0,PI*2);g.fill();}},true);
function rede(pai,w,d,altura,x,z){const geo=new THREE.PlaneGeometry(w,d,24,18);const p=geo.attributes.position;
  for(let i=0;i<p.count;i++){const u=p.getX(i)/w*2,v=p.getY(i)/d*2;p.setZ(i,-(1-Math.min(1,Math.max(Math.abs(u),Math.abs(v))))*0+(Math.cos(u*PI*1.5)*Math.cos(v*PI*1.5))*0.35-Math.max(Math.abs(u),Math.abs(v))**2.2*(altura-0.04));}   /* bordas encostam no chão (antes ficavam a 0,5 m) */
  geo.computeVertexNormals();const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:TEX_REDE,alphaTest:0.4,side:THREE.DoubleSide,roughness:1}));m.rotation.x=-PI/2;m.position.set(x,altura,z);m.castShadow=true;pai.add(m);
  for(const [sx,sz] of[[-0.3,-0.25],[0.3,0.25]])haste(new V3(x+sx*w,0,z+sz*d),new V3(x+sx*w,altura-0.1,z+sz*d),0.05,S('#5b4a33',0.9),pai);return m;}
// cerca de alambrado
const TEX_ALAMBRADO=canvasTex(128,128,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=5;for(let k=-w;k<w*2;k+=32){g.beginPath();g.moveTo(k,0);g.lineTo(k+h,h);g.stroke();g.beginPath();g.moveTo(k+h,0);g.lineTo(k,h);g.stroke();}},false);
function cerca(pai,lado,alt=2.4){const mat=new THREE.MeshStandardMaterial({color:0x9aa1a6,alphaMap:TEX_ALAMBRADO,transparent:false,alphaTest:0.5,side:THREE.DoubleSide,metalness:0.6,roughness:0.5});
  const poste=S('#7d858b',0.5,0.6);for(let s=0;s<4;s++){const a=s*PI/2,geo=new THREE.PlaneGeometry(lado,alt);geo.attributes.uv.array.forEach((v,i,arr)=>{arr[i]=i%2?v*alt/0.5:v*lado/0.5;});
    const m=new THREE.Mesh(geo,mat);m.position.set(Math.cos(a)*lado/2,alt/2,Math.sin(a)*lado/2);m.rotation.y=-a+PI/2;pai.add(m);
    for(let k=0;k<=Math.round(lado/3);k++){const t=-lado/2+k*lado/Math.round(lado/3);const px=Math.cos(a)*lado/2-Math.sin(a)*t,pz=Math.sin(a)*lado/2+Math.cos(a)*t;cl(0.05,0.05,alt+0.3,poste,px,(alt+0.3)/2,pz,pai,6);}}}
// pessoa de 1,80 m p/ escala
function pessoa(pai,x,z,ry=0){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;pai.add(g);const f=S('#4a5638',0.9),b=S('#20231e',0.9),p=S('#c99470',0.7);
  for(const s of[-0.11,0.11])cl(0.075,0.07,0.86,f,0,0.43,s,g,8);bx(0.26,0.6,0.42,f,0,1.17,0,g);for(const s of[-0.27,0.27])cl(0.055,0.05,0.62,f,0,1.15,s,g,8);
  const c=new THREE.Mesh(new THREE.SphereGeometry(0.11,12,8),p);c.position.y=1.6;g.add(c);const cap=new THREE.Mesh(new THREE.SphereGeometry(0.135,12,8,0,PI*2,0,PI/2),f);cap.position.y=1.63;g.add(cap);
  bx(0.2,0.08,0.3,b,0.03,0.04,-0.11,g);bx(0.2,0.08,0.3,b,0.03,0.04,0.11,g);return g;}

// ---------- caminhão 8x8 genérico (frente = +x) ----------
function caminhao(pai,cor,L=11){const g=new THREE.Group();pai.add(g);const pin=P('metalpint',cor,{tile:1.5,r:0.75,ns:0.6}),esc=P('metalpint','#2c3226',{tile:1.5,r:0.8});
  bx(L,0.5,1.1,esc,0,1.15,0,g);   // longarinas
  const cab=new THREE.Group();cab.position.set(L/2-1.3,0,0);g.add(cab);bx(2.4,1.7,2.55,pin,0,2.35,0,cab);bx(1.6,0.7,2.55,pin,0.4,1.25,0,cab);
  const pb=new THREE.Mesh(new THREE.PlaneGeometry(2.3,0.9),VIDRO);pb.position.set(1.21,2.7,0);pb.rotation.y=PI/2;pb.rotation.x=0;pb.rotateX(-0.18);cab.add(pb);
  for(const s of[-1,1]){const j=new THREE.Mesh(new THREE.PlaneGeometry(1.0,0.7),VIDRO);j.position.set(0.5,2.75,s*1.28);j.rotation.y=s>0?0:PI;cab.add(j);bx(0.08,0.35,0.25,S('#111',0.4),1.25,2.55,s*1.42,cab);}
  bx(0.3,0.25,2.4,S('#191919',0.6),1.22,1.35,0,cab);   // para-choque
  for(const s of[-1,1]){bx(0.05,0.18,0.3,S('#f4f1d0',0.2,0.1),1.25,1.62,s*0.95,cab);}
  const xs=[L/2-1.6,L/2-3.2,-L/2+3.2,-L/2+1.6];for(const x of xs)for(const s of[-1,1]){roda(0.62,0.48,g,x,0.62,s*1.05);bx(1.5,0.12,0.6,esc,x,1.32,s*1.05,g);}
  for(const s of[-1,1]){cl(0.32,0.32,1.4,ACO(),L/2-4.2,1.0,s*1.0,g,14).rotation.z=PI/2;bx(1.2,0.6,0.5,esc,0.5,1.0,s*1.05,g);}   // tanques e caixas de ferramenta
  return g;}
function lancadorTEL(pai,cor,fx,x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;pai.add(g);caminhao(g,cor);
  const pin=P('metalpint',cor,{tile:1.5,r:0.75,ns:0.6}),fxm=S(fx,0.55);
  for(const [px,pz] of[[3.3,1.5],[3.3,-1.5],[-4.6,1.5],[-4.6,-1.5]]){haste(new V3(px,1.2,pz*0.7),new V3(px,0.15,pz),0.09,ACO(),g);cl(0.3,0.34,0.12,S('#2a2e2a',0.8),px,0.06,pz,g,12);}   // sapatas
  const qua=new THREE.Group();qua.position.set(-5.2,1.8,0);qua.rotation.z=1.05;g.add(qua);   // quadro elevado ~60°
  bx(8.6,0.35,2.4,pin,4.3,-0.25,0,qua);
  for(const [cy,cz] of[[0.55,-0.6],[0.55,0.6],[1.55,-0.6],[1.55,0.6]]){const c=cl(0.46,0.46,8.2,pin,4.2,cy,cz,qua,24);c.rotation.z=PI/2;
    for(let k=0;k<5;k++){const a=new THREE.Mesh(new THREE.TorusGeometry(0.47,0.045,LEVE?3:5,LEVE?10:18),pin);a.position.set(0.5+k*1.85,cy,cz);a.rotation.y=PI/2;sombra(a);qua.add(a);}
    const tp=cl(0.47,0.47,0.1,S('#d9d6c8',0.6),8.35,cy,cz,qua,24);tp.rotation.z=PI/2;const fa=cl(0.475,0.475,0.35,fxm,7.6,cy,cz,qua,24);fa.rotation.z=PI/2;}
  // pistões hidráulicos
  for(const s of[-0.9,0.9])haste(new V3(-1.2,1.4,s),new V3(-5.2+Math.cos(1.05)*4,1.8+Math.sin(1.05)*4,s),0.14,S('#c9ccc4',0.25,0.8),g);
  return g;}
// radar de arranjo em fase num reboque
const TEX_FASE=canvasTex(256,256,(g,w,h)=>{g.fillStyle='#d8dbd4';g.fillRect(0,0,w,h);g.fillStyle='#b9bdb4';for(let y=0;y<h;y+=16)for(let x=(y/16%2)*8;x<w;x+=16){g.fillRect(x+3,y+3,10,10);}g.strokeStyle='#8f948b';g.lineWidth=2;g.strokeRect(1,1,w-2,h-2);});
function radarFase(pai,cor,x,z){const g=new THREE.Group();g.position.set(x,0,z);pai.add(g);const pin=P('metalpint',cor,{tile:1.5,r:0.75,ns:0.6});
  bx(7,0.5,2.3,P('metalpint','#2c3226',{tile:1.5}),0,1.0,0,g);for(const px of[-1.6,-0.4])for(const s of[-1,1])roda(0.55,0.42,g,px,0.55,s*1.0);
  haste(new V3(3.5,1,0),new V3(5,0.6,0),0.08,ACO(),g);for(const [px,pz] of[[3,1.3],[3,-1.3],[-3.2,1.3],[-3.2,-1.3]])haste(new V3(px,1.0,pz*0.8),new V3(px,0.1,pz),0.08,ACO(),g);
  const tor=new THREE.Group();tor.position.set(0.5,1.25,0);g.add(tor);cl(0.9,1.0,0.6,pin,0,0.3,0,tor,24);
  bx(1.3,2.2,1.6,pin,-0.2,1.7,0,tor);const eixo=cl(0.22,0.22,2.0,ACO(),0,2.8,0,tor,16);eixo.rotation.x=PI/2;   // coluna + eixo de inclinação
  const pan=new THREE.Group();pan.position.set(0.25,2.8,0);pan.rotation.z=0.35;   /* face p/ cima e p/ fora (antes estava virada p/ o chão) */
  tor.add(pan);bx(0.6,4.2,4.6,pin,-0.3,0,0,pan);
  const face=new THREE.Mesh(new THREE.PlaneGeometry(4.4,4.0),new THREE.MeshStandardMaterial({map:TEX_FASE,roughness:0.5,metalness:0.2}));face.position.x=0.01;face.rotation.y=PI/2;pan.add(face);
  bx(0.9,1.4,1.4,pin,-0.95,0.4,0,pan);   // caixa de eletrônica atrás do painel
  for(const z of[-0.8,0.8])haste(new V3(-0.6,0.6,z),new V3(-0.75,1.6,z),0.09,S('#c9ccc4',0.25,0.8),tor);   // pistões de inclinação
  giraM(tor,0.012);return g;}
function abrigo(pai,cor,fx,x,z,ry,L=6){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;pai.add(g);const pin=P('metalpint',cor,{tile:1.5,r:0.75,ns:0.6}),esc=S('#25292a',0.7);
  bx(L,2.6,2.5,pin,0,1.55,0,g);for(const px of[-L/2+0.6,L/2-0.6])for(const pz of[-1,1])bx(0.3,0.25,0.3,esc,px,0.12,pz,g);
  bx(0.9,1.9,0.05,S('#3d4436',0.7),-0.8,1.3,1.27,g);bx(0.06,0.06,0.06,S('#ccc',0.3,0.8),-0.45,1.3,1.31,g);   // porta
  for(const k of[0.7,2.0])bx(0.9,0.6,0.45,S('#b8bcb3',0.6,0.2),k,2.2,1.5,g);   // ar-condicionado
  bx(L*0.9,0.06,0.3,S(fx,0.55),0,2.83,1.1,g);
  const m=new V3(-L/2+0.6,2.85,-0.6);haste(m,new V3(m.x,12,m.z),0.07,ACO(),g);for(let i=0;i<3;i++){const a=i/3*PI*2+0.3;haste(new V3(m.x,11.5,m.z),new V3(m.x+Math.cos(a)*5,0,m.z+Math.sin(a)*5),0.012,S('#999',0.4,0.6),g);}
  bx(0.9,0.06,0.06,ACO(),m.x,11.8,m.z,g);bx(0.06,0.06,0.9,ACO(),m.x,11.6,m.z,g);
  return g;}
function gerador(pai,cor,x,z,ry){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;pai.add(g);const pin=P('metalpint',cor,{tile:1.5,r:0.75,ns:0.6});
  bx(3.2,1.6,1.8,pin,0,1.4,0,g);for(const s of[-1,1])roda(0.45,0.3,g,-0.3,0.45,s*0.95);haste(new V3(1.6,0.8,0),new V3(2.8,0.4,0),0.06,ACO(),g);
  for(let k=0;k<6;k++)bx(0.04,0.9,0.12,S('#2b2f2a',0.7),-1.0+k*0.35,1.45,0.91,g);cl(0.09,0.09,0.8,S('#2b2b2b',0.5,0.5),1.2,2.5,0.4,g,8);return g;}
// berma de terra em ferradura
function berma(pai,R,ab,x,z,ry){const geo=new THREE.TorusGeometry(R,1.6,8,40,PI*2-ab);const m=sombra(new THREE.Mesh(geo,P('reboco','#7b6a4a',{tile:3,r:1,ns:2.5})));
  m.rotation.x=-PI/2;m.rotation.z=ry+ab/2;m.scale.set(1,1,0.55);m.position.set(x,0,z);pai.add(m);
  for(const a of[0,PI*2-ab]){const c=sombra(new THREE.Mesh(new THREE.SphereGeometry(1.6,16,10),m.material));c.position.set(Math.cos(a)*R,Math.sin(a)*R,0);m.add(c);}   // pontas arredondadas (antes abertas)
  return m;}

// ===== 1) ESTAÇÃO SAM =====
function samNovo(fx){const g=new THREE.Group();const oli='#5a6640';
  bx(42,0.12,42,P('concreto','#a39a85',{tile:4,r:1,ns:1.2}),0,0.06,0,g);   // cascalho compactado
  for(const [x,z,ry] of[[-11,-9,-0.65],[11,-9,0.65-PI]]){berma(g,7.2,1.6,x,z,ry+PI/2*0);lancadorTEL(g,oli,fx,x,z,ry);}
  radarFase(g,oli,0,6);abrigo(g,oli,fx,-12,11,0.15);gerador(g,oli,-5,15,0.15);
  sacos(g,4.6,0.4,PI*2-0.4,3).position.set(0,0,6);
  rede(g,10,7,3.4,-12,11);
  for(const [x,z] of[[6,13],[-2,-3]])pessoa(g,x,z,1);
  return g;}
// ===== 2) RADAR DE CÚPULA =====
function radomeNovo(fx){const g=new THREE.Group();
  bx(36,0.15,36,P('concreto','#9c9c96',{tile:4,r:1}),0,0.07,0,g);cerca(g,34);
  const con=P('concreto','#c4c2bb',{tile:3,r:0.95,ns:1.3});const tor=cl(4.4,5.2,22,con,0,11,0,g,40);
  for(let k=1;k<7;k++)cl(4.45+((22-k*3)/22)*0.8*0+0.01+(5.2-4.4)*(1-k*3/22),4.45+(5.2-4.4)*(1-k*3/22),0.08,S('#a9a79f',0.9),0,k*3,0,g,40);   // juntas de concretagem
  cl(7.2,7.2,0.5,con,0,22.25,0,g,48);   // plataforma
  const gr=S('#d7a51e',0.5,0.4);for(let i=0;i<36;i++){const a=i/36*PI*2;cl(0.04,0.04,1.1,gr,Math.cos(a)*7.0,23.05,Math.sin(a)*7.0,g,6);}
  for(const h of[23.1,23.55]){const t=new THREE.Mesh(new THREE.TorusGeometry(7.0,0.035,6,72),gr);t.rotation.x=PI/2;t.position.y=h;g.add(t);}
  // cúpula geodésica: painéis com leve variação de tom
  const geo=new THREE.IcosahedronGeometry(9,3),cor=[],r=rnd(5);for(let i=0;i<geo.attributes.position.count;i+=3){const v=0.88+r()*0.12;for(let k=0;k<3;k++)cor.push(v,v,v*1.01);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cor,3));const dom=sombra(new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:0.45,color:0xf2f3ef})));dom.position.y=29.2;g.add(dom);
  const ped=haste(new V3(0,37.9,0),new V3(0,41,0),0.06,ACO(),g);const luz=new THREE.Mesh(new THREE.SphereGeometry(0.25,12,8),new THREE.MeshStandardMaterial({color:0xff2a1a,emissive:0xff2a1a,emissiveIntensity:2}));luz.position.y=41.1;g.add(luz);
  // escada externa com gaiola
  const esc=S('#d7a51e',0.5,0.4);for(const s of[-0.35,0.35])haste(new V3(5.25,0.2,s),new V3(4.45,22,s),0.03,esc,g);for(let k=0;k<55;k++){const t=k/55,x=5.25-0.8*t,y=0.2+21.8*t;haste(new V3(x,y,-0.35),new V3(x,y,0.35),0.018,esc,g);}
  // prédio de operações
  const pred=new THREE.Group();pred.position.set(-10,0,-9);g.add(pred);const reb=P('reboco','#d9d4c6',{tile:2,r:0.95});bx(12,4.6,8,reb,0,2.3,0,pred);
  bx(12.4,0.3,8.4,P('zinco','#8e9496',{tile:1,r:0.5,m:0.5}),0,4.75,0,pred);bx(12.6,0.35,8.6,S(fx,0.6),0,4.4,0,pred);
  for(let k=0;k<4;k++){bx(1.6,1.1,0.06,VIDRO,-4.2+k*2.6,2.9,4.02,pred);bx(1.75,0.08,0.12,S('#e8e6df',0.6),-4.2+k*2.6,2.32,4.06,pred);}
  bx(1.1,2.2,0.06,S('#4c5459',0.6),5.2,1.1,4.02,pred);bx(2,0.12,1.2,S('#bbb',0.8),5.2,2.5,4.5,pred);
  for(const k of[-3,0])bx(1.0,0.7,0.8,S('#c6c9c3',0.6,0.2),k,5.3,-2,pred);cl(0.06,0.06,4,ACO(),4.5,6.9,-2.5,pred,6);
  pessoa(g,-4,-4,0.6);return g;}
// ===== 3) RADAR GIRATÓRIO (busca aérea) =====
function refletor(pai,W,H,f,mat){const N=14,Mx=30,pos=[],uv=[],idx=[];for(let i=0;i<=N;i++){const y=-H/2+H*i/N,x=y*y/(4*f);for(let j=0;j<=Mx;j++){const z=-W/2+W*j/Mx;pos.push(x,y,z);uv.push(z/0.6,y/0.6);}}
  for(let i=0;i<N;i++)for(let j=0;j<Mx;j++){const a=i*(Mx+1)+j,b=a+Mx+1;idx.push(a,b,a+1,b,b+1,a+1);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const m=new THREE.Mesh(geo,mat);m.castShadow=true;pai.add(m);return m;}
const TEX_GRADE=canvasTex(64,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.strokeStyle='#fff';g.lineWidth=6;g.strokeRect(0,0,w,h);g.lineWidth=3;g.beginPath();g.moveTo(w/2,0);g.lineTo(w/2,h);g.moveTo(0,h/2);g.lineTo(w,h/2);g.stroke();},false);
function radarGiraNovo(fx){const g=new THREE.Group();const cin='#9ea6a6';
  bx(32,0.15,32,P('concreto','#9c9c96',{tile:4,r:1}),0,0.07,0,g);
  const aco=P('metalpint','#c9cdc6',{tile:1.5,r:0.6,ns:0.5});
  // torre treliçada 3×3 m, 11 m
  const H=11,a=1.5;for(const [x,z] of[[a,a],[a,-a],[-a,a],[-a,-a]])haste(new V3(x*1.25,0,z*1.25),new V3(x,H,z),0.12,aco,g);
  for(let k=0;k<4;k++){const y0=k*H/4,y1=(k+1)*H/4,s0=1.25-0.25*k/4,s1=1.25-0.25*(k+1)/4;for(const [p,q] of[[[a,a],[a,-a]],[[a,-a],[-a,-a]],[[-a,-a],[-a,a]],[[-a,a],[a,a]]]){
    haste(new V3(p[0]*s0,y0,p[1]*s0),new V3(q[0]*s1,y1,q[1]*s1),0.05,aco,g);haste(new V3(q[0]*s0,y0,q[1]*s0),new V3(p[0]*s1,y1,p[1]*s1),0.05,aco,g);haste(new V3(p[0]*s1,y1,p[1]*s1),new V3(q[0]*s1,y1,q[1]*s1),0.06,aco,g);}}
  bx(3.6,0.25,3.6,P('metalpint','#5d6560',{tile:1}),0,H+0.12,0,g);
  const cab=new THREE.Group();cab.position.y=H+0.25;g.add(cab);cl(1.1,1.2,0.6,P('metalpint','#5d6560',{tile:1}),0,0.3,0,cab,24);bx(2.2,1.6,2,P('metalpint','#6d756f',{tile:1.2}),-0.6,1.4,0,cab);
  const ant=new THREE.Group();ant.position.set(0.4,4.6,0);ant.rotation.z=-0.12;cab.add(ant);
  const malha=new THREE.MeshStandardMaterial({color:0xd2d6d0,alphaMap:TEX_GRADE,alphaTest:0.5,side:THREE.DoubleSide,metalness:0.5,roughness:0.45});
  refletor(ant,22,7.5,4.5,malha);
  const tubo=S('#e3e6e0',0.4,0.5);for(let j=0;j<=8;j++){const z=-11+j*2.75,pts=[];for(let i=0;i<=10;i++){const y=-3.75+7.5*i/10;pts.push(new V3(y*y/18,y,z));}
    const t=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),20,0.07,6),tubo);t.castShadow=true;ant.add(t);}
  for(const y of[-3.75,0,3.75])haste(new V3(y*y/18,y,-11),new V3(y*y/18,y,11),0.08,tubo,ant);
  // alimentador (corneta) e braços
  const fe=new THREE.Group();fe.position.set(4.5,0,0);ant.add(fe);bx(0.5,0.7,18,S('#d9dcd5',0.5,0.3),0,0,0,fe);for(const z of[-8,0,8]){haste(new V3(0,0,z),new V3(0.6,3.5,z*1.1),0.06,tubo,ant);haste(new V3(4.5,0,z),new V3(0.6,-3.5,z*1.1),0.06,tubo,ant);haste(new V3(4.5,0,z),new V3(0,0,z),0.08,tubo,ant);}
  haste(new V3(-0.6,-4.4,0),new V3(0.3,0,0),0.18,P('metalpint','#5d6560',{tile:1}),ant);
  giraM(cab,0.02);
  abrigo(g,'#7a8069',fx,-9,9,0.2,7);gerador(g,'#5a6640',-3,12.5,0.2);pessoa(g,4,6,2.2);
  return g;}
// ===== 4) ANTIAÉREA BITUBO 35 mm =====
function aaNovo(fx){const g=new THREE.Group();const oli='#4f5a3a',pin=P('metalpint',oli,{tile:1.2,r:0.7,ns:0.6}),esc=P('metalpint','#2e3427',{tile:1.2,r:0.8});
  bx(16,0.1,16,P('concreto','#8f8670',{tile:3,r:1,ns:1.4}),0,0.05,0,g);sacos(g,6.4,0,PI*2,4);
  // carreta com 4 braços estabilizadores
  bx(4.6,0.5,1.4,esc,0,0.75,0,g);for(let i=0;i<4;i++){const a=PI/4+i*PI/2,x=Math.cos(a)*3.1,z=Math.sin(a)*3.1;haste(new V3(Math.cos(a)*0.7,0.8,Math.sin(a)*0.7),new V3(x,0.35,z),0.13,esc,g);cl(0.35,0.4,0.15,S('#252a22',0.8),x,0.08,z,g,14);haste(new V3(x,0.9,z),new V3(x,0.1,z),0.07,ACO(),g);}
  for(const s of[-1,1])roda(0.48,0.3,g,-1.3,0.5,s*0.95);
  const tor=new THREE.Group();tor.position.y=1.05;g.add(tor);cl(1.05,1.15,0.35,esc,0,0.17,0,tor,28);
  // corpo da torre (perfil com frente inclinada, extrudado)
  const sh=new THREE.Shape();sh.moveTo(-1.3,0);sh.lineTo(1.0,0);sh.lineTo(1.35,0.7);sh.lineTo(0.9,1.55);sh.lineTo(-1.2,1.55);sh.lineTo(-1.45,0.9);sh.lineTo(-1.3,0);
  const ge=new THREE.ExtrudeGeometry(sh,{depth:1.6,bevelEnabled:true,bevelSize:0.04,bevelThickness:0.04,bevelSegments:1});ge.translate(0,0,-0.8);
  const uv=ge.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k),uv.getY(k));const corpo=sombra(new THREE.Mesh(ge,pin));corpo.position.y=0.35;tor.add(corpo);
  bx(0.55,0.4,0.5,S('#1d2226',0.4,0.3),0.2,2.15,0,tor);const vis=new THREE.Mesh(new THREE.PlaneGeometry(0.4,0.25),VIDRO);vis.position.set(0.48,2.17,0);vis.rotation.y=PI/2;tor.add(vis);   // mira
  bx(0.5,1.0,0.06,S('#3b4234',0.7),-0.7,1.0,0.86,tor);   // escotilha
  // dois canhões nos berços laterais
  const ele=0.42;{const mu=cl(0.13,0.13,2.6,ACO(),0.15,1.5,0,tor,14);mu.rotation.x=PI/2;}   // munhão: liga os berços ao corpo
  for(const s of[-1,1]){const b=new THREE.Group();b.position.set(0.15,1.5,s*1.05);b.rotation.z=ele;tor.add(b);
    bx(1.9,0.55,0.42,pin,-0.2,0,0,b);bx(0.9,0.75,0.5,esc,-0.9,0.45,0,b);   // berço + caixa de munição
    const cam=cl(0.15,0.15,1.3,pin,1.35,0,0,b,16);cam.rotation.z=PI/2;const cano=cl(0.065,0.07,3.0,S('#2a2d2a',0.45,0.7),3.4,0,0,b,14);cano.rotation.z=PI/2;
    const fr=cl(0.1,0.1,0.45,S('#2a2d2a',0.45,0.7),5.0,0,0,b,14);fr.rotation.z=PI/2;for(let k=0;k<3;k++)bx(0.06,0.24,0.24,S('#151715',0.5,0.5),4.86+k*0.13,0,0,b);   // freio de boca
    bx(0.5,0.08,0.3,S(fx,0.55),0.4,0.31,0,b);}
  pessoa(g,-2.6,2.2,0.8);return g;}


function cvs(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function texH(c){const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t;}
const PISTA=1300;
function texPistaC(fundo=true,ger=77){const L=4096,H=128,c=cvs(L,H),g=c.getContext('2d'),r=rnd(ger),pm=L/PISTA,py=H/46;
  if(fundo){g.fillStyle='#3e4146';g.fillRect(0,0,L,H);
    for(let i=0;i<9000;i++){const v=50+r()*40|0;g.fillStyle=`rgba(${v},${v},${v+4},.5)`;g.fillRect(r()*L,r()*H,2+r()*6,1+r()*2);}
    g.fillStyle='rgba(20,20,22,.35)';g.fillRect(0,H*0.38,L,H*0.24);}
  for(const e of[-1,1])for(let i=0;i<70;i++){const x=L/2+e*(L/2-(140+r()*260)*pm),y=H/2+(r()-0.5)*H*0.35;g.fillStyle='rgba(15,15,15,.28)';g.fillRect(x,y,(20+r()*60)*pm*e,2+r()*2);}
  const W=fundo?'#f2f2f2':'rgba(238,238,232,.92)';g.fillStyle=W;for(const y of[1.5,44.5-0.9])g.fillRect(0,y*py,L,0.9*py);
  for(let x=-560;x<=540;x+=50)g.fillRect((x+650)*pm,(23-0.5)*py,22*pm,1*py);
  for(const e of[-1,1]){const x0=e<0?6*pm:L-36*pm;for(let k=0;k<12;k++)g.fillRect(x0,(4+k*3.3)*py,30*pm,1.8*py);
    const xa=e<0?300*pm:L-345*pm;for(const y of[8,33])g.fillRect(xa,y*py,45*pm,4.5*py);
    for(let k=0;k<3;k++){const xt=e<0?(150+k*60)*pm:L-(150+k*60+22)*pm;for(const y of[10,31])g.fillRect(xt,y*py,22*pm,1.6*py);}
    g.save();g.translate(e<0?52*pm:L-52*pm,H/2);g.rotate(e<0?PI/2:-PI/2);g.font=`bold ${Math.round(12*pm)}px sans-serif`;g.textAlign='center';g.textBaseline='middle';g.scale(1,py/pm*1.6);g.fillText(e<0?'09':'27',0,0);g.restore();}
  if(!fundo){g.globalCompositeOperation='destination-out';for(let i=0;i<26000;i++){g.fillStyle=`rgba(0,0,0,${0.25+r()*0.6})`;g.fillRect(r()*L,r()*H,1+r()*3,1+r()*2);}}   // tinta gasta
  return c;}
function texListras2(){const c=cvs(64,16),g=c.getContext('2d');for(let i=0;i<5;i++){g.fillStyle=i%2?'#f4f4f4':'#ff5a14';g.fillRect(i*13,0,13,16);}return c;}

// ---------- PROPOSTA ----------
const CONC=(cor='#bdbab2',tile=3)=>P('concreto',cor,{tile,r:0.95,ns:1.3}),REB=(cor='#ddd6c6')=>P('reboco',cor,{tile:2,r:0.95}),ZIN=(cor='#c3c8c9')=>P('zinco',cor,{tile:1.2,r:0.5,m:0.15});
const BRANCO_PINT=()=>S('#ecebe4',0.42,0.08),AMARELO=S('#e2b21c',0.55,0.2),EMIS=(c,i=2)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:i});
function piso(g,w,d,mat,y=0.05){const geo=new THREE.PlaneGeometry(w,d),uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*w,uv.getY(k)*d);const p=new THREE.Mesh(geo,mat);p.rotation.x=-PI/2;p.position.y=y;p.receiveShadow=true;g.add(p);return p;}
function guarda(pai,pts,h=1.1,mat=AMARELO,passo=1.2){for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],L=a.distanceTo(b),n=Math.max(1,Math.round(L/passo));
  for(let k=0;k<n;k++){const p=new V3().lerpVectors(a,b,k/n);haste(p,p.clone().setY(p.y+h),0.025,mat,pai,5);}for(const y of[h,h*0.5])haste(a.clone().setY(a.y+y),b.clone().setY(b.y+y),0.025,mat,pai,5);}}
function janelas(pai,mat,x0,x1,y,z,nx,w=1.4,h=1.3,face=1){const fr=S('#e9e6dd',0.6);for(let k=0;k<nx;k++){const x=x0+(x1-x0)*(k+0.5)/nx;bx(w,h,0.06,VIDRO,x,y,z,pai);bx(w+0.16,0.1,0.25,fr,x,y-h/2-0.05,z+face*0.08,pai);bx(0.06,h,0.08,fr,x,y,z+face*0.03,pai);}}
function arcond(pai,x,y,z){bx(0.9,0.62,0.4,S('#d4d6d0',0.6,0.2),x,y,z,pai);const v=cl(0.24,0.24,0.03,S('#333',0.5),x+0.15,y,z+0.21,pai,16);v.rotation.x=PI/2;}
function caixaDagua(pai,x,y,z){cl(0.9,0.75,1.1,S('#2f6fb0',0.45,0.1),x,y+0.55,z,pai,24);cl(0.95,0.95,0.12,S('#2a62a0',0.45),x,y+1.16,z,pai,24);}   // caixa d'água de fibra azul
// bandeira que tremula (vértices)
const BAND=[];function bandeira(pai,cor,x,z,h=14){haste(new V3(x,0,z),new V3(x,h,z),0.07,S('#d8d8d4',0.35,0.7),pai,10);const b=new THREE.Mesh(new THREE.PlaneGeometry(3.6,2.4,16,6),new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),side:THREE.DoubleSide,roughness:0.8}));
  b.geometry.translate(1.8,0,0);b.position.set(x,h-1.3,z);pai.add(b);b.castShadow=true;b.userData.vivo=true;BAND.push(b);const bola=new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8),S('#c9a227',0.3,0.8));bola.position.set(x,h+0.1,z);pai.add(bola);return b;}
function tremula(t){for(const b of BAND){const p=b.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*1.6-t*5)*0.18*(x/3.6));}p.needsUpdate=true;b.geometry.computeVertexNormals();}}

// ===== 1) TORRE DE CONTROLE =====
function torreNovo(cor){const g=new THREE.Group();  const reb=REB('#e2dccd'),con=CONC('#c9c6bd',3);
  // prédio de 2 andares
  const pr=new THREE.Group();pr.position.set(10,0,-4);g.add(pr);bx(24,7.4,12,reb,0,3.7,0,pr);bx(24.4,0.6,12.4,con,0,7.7,0,pr);bx(24.4,0.12,12.4,S('#6f726f',0.9),0,8.06,0,pr);
  for(const f of[1,-1])for(const y of[2.2,5.6])janelas(pr,reb,-11,11,y,f*6.01,7,1.6,1.4,f);
  bx(4,0.25,2.4,con,-4,3.3,7.2,pr);for(const x of[-5.8,-2.2])cl(0.12,0.12,3.2,S('#bbb',0.4,0.6),x,1.6,8.2,pr,8);bx(2.4,2.6,0.06,VIDRO,-4,1.3,6.02,pr);   // entrada com marquise
  for(const x of[-8,-3,4])arcond(pr,x,8.5,-3);caixaDagua(pr,8,8.1,2);
  // fuste octogonal com rasgo de janelas da escada
  const H=26;cl(3.6,3.9,H,con,-6,H/2,-4,g,8).rotation.y=PI/8;for(let k=1;k<9;k++)cl(3.62+0.3*(1-k*3/H),3.62+0.3*(1-k*3/H),0.06,S('#a8a59c',0.95),-6,k*3,-4,g,8).rotation.y=PI/8;
  bx(0.9,H-6,0.08,VIDRO,-6,H/2+1,-4+3.52,g);   // rasgo de janelas da escada (numa face do octógono)
  // andar técnico + cabine de vidro inclinada (8 lados)
  const cab=new THREE.Group();cab.position.set(-6,H,-4);g.add(cab);cl(4.8,3.9,3.0,con,0,1.5,0,cab,8);
  cl(6.6,6.6,0.3,con,0,3.15,0,cab,8);   // laje com passarela
  guarda(cab,Array.from({length:9},(_,i)=>new V3(Math.cos(i/8*PI*2+PI/8)*6.4,3.3,Math.sin(i/8*PI*2+PI/8)*6.4)),1.1,S('#d9d9d4',0.4,0.6),1.4);
  const vid=new THREE.Mesh(new THREE.CylinderGeometry(5.6,4.8,3.6,8,1,true),new THREE.MeshStandardMaterial({color:0x2a4552,roughness:0.05,metalness:0.8,transparent:true,opacity:0.78,side:THREE.DoubleSide}));vid.position.y=5.1;vid.rotation.y=PI/8;cab.add(vid);
  bx(8.4,0.8,8.4,S('#2b2f33',0.8),0,3.7,0,cab).rotation.y=PI/8;   // peitoril
  for(let i=0;i<8;i++){const a=i/8*PI*2;haste(new V3(Math.cos(a)*4.85,3.3,Math.sin(a)*4.85),new V3(Math.cos(a)*5.62,6.9,Math.sin(a)*5.62),0.07,S('#2b2f33',0.6,0.5),cab,6);}
  cl(6.3,6.0,0.7,S('#33383c',0.8),0,7.25,0,cab,8);cl(2.2,2.4,0.8,con,0,8.0,0,cab,8);
  const dom=new THREE.Mesh(new THREE.SphereGeometry(1.3,18,12),S('#f2f2ee',0.4));dom.position.set(1.2,9.6,0);dom.castShadow=true;cab.add(dom);haste(new V3(1.2,8.4,0),new V3(1.2,8.9,0),0.3,ACO(),cab);
  haste(new V3(-1,8.4,0.6),new V3(-1,14,0.6),0.06,ACO(),cab);for(const y of[11,12.6])haste(new V3(-1.8,y,0.6),new V3(-0.2,y,0.6),0.03,ACO(),cab);
  const luz=new THREE.Mesh(new THREE.SphereGeometry(0.18,10,8),EMIS(0xff2a1a));luz.position.set(-1,14.15,0.6);cab.add(luz);
  // anemômetro
  haste(new V3(-1,8.4,-1.4),new V3(-1,10.4,-1.4),0.04,ACO(),cab);for(let i=0;i<3;i++){const a=i/3*PI*2;haste(new V3(-1,10.4,-1.4),new V3(-1+Math.cos(a)*0.4,10.4,-1.4+Math.sin(a)*0.4),0.015,ACO(),cab);}
  return g;}

// ===== 2) ABRIGO REFORÇADO (HAS) =====
function hasNovo(cor){const g=new THREE.Group();
  const W=30,Hh=10.5,L=44,con=CONC('#b3b0a6',3);
  // casca em arco (meio cilindro achatado) + nervuras a cada 4 m
  const geo=new THREE.CylinderGeometry(W/2,W/2,L,40,1,true,-PI/2,PI);geo.rotateX(-PI/2);{const uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*PI*W/2/3,uv.getY(k)*L/3);}
  const conD=CONC('#b3b0a6',3).clone();conD.side=THREE.DoubleSide;const casca=sombra(new THREE.Mesh(geo,conD));casca.scale.y=Hh/(W/2);g.add(casca);
  for(let z=-L/2+2;z<=L/2-2;z+=4){const t=new THREE.Mesh(new THREE.TorusGeometry(W/2+0.05,0.12,6,40,PI),S('#9b988f',0.95));t.scale.y=Hh/(W/2);t.position.z=z;g.add(t);}
  // terra e capim por cima (faixa central)
  const ter=new THREE.Mesh(new THREE.CylinderGeometry(W/2+0.3,W/2+0.3,L-2,40,1,true,-PI/2+0.75,PI-1.5),P('reboco','#6d7a45',{tile:2,r:1,ns:2}));ter.geometry.rotateX(-PI/2);ter.scale.y=(Hh+0.25)/(W/2);ter.receiveShadow=true;g.add(ter);
  // parede frontal (cabeça) com vão do portão
  const fr=new THREE.Shape();fr.moveTo(-W/2-1.2,0);fr.lineTo(W/2+1.2,0);fr.lineTo(W/2+1.2,Hh*0.55);fr.absellipse(0,0,W/2+1.2,Hh+1,0,PI,false);fr.lineTo(-W/2-1.2,0);
  const vao=new THREE.Path();vao.moveTo(-11.5,0.01);vao.lineTo(11.5,0.01);vao.lineTo(11.5,7.6);vao.lineTo(-11.5,7.6);vao.lineTo(-11.5,0.01);fr.holes.push(vao);
  const fg=new THREE.ExtrudeGeometry(fr,{depth:1.4,bevelEnabled:false});{const uv=fg.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/3,uv.getY(k)/3);}
  const frente=sombra(new THREE.Mesh(fg,CONC('#c2bfb5',3)));frente.position.z=-L/2-1.4;g.add(frente);
  // portões de correr: 2 folhas de aço com nervuras, entreabertos
  const aco=P('metalpint','#6f7466',{tile:1.5,r:0.6,ns:0.7});for(const [x,s] of[[-6.3,-1],[6.6,1]]){const f=bx(12.2,7.5,0.9,aco,x,3.8,-L/2-1.9,g);for(let k=0;k<6;k++)bx(12.2,0.18,0.25,S('#5a5e53',0.6,0.3),x,0.8+k*1.3,-L/2-2.45,g);bx(0.25,7.5,0.3,AMARELO,x+s*6.0,3.8,-L/2-2.4,g);}
  bx(0.7,7.4,0.4,S('#0d0f10',1),0.15,3.75,-L/2-1.4,g);   // fresta escura
  bx(28,0.12,0.4,S('#4a4a46',0.6,0.6),0,0.07,-L/2-1.9,g);bx(28,0.12,0.4,S('#4a4a46',0.6,0.6),0,0.07,-L/2-1.3,g);   // trilhos
  // parede do fundo + saída de exaustão
  const fundo=sombra(new THREE.Mesh(new THREE.ShapeGeometry((()=>{const s=new THREE.Shape();s.moveTo(-W/2,0);s.lineTo(W/2,0);s.absellipse(0,0,W/2,Hh,0,PI,false);return s;})()),conD));fundo.position.z=L/2;g.add(fundo);   /* virada p/ fora (antes estava p/ dentro e sumia) */
  bx(6,4,2.2,CONC('#a9a69c',3),0,5.5,L/2+1.0,g);bx(4.6,2.6,0.1,S('#121314',1),0,5.5,L/2+2.12,g);
  // linha amarela de entrada + número
  piso(g,0.5,46,S('#e2b21c',0.7),0.07).position.z=-L/2-26;
  const nt=canvasTex(256,128,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='rgba(235,235,228,.95)';c.font='bold 110px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText('07',w/2,h/2+6);});
  const num=new THREE.Mesh(new THREE.PlaneGeometry(4,2),new THREE.MeshStandardMaterial({map:nt,transparent:true,roughness:0.8}));num.position.set(0,9.2,-L/2-1.42);num.rotation.y=PI;g.add(num);
  for(const x of[-13,13]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.5,0.3,0.3),EMIS(0xffe7b0,1.2));l.position.set(x,8.3,-L/2-1.5);g.add(l);}
  bx(0.25,1.2,0.25,S(cor,0.5),-16.4,0.6,-L/2-3,g);
  pessoa(g,4,-L/2-8,0.3);return g;}

// ===== 3) TANQUES DE COMBUSTÍVEL =====
function tanque(pai,x,z,R,H,cor,nome){const g=new THREE.Group();g.position.set(x,0,z);pai.add(g);const pin=BRANCO_PINT();
  cl(R,R,H,pin,0,H/2+0.3,0,g,48);cl(R+0.25,R+0.25,0.3,CONC('#a8a69e',2),0,0.15,0,g,48);
  for(let y=1.8;y<H;y+=1.8){const t=new THREE.Mesh(new THREE.TorusGeometry(R+0.01,0.03,4,64),S('#c9c8c0',0.6));t.rotation.x=PI/2;t.position.y=y+0.3;g.add(t);}
  const teto=sombra(new THREE.Mesh(new THREE.ConeGeometry(R+0.1,1.3,48,1,true),pin));teto.position.y=H+0.3+0.65;g.add(teto);
  const fx=cl(R+0.02,R+0.02,0.7,S(cor,0.55),0,H-0.6,0,g,48);
  // escada em espiral com corrimão
  const n=Math.round(H/0.22),ang=PI*0.9;const deg=new THREE.InstancedMesh(new THREE.BoxGeometry(0.9,0.06,0.28),S('#8c8f8c',0.6,0.5),n);const m4=new THREE.Matrix4(),q=new THREE.Quaternion();
  for(let i=0;i<n;i++){const a=-PI/2+ang*i/n,y=0.3+H*i/n;q.setFromAxisAngle(new V3(0,1,0),-a);m4.compose(new V3(Math.cos(a)*(R+0.5),y,Math.sin(a)*(R+0.5)),q,new V3(1,1,1));deg.setMatrixAt(i,m4);}deg.castShadow=true;g.add(deg);
  const pts=[];for(let i=0;i<=24;i++){const a=-PI/2+ang*i/24;pts.push(new V3(Math.cos(a)*(R+0.95),0.3+H*i/24+1.0,Math.sin(a)*(R+0.95)));}g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),60,0.03,5),AMARELO));
  for(let i=0;i<=24;i+=2){const a=-PI/2+ang*i/24;const b=new V3(Math.cos(a)*(R+0.95),0.3+H*i/24,Math.sin(a)*(R+0.95));haste(b,b.clone().setY(b.y+1.0),0.022,AMARELO,g,5);}
  // guarda-corpo no topo, perto da escada
  const topo=[];for(let i=0;i<=8;i++){const a=-PI/2+ang-0.5+i*0.12;topo.push(new V3(Math.cos(a)*(R-0.2),H+0.6,Math.sin(a)*(R-0.2)));}guarda(g,topo,1.0,AMARELO,0.9);
  // nome pintado
  const nt=canvasTex(512,128,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#2b3a55';c.font='bold 92px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(nome,w/2,h/2+4);});
  const ng=new THREE.CylinderGeometry(R+0.03,R+0.03,1.6,48,1,true,PI*0.15,PI*0.45);const nm=new THREE.Mesh(ng,new THREE.MeshStandardMaterial({map:nt,transparent:true,roughness:0.6}));nm.position.y=H*0.55;g.add(nm);
  return g;}
function tanquesNovo(cor){const g=new THREE.Group();
  const con=CONC('#bebbb2',2);const bw=42,bd=48;   // dique de contenção
  for(const [x,z,w,d] of[[0,-bd/2,bw,0.4],[0,bd/2,bw,0.4],[-bw/2,0,0.4,bd],[bw/2,0,0.4,bd]])bx(w,1.4,d,con,x,0.7,z,g);
  piso(g,bw-0.4,bd-0.4,P('concreto','#8d8b84',{tile:3,r:0.95}),0.06);
  for(const z of[-4,4]){const e=new THREE.Group();e.position.set(bw/2,0,z);g.add(e);for(let k=0;k<4;k++){bx(0.8,0.06,0.3,S('#8c8f8c',0.6,0.5),0.5,0.35*(k+1),0.45*(k-1.5)*0+0,e);}}
  tanque(g,-9,-11.5,8,9,cor,'QAV-1  T-01');tanque(g,9,11.5,8,9,cor,'QAV-1  T-02');
  // tubulação até a casa de bombas
  const tubo=S('#c9c6b8',0.45,0.5),vm=S('#c0302a',0.5,0.3);
  const casa=new THREE.Group();casa.position.set(27,0,-6);g.add(casa);bx(6,3.2,5,REB('#d8d2c2'),0,1.6,0,casa);bx(6.4,0.2,5.4,ZIN(),0,3.3,0,casa);bx(1,2.1,0.06,S('#4c5459',0.6),-1.2,1.05,2.52,casa);
  for(const [a,b] of[[new V3(-1,0.8,-11.5),new V3(8,0.8,-11.5)],[new V3(8,0.8,-11.5),new V3(8,0.8,-7)],[new V3(8,0.8,-7),new V3(24,0.8,-7)],[new V3(17,0.8,11.5),new V3(21,0.8,11.5)],[new V3(21,0.8,11.5),new V3(21,0.8,-5)],[new V3(21,0.8,-5),new V3(24,0.8,-5)]])haste(a,b,0.18,tubo,g,12);
  for(const p of[new V3(-1,0.8,-11.5),new V3(17,0.8,11.5),new V3(14,0.8,-7)]){const v=new THREE.Mesh(new THREE.TorusGeometry(0.32,0.05,6,16),vm);v.position.copy(p).setY(1.4);v.rotation.x=PI/2;g.add(v);haste(p,p.clone().setY(1.4),0.04,ACO(),g);}
  for(let x=-16;x<=16;x+=4)for(const z of[-11.5])cl(0.12,0.16,0.7,CONC('#a8a69e',1),x+8,0.35,z,g,8);
  // placa de perigo
  const pl=canvasTex(256,256,(c,w,h)=>{c.fillStyle='#d62e24';c.fillRect(0,0,w,h);c.fillStyle='#fff';c.font='bold 46px Arial';c.textAlign='center';c.fillText('PERIGO',w/2,90);c.font='bold 34px Arial';c.fillText('INFLAMÁVEL',w/2,150);c.fillText('NÃO FUME',w/2,200);});
  const placa=new THREE.Mesh(new THREE.PlaneGeometry(1.2,1.2),new THREE.MeshStandardMaterial({map:pl,roughness:0.6}));placa.position.set(bw/2+0.25,1.9,8);placa.rotation.y=PI/2;g.add(placa);haste(new V3(bw/2+0.22,0,8),new V3(bw/2+0.22,1.3,8),0.04,ACO(),g);
  pessoa(g,24,2,1.2);return g;}

// ===== 4) PRÉDIOS =====
function telhado2aguas(pai,w,d,h,mat,y){const s=new THREE.Shape();s.moveTo(-d/2-0.4,0);s.lineTo(d/2+0.4,0);s.lineTo(0,h);s.lineTo(-d/2-0.4,0);
  const geo=new THREE.ExtrudeGeometry(s,{depth:w+0.8,bevelEnabled:false});geo.translate(0,0,-(w+0.8)/2);{const uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/1.2,uv.getY(k)/1.2);}
  const m=sombra(new THREE.Mesh(geo,mat));m.rotation.y=PI/2;m.position.y=y;pai.add(m);return m;}
function prediosNovo(cor){const g=new THREE.Group();piso(g,90,70,CONC('#a5a39b',4));
  // A) esquadrão: 2 andares, platibanda, janelas em faixa
  const a=new THREE.Group();a.position.set(-20,0,-12);g.add(a);const reb=REB('#e6dfcf');bx(30,7.2,16,reb,0,3.6,0,a);bx(30.3,0.9,16.3,REB('#cfc7b5'),0,7.6,0,a);
  bx(30.6,0.25,16.6,S('#3f3f3c',0.9),0,0.12,0,a);for(const f of[1,-1])for(const y of[2.1,5.4])janelas(a,reb,-13.5,13.5,y,f*8.01,9,1.5,1.3,f);
  for(const f of[1,-1])for(const y of[2.1,5.4])janelas({add:o=>{o.rotation.y=PI/2;o.position.set(f*15.01,o.position.y,-o.position.x);a.add(o);}},reb,-6,6,y,0,4,1.5,1.3,1);
  bx(5,0.3,3,CONC(),-6,3.4,9.4,a);for(const x of[-8.2,-3.8])cl(0.15,0.15,3.3,REB('#cfc7b5'),x,1.65,10.6,a,10);bx(2.6,2.6,0.06,VIDRO,-6,1.3,8.03,a);
  bx(3.4,0.6,0.1,S(cor,0.55),8,7.1,8.06,a);
  for(const x of[-10,-5,2])arcond(a,x,8.4,-4);caixaDagua(a,9,8.05,3);caixaDagua(a,11.2,8.05,3);
  // B) depósito de chapa ondulada, telhado de 2 águas, portão de enrolar
  const b=new THREE.Group();b.position.set(22,0,10);g.add(b);const zn=ZIN('#c9cecd');bx(22,7,22,zn,0,3.5,0,b);telhado2aguas(b,22,22,3.2,ZIN('#b0b5b7'),7);
  const tri=new THREE.Shape();tri.moveTo(-11,0);tri.lineTo(11,0);tri.lineTo(0,3.2);const tg=new THREE.ShapeGeometry(tri);{const uv=tg.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/1.2,uv.getY(k)/1.2);}
  for(const s of[1,-1]){const o=new THREE.Mesh(tg,zn);o.position.set(s*11.01,7,0);o.rotation.y=s*PI/2;b.add(o);}
  const port=P('zinco','#c9b25a',{tile:0.6,r:0.6,m:0.4});const pg=bx(8,5.5,0.1,port,-3,2.75,-11.05,b);bx(8.6,0.6,0.7,S('#6b6e6a',0.6,0.4),-3,5.8,-11.3,b);bx(1,2.2,0.08,S('#3c4a5a',0.6),6,1.1,-11.05,b);
  for(const x of[-9,-1,7])bx(1.8,0.9,0.06,new THREE.MeshStandardMaterial({color:0xb9c8cc,roughness:0.3,transparent:true,opacity:0.7}),x,6.0,11.06,b);
  piso(g,0.25,14,S('#e2b21c',0.7),0.07).position.set(19,0.07,-8);
  // C) alojamento térreo com telhado de telha
  const c=new THREE.Group();c.position.set(-18,0,20);g.add(c);bx(40,3.6,12,REB('#efe8d8'),0,1.8,0,c);telhado2aguas(c,40,12,2.4,P('reboco','#a8532f',{tile:0.5,r:0.85,ns:2.2}),3.6);
  for(const f of[1,-1])janelas(c,null,-18,18,2.0,f*6.01,10,1.3,1.1,f);for(const x of[-15,0,15])bx(1,2.2,0.06,S('#7a5a3c',0.7),x,1.1,6.04,c);
  pessoa(g,-4,1,0.4);pessoa(g,8,-4,2.8);return g;}

// ===== 5) PISTA E CABECEIRA =====
function pistaNovo(cor){const g=new THREE.Group();const L=PISTA,x0=-L/2+60;
  const asf=P('asfalto','#d8d6cf',{tile:4,r:0.95,ns:0.8});const p=piso(g,L,46,asf,0.08);p.position.x=x0;
  for(const s of[-1,1]){const a=piso(g,L,7.5,P('asfalto','#f2efe6',{tile:4,r:1}),0.06);a.position.set(x0,0.06,s*26.75);}   // acostamentos
  const mk=texH(texPistaC(false,77));const marc=new THREE.Mesh(new THREE.PlaneGeometry(L,46),new THREE.MeshStandardMaterial({map:mk,transparent:true,roughness:0.75,polygonOffset:true,polygonOffsetFactor:-2}));marc.rotation.x=-PI/2;marc.position.set(x0,0.1,0);marc.receiveShadow=true;g.add(marc);
  // luzes de borda (embutidas com cúpula) e cabeceira verde/vermelha
  const base=S('#d9c22a',0.5,0.3);for(let x=-180;x<=60;x+=60)for(const s of[-1,1]){cl(0.18,0.22,0.35,base,x,0.18,s*24.2,g,10);const l=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,6,0,PI*2,0,PI/2),EMIS(0xfff1c8,1.5));l.position.set(x,0.35,s*24.2);g.add(l);}
  for(let k=-10;k<=10;k++){cl(0.15,0.18,0.25,base,59.5,0.13,k*2.2,g,8);const l=new THREE.Mesh(new THREE.SphereGeometry(0.13,10,6,0,PI*2,0,PI/2),EMIS(0x3cff6a,2));l.position.set(59.5,0.25,k*2.2);g.add(l);}
  // PAPI (4 caixas à esquerda, a 300 m da cabeceira)
  for(let k=0;k<4;k++){const u=new THREE.Group();u.position.set(60-300,0,-34-k*9);g.add(u);bx(1.4,0.6,0.9,S('#e8e4d8',0.6),0,0.7,0,u);for(const s of[-0.3,0.3])haste(new V3(s,0,0),new V3(s,0.4,0),0.05,ACO(),u);
    const lz=new THREE.Mesh(new THREE.CircleGeometry(0.2,14),EMIS(k<2?0xffffff:0xff3020,2));lz.position.set(0.71,0.75,0);lz.rotation.y=PI/2;u.add(lz);}
  // placa de pista (amarelo/preto)
  const pl=canvasTex(256,96,(c,w,h)=>{c.fillStyle='#1b1b1b';c.fillRect(0,0,w/2,h);c.fillStyle='#f2c21b';c.fillRect(w/2,0,w/2,h);c.font='bold 64px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle='#f2c21b';c.fillText('A',w/4,h/2+3);c.fillStyle='#1b1b1b';c.fillText('09',w*3/4,h/2+3);});
  const placa=new THREE.Group();placa.position.set(20,0,-40);g.add(placa);bx(2.6,1.0,0.25,S('#222',0.6),0,1.0,0,placa);const fc=new THREE.Mesh(new THREE.PlaneGeometry(2.5,0.92),new THREE.MeshStandardMaterial({map:pl,emissive:0x222222,roughness:0.5}));fc.position.set(0,1.0,0.13);placa.add(fc);for(const x of[-1,1])haste(new V3(x,0,0),new V3(x,0.5,0),0.05,ACO(),placa);
  // biruta de verdade: mastro, aro e saia listrada caída pelo vento
  const bi=new THREE.Group();bi.position.set(30,0,-60);g.add(bi);haste(new V3(0,0,0),new V3(0,7,0),0.09,S('#e9e9e4',0.4,0.5),bi,10);cl(0.6,0.6,0.5,CONC(),0,0.25,0,bi,12);
  const aro=new THREE.Mesh(new THREE.TorusGeometry(0.45,0.03,6,20),ACO());aro.position.set(0.25,7,0);aro.rotation.y=PI/2;bi.add(aro);haste(new V3(0,7,0),new V3(0.25,7,0),0.03,ACO(),bi);
  const lis=texH(texListras2());const sg=new THREE.CylinderGeometry(0.45,0.22,3.6,16,10,true);sg.rotateZ(-PI/2);sg.translate(1.8+0.25,0,0);const sp=sg.attributes.position;for(let i=0;i<sp.count;i++){const x=sp.getX(i)-0.25;sp.setY(i,sp.getY(i)-0.06*x*x);}sg.computeVertexNormals();
  const saia=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({map:lis,side:THREE.DoubleSide,roughness:0.85}));saia.position.y=7;saia.castShadow=true;bi.add(saia);
  // taxiway com linha central amarela e luzes azuis
  const tx=piso(g,26,90,asf,0.07);tx.position.set(-40,0.07,-68);const lc=piso(g,0.3,90,S('#e2b21c',0.6),0.09);lc.position.set(-40,0.09,-68);
  for(let z=-28;z>=-110;z-=15)for(const s of[-1,1]){cl(0.12,0.15,0.3,S('#2a5bd7',0.5),-40+s*13.4,0.15,z,g,8);const l=new THREE.Mesh(new THREE.SphereGeometry(0.11,8,6,0,PI*2,0,PI/2),EMIS(0x3a7bff,2));l.position.set(-40+s*13.4,0.3,z);g.add(l);}
  pessoa(g,40,-30,1);return g;}

// ---------- PROPOSTA ----------
// água do mar (só na prévia; no jogo o mar já existe)
const TEX_MAR_N=canvasTex(256,256,(c,w,h)=>{const r=rnd(12);c.fillStyle='rgb(128,128,255)';c.fillRect(0,0,w,h);for(let i=0;i<1400;i++){const x=r()*w,y=r()*h,s=4+r()*14;const gr=c.createRadialGradient(x,y,0,x,y,s);const k=r()<0.5;gr.addColorStop(0,k?'rgba(160,150,255,.5)':'rgba(96,106,255,.5)');gr.addColorStop(1,'rgba(128,128,255,0)');c.fillStyle=gr;c.fillRect(x-s,y-s,2*s,2*s);}},false);
TEX_MAR_N.repeat.set(30,30);
function agua(g){const m=new THREE.Mesh(new THREE.PlaneGeometry(2400,2400),new THREE.MeshStandardMaterial({color:0x1f4f6b,roughness:0.18,metalness:0.25,normalMap:TEX_MAR_N,normalScale:new THREE.Vector2(0.5,0.5),transparent:true,opacity:0.93}));m.rotation.x=-PI/2;m.position.y=0;m.receiveShadow=true;g.add(m);return g;}
// casco de navio de verdade: seções com V, alargamento (flare), tosado (proa mais alta) e popa espelhada
const NAV=cor=>{const t=tex('metalpint',2);return new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),normalMap:t.normalMap,normalScale:new THREE.Vector2(0.18,0.18),roughness:0.55,metalness:0.1});};
function cascoNavio(L,B,D,T,o={}){const N=40,K=9,pos=[],cor=[],uv=[],idx=[];const cBase=new THREE.Color(o.cor||'#7d878f').convertSRGBToLinear(),cFundo=new THREE.Color(o.fundo||'#8e2b22').convertSRGBToLinear(),cFaixa=new THREE.Color('#16181a').convertSRGBToLinear();
  const xP=o.proa??0.62,secoes=[];
  for(let i=0;i<=N;i++){const u=i/N,x=-L/2+L*u;const t=Math.max(0,(u-xP)/(1-xP));const larg=B/2*(u<0.08?0.86+0.14*u/0.08:1)*(1-t*t*(0.35+0.65*t));
    const conv=D+(o.tosado??0.035*L)*Math.pow(Math.max(0,u-0.4)/0.6,2);const quilha=-T+T*Math.pow(t,1.6)*0.95;const vee=0.25+0.6*t;
    const ring=[];for(let k=0;k<=K;k++){const s=k/K;   // s=0 quilha, s=1 convés
      let y,z;if(s<0.4){const q=s/0.4;y=quilha+(0-quilha)*Math.pow(q,1+vee)*0.92;z=larg*(0.15+0.85*Math.sin(q*PI/2))*(1-vee*0.35*(1-q));}else{const q=(s-0.4)/0.6;y=0+(conv-0)*q;z=larg*(1+(o.flare??0.06)*q*(0.4+t));}
      ring.push([x,y,z]);}secoes.push(ring);}
  const add=(p,c,uu,vv)=>{pos.push(...p);cor.push(c.r,c.g,c.b);uv.push(uu,vv);return pos.length/3-1;};
  const colorDe=y=>y<-0.25?cFundo:y<0.45?cFaixa:cBase;
  for(const lado of[1,-1]){const base=pos.length/3;for(let i=0;i<=N;i++)for(let k=0;k<=K;k++){const [x,y,z]=secoes[i][k];add([x,y,z*lado],colorDe(y),x/3,y/3);}
    for(let i=0;i<N;i++)for(let k=0;k<K;k++){const a=base+i*(K+1)+k,b=a+K+1;if(lado>0)idx.push(a,b,a+1,b,b+1,a+1);else idx.push(a,a+1,b,b,a+1,b+1);}}
  // popa (espelho)
  const s0=secoes[0];const c0=add([s0[0][0],s0[0][1],0],cBase,0,0);for(let k=0;k<K;k++){const a=add([s0[k][0],s0[k][1],s0[k][2]],colorDe(s0[k][1]),s0[k][2]/3,s0[k][1]/3),b=add([s0[k+1][0],s0[k+1][1],s0[k+1][2]],colorDe(s0[k+1][1]),s0[k+1][2]/3,s0[k+1][1]/3),
    a2=add([s0[k][0],s0[k][1],-s0[k][2]],colorDe(s0[k][1]),0,0),b2=add([s0[k+1][0],s0[k+1][1],-s0[k+1][2]],colorDe(s0[k+1][1]),0,0);idx.push(c0,b,a,c0,a2,b2);}
  {const dP=add([s0[K][0],s0[K][1],s0[K][2]],cBase,0,0),dS=add([s0[K][0],s0[K][1],-s0[K][2]],cBase,0,0);idx.push(c0,dS,dP);}   /* fecha o miolo do espelho de popa (antes ficava aberto) */
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(cor,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(idx);geo.computeVertexNormals();
  const t=tex('metalpint',2);const mat=new THREE.MeshStandardMaterial({vertexColors:true,normalMap:t.normalMap,normalScale:new THREE.Vector2(0.2,0.2),roughness:0.55,metalness:0.1,side:THREE.DoubleSide});   // tinta naval lisa (sem manchas)
  const m=sombra(new THREE.Mesh(geo,mat));
  // convés: tampa entre as bordas
  const dp=[],di=[];for(let i=0;i<=N;i++){const [x,y,z]=secoes[i][K];dp.push(x,y-0.05,z*0.995,x,y-0.05,-z*0.995);}for(let i=0;i<N;i++){const a=i*2;di.push(a,a+2,a+1,a+1,a+2,a+3);}
  const dg=new THREE.BufferGeometry();dg.setAttribute('position',new THREE.Float32BufferAttribute(dp,3));dg.setIndex(di);dg.computeVertexNormals();{const uvd=[];for(let i=0;i<dp.length;i+=3)uvd.push(dp[i]/2,dp[i+2]/2);dg.setAttribute('uv',new THREE.Float32BufferAttribute(uvd,2));}
  const deck=new THREE.Mesh(dg,P('concreto',o.conves||'#5f666b',{tile:2,r:0.9,ns:0.6}));deck.receiveShadow=true;m.add(deck);
  m.userData.secoes=secoes;m.userData.K=K;return m;}
function bordaDe(m,i){const s=m.userData.secoes[i],K=m.userData.K;return s[K];}
// balaustrada (corrimão + balaústres instanciados) ao longo da borda do convés
function balaustrada(pai,casco,i0,i1,h=1.0){const S_=casco.userData.secoes,K=casco.userData.K,mat=S('#cfd3d4',0.4,0.5);
  for(const lado of[1,-1]){const pts=[];for(let i=i0;i<=i1;i++){const [x,y,z]=S_[i][K];pts.push(new V3(x,y+h,z*lado*0.985));}
    if(LEVE)continue;pai.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*3,0.035,5),mat));
    const pts2=pts.map(p=>p.clone().setY(p.y-h*0.5));pai.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts2),pts.length*3,0.025,5),mat));
    const curva=new THREE.CatmullRomCurve3(pts),n=Math.round(curva.getLength()/1.5),inst=new THREE.InstancedMesh(new THREE.CylinderGeometry(0.03,0.03,h,5),mat,n),m4=new THREE.Matrix4();
    for(let k=0;k<n;k++){const p=curva.getPoint(k/(n-1||1));m4.makeTranslation(p.x,p.y-h/2,p.z);inst.setMatrixAt(k,m4);}pai.add(inst);}}
// casa com paredes inclinadas (furtiva)
function tronco(w,h,d,k,mat,x,y,z,pai,kz){const g=new THREE.BoxGeometry(w,h,d),p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*(kz??k));}
  const uv=g.attributes.uv,D=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];for(let f=0;f<6;f++)for(let i=0;i<4;i++){const q=f*4+i;uv.setXY(q,uv.getX(q)*D[f][0]/2,uv.getY(q)*D[f][1]/2);}
  g.computeVertexNormals();const m=sombra(new THREE.Mesh(g,mat));m.position.set(x,y,z);pai.add(m);return m;}
function numeroCasco(pai,casco,i,txt,esc=1,tinta='#f4f4f0',yFix=null){const [x,y,z]=casco.userData.secoes[i][casco.userData.K-2];const t=canvasTex(512,256,(c,w,h)=>{c.clearRect(0,0,w,h);c.font='bold 200px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle='rgba(0,0,0,.55)';c.fillText(txt,w/2+6,h/2+8);c.fillStyle=tinta;c.fillText(txt,w/2,h/2);});
  for(const lado of[1,-1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(5*esc,2.5*esc),new THREE.MeshStandardMaterial({map:t,transparent:true,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-4}));p.position.set(x,yFix??y*0.55+0.6,z*lado+0.12*lado);p.rotation.y=lado>0?0:PI;pai.add(p);}}
function canhao127(pai,mat,x,y,esc=1){const t=new THREE.Group();t.position.set(x,y,0);t.scale.setScalar(esc);pai.add(t);
  cl(2.6,2.8,0.6,mat,0,0.3,0,t,24);const sh=new THREE.Shape();sh.moveTo(-3,0);sh.lineTo(2.2,0);sh.lineTo(3.4,1.2);sh.lineTo(1.4,2.7);sh.lineTo(-2.6,2.7);sh.lineTo(-3,0);
  const geo=new THREE.ExtrudeGeometry(sh,{depth:4.2,bevelEnabled:true,bevelSize:0.06,bevelThickness:0.06,bevelSegments:1});geo.translate(0,0,-2.1);{const uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/2,uv.getY(k)/2);}
  const c=sombra(new THREE.Mesh(geo,mat));c.position.y=0.6;t.add(c);const ca=cl(0.17,0.2,7.2,S('#5e676d',0.5,0.5),6.4,2.2,0,t,14);ca.rotation.z=PI/2+0.1;   /* elevado ~6° */cl(0.32,0.32,1.2,mat,3.6,1.7,0,t,14).rotation.z=PI/2;return t;}
function ciws(pai,x,y,z,ry=0){   /* (21/11) CIWS tipo Phalanx: pedestal, giro, berço, cúpula do radar em cima e 6 canos rotativos embaixo; ry = p/ onde aponta */
  const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=ry;pai.add(g);const br=S('#e9ecea',0.45,0.1),cz=S('#c9cfd2',0.5,0.2),esc=S('#2a2d2f',0.4,0.6);
  cl(0.95,1.1,0.7,cz,0,0.35,0,g,20);cl(1.0,1.0,0.25,esc,0,0.82,0,g,20);   // pedestal + anel de giro
  const t=new THREE.Group();t.position.y=0.95;g.add(t);for(const s of[-0.62,0.62])bx(0.9,1.3,0.12,cz,0,0.65,s,t);   // braços do berço
  const ber=new THREE.Group();ber.position.y=1.05;ber.rotation.z=0.22;t.add(ber);   // tudo que eleva (≈13°)
  bx(1.3,0.85,1.0,br,-0.15,0,0,ber);cl(0.18,0.18,1.3,ACO(),0,0,0,ber,10).rotation.x=PI/2;   // corpo + munhão
  const cu=cl(0.55,0.55,1.0,br,-0.35,0.95,0,ber,24);const dm=new THREE.Mesh(new THREE.SphereGeometry(0.55,24,12,0,PI*2,0,PI/2),br);dm.position.set(-0.35,1.45,0);ber.add(dm);bx(0.08,0.3,0.6,esc,0.2,1.0,0,ber);   // cúpula do radar ("R2-D2")
  for(let k=0;k<6;k++){const a=k/6*PI*2;const c=cl(0.035,0.035,1.7,esc,1.35,-0.15+Math.sin(a)*0.11,Math.cos(a)*0.11,ber,6);c.rotation.z=PI/2;}   // 6 canos
  for(const xx of[0.6,2.1]){const an=cl(0.17,0.17,0.12,esc,xx,-0.15,0,ber,14);an.rotation.z=PI/2;}   // braçadeiras dos canos
  bx(0.7,0.6,0.7,cz,-0.2,-0.6,0.35,ber);   // tambor de munição
  return g;}
function vls(pai,x,y,nx,nz){const g=new THREE.Group();g.position.set(x,y,0);pai.add(g);bx(nx*1.6+0.6,0.5,nz*1.6+0.6,S('#545c61',0.7),0,0.25,0,g);for(let i=0;i<nx;i++)for(let k=0;k<nz;k++)bx(1.3,0.08,1.3,S('#3c4246',0.6),-(nx-1)*0.8+i*1.6,0.54,-(nz-1)*0.8+k*1.6,g);return g;}
function bote(pai,x,y,z,cor='#e46f1c'){const g=new THREE.Group();g.position.set(x,y,z);pai.add(g);const c=cascoNavio(7,2.5,0.9,0.35,{cor,fundo:'#2a2a2a',proa:0.55,tosado:0.25,flare:0.1,conves:'#333'});g.add(c);
  const t=new THREE.Mesh(new THREE.TorusGeometry(1,0.22,8,24),S('#ef7d22',0.7));t.scale.set(3.2,1,1.15);t.rotation.x=PI/2;t.position.y=0.9;g.add(t);bx(1,0.9,0.8,S('#2b2b2b',0.6),-1.6,1.2,0,g);return g;}
function balsas(pai,x,y,z,n=3){for(let k=0;k<n;k++){const c=cl(0.45,0.45,1.5,S('#f2f2ee',0.5),x+k*1.2,y+0.5,z,pai,16);c.rotation.x=PI/2;for(const s of[-0.4,0.4]){const a=cl(0.47,0.47,0.08,S('#d84a24',0.6),x+k*1.2,y+0.5,z+s,pai,16);a.rotation.x=PI/2;}}bx(n*1.2+0.2,0.15,1.8,S('#7d878f',0.6),x+(n-1)*0.6,y,z,pai);}
function mastroTrelica(pai,x,y,h,mat){const g=new THREE.Group();g.position.set(x,y,0);pai.add(g);const a=1.2;for(const [p,q] of[[a,a],[a,-a],[-a,a],[-a,-a]])haste(new V3(p,0,q),new V3(p*0.35,h,q*0.35),0.08,mat,g,6);
  for(let k=0;k<5;k++){const y0=k*h/5,y1=(k+1)*h/5,s0=1-0.65*k/5,s1=1-0.65*(k+1)/5;for(const [p,q,r,s] of[[a,a,a,-a],[a,-a,-a,-a],[-a,-a,-a,a],[-a,a,a,a]]){haste(new V3(p*s0,y0,q*s0),new V3(r*s1,y1,s*s1),0.04,mat,g,5);haste(new V3(p*s1,y1,q*s1),new V3(r*s1,y1,s*s1),0.05,mat,g,5);}}
  return g;}
function heliconves(pai,x,y,w,d){const px=32,t=canvasTex(Math.round(d*px),Math.round(w*px),(c,W,H)=>{   /* canvas na proporção do convoo: o círculo sai redondo (antes esticava e ficava oval) */
  c.fillStyle='#4d5357';c.fillRect(0,0,W,H);c.strokeStyle='#f2f2ee';c.lineWidth=0.3*px;c.strokeRect(0.4*px,0.4*px,W-0.8*px,H-0.8*px);const R=Math.min(W,H)*0.36;c.beginPath();c.arc(W/2,H/2,R,0,PI*2);c.stroke();
  c.strokeStyle='#e8c21c';c.lineWidth=0.25*px;c.beginPath();c.moveTo(W/2,0.9*px);c.lineTo(W/2,H-0.9*px);c.stroke();c.beginPath();c.moveTo(W/2-R*0.7,H/2+R*0.75);c.lineTo(W/2+R*0.7,H/2+R*0.75);c.stroke();});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(d,w),new THREE.MeshStandardMaterial({map:t,roughness:0.85}));p.rotation.x=-PI/2;p.rotation.z=PI/2;   /* w = comprimento (proa-popa), d = largura (antes trocados: o convoo passava da popa) */p.position.set(x,y,0);p.receiveShadow=true;pai.add(p);
  for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.PlaneGeometry(w,1.2),new THREE.MeshStandardMaterial({color:0x3b4043,alphaMap:TEX_ALAMBRADO,alphaTest:0.5,side:THREE.DoubleSide}));r.position.set(x,y-0.1,s*(d/2+0.55));r.rotation.x=-PI/2+s*0.25;pai.add(r);}}
function bandeiraPopa(pai,cor,x,y){haste(new V3(x,y,0),new V3(x-0.5,y+5,0),0.05,S('#d0d0cc',0.4,0.5),pai,8);const b=new THREE.Mesh(new THREE.PlaneGeometry(2.4,1.6,12,4),new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),side:THREE.DoubleSide,roughness:0.8}));
  b.geometry.translate(-1.2,0,0);b.position.set(x-0.5,y+4.1,0);b.rotation.y=PI;pai.add(b);BAND.push(b);return b;}
function convesY(c,x){const S_=c.userData.secoes,N=S_.length-1,x0=S_[0][0][0],x1=S_[N][0][0];const i=Math.max(0,Math.min(N,Math.round((x-x0)/(x1-x0)*N)));return S_[i][c.userData.K][1];}

// ===== NAVIO A · fragata clássica (casco cinza, mastro treliça, canhão 127 mm, CIWS) =====
function navioANovo(cor){const g=agua(new THREE.Group());const L=80,cz=NAV('#8a949b'),cz2=NAV('#a7b0b6'),esc=S('#4b545c',0.7);
  const c=cascoNavio(L,13,7.5,4,{cor:'#808a91'});g.add(c);const D=7.5;balaustrada(g,c,1,36);numeroCasco(g,c,30,'F 40');
  // superestrutura
  bx(18,5,10.5,cz2,-5,D+2.5,0,g);bx(11,4,9,cz2,-1.5,D+7,0,g);const pv=bx(0.12,1.4,8.4,VIDRO,4.03,D+7.6,0,g);
  bx(11.4,0.3,9.6,S('#3b4145',0.7),-1.5,D+9.15,0,g);for(const s of[-1,1])bx(3,0.3,2,cz2,1.2,D+6,s*5.3,g);   // asas da ponte
  const mt=mastroTrelica(g,-3,D+9.3,13,S('#5a6268',0.6,0.3));const rad=new THREE.Group();rad.position.set(-3,D+22.5,0);g.add(rad);bx(1.2,0.9,7,S('#d5dadc',0.5),0,0,0,rad);bx(0.3,0.3,0.3,esc,0,-0.6,0,rad);gira(rad,0.04);
  for(const y of[D+15,D+18.5])bx(0.15,0.15,4.4,esc,-3,y,0,g);const ld=new THREE.Mesh(new THREE.SphereGeometry(1.1,16,12),S('#eef0ef',0.4));ld.position.set(-3,D+20.3,0);g.add(ld);
  // chaminé
  const ch=tronco(6,5.5,5.5,0.82,cz,-10,D+7.75,0,g,0.85);bx(4.2,0.6,4.4,S(cor,0.55),-10,D+10.7,0,g);for(const z of[-0.8,0.8])cl(0.45,0.45,1.2,S('#1b1d1f',0.6),-10.6,D+11.3,z,g,12);   // chaminé em cima da casa
  canhao127(g,cz2,24,convesY(c,24)-0.06,1);   /* base giratória assentada no convés (antes 0,4 m acima) */vls(g,13,convesY(c,13)-0.1,4,3);
  bx(3.4,2.6,3.4,cz2,-21.5,D+1.3,0,g);ciws(g,-21.5,D+2.6,0,PI);   /* pedestal pequeno (antes um bloco de 12 × 10 m) */   /* aponta p/ a popa (antes mirava a própria superestrutura) */for(const s of[-1,1])balsas(g,-17.2,D+0.15,s*5.0,2);
  heliconves(g,-31.6,D+0.12,15.8,10.4);   /* convoo ocupa a popa toda */bandeiraPopa(g,cor,-39.6,D+0.2);
  return g;}
// ===== NAVIO B · fragata furtiva (classe Tamandaré) =====
function navioBNovo(cor){const g=agua(new THREE.Group());const L=82,cz=NAV('#737d84'),esc=S('#3c444b',0.7);
  const c=cascoNavio(L,13.5,7.8,4.2,{cor:'#6e777e',flare:0.1});g.add(c);const D=7.8;balaustrada(g,c,1,37);numeroCasco(g,c,30,'F 200');
  tronco(34,6.5,12.6,0.86,cz,-5,D+3.25,0,g,0.82);tronco(13,5,9.8,0.82,cz,1.5,D+8.6,0,g,0.8);
  const jan=bx(0.12,1.2,7.6,VIDRO,7.25,D+9.4,0,g);jan.rotation.z=0.23;   /* janela colada na frente inclinada (antes saía 1,6 m p/ fora) */
  // mastro integrado com 4 painéis de radar
  const MX=1.5;   /* mastro centrado em cima da ponte (antes em -3: metade ficava no ar, atrás da ponte) */
  tronco(7,10,7,0.5,cz,MX,D+16,0,g,0.5);for(const [nx,nz] of[[1,0],[-1,0],[0,1],[0,-1]]){const n=new V3(nx*10,1.75,nz*10).normalize(),ctr=new V3(MX+nx*2.73,D+15.5,nz*2.73);const p=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshStandardMaterial({map:TEX_FASE,color:0x6f777c,roughness:0.5}));p.position.copy(ctr).addScaledVector(n,0.04);p.lookAt(ctr.clone().add(n));g.add(p);}   // 4 painéis do radar no mastro integrado
  cl(0.2,0.2,5,esc,MX,D+23.5,0,g,8);const d=new THREE.Group();d.position.set(MX,D+26,0);g.add(d);bx(0.5,0.5,4.5,S('#c9cfd2',0.5),0,0,0,d);gira(d,0.06);
  tronco(7,4,6,0.6,esc,-14.5,D+8.5,0,g);tronco(4.75,0.6,4.1,0.93,S(cor,0.55),-14.5,D+10.0,0,g,0.93);   /* chaminé inteira em cima da casa (antes sobrava 2 m p/ fora) */   /* faixa do time no topo da chaminé (a da lateral ficava solta) */
  const t=new THREE.Group();t.position.set(25,convesY(c,25)-0.06,0);g.add(t);tronco(6,2.6,5.4,0.55,cz,0,1.3,0,t);bx(0.9,0.9,1.3,cz,2.1,1.6,0,t).rotation.z=-0.5;   /* mantelete: liga o cano à torre */
  const ca=cl(0.17,0.22,7,S('#5e676d',0.5,0.5),5.5,2.05,0,t,14);ca.rotation.z=PI/2+0.1;   /* cano saindo da torre, levemente p/ cima (antes apontava p/ o convés e ficava solto) */
  vls(g,16.6,convesY(c,16.6)-0.1,4,2);   /* afastado da casa (antes entrava 0,5 m nela) */ciws(g,-24.3,D,0,PI);for(const s of[-1,1])balsas(g,-9,D+0.15,s*5.0,2);
  heliconves(g,-33.3,D+0.12,13,11.2);bandeiraPopa(g,cor,-40.6,D+0.2);return g;}
// ===== NAVIO C · corveta clássica (duas chaminés, mastro treliça, botes) =====
function navioCNovo(cor){const g=agua(new THREE.Group());const L=76,cz=NAV('#8f989d'),br=NAV('#d4cfc1'),esc=S('#4a4f53',0.7);
  const c=cascoNavio(L,12.4,7,3.8,{cor:'#8b949a',conves:'#7a5f42'});g.add(c);const D=7;balaustrada(g,c,1,36);numeroCasco(g,c,30,'V 32');
  bx(13,5,9,br,-2,D+2.5,0,g);bx(7,4,8,br,-0.5,D+7,0,g);bx(0.12,1.3,7.4,VIDRO,3.03,D+7.4,0,g);bx(7.4,0.3,8.4,S('#3b4145',0.7),-0.5,D+9.15,0,g);
  for(const x of[-12,-18.5]){cl(1.6,1.9,8,cz,x,D+4,0,g,20);cl(1.62,1.62,1.2,S(cor,0.55),x,D+7.4,0,g,20);cl(1.64,1.64,0.8,S('#1c1d1e',0.6),x,D+8.4,0,g,20);}
  mastroTrelica(g,1,D+9.3,12,S('#5a6268',0.6,0.3));const rad=new THREE.Group();rad.position.set(1,D+21.5,0);g.add(rad);bx(0.9,0.7,5,S('#d5dadc',0.5),0,0,0,rad);gira(rad,0.04);
  canhao127(g,br,21,convesY(c,21)-0.06,0.85);canhao127(g,br,-28,convesY(c,-28)-0.06,0.75).rotation.y=PI;
  for(const s of[-1,1]){bote(g,-15.2,D+0.75,s*4.6,'#ece6d6');for(const x of[-17.4,-13])bx(0.4,0.6,1.6,esc,x,D+0.3,s*4.6,g);for(const x of[-18.2,-12.2]){haste(new V3(x,D,s*5.7),new V3(x,D+3.2,s*5.7),0.08,esc,g);haste(new V3(x,D+3.2,s*5.7),new V3(x,D+3.2,s*4.6),0.07,esc,g);}}
  bandeiraPopa(g,cor,-37.6,D+0.2);return g;}

// ===== LANCHA de patrulha (~12 m) =====
function lanchaNovo(){const g=agua(new THREE.Group());const c=cascoNavio(12,3.5,1.45,0.65,{cor:'#e3e6e2',fundo:'#2f3438',proa:0.5,tosado:0.35,flare:0.08,conves:'#9aa09a'});c.position.y=0;g.add(c);
  const D=1.45;const def=[];for(let i=1;i<=38;i++){const [x,y,z]=c.userData.secoes[i][c.userData.K];def.push(new V3(x,y-0.1,z+0.08));}
  for(const s of[1,-1]){const pts=def.map(p=>new V3(p.x,p.y,p.z*s));g.add(sombra(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),80,0.14,8),S('#2b2f33',0.85))));}   // defensa de borracha
  const cab=new THREE.Group();cab.position.set(-0.6,D,0);g.add(cab);const pin=NAV('#eef0ec');
  bx(3.2,1.6,2.5,pin,0,0.8,0,cab);const pb=bx(0.06,0.75,2.3,VIDRO,1.55,1.2,0,cab);pb.rotation.z=0.28;bx(0.08,0.08,2.5,pin,1.68,0.78,0,cab);   /* para-brisa inclinado na própria frente (antes era um bloco saindo) */
  for(const s of[-1,1])bx(1.8,0.65,0.05,VIDRO,-0.2,1.15,s*1.26,cab);bx(3.6,0.1,2.8,pin,-0.3,1.66,0,cab);
  // arco do radar
  for(const s of[-1,1])haste(new V3(-1.8,1.66,s*1.2),new V3(-2.1,2.9,s*0.9),0.06,S('#d8dcda',0.3,0.7),cab);haste(new V3(-2.1,2.9,-0.9),new V3(-2.1,2.9,0.9),0.06,S('#d8dcda',0.3,0.7),cab);
  const rr=new THREE.Group();rr.position.set(-2.1,3.05,0);cab.add(rr);bx(0.3,0.1,1.2,S('#f4f4f0',0.4),0,0,0,rr);gira(rr,0.15);haste(new V3(-2.1,2.9,0.5),new V3(-2.1,4.2,0.5),0.02,S('#222',0.4),cab);
  for(const [s,cc] of[[1,0x18e04a],[-1,0xff2a1a]]){const l=new THREE.Mesh(new THREE.BoxGeometry(0.12,0.1,0.06),EMIS(cc,1.5));l.position.set(1.0,1.5,s*1.27);cab.add(l);}
  // metralhadora .50 com escudo, no aro da proa
  const ar=new THREE.Group();ar.position.set(3.4,D,0);g.add(ar);cl(0.12,0.16,0.9,S('#2a2d2a',0.5,0.5),0,0.45,0,ar,10);const gun=new THREE.Group();gun.position.y=1.0;ar.add(gun);
  bx(0.9,0.22,0.2,S('#252826',0.45,0.6),0.15,0,0,gun);const cano=cl(0.035,0.04,1.15,S('#1c1e1d',0.4,0.7),1.15,0.02,0,gun,8);cano.rotation.z=PI/2;bx(0.06,0.65,0.95,S('#3c443a',0.6,0.3),0.42,0.1,0,gun);bx(0.3,0.25,0.25,S('#5a6040',0.8),-0.1,-0.22,0.2,gun);
  // 2 motores de popa com capô
  for(const z of[-0.65,0.65]){const m=new THREE.Group();m.position.set(-6.25,D-0.55,z);m.rotation.z=-0.06;   /* hélice abaixo da linha d'água */g.add(m);   /* (21/11) motor de popa de verdade: capô, perna, placa anticavitação e hélice */
    const pre=S('#24272a',0.35,0.25),cin=S('#3a3e42',0.5,0.4);
    bx(0.42,0.55,0.42,cin,0.16,0.3,0,m);   // suporte encostado no espelho de popa
    bx(0.62,0.5,0.46,pre,-0.08,0.35,0,m);const cp=new THREE.Mesh(new THREE.SphereGeometry(0.33,16,10,0,PI*2,0,PI/2),pre);cp.scale.set(1.0,0.7,0.72);cp.position.set(-0.08,0.6,0);sombra(cp);m.add(cp);   // capô
    for(const s2 of[-1,1])bx(0.5,0.05,0.005,S('#d8dbd8',0.4),-0.1,0.42,s2*0.232,m);   // faixa da marca nas laterais
    bx(0.16,1.25,0.1,cin,-0.05,-0.6,0,m);bx(0.5,0.03,0.26,cin,-0.02,-1.0,0,m);   // perna + placa anticavitação
    const tp=cl(0.08,0.06,0.42,cin,-0.05,-1.15,0,m,10);tp.rotation.z=PI/2;   // torpedo da rabeta
    const hel=new THREE.Group();hel.position.set(-0.3,-1.15,0);m.add(hel);for(let k=0;k<3;k++){const p=bx(0.04,0.22,0.09,S('#8c9196',0.3,0.8),0,0,0,hel);p.rotation.x=k/3*PI*2;p.translateY(0.12);}}
  numeroCasco(g,c,25,'P-01',0.3,'#1d2a3a',0.72);   /* abaixo da defensa, inteiro */for(const [x,z] of[[2.6,0],[-1.2,0.7]])pessoa(g,x,z,PI/2).position.y=D;
  // espuma na proa e esteira
  const es=new THREE.Mesh(new THREE.PlaneGeometry(26,7),new THREE.MeshBasicMaterial({map:canvasTex(256,64,(c2,w,h)=>{const r=rnd(8);const gr=c2.createLinearGradient(w,0,0,0);gr.addColorStop(0,'rgba(255,255,255,.85)');gr.addColorStop(1,'rgba(255,255,255,0)');c2.fillStyle=gr;for(let i=0;i<900;i++){const x=r()*w,y=h/2+(r()-0.5)*h*(x/w*0.2+0.8*(1-x/w));c2.globalAlpha=0.3+0.5*(x/w);c2.fillRect(x,y,2+r()*4,1+r()*2);}}),transparent:true,depthWrite:false}));
  es.rotation.x=-PI/2;es.position.set(-19,0.05,0);g.add(es);return g;}

// ===== ÁRVORES: mata atlântica, araucária e coqueiro (geometria única por espécie, instanciável) =====
function folhagem(raio,det,ruido,cor1,cor2,sem){const geo=new THREE.IcosahedronGeometry(raio,det),p=geo.attributes.position,r=rnd(sem),cor=[],c1=new THREE.Color(cor1).convertSRGBToLinear(),c2=new THREE.Color(cor2).convertSRGBToLinear(),c=new THREE.Color();
  const mapa=new Map();for(let i=0;i<p.count;i++){const k=p.getX(i).toFixed(2)+','+p.getY(i).toFixed(2)+','+p.getZ(i).toFixed(2);if(!mapa.has(k))mapa.set(k,1+(r()-0.5)*ruido);const f=mapa.get(k);p.setXYZ(i,p.getX(i)*f,p.getY(i)*f*0.85,p.getZ(i)*f);
    const y=p.getY(i)/raio;c.copy(c1).lerp(c2,Math.min(1,Math.max(0,0.5+y*0.6+(r()-0.5)*0.25)));cor.push(c.r,c.g,c.b);}
  geo.setAttribute('color',new THREE.Float32BufferAttribute(cor,3));geo.computeVertexNormals();return geo;}
const M_FOLHA=new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.9,flatShading:true});
function troncoCurvo(pai,pts,r0,r1){const mat=P('casca','#8a7a66',{tile:1,r:1,ns:1.2});const cur=new THREE.CatmullRomCurve3(pts),geo=new THREE.TubeGeometry(cur,6,1,6,false),p=geo.attributes.position;   // jogo: 6×6 (prévia 12×8)
  // afina o tubo do pé ao topo
  for(let i=0;i<p.count;i++){const seg=Math.floor(i/7)/6,k=r0+(r1-r0)*seg,c=cur.getPointAt(seg);p.setXYZ(i,c.x+(p.getX(i)-c.x)*k,c.y+(p.getY(i)-c.y)*k,c.z+(p.getZ(i)-c.z)*k);}
  geo.computeVertexNormals();const m=sombra(new THREE.Mesh(geo,mat));pai.add(m);return m;}
function arvoreMata(pai,x,z,e,sem){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(e);g.rotation.y=sem;pai.add(g);const r=rnd(sem*97+3);
  troncoCurvo(g,[new V3(0,-0.3,0),new V3(0.3,4,0.2),new V3(-0.2,8,0.1),new V3(0.1,11,0)],0.55,0.25);
  for(const [a,h,L] of[[0.3,8,3.5],[2.4,9,3],[4.3,7.5,3.2]])troncoCurvo(g,[new V3(0,h,0),new V3(Math.cos(a)*L*0.5,h+1.2,Math.sin(a)*L*0.5),new V3(Math.cos(a)*L,h+2.4,Math.sin(a)*L)],0.22,0.1);
  for(let k=0;k<4;k++){const a=k*2.1+r(),d=k?2.0+r()*1.6:0,f=new THREE.Mesh(folhagem(2.9+r()*1.3,1,0.35,'#1f3d1c','#5d8a3a',sem*10+k),M_FOLHA);f.position.set(Math.cos(a)*d,11+r()*2.2-(k?0.8:0),Math.sin(a)*d);f.castShadow=true;g.add(f);}
  return g;}
function araucaria(pai,x,z,e,sem){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(e);g.rotation.y=sem;pai.add(g);const r=rnd(sem*31+7);
  troncoCurvo(g,[new V3(0,-0.3,0),new V3(0,8,0),new V3(0,16,0),new V3(0,20,0)],0.5,0.28);
  // galhos em candelabro, curvando p/ cima, com tufos nas pontas
  const n=8;for(let k=0;k<n;k++){const a=k/n*PI*2+r()*0.4,L=4+r()*2.2,h=16.5+r()*2.5;const p0=new V3(0,h,0),p1=new V3(Math.cos(a)*L*0.6,h+0.3,Math.sin(a)*L*0.6),p2=new V3(Math.cos(a)*L,h+2.2+r(),Math.sin(a)*L);
    troncoCurvo(g,[p0,p1,p2],0.13,0.07);const f=new THREE.Mesh(folhagem(1.45,0,0.3,'#20361d','#4c6e33',sem*13+k),M_FOLHA);f.scale.set(1.25,0.55,1.25);f.position.copy(p2).setY(p2.y+0.25);f.castShadow=true;g.add(f);}
  const f=new THREE.Mesh(folhagem(1.6,1,0.3,'#20361d','#4c6e33',sem),M_FOLHA);f.scale.set(1.3,0.5,1.3);f.position.y=20.3;g.add(f);
  return g;}
function coqueiro(pai,x,z,e,sem){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(e);g.rotation.y=sem;pai.add(g);const r=rnd(sem*7+1);
  const topo=new V3(1.6+r(),9.5,0.4);troncoCurvo(g,[new V3(0,-0.3,0),new V3(0.3,3,0),new V3(0.9,6.5,0.2),topo],0.3,0.2);
  const fol=S('#4c7a2c',0.8);fol.side=THREE.DoubleSide;for(let k=0;k<9;k++){const a=k/9*PI*2+r()*0.3,L=4.2+r()*0.8;const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new V3(topo.x+Math.cos(a)*L*t,topo.y+0.6*Math.sin(t*PI*0.9)*1.4-t*t*2.4,topo.z+Math.sin(a)*L*t));}
    const cur=new THREE.CatmullRomCurve3(pts);const pos=[],idx=[];for(let i=0;i<=8;i++){const t=i/8,c=cur.getPoint(t),tg=cur.getTangent(t),lat=new V3(-tg.z,0,tg.x).normalize().multiplyScalar(0.55*Math.sin(t*PI)*(1-t*0.3));
      pos.push(c.x-lat.x,c.y-0.15*Math.sin(t*PI),c.z-lat.z,c.x,c.y,c.z,c.x+lat.x,c.y-0.15*Math.sin(t*PI),c.z+lat.z);if(i<8){const b=i*3;idx.push(b,b+3,b+1,b+1,b+3,b+4,b+1,b+4,b+2,b+2,b+4,b+5);}}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setIndex(idx);geo.computeVertexNormals();const fo=new THREE.Mesh(geo,fol);fo.castShadow=true;g.add(fo);}
  for(let k=0;k<4;k++){const c=new THREE.Mesh(new THREE.SphereGeometry(0.22,10,8),S('#6b5a2a',0.7));c.position.set(topo.x+Math.cos(k*1.6)*0.35,topo.y-0.35,topo.z+Math.sin(k*1.6)*0.35);g.add(c);}
  return g;}
function arvoresNovo(){const g=new THREE.Group();const r=rnd(21);
  for(let i=0;i<6;i++)arvoreMata(g,-22+r()*14,-14+r()*28,0.85+r()*0.5,i+1);
  for(let i=0;i<4;i++)araucaria(g,-4+r()*9,-12+r()*24,0.85+r()*0.35,i+11);
  const areia=new THREE.Mesh(new THREE.CircleGeometry(12,32),P('reboco','#d9c79a',{tile:2,r:1,ns:1.5}));areia.rotation.x=-PI/2;areia.position.set(16,0.03,0);areia.receiveShadow=true;g.add(areia);
  for(let i=0;i<4;i++)coqueiro(g,11+r()*10,-7+r()*14,0.9+r()*0.3,i+21);
  pessoa(g,4,14,0.5);return g;}

// ===== CAIXAS do gancho: tambores, munição e kit de reparo, com eslinga p/ içar =====
const TEX_MADEIRA=canvasTex(256,256,(c,w,h)=>{const r=rnd(5);c.fillStyle='#a4824f';c.fillRect(0,0,w,h);for(let i=0;i<600;i++){c.strokeStyle=`rgba(${80+r()*40|0},${55+r()*25|0},${30+r()*15|0},${0.15+r()*0.25})`;c.lineWidth=1+r()*2;const y=r()*h;c.beginPath();c.moveTo(0,y);c.bezierCurveTo(w*0.3,y+(r()-0.5)*6,w*0.7,y+(r()-0.5)*6,w,y+(r()-0.5)*4);c.stroke();}
  c.fillStyle='rgba(40,25,10,.5)';for(let i=0;i<5;i++)c.fillRect(0,i*h/5,w,2);});
const MAD=()=>new THREE.MeshStandardMaterial({map:TEX_MADEIRA,roughness:0.85});
function palete(pai){for(const z of[-0.55,0,0.55])bx(1.4,0.1,0.14,MAD(),0,0.05,z,pai);bx(1.4,0.04,1.3,MAD(),0,0.12,0,pai);for(let k=0;k<6;k++)bx(1.4,0.025,0.18,MAD(),0,0.155,-0.55+k*0.22,pai);}
function eslinga(pai,cantos,yTopo,h){const anel=new THREE.Mesh(new THREE.TorusGeometry(0.12,0.03,6,16),S('#8f969b',0.4,0.7));anel.position.y=yTopo+h;pai.add(anel);
  for(const [x,y,z] of cantos)haste(new V3(x,y,z),new V3(0,yTopo+h-0.1,0),0.018,S('#e2a71a',0.7),pai,5);}
function rotulo(txt,cor='#f2f2ee',fundo='rgba(0,0,0,0)',w=256,h=128,fs=46){return canvasTex(w,h,(c,W,H)=>{c.fillStyle=fundo;c.fillRect(0,0,W,H);c.fillStyle=cor;c.font=`bold ${fs}px Arial`;c.textAlign='center';c.textBaseline='middle';txt.split('\n').forEach((l,i,a)=>c.fillText(l,W/2,H/2+(i-(a.length-1)/2)*fs*1.05));});}
function decal(pai,tex,w,h,x,y,z,ry){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshStandardMaterial({map:tex,transparent:true,roughness:0.7,polygonOffset:true,polygonOffsetFactor:-4}));p.position.set(x,y,z);p.rotation.y=ry;pai.add(p);return p;}
function caixaComb(pai,x){const g=new THREE.Group();g.position.x=x;pai.add(g);palete(g);const tb=P('metalpint','#b8312a',{tile:0.8,r:0.5,m:0.2,ns:0.8});const lab=rotulo('JET A-1','#f2f2ee','rgba(0,0,0,0)',256,64,40);
  for(const [a,b] of[[-0.33,-0.33],[0.33,-0.33],[-0.33,0.33],[0.33,0.33]]){cl(0.29,0.29,0.88,tb,a,0.61,b,g,24);for(const y of[0.37,0.85])cl(0.3,0.3,0.03,S('#9c2822',0.5,0.3),a,y,b,g,24);
    cl(0.29,0.29,0.012,S('#a92c25',0.5,0.3),a,1.055,b,g,24);cl(0.04,0.04,0.03,S('#c9c9c4',0.4,0.6),a+0.14,1.07,b,g,8);const lb=new THREE.Mesh(new THREE.CylinderGeometry(0.295,0.295,0.16,24,1,true,a>0?0.2:PI+0.2,1.2),new THREE.MeshStandardMaterial({map:lab,transparent:true}));lb.position.set(a,0.62,b);lb.rotation.y=b>0?0:PI;g.add(lb);}
  for(const y of[0.45,0.8]){const t=new THREE.Mesh(new THREE.TorusGeometry(0.66,0.012,4,4),S('#e2a71a',0.7));t.rotation.set(PI/2,0,PI/4);t.scale.set(1.12,1.12,1);t.position.y=y;g.add(t);}
  eslinga(g,[[-0.62,0.16,-0.62],[0.62,0.16,-0.62],[-0.62,0.16,0.62],[0.62,0.16,0.62]],1.1,1.3);return g;}
function caixaMun(pai,x){const g=new THREE.Group();g.position.x=x;pai.add(g);palete(g);const ol=P('metalpint','#4f5d34',{tile:0.8,r:0.75,ns:0.7});const lab=rotulo('CART 30 MM\nLOTE 14-26','#f0e6b0','rgba(0,0,0,0)',256,128,34);
  for(let k=0;k<2;k++){const y=0.39+k*0.47;bx(1.3,0.45,0.9,ol,0,y,0,g);bx(1.32,0.06,0.92,S('#3c4727',0.7),0,y+0.2,0,g);for(const s of[-0.5,0.5]){bx(0.1,0.06,0.04,S('#888',0.4,0.7),s,y+0.12,0.47,g);}
    for(const s of[-1,1]){const al=new THREE.Mesh(new THREE.TorusGeometry(0.07,0.015,5,10,PI),S('#2a2a24',0.8));al.position.set(s*0.66,y+0.05,0);al.rotation.y=PI/2;al.rotation.z=PI;g.add(al);}
    decal(g,lab,0.9,0.36,0,y,0.451,0);}
  for(const z of[-0.3,0.3]){const t=new THREE.Mesh(new THREE.TorusGeometry(0.5,0.01,4,4),S('#e2a71a',0.7));t.rotation.set(0,0,PI/4);t.scale.set(1.35,1.0,1);t.position.set(0,0.6,z);g.add(t);}
  eslinga(g,[[-0.62,0.16,-0.42],[0.62,0.16,-0.42],[-0.62,0.16,0.42],[0.62,0.16,0.42]],1.1,1.4);return g;}
function caixaRep(pai,x){const g=new THREE.Group();g.position.x=x;pai.add(g);palete(g);const ci=P('metalpint','#7b8287',{tile:0.8,r:0.5,m:0.3,ns:0.7});
  bx(1.25,0.75,0.95,ci,0,0.55,0,g);for(const y of[0.25,0.85])bx(1.27,0.05,0.97,S('#55595c',0.5,0.5),0,y,0,g);for(const s of[-0.62,0.62])bx(0.05,0.75,0.97,S('#55595c',0.5,0.5),s,0.55,0,g);
  decal(g,rotulo('REPARO\nBLINDAGEM','#ffd21a','rgba(0,0,0,0)',256,128,38),0.9,0.42,0,0.58,0.478,0);
  const cruz=rotulo('+','#ffffff','#d32f2f',64,64,60);decal(g,cruz,0.28,0.28,0.45,0.75,0.478,0);
  for(let k=0;k<3;k++)bx(1.1,0.05,0.8,P('metal','#9ba3a8',{tile:0.5,r:0.45,m:0.6}),0,0.96+k*0.06,0,g);   // chapas de blindagem
  eslinga(g,[[-0.62,0.16,-0.47],[0.62,0.16,-0.47],[-0.62,0.16,0.47],[0.62,0.16,0.47]],1.1,1.3);return g;}
function caixasNovo(){const g=new THREE.Group();bx(9,0.06,5,P('concreto','#a8a59c',{tile:2}),0,0.03,0,g);caixaComb(g,-2.4);caixaMun(g,0);caixaRep(g,2.4);pessoa(g,0.2,-1.6,0.3);
  for(const [x,c] of[[-2.4,0xff5040],[0,0xd8c040],[2.4,0xffffff]]){const a=new THREE.Mesh(new THREE.RingGeometry(1.0,1.1,32),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:0.55,side:THREE.DoubleSide}));a.rotation.x=-PI/2;a.position.set(x,0.08,0);g.add(a);}
  return g;}


// ===== LOTE 4 (aprovado 21/11): míssil MAA-1B, bomba Mk-82, Tu-95, soldado e paraquedas =====
function fuselagem(pts,seg,mat){const p=[...pts].sort((a,b)=>a[0]-b[0]).map(([x,r])=>new THREE.Vector2(Math.max(0.001,r),x));   /* da cauda p/ o nariz: faces viradas p/ fora (antes ficavam p/ dentro e via-se o interior) */const geo=new THREE.LatheGeometry(p,seg);geo.rotateZ(-PI/2);
  {const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/2,uv.getX(i)*6);}geo.computeVertexNormals();return sombra(new THREE.Mesh(geo,mat));}
// asa/empenagem: planta (lista de [x,z]) extrudada na espessura e com perfil afinando na ponta
function superficie(planta,esp,mat,bisel=0.12){const s=new THREE.Shape();planta.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));const geo=new THREE.ExtrudeGeometry(s,{depth:esp,bevelEnabled:true,bevelSize:bisel,bevelThickness:bisel,bevelSegments:2,steps:1});
  geo.translate(0,0,-esp/2);geo.rotateX(PI/2);{const uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/2,uv.getY(k)/2);}geo.computeVertexNormals();return sombra(new THREE.Mesh(geo,mat));}
function ogiva(L,R,r0,n=10){const rho=(R*R+L*L)/(2*R),pts=[];for(let i=0;i<=n;i++){const x=L*i/n;pts.push([x,Math.max(r0,Math.sqrt(Math.max(0,rho*rho-(L-x)*(L-x)))+R-rho)]);}return pts;}   // x a partir da ponta
function corpoTorno(perfil,seg,mat){return fuselagem(perfil,seg,mat);}
function aleta(raiz0,raiz1,ponta0,ponta1,env,esp,mat){return superficie([[raiz0,0],[raiz1,0],[ponta1,env],[ponta0,env]],esp,mat,Math.min(0.004,esp/2));}   // trapézio: bordo de ataque raiz0→ponta0
function anelPint(pai,x,r0,r1,larg,mat){const a=cl(r0,r1,larg,mat,x,0,0,pai,32,true);a.rotation.z=PI/2;return a;}
function estencil(txt,w,h,cor='#2b2b2b',fs=28){return new THREE.MeshStandardMaterial({map:canvasTex(512,Math.round(512*h/w),(c,W,H)=>{c.clearRect(0,0,W,H);c.fillStyle=cor;c.font=`bold ${fs}px Arial`;c.textAlign='center';c.textBaseline='middle';c.fillText(txt,W/2,H/2);}),transparent:true,roughness:0.6,polygonOffset:true,polygonOffsetFactor:-4});}
// MAA-1B Piranha (míssil ar-ar brasileiro de curto alcance): 2,82 m, Ø 15,2 cm, canards na frente e aletas com "rollerons" na cauda
function missilNovo(){const g=new THREE.Group(),R=0.076;const br=S('#d6d9d4',0.38,0.15),cz=S('#a9aeb0',0.4,0.2),es=S('#2c2f31',0.4,0.6);
  const nariz=ogiva(0.34,R,0.044,12).map(([x,r])=>[1.41-0.34+x*0+(0.34-x),r]).reverse();   // da ponta (x=1.41) até o corpo
  const perfil=[[1.41,0.044],...ogiva(0.34,R,0.044,12).map(([x,r])=>[1.41-x,r]).slice(1),[0.9,R],[-1.32,R],[-1.41,0.066]];
  g.add(corpoTorno(perfil,32,br));
  const dom=new THREE.Mesh(new THREE.SphereGeometry(0.046,20,12,0,PI*2,0,PI/2),new THREE.MeshStandardMaterial({color:0x1d2a33,roughness:0.05,metalness:0.6}));dom.rotation.z=-PI/2;dom.position.x=1.41;g.add(dom);   // cúpula do sensor infravermelho
  anelPint(g,1.08,R+0.0008,R+0.0008,0.012,es);anelPint(g,0.5,R+0.001,R+0.001,0.05,S('#e2b21c',0.5));anelPint(g,-0.2,R+0.001,R+0.001,0.05,S('#8a5a2a',0.6));anelPint(g,-0.7,R+0.0008,R+0.0008,0.01,es);   // juntas, faixa amarela (ogiva) e marrom (motor)
  for(let i=0;i<4;i++){const a=i*PI/2+PI/4;
    const c=aleta(1.17,0.97,1.08,0.99,0.12,0.006,cz);c.position.y=0;c.rotation.x=a;c.children;g.add(c);c.position.set(0,0,0);c.translateZ(0);   // canards
    const fg=new THREE.Group();fg.rotation.x=a;g.add(fg);const f=aleta(-1.02,-1.36,-1.2,-1.36,0.17,0.007,br);f.position.z=R*0.6;fg.add(f);   // aletas de cauda
    const rol=cl(0.034,0.034,0.012,es,-1.31,0,R*0.6+0.13,fg,18);   // roleron na ponta (gira com o vento e estabiliza o rolamento)
  }
  const bo=cl(0.05,0.042,0.05,es,-1.43,0,0,g,20);bo.rotation.z=PI/2;
  for(const x of[0.35,-0.55]){bx(0.08,0.02,0.035,S('#6d7276',0.4,0.6),x,R+0.01,0,g);}   // patins do trilho de lançamento
  for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.PlaneGeometry(0.62,0.05),estencil('MAA-1B PIRANHA',620,50,'#3a3a3a',30));e.position.set(0.1,0,s*(R+0.002));e.rotation.y=s>0?0:PI;g.add(e);}
  return g;}
// Mk-82 (227 kg): 2,21 m, Ø 27,3 cm, verde-oliva, faixas amarelas, cauda cônica com 4 aletas
function bombaNovo(){const g=new THREE.Group(),R=0.1365;const ol=P('metalpint','#525b2c',{tile:0.4,r:0.55,ns:0.35}),am=S('#e2b21c',0.5),me=S('#b9bdc0',0.35,0.75);
  const perfil=[[1.105,0.028],...ogiva(0.62,R,0.028,14).map(([x,r])=>[1.105-x,r]).slice(1),[-0.22,R],[-0.6,0.075]];
  g.add(corpoTorno(perfil,36,ol));
  const fz=cl(0.026,0.03,0.07,me,1.135,0,0,g,16);fz.rotation.z=PI/2;const fv=new THREE.Mesh(new THREE.ConeGeometry(0.018,0.04,10),me);fv.rotation.z=-PI/2;fv.position.x=1.19;g.add(fv);   // espoleta de nariz
  anelPint(g,0.62,0.117,0.125,0.05,am);anelPint(g,-0.12,R+0.001,R+0.001,0.05,am);   // faixas amarelas: explosivo
  // cauda cônica (Mk-15 low drag): cone + 4 aletas
  const cone=cl(0.11,0.072,0.5,ol,-0.85,0,0,g,28,true);cone.rotation.z=PI/2;   // rt fica em -x
  for(let i=0;i<4;i++){const fg=new THREE.Group();fg.rotation.x=i*PI/2+PI/4;g.add(fg);const f=aleta(-0.62,-1.1,-0.86,-1.1,0.1,0.006,ol);f.position.z=0.075;fg.add(f);
    bx(0.24,0.006,0.03,ol,-0.98,0,0.17,fg);}   // aleta + reforço da ponta
  const tampa=cl(0.11,0.11,0.01,S('#3b4022',0.6),-1.1,0,0,g,28);tampa.rotation.z=PI/2;
  for(const x of[0.178,-0.178]){const l=new THREE.Mesh(new THREE.TorusGeometry(0.022,0.007,6,12,PI),me);l.position.set(x,R,0);g.add(l);}   // olhais 14" (35,6 cm)
  const cr=cl(0.016,0.016,0.02,me,0,R-0.004,0,g,10);   // receptáculo de carga
  for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.PlaneGeometry(0.8,0.07),estencil('BOMB GP 500 LB MK 82',800,70,'#e8dfb0',34));e.position.set(0.2,0.02,s*(R+0.002));e.rotation.y=s>0?0:PI;g.add(e);}
  return g;}
// reboque de armamento (verde, 4 rodas) com berços em V e cintas; cavalete p/ o míssil
const _GLB={};function glb(url){return _GLB[url]||(_GLB[url]=new Promise((ok,erro)=>new THREE.GLTFLoader().load(url,ok,undefined,erro)));}
// Tu-95 "Bear" (helijah, CC-BY 4.0): carrega sob demanda; estrelas vermelhas viram a insígnia cinza da Frota Cinzenta
function semEstrela(tex){const im=tex.image;if(!im||!im.width)return;const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
  const d=x.getImageData(0,0,c.width,c.height),p=d.data;for(let i=0;i<p.length;i+=4){const r=p[i],g=p[i+1],b=p[i+2];if(r>120&&r>g*1.8&&r>b*1.8){const v=(r+g+b)/3*0.45;p[i]=v;p[i+1]=v*1.04;p[i+2]=v*1.1;}}
  x.putImageData(d,0,0);tex.image=c;tex.needsUpdate=true;}
function bombardeiro(){const g=new THREE.Group();g.userData.bomb=true;glb('modelos/tu95.glb').then(G=>{const o=G.scene.clone(true);o.rotation.y=PI;
    o.traverse(m=>{if(m.isMesh){m.castShadow=true;if(m.material.map&&!m.material.map._semEst){m.material.map._semEst=1;semEstrela(m.material.map);}}});
    o.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(o),c=b.getCenter(new V3());o.position.sub(c);g.add(o);});return g;}
// soldado (Kolos Studios, CC-BY 4.0): o esqueleto do arquivo veio quebrado, então congela a pose modelada e gira os braços nos ombros
const _SOLD={};
function soldadoGeo(o){const k='sold'+(o.bracoE??-1.25)+'/'+(o.bracoD??-1.25)+JSON.stringify(o.cores||{});if(_SOLD[k])return _SOLD[k];
  return _SOLD[k]=glb('modelos/soldado.glb').then(G=>{const s=G.scene;s.updateMatrixWorld(true);const v=new V3(),pecas=[],bb=new THREE.Box3();
    s.traverse(m=>{if(!m.isSkinnedMesh)return;const geo=m.geometry.clone(),pos=geo.attributes.position;for(let i=0;i<pos.count;i++){v.fromBufferAttribute(m.geometry.attributes.position,i).applyMatrix4(m.matrixWorld);pos.setXYZ(i,v.x,v.y,v.z);bb.expandByPoint(v);}pecas.push([geo,m.material]);});
    const k2=1.75/(bb.max.y-bb.min.y),cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2,bE=o.bracoE??-1.25,bD=o.bracoD??-1.25,OY=1.43,OX=0.19,out=[];
    for(const [geo,m0] of pecas){const pos=geo.attributes.position;for(let i=0;i<pos.count;i++){let x=(pos.getX(i)-cx)*k2,y=(pos.getY(i)-bb.min.y)*k2,z=(pos.getZ(i)-cz)*k2;
        const ax=Math.abs(x),w=Math.min(1,Math.max(0,(ax-OX+0.03)/0.08))*(y>1.12?1:0);if(w>0){const sg=Math.sign(x),a=(sg>0?bD:-bE)*w,dx=x-sg*OX,dy=y-OY,c=Math.cos(a),sn=Math.sin(a);x=sg*OX+dx*c-dy*sn;y=OY+dx*sn+dy*c;}
        pos.setXYZ(i,z,y,-x);}   // frente do boneco p/ +x (padrão do jogo)
      geo.deleteAttribute('skinIndex');geo.deleteAttribute('skinWeight');geo.computeVertexNormals();geo.computeBoundingSphere();
      const mat=new THREE.MeshStandardMaterial({color:m0.color.clone(),roughness:0.85});const cc=o.cores&&o.cores[m0.name];if(cc)mat.color.set(cc).convertSRGBToLinear();out.push([geo,mat]);}
    return out;});}
function soldado(o={}){const g=new THREE.Group();g.userData.bracos=[];soldadoGeo(o).then(l=>{for(const [geo,mat] of l){const m=new THREE.Mesh(geo,mat);m.castShadow=true;g.add(m);}});return g;}
const VERDE={'Material.003':'#5b6b45','Material.002':'#3b4630'},PILOTO={'Material.003':'#7f8c6c','Material.002':'#4d5643'};
function paraquedas(){const g=new THREE.Group();glb('modelos/paraquedas.glb').then(G=>{const p=G.scene.clone(true);p.scale.set(2.6*0.55,2.4,2.6);p.rotation.z=PI/2-0.08;p.rotation.y=0.15;p.position.y=0.75;p.traverse(m=>{if(m.isMesh)m.castShadow=true;});g.add(p);});return g;}
function pessoa(){return new THREE.Group();}   // no jogo não entra o boneco de escala
function agua(g){return g;}                     // o mar do jogo já existe
// ---------- FUSÃO: junta as malhas por material; guarda as caixas das peças grandes p/ colisão ----------
const _mi=new THREE.Matrix4(),_bb=new THREE.Box3();
const _u=t=>t?t.uuid:'-';   // materiais iguais (mesma cor/texturas/acabamento) viram um só, mesmo criados em lugares diferentes
const TXU={};function texUm(t){const k=t._nome;if(!TXU[k]){const c=TL.load('tex/'+k+'.jpg');c.wrapS=c.wrapT=THREE.RepeatWrapping;c.anisotropy=8;c.encoding=t.encoding;c._nome=k;c._tile=1;TXU[k]=c;}return TXU[k];}   // textura única (repetição já vai nas UVs)
function assavel(m){return m.isMeshStandardMaterial&&!m.transparent&&!m.alphaMap&&!(m.emissive&&m.emissive.getHex()&&m.emissiveIntensity>0)&&m.alphaTest===0;}   // cor vai p/ os vértices
const _n=t=>t?(t._nome||t.uuid):'-';
function chaveAss(m){return ['A',_n(m.map),_n(m.normalMap),_n(m.roughnessMap),m.side,m.flatShading,m.roughness<0.65?0:1,m.metalness<0.3?0:1,m.polygonOffset].join('|');}   // 2 faixas de aspereza e de metal
function chaveMat(m){return [m.type,m.color&&m.color.getHexString(),m.emissive&&m.emissive.getHexString(),m.emissiveIntensity,_u(m.map),_u(m.normalMap),_u(m.roughnessMap),_u(m.alphaMap),m.roughness,m.metalness,m.transparent,m.opacity,m.side,m.vertexColors,m.flatShading,m.alphaTest,m.polygonOffset].join('|');}
function fundir(root,minH=1.5){root.updateMatrixWorld(true);
  {const vivos=[];const busca=o=>{for(const c of o.children){if(c.userData.vivo){if(!c.isMesh)vivos.push(c);}else busca(c);}};busca(root);for(const v of vivos)fundir(v,minH);}   // grupos que giram/somem: funde por dentro
_mi.copy(root.matrixWorld).invert();const grupos=new Map(),caixas=[],tirar=[];
  root.traverse(m=>{if(!m.isMesh||m.isInstancedMesh)return;let p=m;while(p&&p!==root){if(p.userData.vivo)return;p=p.parent;}
    const rel=new THREE.Matrix4().multiplyMatrices(_mi,m.matrixWorld);
    if(!m.geometry.boundingBox)m.geometry.computeBoundingBox();_bb.copy(m.geometry.boundingBox).applyMatrix4(rel);const sz=_bb.getSize(new V3());
    if(sz.y>=minH&&Math.max(sz.x,sz.z)>0.25)caixas.push(_bb.clone());
    tirar.push(m);if(LEVE&&(m.userData.det||sz.length()<0.35))return;
    const mat=m.material;if(Array.isArray(mat))return;const ass=assavel(mat),k=ass?chaveAss(mat):chaveMat(mat);let gr=grupos.get(k);
    if(!gr){let mb=mat;if(ass){mb=mat.clone();mb.color.setRGB(1,1,1);mb.vertexColors=true;for(const q of['map','normalMap','roughnessMap'])if(mb[q]&&mb[q]._nome)mb[q]=texUm(mb[q]);mb.roughness=mat.roughness<0.65?0.5:0.9;mb.metalness=mat.metalness<0.3?0.05:0.5;}grupos.set(k,gr=[mb]);}
    gr.push([m.geometry,rel,ass?mat.color:null,ass&&mat.map&&mat.map._nome?1/mat.map._tile:1]);});
  for(const m of tirar)m.parent.remove(m);
  for(const [k,[mat,...lista]] of grupos){const geo=juntaGeo(lista,!!mat.vertexColors||lista.some(l=>l[2]));if(!geo)continue;const mm=new THREE.Mesh(geo,mat);root.add(mm);}
  root.userData.caixas=caixas;return root;}
function juntaGeo(lista,cor){let n=0;const partes=[];for(const [g0,rel,cor0,rep] of lista){const g=(g0.index?g0.toNonIndexed():g0.clone());g.applyMatrix4(rel);if(rep&&rep!==1&&g.attributes.uv){const u=g.attributes.uv.array;for(let i=0;i<u.length;i++)u[i]*=rep;}if(!g.attributes.normal)g.computeVertexNormals();g.userData.cor=cor0;partes.push(g);n+=g.attributes.position.count;}
  if(!n)return null;const P=new Float32Array(n*3),N=new Float32Array(n*3),U=new Float32Array(n*2),C=cor?new Float32Array(n*3):null;let o=0;
  for(const g of partes){const c=g.attributes.position.count;P.set(g.attributes.position.array,o*3);N.set(g.attributes.normal.array,o*3);if(g.attributes.uv)U.set(g.attributes.uv.array,o*2);
    if(C){const k=g.userData.cor;if(g.attributes.color){const a=g.attributes.color.array;for(let i=0;i<c;i++){C[(o+i)*3]=a[i*3]*(k?k.r:1);C[(o+i)*3+1]=a[i*3+1]*(k?k.g:1);C[(o+i)*3+2]=a[i*3+2]*(k?k.b:1);}}
      else if(k)for(let i=0;i<c;i++){C[(o+i)*3]=k.r;C[(o+i)*3+1]=k.g;C[(o+i)*3+2]=k.b;}else C.fill(1,o*3,(o+c)*3);}o+=c;g.dispose();}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('uv',new THREE.BufferAttribute(U,2));if(C)geo.setAttribute('color',new THREE.BufferAttribute(C,3));
  geo.computeBoundingSphere();return geo;}
function fundacao(g,w,d,cor='#9c9a92'){bx(w,8,d,CONC(cor,4),0,-4,0,g);return g;}   // bloco enterrado: em encosta o pátio não fica flutuando
// ---------- prédios da base com medida livre ----------
function esquadrao(w,d,h,cor){const a=new THREE.Group();const reb=REB('#e6dfcf');bx(w,h,d,reb,0,h/2,0,a);bx(w+0.3,0.9,d+0.3,REB('#cfc7b5'),0,h+0.4,0,a);
  const nx=Math.max(3,Math.round(w/3.3)),nz=Math.max(2,Math.round(d/3.3)),and=h>5?[2.1,h-1.8]:[2.0];
  for(const f of[1,-1])for(const y of and)janelas(a,reb,-w/2+1.5,w/2-1.5,y,f*(d/2+0.01),nx,1.5,1.3,f);
  bx(5,0.3,3,CONC(),-w/5,3.4,d/2+1.4,a);for(const x of[-w/5-2.2,-w/5+2.2])cl(0.15,0.15,3.3,REB('#cfc7b5'),x,1.65,d/2+2.6,a,10);bx(2.6,2.6,0.06,VIDRO,-w/5,1.3,d/2+0.03,a);
  bx(3.4,0.6,0.1,S(cor,0.55),w/4,h-0.1,d/2+0.06,a);for(const x of[-w/3,-w/6,w/10])arcond(a,x,h+1.2,-d/4);caixaDagua(a,w/3,h+0.85,d/5);return a;}
function deposito(w,d,h){const b=new THREE.Group();const zn=ZIN('#c9cecd');bx(w,h,d,zn,0,h/2,0,b);telhado2aguas(b,w,d,3.2,ZIN('#b0b5b7'),h);
  const tri=new THREE.Shape();tri.moveTo(-d/2,0);tri.lineTo(d/2,0);tri.lineTo(0,3.2);const tg=new THREE.ShapeGeometry(tri);{const uv=tg.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/1.2,uv.getY(k)/1.2);}
  for(const s of[1,-1]){const o=new THREE.Mesh(tg,zn);o.position.set(s*(w/2+0.01),h,0);o.rotation.y=s*PI/2;b.add(o);}
  bx(Math.min(8,w*0.4),Math.min(5.5,h-1),0.1,P('zinco','#c9b25a',{tile:0.6,r:0.6,m:0.4}),-w/8,Math.min(5.5,h-1)/2,-d/2-0.05,b);bx(1,2.2,0.08,S('#3c4a5a',0.6),w/3,1.1,-d/2-0.05,b);return b;}
function alojamento(w,d){const c=new THREE.Group();bx(w,3.6,d,REB('#efe8d8'),0,1.8,0,c);telhado2aguas(c,w,d,2.4,P('reboco','#a8532f',{tile:0.5,r:0.85,ns:2.2}),3.6);
  for(const f of[1,-1])janelas(c,null,-w/2+2,w/2-2,2.0,f*(d/2+0.01),Math.round(w/4),1.3,1.1,f);for(const x of[-w/3,0,w/3])bx(1,2.2,0.06,S('#7a5a3c',0.7),x,1.1,d/2+0.04,c);return c;}
function radomePequeno(){const g=new THREE.Group();const con=CONC('#c4c2bb',3);cl(1.6,2.0,14,con,0,7,0,g,16);cl(3.4,3.4,0.4,con,0,14.2,0,g,24);
  guarda(g,Array.from({length:13},(_,i)=>new V3(Math.cos(i/12*PI*2)*3.25,14.4,Math.sin(i/12*PI*2)*3.25)),1.0,AMARELO,1.2);
  const geo=new THREE.IcosahedronGeometry(4.6,2),cor=[],r=rnd(9);for(let i=0;i<geo.attributes.position.count;i+=3){const v=0.88+r()*0.12;for(let k=0;k<3;k++)cor.push(v,v,v);}geo.setAttribute('color',new THREE.Float32BufferAttribute(cor,3));
  const d=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:0.45,color:0xf2f3ef}));d.position.y=17.6;g.add(d);return g;}
function birutaNova(){const bi=new THREE.Group();haste(new V3(0,0,0),new V3(0,7,0),0.09,S('#e9e9e4',0.4,0.5),bi,10);bi.children[bi.children.length-1].userData.det=false;cl(0.6,0.6,0.5,CONC(),0,0.25,0,bi,12);
  const aro=new THREE.Mesh(new THREE.TorusGeometry(0.45,0.03,6,20),ACO());aro.position.set(0.25,7,0);aro.rotation.y=PI/2;bi.add(aro);
  const lis=texH(texListras2());const sg=new THREE.CylinderGeometry(0.45,0.22,3.6,16,6,true);sg.rotateZ(-PI/2);sg.translate(1.8+0.25,0,0);const sp=sg.attributes.position;for(let i=0;i<sp.count;i++){const x=sp.getX(i)-0.25;sp.setY(i,sp.getY(i)-0.06*x*x);}sg.computeVertexNormals();
  const saia=new THREE.Mesh(sg,new THREE.MeshStandardMaterial({map:lis,side:THREE.DoubleSide,roughness:0.85}));saia.position.y=7;bi.add(saia);return bi;}
function papi(){const g=new THREE.Group();for(let k=0;k<4;k++){const u=new THREE.Group();u.position.set(0,0,-k*9);g.add(u);bx(1.4,0.6,0.9,S('#e8e4d8',0.6),0,0.7,0,u);for(const s of[-0.3,0.3])haste(new V3(s,0,0),new V3(s,0.4,0),0.08,ACO(),u);
  const lz=new THREE.Mesh(new THREE.CircleGeometry(0.2,14),EMIS(k<2?0xffffff:0xff3020,2));lz.position.set(0.71,0.75,0);lz.rotation.y=PI/2;u.add(lz);}return g;}
// pista: asfalto de verdade embaixo + marcas (tinta gasta) por cima
let _mPista=null;function pistaMats(){if(_mPista)return _mPista;const asf=P('asfalto','#d8d6cf',{tile:4,r:0.95,ns:0.8}).clone();Object.assign(asf,{polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-16});   /* o chão da base também usa deslocamento: sem isso a grama passava por cima */
  const mk=texH(texPistaC(false,77));mk.anisotropy=8;return _mPista={asf,marc:new THREE.MeshStandardMaterial({map:mk,transparent:true,roughness:0.75,polygonOffset:true,polygonOffsetFactor:-6,polygonOffsetUnits:-24})};}
function pistaGeo(w,d){const geo=new THREE.PlaneGeometry(w,d),uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)*w,uv.getY(k)*d);return geo;}
// ---------- ÁRVORES com nível de detalhe (perto: espécie detalhada; longe: copa simples) ----------
function geoEspecie(fn,alvoH){const g=new THREE.Group();fn(g,0,0,1,7);g.updateMatrixWorld(true);const casca=[],folha=[];let mC=null,mF=null;
  g.traverse(m=>{if(!m.isMesh)return;(m.material===M_FOLHA||m.material.side===THREE.DoubleSide&&!m.material.map?folha:casca).push([m.geometry,m.matrixWorld.clone()]);if(m.material===M_FOLHA||(m.material.side===THREE.DoubleSide&&!m.material.map))mF=m.material;else mC=m.material;});
  const bb=new THREE.Box3().setFromObject(g),k=alvoH/(bb.max.y);const esc=new THREE.Matrix4().makeScale(k,k,k);const ap=l=>l.map(([geo,mw])=>[geo,new THREE.Matrix4().multiplyMatrices(esc,mw)]);
  return{casca:juntaGeo(ap(casca),false),folha:juntaGeo(ap(folha),!!mF.vertexColors),mC,mF};}
function geoLonge(corA,corB,h,palma){const f=folhagem(h*(palma?0.28:0.3),0,0.3,corA,corB,3);f.scale(1,palma?0.5:0.9,1);f.translate(0,h*(palma?0.92:0.72),0);const t=new THREE.CylinderGeometry(h*0.025,h*0.04,h*0.75,5);t.translate(0,h*0.37,0);
  const c=new Float32Array(t.attributes.position.count*3);const k=new THREE.Color('#5b4a38').convertSRGBToLinear();for(let i=0;i<c.length;i+=3){c[i]=k.r;c[i+1]=k.g;c[i+2]=k.b;}t.setAttribute('color',new THREE.BufferAttribute(c,3));
  return juntaGeo([[f.index?f.toNonIndexed():f,new THREE.Matrix4()],[t.toNonIndexed(),new THREE.Matrix4()]],true);}
const FLORESTAS=[];
function floresta(lista,especie){   // lista: [x,y,z,altura,giro]
  const fn={mata:arvoreMata,arauc:araucaria,coco:coqueiro}[especie],H0={mata:14,arauc:21,coco:10.5}[especie];
  const det=geoEspecie(fn,H0),longe=geoLonge(especie==='arauc'?'#20361d':'#1f3d1c',especie==='coco'?'#5b8a34':'#5d8a3a',H0,especie==='coco');
  const n=lista.length,mats=new Float32Array(n*16),m4=new THREE.Matrix4(),q=new THREE.Quaternion(),Y=new V3(0,1,0);
  for(let i=0;i<n;i++){const [x,y,z,h,r]=lista[i],s=h/H0;q.setFromAxisAngle(Y,r);m4.compose(new V3(x,y-0.3,z),q,new V3(s*(0.9+((r*7)%0.2)),s,s*(0.9+((r*13)%0.2))));m4.toArray(mats,i*16);}
  const capPerto=Math.min(n,LEVE?400:1500);const iC=new THREE.InstancedMesh(det.casca,det.mC,capPerto),iF=new THREE.InstancedMesh(det.folha,det.mF,capPerto),iL=new THREE.InstancedMesh(longe,new THREE.MeshStandardMaterial({vertexColors:true,roughness:0.95,flatShading:true}),n);
  for(const o of[iC,iF,iL]){o.frustumCulled=false;o.count=0;cena.add(o);}
  const F={lista,mats,iC,iF,iL,n,cap:capPerto,t:1};FLORESTAS.push(F);atualizaFloresta(F,0,0,true);return F;}
function atualizaFloresta(F,cx,cz,tudo){const R2=(LEVE?260:650)**2;let a=0,b=0;const A=F.iC.instanceMatrix.array,B=F.iF.instanceMatrix.array,L=F.iL.instanceMatrix.array,M_=F.mats;
  for(let i=0;i<F.n;i++){const x=M_[i*16+12],z=M_[i*16+14],d=(x-cx)*(x-cx)+(z-cz)*(z-cz);const src=M_.subarray(i*16,i*16+16);
    if(d<R2&&a<F.cap&&!tudo){A.set(src,a*16);B.set(src,a*16);a++;}else{L.set(src,b*16);b++;}}
  F.iC.count=F.iF.count=a;F.iL.count=b;F.iC.instanceMatrix.needsUpdate=F.iF.instanceMatrix.needsUpdate=F.iL.instanceMatrix.needsUpdate=true;}
let _tFl=0;
function passo(dt,camPos){_tFl-=dt;if(_tFl<=0&&camPos){_tFl=0.4;for(const F of FLORESTAS)atualizaFloresta(F,camPos.x,camPos.z,false);}
  if(!LEVE)tremula(performance.now()/1000);}
const comFund=(fn,w,d)=>(...a)=>{const g=fn(...a);if(w)fundacao(g,w,d);return fundir(g);};
return{LEVE,fundir,passo,floresta,
  sam:comFund(samNovo,42,42),radome:comFund(radomeNovo,36,36),radarGira:comFund(radarGiraNovo,32,32),
  aa:(cor)=>{const g=aaNovo(cor);fundacao(g,16,16,'#8f8670');let tor=null;g.traverse(o=>{if(!tor&&o.isGroup&&Math.abs(o.position.y-1.05)<0.01)tor=o;});if(tor)tor.userData.vivo=true;fundir(g);g.userData.torre=tor;return g;},
  torre:comFund(torreNovo),has:comFund(hasNovo),tanques:comFund(tanquesNovo),esquadrao:(w,d,h,c)=>fundir(esquadrao(w,d,h,c)),deposito:(w,d,h)=>fundir(deposito(w,d,h)),alojamento:(w,d)=>fundir(alojamento(w,d)),
  radomePequeno:()=>fundir(radomePequeno()),biruta:()=>fundir(birutaNova()),papi:()=>fundir(papi()),pistaMats,pistaGeo,
  navioA:comFund(navioANovo),navioB:comFund(navioBNovo),navioC:comFund(navioCNovo),
  lancha:()=>{const g=lanchaNovo();g.traverse(o=>{if(o.isMesh&&o.material.map&&o.material.transparent&&o.position.x<-15)o.parent.remove(o);});fundir(g,0.8);return g;},
  missil:()=>fundir(missilNovo(),9),bomba:()=>fundir(bombaNovo(),9),bombardeiro,soldado:()=>soldado({cores:VERDE}),piloto:()=>soldado({cores:PILOTO,bracoE:1.1,bracoD:-1.2}),paraquedas,
  caixa:(tipo)=>fundir({comb:caixaComb,mun:caixaMun,blind:caixaRep}[tipo](new THREE.Group(),0),0.5)};
})();
