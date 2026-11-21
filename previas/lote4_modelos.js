// ===================== LOTE 4 · AERONAVES, ARMAS E GENTE =====================
// ---------- HOJE (copiado do js-jet) ----------
let GRIPEN=null;const _gr=fetch('gripen.json').then(r=>r.json()).then(d=>{const g={};for(const [k,x] of Object.entries(d)){if(k==='cocar')continue;const geo=new THREE.BufferGeometry(),v=new Float32Array(x.v.length);for(let i=0;i<v.length;i++)v[i]=x.v[i]/1000;
  geo.setAttribute('position',new THREE.BufferAttribute(v,3));geo.setIndex(x.f);geo.computeVertexNormals();g[k]=geo;}GRIPEN=g;if(window._recarrega)_recarrega();});
function gripenA(cor,esc=0.875){const J=new THREE.Group();if(!GRIPEN)return J;const mg=M('#868d93',0.62),mc=M(cor,0.5);for(const k of['corpo','asas'])J.add(sombra(new THREE.Mesh(GRIPEN[k],mg)));for(const k of['canards','deriva'])J.add(sombra(new THREE.Mesh(GRIPEN[k],mc)));J.scale.setScalar(esc);return J;}
function bombardeiroA(){const g=new THREE.Group();const j=gripenA('#8a8f95',0.875*1.6);j.position.y=4;g.add(j);return g;}   // hoje: Gripen 1,6× (24 m)
function missilA(){const g=new THREE.Group(),m=M('#e8e8e8',0.4),p=M('#b0b4b8',0.4);const c=cil(0.22,0.22,3.4,m,0,0,0,g,8);c.rotation.z=PI/2;const n=cil(0,0.22,0.6,p,2.0,0,0,g,8);n.rotation.z=-PI/2;
  for(let i=0;i<4;i++){const a=box(0.6,0.04,0.9,m,-1.4,0,0,g);a.rotation.x=i*PI/4;}g.scale.setScalar(0.75);g.position.y=1.2;return g;}
function bombaA(){const g=new THREE.Group(),mb=M('#4a5a2a',0.7);const c=cil(0.45,0.45,2.6,mb,0,0,0,g,10);c.rotation.z=PI/2;esf(0.45,mb,1.3,0,0,g,1.5,1,1);
  for(let i=0;i<4;i++){const a=box(0.7,0.05,1.3,M('#3a3f1a',0.6),-1.3,0,0,g);a.rotation.x=i*PI/4;}g.scale.setScalar(0.65);g.position.y=0.6;return g;}
function militarA(){const h=new THREE.Group(),mac=M('#5b6b45',0.9),col=M('#3b4630',0.85),bot=M('#1c1c1a',0.8),pele=M('#c99470',0.8),cap=M('#c3c7c0',0.5),vis=M('#1d2a33',0.2),luv=M('#2b2b26',0.9);
  for(const z of[-0.1,0.1]){box(0.27,0.11,0.12,bot,0.04,0.055,z,h);cil(0.07,0.065,0.42,mac,0,0.32,z,h,8);cil(0.08,0.07,0.42,mac,0,0.74,z,h,8);}
  box(0.2,0.12,0.36,col,0,0.98,0,h);box(0.22,0.5,0.38,mac,0,1.2,0,h);box(0.25,0.32,0.4,col,0.01,1.24,0,h);
  cil(0.05,0.06,0.08,pele,0,1.49,0,h,8);esf(0.105,pele,0,1.6,0,h);esf(0.125,cap,-0.01,1.64,0,h,1,0.95,1);box(0.04,0.07,0.17,vis,0.11,1.63,0,h);
  for(const z of[-1,1]){const o=new THREE.Group();o.position.set(0,1.42,z*0.23);h.add(o);cil(0.055,0.05,0.3,mac,0,-0.15,0,o,8);const c=new THREE.Group();c.position.y=-0.3;o.add(c);cil(0.05,0.045,0.28,mac,0,-0.14,0,c,8);esf(0.05,luv,0,-0.3,0,c);
    o.rotation.x=-z*2.6;}return h;}
