// (18/11) teste do terreno montanha: entra na sala com bots, voa e fotografa a tela e o radar.  node testes/terreno.js [toque]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const toque=process.argv[2]==='toque';const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:toque?{width:844,height:390}:{width:1280,height:720},hasTouch:toque,isMobile:toque});const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  const t0=Date.now();await pg.goto('http://localhost:8791/'+(toque?'?toque':''));await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});console.log('carregou em',Date.now()-t0,'ms');
  await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');await pg.waitForTimeout(3000);
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(8000);await pg.keyboard.down('ArrowDown');await pg.waitForTimeout(1500);await pg.keyboard.up('ArrowDown');await pg.waitForTimeout(3000);
  await pg.screenshot({path:__dirname+'/f_terreno'+(toque?'_t':'')+'.png'});
  console.log(JSON.stringify(await pg.evaluate(()=>({y:Math.round(JJ.EU.pos.y),vivo:JJ.EU.vivo}))));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
