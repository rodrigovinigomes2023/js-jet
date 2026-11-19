// (18/11) teste do radar em cone + RWR: entra na sala com bots, voa e fotografa o radar.  node testes/radar.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1280,height:720}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  await pg.goto('http://localhost:8791/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');await pg.waitForTimeout(3000);
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(9000);
  for(const i of [1,2]){await pg.waitForTimeout(1500);await pg.locator('#radar').screenshot({path:__dirname+'/f_radar'+i+'.png'});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