function pilotoA(){const g=new THREE.Group();g.add(militarA());const pan=box(2.6,0.04,0.9,M('#ff6a1a',0.8),3.2,0.03,1.6,g);pan.rotation.y=0.6;box(0.32,0.5,0.32,M('#3b4630',0.8),1.4,0.25,-1.2,g);
  const lata=cil(0.07,0.07,0.3,M('#e06a20',0.6),-1.6,0.15,1.2,g,8);lata.rotation.z=1.4;return g;}
function armasA(){const g=new THREE.Group();const m=missilA();m.position.set(0,1.2,-1.5);g.add(m);const b=bombaA();b.position.set(0,0.6,1.5);g.add(b);return g;}

// ---------- PROPOSTA ----------
// fuselagem por torno (perfil r(x)), deitada ao longo de x
function fuselagem(pts,seg,mat){const p=[...pts].sort((a,b)=>a[0]-b[0]).map(([x,r])=>new THREE.Vector2(Math.max(0.001,r),x));   /* da cauda p/ o nariz: faces viradas p/ fora (antes ficavam p/ dentro e via-se o interior) */const geo=new THREE.LatheGeometry(p,seg);geo.rotateZ(-PI/2);
  {const uv=geo.attributes.uv,pos=geo.attributes.position;for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/2,uv.getX(i)*6);}geo.computeVertexNormals();return sombra(new THREE.Mesh(geo,mat));}
// asa/empenagem: planta (lista de [x,z]) extrudada na espessura e com perfil afinando na ponta
function superficie(planta,esp,mat,bisel=0.12){const s=new THREE.Shape();planta.forEach(([x,z],i)=>i?s.lineTo(x,z):s.moveTo(x,z));const geo=new THREE.ExtrudeGeometry(s,{depth:esp,bevelEnabled:true,bevelSize:bisel,bevelThickness:bisel,bevelSegments:2,steps:1});
  geo.translate(0,0,-esp/2);geo.rotateX(PI/2);{const uv=geo.attributes.uv;for(let k=0;k<uv.count;k++)uv.setXY(k,uv.getX(k)/2,uv.getY(k)/2);}geo.computeVertexNormals();return sombra(new THREE.Mesh(geo,mat));}
function motorPod(pai,x,y,z,L,r,mat){const g=new THREE.Group();g.position.set(x,y,z);pai.add(g);const n=fuselagem([[L/2,r*0.92],[L/2-0.4,r],[-L/2+0.8,r*0.95],[-L/2,r*0.7]],20,mat);g.add(n);
  const ent=cl(r*0.86,r*0.86,0.06,S('#121416',0.6),L/2+0.02,0,0,g,20);ent.rotation.z=PI/2;const sp=new THREE.Mesh(new THREE.ConeGeometry(r*0.3,0.5,14),S('#c9ccce',0.3,0.8));sp.rotation.z=-PI/2;sp.position.x=L/2-0.15;g.add(sp);
  const es=cl(r*0.62,r*0.5,0.6,S('#3b342e',0.6,0.6),-L/2-0.25,0,0,g,16);es.rotation.z=PI/2;return g;}
