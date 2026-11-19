// (18/11) foto aérea da maior ilha-montanha (câmera fixa).  node testes/terreno_foto.js [toque]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const toque=process.argv[2]==='toque';const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:toque?{width:844,height:390}:{width:1280,height:720},hasTouch:toque,isMobile:toque});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/'+(toque?'?toque':''));await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});
  await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{window.__camFixa=[[2600,650,1900],[312,250,-208]];});await pg.waitForTimeout(2500);
  await pg.screenshot({path:__dirname+'/f_terreno_ar'+(toque?'_t':'')+'.png'});
  await pg.evaluate(()=>{window.__camFixa=[[0,1200,7000],[0,900,-9000]];});await pg.waitForTimeout(2500);
  await pg.screenshot({path:__dirname+'/f_terreno_baixo'+(toque?'_t':'')+'.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
