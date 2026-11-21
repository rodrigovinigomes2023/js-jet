// ===================== LOTE 2 · BASE AÉREA =====================
// ---------- HOJE (copiado do js-jet: jogo.js, montagem das bases) ----------
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
function texConcretoC(){const S=512,c=cvs(S,S),g=c.getContext('2d'),r=rnd(31);g.fillStyle='#8e8f8a';g.fillRect(0,0,S,S);
  for(let i=0;i<4;i++)for(let j=0;j<4;j++){const v=128+r()*10|0;g.fillStyle=`rgb(${v},${v},${v-4})`;g.fillRect(i*128+1,j*128+1,126,126);}
  for(let i=0;i<5000;i++){const v=120+r()*70|0;g.fillStyle=`rgba(${v},${v},${v},.35)`;g.fillRect(r()*S,r()*S,1+r()*3,1+r()*3);}
  g.strokeStyle='rgba(60,60,60,.7)';g.lineWidth=2;for(let i=0;i<=4;i++){g.beginPath();g.moveTo(i*128,0);g.lineTo(i*128,S);g.moveTo(0,i*128);g.lineTo(S,i*128);g.stroke();}return c;}
function texListras2(){const c=cvs(64,16),g=c.getContext('2d');for(let i=0;i<5;i++){g.fillStyle=i%2?'#f4f4f4':'#ff5a14';g.fillRect(i*13,0,13,16);}return c;}
let _tC=null;const tCon=()=>{if(!_tC){_tC=texH(texConcretoC());_tC.wrapS=_tC.wrapT=THREE.RepeatWrapping;}return _tC;};
function mHasA(){return new THREE.MeshStandardMaterial({map:tCon(),color:0xc8c4b8,roughness:0.95,side:THREE.DoubleSide});}
function mConcA(){return new THREE.MeshStandardMaterial({map:tCon(),color:0xd8d8d8,roughness:0.9});}
const mVi=M('#9fd4ff',0.2),mTe=M('#5a6066',0.7),mPo=M('#cfcfcf',0.5),mPred=M('#cfc6b4',0.85),mTanq=M('#e6e6e2',0.5),mAmar=M('#e8b818',0.7),mPorta=M('#3d4247',0.6);
function chaoA(g,w,d,mat){const p=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat||M('#8e8f8a',0.95));p.rotation.x=-PI/2;p.position.y=0.03;p.receiveShadow=true;g.add(p);}
function torreA(cor){const g=new THREE.Group();chaoA(g,60,50);cil(3.2,4.2,26,mConcA(),0,13,0,g,12);cil(7,5,6,mVi,0,29,0,g,10);cil(7.6,7.6,0.9,mTe,0,32.4,0,g,10);
  cil(0.15,0.15,8,mPo,0,36.5,0,g,6);box(12,8,20,mPred,22,4,-6,g);cil(0.35,0.35,24,mPo,-14,12,20,g);const band=new THREE.Mesh(new THREE.PlaneGeometry(9,5.5),new THREE.MeshStandardMaterial({color:new THREE.Color(cor).convertSRGBToLinear(),side:THREE.DoubleSide}));band.position.set(-9.5,21,20);g.add(band);return g;}
function hasA(){const g=new THREE.Group();chaoA(g,60,90);const h=new THREE.Mesh((()=>{const q=new THREE.CylinderGeometry(15,15,44,18,1,false,-PI/2,PI);q.rotateX(-PI/2);return q;})(),mHasA());h.castShadow=true;g.add(h);
  const pt=new THREE.Mesh(new THREE.CircleGeometry(15,18,0,PI),mPorta);pt.position.set(0,0.05,-22.2);pt.rotation.y=PI;g.add(pt);box(1.2,0.3,45,mAmar,0,0.32,-57,g);return g;}
function tanquesA(){const g=new THREE.Group();chaoA(g,70,60);for(const [x,z] of[[-9,-11.5],[9,11.5]]){cil(8,8,9,mTanq,x,4.5,z,g,16);cil(8.2,8.2,0.4,mTe,x,9.1,z,g,16);}return g;}
function prediosA(){const g=new THREE.Group();chaoA(g,90,70);for(const [x,z,w,d,hh] of [[-20,-12,30,16,7],[22,10,22,22,9],[-18,20,40,14,6]]){box(w,hh,d,mPred,x,hh/2,z,g);box(w+1,0.6,d+1,mTe,x,hh+0.3,z,g);}return g;}
function pistaA(){const g=new THREE.Group();chaoA(g,260,200,M('#5b7a3a',1));const t=texH(texPistaC());const p=new THREE.Mesh(new THREE.PlaneGeometry(PISTA,46),new THREE.MeshStandardMaterial({map:t,roughness:0.9}));p.rotation.x=-PI/2;p.position.set(-PISTA/2+60,0.3,0);p.receiveShadow=true;g.add(p);
  cil(0.12,0.12,7,mPo,30,3.5,-60,g,6);const bi=new THREE.Mesh(new THREE.ConeGeometry(0.9,5,10,1,true),new THREE.MeshStandardMaterial({map:texH(texListras2()),side:THREE.DoubleSide}));bi.rotation.z=-PI/2;bi.position.set(32.5,6.6,-60);g.add(bi);
  for(let x=-120;x<=60;x+=60)for(const sz of[-24,24])box(0.9,0.7,0.9,new THREE.MeshBasicMaterial({color:0xfff2c0}),x,0.5,sz,g);for(let k=-4;k<=4;k++)box(0.9,0.7,0.9,new THREE.MeshBasicMaterial({color:0x30ff60}),55,0.5,k*5,g);return g;}

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
  b.geometry.translate(1.8,0,0);b.position.set(x,h-1.3,z);pai.add(b);b.castShadow=true;BAND.push(b);const bola=new THREE.Mesh(new THREE.SphereGeometry(0.12,10,8),S('#c9a227',0.3,0.8));bola.position.set(x,h+0.1,z);pai.add(bola);return b;}
function tremula(t){for(const b of BAND){const p=b.geometry.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setZ(i,Math.sin(x*1.6-t*5)*0.18*(x/3.6));}p.needsUpdate=true;b.geometry.computeVertexNormals();}}

// ===== 1) TORRE DE CONTROLE =====
function torreNovo(cor){const g=new THREE.Group();piso(g,60,50,CONC('#a9a79f',4));
  const reb=REB('#e2dccd'),con=CONC('#c9c6bd',3);
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
  bandeira(g,cor,-20,14,14);pessoa(g,2,6,2.4);return g;}

// ===== 2) ABRIGO REFORÇADO (HAS) =====
function hasNovo(cor){const g=new THREE.Group();piso(g,60,100,CONC('#a3a199',4));
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
function tanquesNovo(cor){const g=new THREE.Group();piso(g,70,60,CONC('#9f9d96',4));
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
