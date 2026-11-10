// fotos da visão da cabine (V): reto e em curva puxando o manche.  node testes/cabine.js [toque]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const toque=process.argv[2]==='toque';const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:toque?{width:844,height:390}:{width:1280,height:720},hasTouch:toque,isMobile:toque});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/'+(toque?'?toque':''));await pg.waitForTimeout(1500);await pg.fill('#nome','TesteCabine');await pg.click('#decolar');await pg.waitForTimeout(2000);
  await pg.keyboard.press('KeyV');await pg.waitForTimeout(700);await pg.screenshot({path:__dirname+'/f_cab1'+(toque?'_t':'')+'.png'});
  await pg.keyboard.down('KeyD');await pg.keyboard.down('KeyS');await pg.keyboard.down('ShiftLeft');await pg.waitForTimeout(900);
  await pg.screenshot({path:__dirname+'/f_cab2'+(toque?'_t':'')+'.png'});await pg.keyboard.up('KeyD');await pg.keyboard.up('KeyS');await pg.keyboard.up('ShiftLeft');
  await pg.keyboard.press('KeyV');await pg.waitForTimeout(300);
  console.log('erros:',erros.join(' | ')||'nenhum');await b.close();})();