// ===== 1) BOMBARDEIRO PESADO (4 motores, asa enflechada) =====
function bombardeiroNovo(cor){const g=new THREE.Group();const cin=NAV('#8b9298'),esc=NAV('#6a7177'),mot=NAV('#7d848a');
  const F=new THREE.Group();F.position.y=4.2;g.add(F);
  F.add(fuselagem([[22,0],[21.4,0.6],[20,1.25],[18,1.75],[15,2.05],[10,2.2],[-8,2.2],[-14,1.9],[-18,1.4],[-21,0.8],[-22,0.5]],28,cin));
  // cabine: faixa de janelas no topo do nariz
  {const jg=new THREE.CylinderGeometry(1.47,1.8,1.7,32,1,true,PI*1.5-0.95,1.9);const jm=new THREE.Mesh(jg,VIDRO);jm.rotation.z=-PI/2;jm.position.set(18.55,0,0);F.add(jm);   /* faixa de janelas colada no nariz (antes losangos saindo) */
   for(let k=-2;k<=2;k++){const a=k*0.42;const mm=new THREE.Mesh(new THREE.CylinderGeometry(1.49,1.82,1.7,4,1,true,PI*1.5+a-0.015,0.03),S('#2a2d30',0.5));mm.rotation.z=-PI/2;mm.position.set(18.55,0,0);F.add(mm);}}
  // asa alta enflechada (~35°) com envergadura de 48 m
  const asa=superficie([[5,0],[-4,0],[-16.5,23.8],[-13.2,24]],0.55,cin,0.18);asa.position.set(0,1.6,0);F.add(asa);const asa2=asa.clone();asa2.scale.z=-1;F.add(asa2);
  for(const s of[-1,1]){bx(3.2,0.12,0.5,S(cor,0.55),-14.8,1.65,s*22.6,F);   // ponta da asa na cor do time
    for(const [zz,xx] of[[8.5,-1.4],[15.5,-6.4]]){bx(2.2,1.0,0.35,cin,xx+0.4,1.0,s*zz,F);motorPod(F,xx+1.8,0.05,s*zz,5.2,0.82,mot);}}   // 4 motores em pilones
  // empenagem: deriva alta + estabilizadores
  const der=superficie([[-15,0],[-21.5,0],[-24.2,9.5],[-21,9.5]],0.4,cin,0.12);der.rotation.x=-PI/2;der.position.set(0,1.4,0);F.add(der);
  bx(3.2,1.4,0.46,S(cor,0.55),-22.4,8.6,0,F);
  const est=superficie([[-17.5,0],[-22,0],[-24.6,8.2],[-22.4,8.3]],0.3,cin,0.1);est.position.set(0,0.9,0);F.add(est);const est2=est.clone();est2.scale.z=-1;F.add(est2);
  // torre de cauda com 2 canos, compartimento de bombas, antenas, trem recolhido (portas)
  const tc=new THREE.Mesh(new THREE.SphereGeometry(0.75,16,10),esc);tc.position.set(-22.2,0.1,0);F.add(tc);for(const s of[-0.18,0.18]){const c=cl(0.05,0.05,1.6,S('#2a2d2f',0.4,0.6),-23.2,0.1,s,F,8);c.rotation.z=PI/2;}
  bx(10,0.05,1.6,S('#4d5459',0.7),2,-2.17,0,F);for(const x of[-3,2,7])bx(0.05,0.06,1.62,S('#3b4045',0.6),x,-2.18,0,F);
  for(const [x,y] of[[6,2.2],[-6,2.2]])haste(new V3(x,y,0),new V3(x-0.6,y+0.9,0),0.05,S('#2a2d2f',0.5),F);
  // insígnia da facção (estrela cinza-escura) nas laterais
  const ins=canvasTex(128,128,(c,w,h)=>{c.clearRect(0,0,w,h);c.fillStyle='#2f3438';c.beginPath();c.arc(64,64,58,0,7);c.fill();c.fillStyle='#c9ccd0';c.beginPath();for(let i=0;i<10;i++){const a=-PI/2+i*PI/5,r=i%2?18:44;c.lineTo(64+Math.cos(a)*r,64+Math.sin(a)*r);}c.fill();});
  for(const s of[-1,1]){const p=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshStandardMaterial({map:ins,transparent:true,polygonOffset:true,polygonOffsetFactor:-4}));p.position.set(-12,0.4,s*2.06);p.rotation.y=s>0?0:PI;F.add(p);}
  // Gripen ao lado p/ comparar o tamanho
  const gp=gripenA('#3a7bd5');gp.position.set(10,1.9,-30);gp.rotation.y=0.3;g.add(gp);g.userData.gp=gp;
  return g;}
