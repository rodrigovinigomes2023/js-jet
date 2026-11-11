// (10/11) sala sem bots: bomba destrói lançador SAM da base inimiga.  PORTA=8792 node testes/bomba_sam.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));pg.on('websocket',w=>{w.on('framesent',f=>{if(/bomba|impacto/.test(f.payload))console.log('>>',f.payload);});w.on('framereceived',f=>{if(/bomba|sams|impacto/.test(f.payload))console.log('<<',f.payload.slice(0,160));});});
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#salaPvp');await pg.waitForTimeout(2500);
  const st=()=>pg.evaluate(()=>({bombas:document.querySelector('#tMis').textContent,lanc:JJ.BASES.map(B=>B.lanc.map(l=>l.vivo?1:0).join('')).join(' '),vivo:JJ.EU.vivo}));
  console.log('antes',JSON.stringify(await st()));
  // alvo: lançador 0 da base 2 (oposta)
  const alinha=()=>pg.evaluate(()=>{const L=JJ.BASES[2].lanc[0].L,p=new THREE.Vector3();L.getWorldPosition(p);const d=p.sub(JJ.ccip.position);d.y=0;if(JJ.ccip.visible)JJ.EU.pos.add(d);return JJ.ccip.visible;});
  await pg.evaluate(()=>{const L=JJ.BASES[2].lanc[0].L,p=new THREE.Vector3();L.getWorldPosition(p);const {EU}=JJ;EU.solo=false;EU.vel=150;EU.pos.set(p.x-700,300,p.z);EU.q.setFromAxisAngle(new THREE.Vector3(0,0,1),-0.12);});
  await pg.waitForTimeout(200);console.log('ccip',await alinha());await pg.waitForTimeout(20);await pg.keyboard.press('KeyB');
  for(let i=0;i<9;i++){await pg.waitForTimeout(1000);console.log(' t',i,JSON.stringify(await pg.evaluate(()=>({n:JJ.BOMBV.size,b:[...JJ.BOMBV.values()].map(b=>[Math.round(b.p.x),Math.round(b.p.y),Math.round(b.p.z)]),imp:JJ.impactos,vivo:JJ.EU.vivo,y:Math.round(JJ.EU.pos.y)}))));}console.log('depois',JSON.stringify(await st()));await pg.screenshot({path:__dirname+'/f_bomba_sam.png'});
  await b.close();})();
