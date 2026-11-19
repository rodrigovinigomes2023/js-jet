// (19/11) modo helicóptero: entra, voa p/ frente, atira, foto.  node testes/heli.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(3000);
  await pg.screenshot({path:__dirname+'/f_heli_base.png'});
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(6000);await pg.keyboard.down('Space');await pg.waitForTimeout(1500);await pg.keyboard.up('Space');await pg.keyboard.up('KeyW');
  await pg.screenshot({path:__dirname+'/f_heli_voo.png'});
  // vai até um radar e fotografa
  await pg.evaluate(()=>{const o=[...JJ.OUT.values()].find(o=>o.nome.includes('Radar'));JJ.EU.pos.set(o.pos.x-120,o.pos.y+40,o.pos.z+60);});await pg.waitForTimeout(2500);
  await pg.screenshot({path:__dirname+'/f_heli_radar.png'});
  console.log(await pg.evaluate(()=>`pos ${JJ.EU.pos.toArray().map(Math.round)} vida ${JJ.EU.vida} alvos ${[...JJ.OUT.values()].length} placar: ${document.querySelector('#placar').textContent}`));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