// ===== 2) ARMAS v2 (refeitas à mão, medidas reais) =====
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
function reboque(){const g=new THREE.Group(),v=P('metalpint','#5a6340',{tile:0.6,r:0.7,ns:0.5}),pr=S('#1c1d1e',0.85),bor=S('#2d2f2b',0.9);
  for(const z of[-0.42,0.42])bx(2.6,0.1,0.08,v,0,0.42,z,g);for(const x of[-1.2,-0.4,0.4,1.2])bx(0.08,0.08,0.92,v,x,0.42,0,g);   // chassi
  for(const x of[-0.8,0.8])for(const z of[-0.5,0.5]){const r=cl(0.2,0.2,0.12,pr,x,0.2,z,g,20);r.rotation.x=PI/2;const c=cl(0.09,0.09,0.13,S('#8d9296',0.4,0.6),x,0.2,z,g,14);c.rotation.x=PI/2;}
  for(const x of[-0.8,0.8])bx(0.06,0.06,1.1,S('#3a3d3f',0.5,0.5),x,0.2,0,g);   // eixos
  haste(new V3(1.3,0.42,0),new V3(2.1,0.25,0),0.03,v,g);const ar=new THREE.Mesh(new THREE.TorusGeometry(0.06,0.015,6,14),v);ar.position.set(2.15,0.25,0);ar.rotation.x=PI/2;g.add(ar);   // cambão
  for(const x of[-0.45,0.45]){bx(0.12,0.08,0.7,v,x,0.5,0,g);for(const s of[-1,1]){const p=bx(0.1,0.16,0.08,bor,x,0.6,s*0.11,g);p.rotation.x=s*0.6;}}   // berços em V com borracha
  return g;}
function cavalete(pai,x,z){for(const xx of[-0.5,0.5]){const g=new THREE.Group();g.position.set(x+xx,0,z);pai.add(g);const v=S('#5a6340',0.7,0.2);
  for(const s of[-1,1])haste(new V3(0,0,s*0.3),new V3(0,0.82,0),0.025,v,g,8);bx(0.12,0.04,0.66,v,0,0.04,0,g);const sd=cl(0.085,0.085,0.1,S('#2d2f2b',0.9),0,0.86,0,g,16,true);sd.rotation.x=PI/2;sd.scale.y=0.6;}}
function armasNovo(){const g=new THREE.Group();const rb=reboque();rb.position.z=1.3;g.add(rb);const b=bombaNovo();b.position.set(0,0.62+0.1365-0.02,1.3);g.add(b);
  for(const x of[-0.45,0.45]){const ci=new THREE.Mesh(new THREE.TorusGeometry(0.145,0.012,4,24,PI),S('#d9a21c',0.7));ci.position.set(x,0.74,1.3);ci.rotation.y=PI/2;g.add(ci);}   // cintas amarelas
  cavalete(g,0.1,-1.1);const m=missilNovo();m.position.set(0.1,0.86+0.076,-1.1);g.add(m);
  pessoa(g,1.6,0,-0.9);return g;}
