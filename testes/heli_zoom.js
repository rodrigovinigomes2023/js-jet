// (19/11) zoom do modo helicóptero: roda do mouse afasta, teclado + aproxima
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(3000);
  await pg.mouse.move(500,280);for(let i=0;i<8;i++){await pg.mouse.wheel(0,100);await pg.waitForTimeout(80);}await pg.waitForTimeout(2000);
  await pg.screenshot({path:__dirname+'/f_zoom_longe.png'});
  for(let i=0;i<12;i++){await pg.keyboard.press('Equal');await pg.waitForTimeout(60);}await pg.click('#bZoomMais');await pg.waitForTimeout(2000);
  await pg.screenshot({path:__dirname+'/f_zoom_perto.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
