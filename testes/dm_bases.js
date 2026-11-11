// (11/11) sala com bots (deathmatch): nasce na própria base, munição acaba, rasante recarrega, base inimiga atira.  PORTA=8792 node testes/dm_bases.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const P=process.env.PORTA||8791,U='http://localhost:'+P;
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  let MORTES_SAM=0,ID=0;pg.on('websocket',w=>w.on('framereceived',f=>{const p=f.payload;if(p.startsWith('{"t":"abate"')){const d=JSON.parse(p);if(d.alvo===ID&&d.arma==='sam')MORTES_SAM++;}}));
  await pg.goto(U+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');await pg.waitForTimeout(3000);
  const st=()=>pg.evaluate(()=>{const {EU}=JJ;return{base:window.MINHA_BASE??null,solo:EU.solo,y:Math.round(EU.pos.y),hud:document.querySelector('#tMis').textContent,aviso:getComputedStyle(document.querySelector('#aviso')).display!=='none'?document.querySelector('#aviso').textContent:''};});
  console.log('nasceu:',JSON.stringify(await st()));
  console.log('bots e bases:',await pg.evaluate(()=>[...JJ.OUT.values()].map(o=>{const B=JJ.BASES.filter(B=>B.sala==='bots').map(B=>[B.i,Math.round(Math.hypot(o.pos.x-B.x,o.pos.z-B.z))]).sort((a,b)=>a[1]-b[1])[0];return `${o.nome}: base mais perto ${B[0]} a ${B[1]} m`;})));
  await pg.screenshot({path:__dirname+'/f_dm_pista.png'});
  // decola "no tapa" e gasta 30 balas
  await pg.evaluate(()=>{const {EU}=JJ;EU.solo=false;EU.trem=EU.tremAlvo=0;EU.vel=160;EU.pos.y=700;});
  await pg.keyboard.down('Space');await pg.waitForTimeout(3000);await pg.keyboard.up('Space');await pg.waitForTimeout(400);
  console.log('depois de atirar:',(await st()).hud);
  // rasante: passa a 70 m em cima da própria base
  const base=await pg.evaluate(()=>{const B=JJ.BASES.find(B=>B.dono&&B.dono.id===JJ.EU.id)||null;return B&&{x:B.x,z:B.z,dx:B.dx,dz:B.dz,i:B.i};});
  console.log('minha base:',JSON.stringify(base));
  for(let k=0;k<30;k++){await pg.evaluate(B=>{const {EU}=JJ;EU.pos.set(B.x-B.dx*300,90,B.z-B.dz*300);EU.q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(-B.dz,B.dx));EU.vel=150;},base);await pg.waitForTimeout(100);}
  await pg.waitForTimeout(600);console.log('depois do rasante:',(await st()).hud);
  // sobrevoa uma base inimiga ocupada a 300 m: tem que levar tiro da antiaérea
  const inim=await pg.evaluate(()=>{const B=JJ.BASES.find(B=>B.sala==='bots'&&B.dono&&B.dono.id!==JJ.EU.id);return B&&{x:B.x,z:B.z,i:B.i,dono:B.dono.nome};});
  console.log('base inimiga:',JSON.stringify(inim));
  ID=await pg.evaluate(()=>JJ.EU.id);await pg.screenshot({path:__dirname+'/f_dm_base_inimiga.png'});
  for(let k=0;k<50;k++){await pg.evaluate(B=>{const {EU}=JJ;EU.pos.set(B.x+200,300,B.z);EU.vel=150;},inim);await pg.waitForTimeout(100);}
  console.log('5 s em cima da base inimiga (300 m): derrubado pela antiaérea',MORTES_SAM,'vez(es)');
  await b.close();})();