// ===== 4) MILITAR (mais anatômico) e PILOTO ABATIDO =====
function militarNovo(o={}){const h=new THREE.Group();const farda=o.farda?S(o.farda,0.9):P('reboco','#5b6b45',{tile:0.4,r:1,ns:0.8}),cola=S('#3b4630',0.85),bota=S('#1c1c1a',0.7),pele=S('#c99470',0.75),cap=o.capacete?S(o.capacete,0.4,0.1):S('#4f5c3c',0.8),luv=S('#2b2b26',0.9);
  for(const z of[-0.1,0.1]){const p=new THREE.Group();p.position.set(0,0.92,z);h.add(p);cl(0.085,0.07,0.44,farda,0,-0.22,0,p,10);const j=new THREE.Group();j.position.y=-0.44;p.add(j);cl(0.065,0.05,0.42,farda,0,-0.21,0,j,10);
    bx(0.28,0.12,0.12,bota,0.05,-0.43,0,j);bx(0.12,0.16,0.12,bota,0,-0.33,0,j);}
  const tr=fuselagem([[0.95,0.15],[1.1,0.17],[1.32,0.2],[1.45,0.19],[1.5,0.12]],12,farda);tr.rotation.z=PI/2;tr.scale.set(1,1,1.35);h.add(tr);   // tronco com ombros
  if(o.colete!==false){const cv=fuselagem([[1.05,0.19],[1.4,0.215]],12,o.colete?S(o.colete,0.6):cola);cv.rotation.z=PI/2;cv.scale.set(1,1.05,1.38);h.add(cv);}
  bx(0.24,0.07,0.36,cola,0,0.97,0,h);   // cinto
  cl(0.05,0.06,0.09,pele,0,1.55,0,h,10);const cab=new THREE.Mesh(new THREE.SphereGeometry(0.1,14,10),pele);cab.scale.set(1,1.12,0.95);cab.position.y=1.66;h.add(cab);
  const ca=new THREE.Mesh(new THREE.SphereGeometry(0.125,16,10,0,PI*2,0,PI*0.55),cap);ca.position.y=1.69;h.add(ca);
  if(o.viseira){const v=new THREE.Mesh(new THREE.SphereGeometry(0.128,16,8,-PI*0.35,PI*0.7,PI*0.3,PI*0.25),VIDRO);v.position.y=1.69;h.add(v);}
  const bracos=[];for(const z of[-1,1]){const ob=new THREE.Group();ob.position.set(0,1.44,z*0.25);h.add(ob);cl(0.06,0.052,0.3,farda,0,-0.15,0,ob,10);
    const c=new THREE.Group();c.position.y=-0.3;ob.add(c);cl(0.05,0.045,0.27,farda,0,-0.135,0,c,10);const m=new THREE.Mesh(new THREE.SphereGeometry(0.048,10,8),luv);m.position.y=-0.3;c.add(m);bracos.push({o:ob,c,z});}
  h.userData.bracos=bracos;return h;}
function paraquedas(pai,x,z){   // velame caído no chão, meio embolado, gomos laranja e branco
  const t=canvasTex(256,256,(c,w,h)=>{for(let i=0;i<16;i++){c.fillStyle=i%2?'#f2f0ea':'#e8642a';c.beginPath();c.moveTo(w/2,h/2);c.arc(w/2,h/2,w/2,i/16*PI*2,(i+1)/16*PI*2);c.fill();}});
  const geo=new THREE.CircleGeometry(3.6,32,4);{const p=geo.attributes.position,r=rnd(17);for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),d=Math.hypot(x,y);p.setZ(i,0.05+Math.max(0,Math.sin(d*2.1+r())*0.25)*(d/3.6)+(r()*0.12));p.setX(i,x*(0.6+0.4*(y>0?1:0.55)));}geo.computeVertexNormals();}
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({map:t,side:THREE.DoubleSide,roughness:0.9}));m.rotation.x=-PI/2;m.position.set(x,0.02,z);m.castShadow=m.receiveShadow=true;pai.add(m);
  const lin=S('#e9e6dc',0.8);for(let i=0;i<8;i++){const a=PI*0.55+i/8*PI*0.9;haste(new V3(x+Math.cos(a)*2.0,0.06,z+Math.sin(a)*2.6),new V3(x+3.4,0.12,z+0.1),0.008,lin,pai,4);}
  return m;}
