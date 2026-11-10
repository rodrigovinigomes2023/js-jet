// teste headless do míssil: aponta o caça p/ um bot, trava, dispara e fotografa o rastro.  node testes/missil.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1280,height:720}});const erros=[],msgs={};
  pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))erros.push(m.text());});
  pg.on('websocket',w=>w.on('framereceived',f=>{try{const t=JSON.parse(f.payload).t;msgs[t]=(msgs[t]||0)+1;}catch(e){}}));
  await pg.goto('http://localhost:8791/');await pg.waitForTimeout(2000);await pg.fill('#nome','Gomes');await pg.click('#decolar');await pg.waitForTimeout(2500);
  const mira=()=>pg.evaluate(()=>{const {EU,OUT}=window.JJ;const o=[...OUT.values()].find(o=>o.vivo);if(!o)return;
    const f=o.vel.clone().normalize();EU.pos.copy(o.pos).addScaledVector(f,-600);EU.pos.y=Math.max(EU.pos.y,400);
    const d=o.pos.clone().sub(EU.pos).normalize();EU.q.setFromUnitVectors(new THREE.Vector3(1,0,0),d);EU.vel=o.vel.length();});
  for(let i=0;i<14;i++){await mira();await pg.waitForTimeout(100);}
  await pg.screenshot({path:__dirname+'/f_trava.png'});
  await pg.keyboard.down('KeyF');for(let i=0;i<4;i++){await mira();await pg.waitForTimeout(100);}await pg.keyboard.up('KeyF');
  await pg.waitForTimeout(900);await pg.screenshot({path:__dirname+'/f_missil.png'});
  await pg.keyboard.down('KeyX');await pg.waitForTimeout(200);await pg.keyboard.up('KeyX');
  await pg.waitForTimeout(3500);await pg.screenshot({path:__dirname+'/f_missil2.png'});
  console.log('msgs',JSON.stringify(msgs),'feed:',await pg.evaluate(()=>document.querySelector('#feed').innerText.replace(/\n/g,' / ')));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
