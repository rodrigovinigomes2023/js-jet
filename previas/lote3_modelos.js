// ===================== LOTE 3 · ÁRVORES, NAVIOS, LANCHA, CAIXAS =====================
// ---------- HOJE (copiado do js-jet) ----------
function cascoA(comp,larg,alt,proa,mat,pai,y=0){const s=new THREE.Shape(),c=comp/2,l=larg/2;
  s.moveTo(-c,-l*0.85);s.lineTo(-c,l*0.85);s.lineTo(-c+2,l);s.lineTo(c-proa,l);s.quadraticCurveTo(c-proa*0.3,l*0.7,c,0);s.quadraticCurveTo(c-proa*0.3,-l*0.7,c-proa,-l);s.lineTo(-c+2,-l);s.closePath();
  const geo=new THREE.ExtrudeGeometry(s,{depth:alt,bevelEnabled:false});geo.rotateX(-PI/2);const m=new THREE.Mesh(geo,mat);m.position.y=y;m.castShadow=true;pai.add(m);return m;}
function torreCanhaoA(mat,matC,x,y,pai,cano=12){const t=new THREE.Group();t.position.set(x,y,0);pai.add(t);cil(3.4,4,2.6,mat,0,1.3,0,t,12);box(5,2.4,5.4,mat,0.6,3.4,0,t);const c=cil(0.5,0.6,cano,matC,cano/2+2.5,3.6,0,t,8);c.rotation.z=PI/2-0.08;return t;}
function bandeiraA(cor,x,y,pai){box(0.3,7,0.3,M('#3a3f44',0.6),x,y+3.5,0,pai);box(0.2,2.6,4,M(cor,0.7),x,y+5.6,2.1,pai);}
function troncoA(w,h,d,k,mat,x,y,z,pai,kz){const g=new THREE.BoxGeometry(w,h,d),p=g.attributes.position;for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setX(i,p.getX(i)*k);p.setZ(i,p.getZ(i)*(kz??k));}g.computeVertexNormals();const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);m.castShadow=true;pai.add(m);return m;}
function navioAA(cor){const g=new THREE.Group(),cz=M('#7d878f',0.65),cz2=M('#a3adb5',0.55),esc_=M('#4b545c',0.7),ver=M('#9e2b25',0.8),pr=M('#1d2328',0.5),fx=M(cor,0.6);
  cascoA(78,15,4,16,ver,g,-1.5);cascoA(78,15,6,16,cz,g,2.5);cascoA(74,13.4,0.4,15,esc_,g,8.5);
  box(16,6,11,cz2,-4,11.5,0,g);box(10,4,9,cz2,-2,16.5,0,g);box(6.5,1.2,9.2,pr,1.4,16.8,0,g);box(1.2,0.6,11.2,fx,-4,14.6,0,g);
  cil(0.5,0.8,12,esc_,-4,24.5,0,g,6);const pr1=new THREE.Group();pr1.position.set(-4,29,0);g.add(pr1);box(1.2,1.8,7,cz2,0,0,0,pr1);gira(pr1,0.03);
  box(6,5,7,cz,-15,11,0,g);cil(2.2,2.6,5,esc_,-15,15.5,0,g,10);box(4.6,0.8,5.2,fx,-15,17.6,0,g);
  box(9,1.2,8,M('#5b646b',0.6),16,9.1,0,g);for(let i=0;i<4;i++)for(let k=0;k<3;k++)box(1.6,0.4,1.6,pr,12.5+i*2.3,9.8,-2.4+k*2.4,g);
  torreCanhaoA(cz2,esc_,26,8.7,g,11);esf(2.2,M('#e9ecef',0.4),-24,13,0,g);cil(2,2.4,3,cz2,-24,10.4,0,g);
  box(14,0.3,12.4,M('#59626a',0.8),-31,8.9,0,g);bandeiraA(cor,-37,8.7,g);return g;}
function navioBA(cor){const g=new THREE.Group(),cz=M('#646d75',0.6),cz2=M('#757f87',0.55),esc_=M('#3c444b',0.7),ver=M('#2b2f33',0.8),pr=M('#1b2126',0.4),fx=M(cor,0.6);
  cascoA(80,14,4,22,ver,g,-1.5);cascoA(80,14,6,22,cz,g,2.5);troncoA(34,6,12.6,0.86,cz2,-4,11.5,0,g,0.8);troncoA(14,5,9.6,0.8,cz2,0,17,0,g,0.78);box(4.6,1,7.2,pr,5.2,17.6,0,g);
  troncoA(7,9,6.4,0.55,cz2,-3,24,0,g,0.55);for(const z of[-1,1])box(3.2,3.2,0.2,pr,-3,23.5,z*2.4,g);box(0.6,2.2,12.8,fx,-12,12,0,g);troncoA(7,4,6,0.6,esc_,-18,16,0,g);
  const t=new THREE.Group();t.position.set(23,8.5,0);g.add(t);troncoA(6,2.4,5.6,0.6,cz2,0,1.2,0,t);const c=cil(0.45,0.55,8,esc_,6,1.6,0,t,8);c.rotation.z=PI/2-0.06;
  troncoA(8,1.4,8,0.7,esc_,14,9.2,0,g);box(13,0.3,12,M('#4a5258',0.8),-32,8.6,0,g);bandeiraA(cor,-38,8.5,g);return g;}