function pilotoNovo(){const g=new THREE.Group();const mil=militarNovo({farda:'#7a8a6a',capacete:'#eef0ec',colete:'#d9b62a',viseira:true});g.add(mil);   // macacão de voo, capacete branco, colete salva-vidas
  for(const B of mil.userData.bracos){B.o.rotation.x=-B.z*2.55;B.c.rotation.x=-B.z*0.25;}   // acenando
  haste(new V3(0.12,1.62,0.05),new V3(0.18,1.2,0.12),0.018,S('#2a2d2f',0.5),g);   // mangueira do oxigênio
  paraquedas(g,-4.4,0.4);
  // painel de sinalização, kit de sobrevivência (assento), lata de fumaça com fumaça laranja
  const pn=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.9),S('#ff5a14',0.8));pn.rotation.x=-PI/2;pn.rotation.z=0.6;pn.position.set(2.8,0.025,1.6);pn.receiveShadow=true;g.add(pn);
  bx(0.45,0.22,0.38,P('metalpint','#4f5d34',{tile:0.5,r:0.7}),1.2,0.11,-1.1,g);bx(0.2,0.12,0.15,S('#d9b62a',0.6),1.45,0.28,-1.1,g);
  const lata=cl(0.06,0.06,0.25,S('#e06a20',0.6),-1.3,0.06,1.2,g,12);lata.rotation.z=PI/2;
  const tf=canvasTex(64,64,(c,w,h)=>{const gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.5,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);});
  const rf=rnd(3);for(let i=0;i<22;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tf,color:0xff7a2a,transparent:true,opacity:0.55*(1-i/24),depthWrite:false}));const t=i/22;sp.position.set(-1.3-t*2.2+(rf()-0.5)*0.3,0.25+t*7,1.2+t*0.6+(rf()-0.5)*0.3);sp.scale.setScalar(0.5+t*3.2);g.add(sp);}   /* fumaça macia (sprites) */
  return g;}

// ===== MODELOS PRONTOS (Sketchfab, CC-BY 4.0): Tu-95 "Bear" (helijah), low poly soldier (Kolos Studios), Army Parachute (amaraklov) =====
const _GLB={};function glb(url){return _GLB[url]||(_GLB[url]=new Promise((ok,erro)=>new THREE.GLTFLoader().load(url,ok,undefined,erro)));}
function bombardeiroGLB(cor){const g=new THREE.Group();glb('modelos/tu95.gltf.json').then(G=>{const o=G.scene.clone(true);o.rotation.y=PI;o.updateMatrixWorld(true);   // nariz p/ +x (padrão do jogo)
    o.traverse(m=>{if(m.isMesh){m.castShadow=m.receiveShadow=true;}});const b=new THREE.Box3().setFromObject(o);o.position.y=-b.min.y;g.add(o);});
  const gp=gripenA('#3a7bd5');gp.position.set(16,1.9,-34);gp.rotation.y=0.3;g.add(gp);return g;}
