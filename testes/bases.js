// teste headless da sala sem bots: nasce na pista, decola, e depois vai p/ perto de outra base (SAM).  node testes/bases.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1280,height:720}});const erros=[],msgs={};
  pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))erros.push(m.text());});
  pg.on('websocket',w=>w.on('framereceived',f=>{try{const t=JSON.parse(f.payload).t;msgs[t]=(msgs[t]||0)+1;}catch(e){}}));
  await pg.goto('http://localhost:8791/');await pg.waitForTimeout(2000);await pg.screenshot({path:__dirname+'/f_menu.png'});
  await pg.fill('#nome','Gomes');await pg.click('#salaPvp');await pg.waitForTimeout(2000);
  const est=()=>pg.evaluate(()=>{const {EU}=window.JJ;return{solo:EU.solo,vivo:EU.vivo,vel:Math.round(EU.vel*3.6),y:Math.round(EU.pos.y),x:Math.round(EU.pos.x),z:Math.round(EU.pos.z),aviso:document.querySelector('#aviso').style.display==='block'?document.querySelector('#aviso').textContent:''};});
  console.log('pista',JSON.stringify(await est()));await pg.screenshot({path:__dirname+'/f_pista.png'});
  await pg.keyboard.down('ShiftLeft');await pg.waitForTimeout(2500);console.log('correndo',JSON.stringify(await est()));
  await pg.keyboard.down('ArrowDown');await pg.waitForTimeout(1500);await pg.keyboard.up('ArrowDown');console.log('subindo',JSON.stringify(await est()));
  await pg.screenshot({path:__dirname+'/f_decolou.png'});await pg.keyboard.up('ShiftLeft');await pg.waitForTimeout(3000);console.log('voando',JSON.stringify(await est()));
  // vai p/ perto da base 2 (oposta), a 2 km dela
  await pg.evaluate(()=>{const {EU}=window.JJ;const a=225*Math.PI/180;EU.pos.set(Math.cos(a)*5200,600,Math.sin(a)*5200);EU.q.setFromAxisAngle(new THREE.Vector3(0,1,0),Math.atan2(EU.pos.z,-EU.pos.x)+Math.PI);});
  await pg.waitForTimeout(2500);console.log('perto base inimiga',JSON.stringify(await est()));await pg.screenshot({path:__dirname+'/f_sam.png'});
  await pg.waitForTimeout(8000);console.log('depois',JSON.stringify(await est()),'feed:',await pg.evaluate(()=>document.querySelector('#feed').innerText.replace(/\n/g,' / ')));
  console.log('msgs',JSON.stringify(msgs));console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