function arvoresA(){const g=new THREE.Group();const r=rnd(4);
  const gA=new THREE.ConeGeometry(1,1,6);gA.translate(0,0.5,0);for(let i=0;i<14;i++){const t=12+r()*14,m=new THREE.Mesh(gA,M('#1f421f',1));m.scale.set(t*0.38,t,t*0.38);m.position.set(-18+r()*20,-1,-14+r()*28);m.castShadow=true;g.add(m);}
  const ga=new THREE.ConeGeometry(4,11,6);ga.translate(0,7.5,0);const tr=new THREE.CylinderGeometry(0.5,0.6,2.5,5);tr.translate(0,1.25,0);
  for(let i=0;i<10;i++){const e=0.7+r()*0.9,x=6+r()*16,z=-14+r()*28;const a=new THREE.Mesh(ga,M(['#2f5d2a','#3a6b30','#254d24','#4a7a36'][i%4],0.9));a.material.flatShading=true;a.scale.setScalar(e);a.position.set(x,0,z);a.castShadow=true;g.add(a);const b=new THREE.Mesh(tr,M('#5a4030',0.9));b.scale.setScalar(e);b.position.set(x,0,z);g.add(b);}
  return g;}
function caixasA(){const g=new THREE.Group(),pal=M('#8a6a45',0.9);const mk=(tipo,x)=>{const c=new THREE.Group();c.position.x=x;g.add(c);box(1.4,0.15,1.4,pal,0,0.075,0,c);
  if(tipo==='comb'){for(const [a,b] of[[-0.33,-0.33],[0.33,-0.33],[-0.33,0.33],[0.33,0.33]]){cil(0.29,0.29,0.88,M('#c0392b',0.5),a,0.59,b,c,12);cil(0.3,0.3,0.05,M('#e8e8e8',0.5),a,0.8,b,c,12);}}
  else if(tipo==='mun'){for(let k=0;k<2;k++){box(1.3,0.45,0.9,M('#556b2f',0.8),0,0.38+k*0.47,0,c);box(1.32,0.08,0.92,M('#c9b037',0.6),0,0.5+k*0.47,0,c);}}
  else{box(1.2,1.2,1.2,M('#f0f0f0',0.6),0,0.75,0,c);box(0.8,0.25,1.22,M('#d32f2f',0.6),0,0.75,0,c);box(0.25,0.8,1.22,M('#d32f2f',0.6),0,0.75,0,c);}};
  mk('comb',-2.2);mk('mun',0);mk('blind',2.2);return g;}
function lanchaA(){const g=new THREE.Group(),cas=M('#d9dcd8',0.55),fun=M('#3a3f44',0.7),cab=M('#e9ebe8',0.5),vid=M('#1d2a33',0.15),pr=M('#22262a',0.6),fx=M('#e8443a',0.6),bor=M('#2b2f33',0.85);
  cascoA(12,3.4,0.6,4,fun,g,-0.35);cascoA(12,3.4,0.9,4,cas,g,0.25);cascoA(11.6,3.3,0.12,3.8,bor,g,1.1);box(10.4,0.06,3.0,M('#a8aca6',0.85),-0.4,1.17,0,g);
  box(3.0,1.5,2.4,cab,-0.6,1.95,0,g);const pb=box(0.08,0.9,2.3,vid,0.95,2.15,0,g);pb.rotation.z=0.35;box(2.6,0.08,2.6,cab,-0.9,2.74,0,g);cil(0.05,0.05,1.4,pr,-1.6,3.45,0,g,6);box(0.5,0.12,0.5,pr,-1.6,4.1,0,g);
  box(0.15,0.2,3.1,fx,-0.4,0.95,0,g);const ar=new THREE.Group();ar.position.set(3.7,1.2,0);g.add(ar);cil(0.08,0.1,0.9,pr,0,0.45,0,ar,6);const cano=cil(0.05,0.05,1.6,pr,0.75,0.95,0,ar,6);cano.rotation.z=PI/2;
  for(const z of[-0.6,0.6]){box(0.5,0.7,0.4,M('#1c1c1c',0.5),-6.25,1.25,z,g);box(0.15,0.9,0.12,pr,-6.3,0.5,z,g);}return g;}

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
    pai.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*3,0.035,5),mat));
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
function troncoCurvo(pai,pts,r0,r1){const mat=P('casca','#8a7a66',{tile:1,r:1,ns:1.2});const cur=new THREE.CatmullRomCurve3(pts),geo=new THREE.TubeGeometry(cur,12,1,8,false),p=geo.attributes.position;
  // afina o tubo do pé ao topo
  for(let i=0;i<p.count;i++){const seg=Math.floor(i/9)/12,k=r0+(r1-r0)*seg,c=cur.getPointAt(seg);p.setXYZ(i,c.x+(p.getX(i)-c.x)*k,c.y+(p.getY(i)-c.y)*k,c.z+(p.getZ(i)-c.z)*k);}
  geo.computeVertexNormals();const m=sombra(new THREE.Mesh(geo,mat));pai.add(m);return m;}