function soldadoGLB(o={}){const g=new THREE.Group();new THREE.GLTFLoader().load('modelos/soldado.gltf.json',G=>{const s=G.scene;   /* cada soldado com o seu esqueleto */
    s.updateMatrixWorld(true);s.traverse(m=>{if(!m.isSkinnedMesh)return;   /* ossos "quebrados" (fora da pose de bind) passam o peso p/ o primeiro ancestral bom */
      const B=m.skeleton.bones,Inv=m.skeleton.boneInverses,M4=new THREE.Matrix4(),pp=new V3(),qq=new THREE.Quaternion(),ss=new V3();
      const MI=new THREE.Matrix4().copy(m.matrixWorld).invert();const bom=B.map((b,i)=>{M4.multiplyMatrices(b.matrixWorld,Inv[i]).premultiply(MI);M4.decompose(pp,qq,ss);return Math.abs(ss.x-1)<0.05&&Math.abs(ss.y-1)<0.05&&pp.length()<30;});
      const sub=B.map((b,i)=>{let k=i,n=b;while(k>=0&&!bom[k]){n=n.parent;k=n&&n.isBone?B.indexOf(n):-1;}return k;});
      const SI=m.geometry.attributes.skinIndex.array;for(let i=0;i<SI.length;i++)if(sub[SI[i]]>=0)SI[i]=sub[SI[i]];m.geometry.attributes.skinIndex.needsUpdate=true;
      g.userData.ruins=(g.userData.ruins||0)+bom.filter(x=>!x).length;});
    if(o.anim&&G.animations[0]){const mx=new THREE.AnimationMixer(s);mx.clipAction(G.animations[0]).play();mx.update(0.01);}   // sem animação = pose em que foi modelado
    s.updateMatrixWorld(true);const osso=n=>{let r=null;s.traverse(q=>{if(q.isBone&&q.name.startsWith(n))r=q;});return r;};
    if(o.pose){o.pose(osso);s.updateMatrixWorld(true);}
    // congela a pose: calcula cada vértice pelos ossos (CPU) e vira malha comum, já em metros
    const ty=osso('head_end').getWorldPosition(new V3()).y,fy=Math.min(osso('toeL').getWorldPosition(new V3()).y,osso('toeR').getWorldPosition(new V3()).y);const k=(o.altura||1.75)/(ty-fy);
    const v=new V3(),pecas=[],bb=new THREE.Box3();s.traverse(m=>{if(!m.isSkinnedMesh)return;m.skeleton.update();
      {const ik=new Set(m.skeleton.bones.map((b,i)=>/IK|_end|_rootJoint/.test(b.name)?i:-1).filter(i=>i>=0)),si=m.geometry.attributes.skinIndex,sw=m.geometry.attributes.skinWeight;   // ossos auxiliares (IK) puxavam vértices p/ longe: tira o peso deles
       const SI=si.array,SW=sw.array;const B=m.skeleton.bones,mao={L:B.findIndex(b=>b.name.startsWith('handL')),R:B.findIndex(b=>b.name.startsWith('handR'))};
       const dedo=B.map(b=>{const q=/^(thumb|index|middle|ring|pinky)/.test(b.name)&&b.name.match(/(L|R)_/);return q?mao[q[1]]:-1;});   // ossos dos dedos vinham com escala quebrada: o peso vai p/ a mão
       for(let i=0;i<SI.length;i++)if(dedo[SI[i]]>=0)SI[i]=dedo[SI[i]];si.needsUpdate=true;
       for(let i=0;i<sw.count;i++){let t=0;const w=[0,1,2,3].map(c=>{const ww=ik.has(SI[i*4+c])?0:SW[i*4+c];t+=ww;return ww;});if(t>0)for(let c=0;c<4;c++)SW[i*4+c]=w[c]/t;}}
      const geo=m.geometry.clone(),pos=geo.attributes.position;
      const SW0=m.geometry.attributes.skinWeight.array;for(let i=0;i<pos.count;i++){const tw=SW0[i*4]+SW0[i*4+1]+SW0[i*4+2]+SW0[i*4+3];if(o.ossos&&tw>1e-4)m.boneTransform(i,v);else v.fromBufferAttribute(m.geometry.attributes.position,i);   /* padrão: pose em que foi modelado (o esqueleto do arquivo veio quebrado) */   /* vértice sem peso: fica onde foi modelado (antes ia p/ a origem e virava lança) */
        v.applyMatrix4(m.matrixWorld);pos.setXYZ(i,v.x,v.y,v.z);bb.expandByPoint(v);}pecas.push([geo,m.material,m.name]);});
    const k2=(o.altura||1.75)/(bb.max.y-bb.min.y),cx=(bb.min.x+bb.max.x)/2,cz=(bb.min.z+bb.max.z)/2;   // escala pela altura da malha já posada
    const bE=o.bracoE??-1.25,bD=o.bracoD??-1.25,OY=1.43,OX=0.19;   // ângulo de cada braço a partir da pose T (negativo = desce); pivô no ombro
    for(const [geo,m0,nome] of pecas){const pos=geo.attributes.position;
      for(let i=0;i<pos.count;i++){let x=(pos.getX(i)-cx)*k2,y=(pos.getY(i)-bb.min.y)*k2,z=(pos.getZ(i)-cz)*k2;
        const ax=Math.abs(x),w=Math.min(1,Math.max(0,(ax-OX+0.03)/0.08))*(y>1.12?1:0);if(w>0){const sg=Math.sign(x),a=(sg>0?bD:-bE)*w*sg*sg,dx=x-sg*OX,dy=y-OY,c=Math.cos(a),sn=Math.sin(a);x=sg*OX+dx*c-dy*sn;y=OY+dx*sn+dy*c;}
        pos.setXYZ(i,x,y,z);}
      geo.deleteAttribute('skinIndex');geo.deleteAttribute('skinWeight');geo.computeVertexNormals();geo.computeBoundingSphere();
      const mat=m0.clone();mat.skinning=false;if(o.cores&&o.cores[m0.name])mat.color.set(o.cores[m0.name]).convertSRGBToLinear();const mm=new THREE.Mesh(geo,mat);mm.castShadow=true;g.add(mm);}
    g.userData.info=pecas.map(([geo,m0,n])=>{geo.computeBoundingBox();const z=geo.boundingBox.getSize(new V3());return n+":"+m0.name+" "+z.toArray().map(v=>v.toFixed(2)).join("x")+" v"+geo.attributes.position.count;}).join(" | ");
    g.userData.pronto=true;});return g;}
