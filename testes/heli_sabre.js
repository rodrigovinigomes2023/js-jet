// (19/11) AH-2 Sabre no modo heli: carrega mi35.js, troca o modelo provisório, rotor/cauda giram, sem erro
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:30000});await pg.waitForTimeout(800);await pg.screenshot({path:__dirname+'/f_sab_brief.png'});await pg.click('#hmOk');
  await pg.evaluate(()=>{HELI_ZOOM=0.5;});await pg.waitForTimeout(2500);await pg.screenshot({path:__dirname+'/f_sab_perto.png'});
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(3000);await pg.keyboard.down('Space');await pg.waitForTimeout(1000);await pg.keyboard.up('Space');await pg.keyboard.up('KeyW');
  await pg.evaluate(()=>{HELI_ZOOM=1;});await pg.waitForTimeout(1500);await pg.screenshot({path:__dirname+'/f_sab_voo.png'});
  console.log(await pg.evaluate(()=>`cap ${HELI_CAP} rotor ${JATO.userData.rotor.rotation.y.toFixed(1)} balas ${BALAS_N}`));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