function arvoreMata(pai,x,z,e,sem){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(e);g.rotation.y=sem;pai.add(g);const r=rnd(sem*97+3);
  troncoCurvo(g,[new V3(0,-0.3,0),new V3(0.3,4,0.2),new V3(-0.2,8,0.1),new V3(0.1,11,0)],0.55,0.25);
  for(const [a,h,L] of[[0.3,8,3.5],[2.4,9,3],[4.3,7.5,3.2]])troncoCurvo(g,[new V3(0,h,0),new V3(Math.cos(a)*L*0.5,h+1.2,Math.sin(a)*L*0.5),new V3(Math.cos(a)*L,h+2.4,Math.sin(a)*L)],0.22,0.1);
  for(let k=0;k<7;k++){const a=r()*PI*2,d=k?1.5+r()*2.4:0,f=new THREE.Mesh(folhagem(2.4+r()*1.4,1,0.35,'#1f3d1c','#5d8a3a',sem*10+k),M_FOLHA);f.position.set(Math.cos(a)*d,11+r()*2.2-(k?0.8:0),Math.sin(a)*d);f.castShadow=true;g.add(f);}
  return g;}
function araucaria(pai,x,z,e,sem){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(e);g.rotation.y=sem;pai.add(g);const r=rnd(sem*31+7);
  troncoCurvo(g,[new V3(0,-0.3,0),new V3(0,8,0),new V3(0,16,0),new V3(0,20,0)],0.5,0.28);
  // galhos em candelabro, curvando p/ cima, com tufos nas pontas
  const n=11;for(let k=0;k<n;k++){const a=k/n*PI*2+r()*0.4,L=4+r()*2.2,h=16.5+r()*2.5;const p0=new V3(0,h,0),p1=new V3(Math.cos(a)*L*0.6,h+0.3,Math.sin(a)*L*0.6),p2=new V3(Math.cos(a)*L,h+2.2+r(),Math.sin(a)*L);
    troncoCurvo(g,[p0,p1,p2],0.13,0.07);const f=new THREE.Mesh(folhagem(1.25,1,0.3,'#20361d','#4c6e33',sem*13+k),M_FOLHA);f.scale.set(1.25,0.55,1.25);f.position.copy(p2).setY(p2.y+0.25);f.castShadow=true;g.add(f);}
  const f=new THREE.Mesh(folhagem(1.6,1,0.3,'#20361d','#4c6e33',sem),M_FOLHA);f.scale.set(1.3,0.5,1.3);f.position.y=20.3;g.add(f);
  return g;}
function coqueiro(pai,x,z,e,sem){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(e);g.rotation.y=sem;pai.add(g);const r=rnd(sem*7+1);
  const topo=new V3(1.6+r(),9.5,0.4);troncoCurvo(g,[new V3(0,-0.3,0),new V3(0.3,3,0),new V3(0.9,6.5,0.2),topo],0.3,0.2);
  const fol=S('#4c7a2c',0.8);fol.side=THREE.DoubleSide;for(let k=0;k<9;k++){const a=k/9*PI*2+r()*0.3,L=4.2+r()*0.8;const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new V3(topo.x+Math.cos(a)*L*t,topo.y+0.6*Math.sin(t*PI*0.9)*1.4-t*t*2.4,topo.z+Math.sin(a)*L*t));}
    const cur=new THREE.CatmullRomCurve3(pts);const pos=[],idx=[];for(let i=0;i<=16;i++){const t=i/16,c=cur.getPoint(t),tg=cur.getTangent(t),lat=new V3(-tg.z,0,tg.x).normalize().multiplyScalar(0.55*Math.sin(t*PI)*(1-t*0.3));
      pos.push(c.x-lat.x,c.y-0.15*Math.sin(t*PI),c.z-lat.z,c.x,c.y,c.z,c.x+lat.x,c.y-0.15*Math.sin(t*PI),c.z+lat.z);if(i<16){const b=i*3;idx.push(b,b+3,b+1,b+1,b+3,b+4,b+1,b+4,b+2,b+2,b+4,b+5);}}
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