function paraquedasGLB(pai,x,z){glb('modelos/paraquedas.gltf.json').then(G=>{const p=G.scene.clone(true);p.scale.set(2.6,2.4,2.6);   // velame Ø ~3,5 m deitado de lado, meio murcho, linhas até o piloto
    p.rotation.z=PI/2-0.08;p.rotation.y=0.15;p.position.set(x,0.75,z);p.scale.x*=0.55;p.traverse(m=>{if(m.isMesh){m.castShadow=true;}});pai.add(p);});}
function soldadosGLB(){const g=new THREE.Group();const verde={'Material.003':'#5b6b45','Material.002':'#3b4630'};   // farda verde-oliva (o original é deserto)
  const a=soldadoGLB({cores:verde});a.position.set(-3.6,0,-0.6);a.rotation.y=0.3;g.add(a);const b=soldadoGLB({cores:verde,bracoD:-1.05,bracoE:-1.35});b.position.set(-2.2,0,-1.8);b.rotation.y=-0.2;g.add(b);
  // piloto abatido: macacão de voo, acenando com o braço esquerdo, paraquedas, painel, kit e fumaça
  const pi=new THREE.Group();pi.position.set(3.6,0,1.6);pi.rotation.y=-0.7;g.add(pi);const pv=soldadoGLB({cores:{'Material.003':'#7f8c6c','Material.002':'#4d5643'},bracoE:1.1,bracoD:-1.2});pi.add(pv);
  paraquedasGLB(pi,-2.8,-0.3);
  const pn=new THREE.Mesh(new THREE.PlaneGeometry(2.6,0.9),S('#ff5a14',0.8));pn.rotation.x=-PI/2;pn.rotation.z=0.6;pn.position.set(2.4,0.025,1.4);pn.receiveShadow=true;pi.add(pn);
  bx(0.45,0.22,0.38,P('metalpint','#4f5d34',{tile:0.5,r:0.7}),1.0,0.11,-1.0,pi);const lata=cl(0.06,0.06,0.25,S('#e06a20',0.6),-1.2,0.06,1.1,pi,12);lata.rotation.z=PI/2;
  const tf=canvasTex(64,64,(c,w,h)=>{const gr=c.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(0.5,'rgba(255,255,255,.5)');gr.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=gr;c.fillRect(0,0,w,h);});
  const rf=rnd(3);for(let i=0;i<22;i++){const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tf,color:0xff7a2a,transparent:true,opacity:0.55*(1-i/24),depthWrite:false}));const t=i/22;sp.position.set(-1.2-t*2.2+(rf()-0.5)*0.3,0.25+t*7,1.1+t*0.6);sp.scale.setScalar(0.5+t*3.2);pi.add(sp);}
  return g;}
function soldadosNovo(){const g=new THREE.Group();const a=militarNovo();a.position.set(-1,0,0);g.add(a);const b=militarNovo();b.position.set(1,0,0);b.rotation.y=0.4;for(const B of b.userData.bracos){B.o.rotation.x=-B.z*0.3;}g.add(b);
  const c=pilotoNovo();c.position.set(4,0,2);c.rotation.y=-0.8;g.add(c);return g;}
function soldadosA(){const g=new THREE.Group();const a=militarA();a.position.set(-1,0,0);g.add(a);const c=pilotoA();c.position.set(4,0,2);c.rotation.y=-0.8;g.add(c);return g;}
