// (19/11) pilotos abatidos longe das bases + militar em escala acenando com fumaça laranja
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:30000});await pg.waitForTimeout(600);await pg.screenshot({path:__dirname+'/f_res_mapa.png'});await pg.click('#hmOk');
  console.log(await pg.evaluate(()=>HELI.pilotos.map(p=>{const dB=Math.min(...JJ.BASES.map(B=>Math.hypot(B.x-p.p.x,B.z-p.p.z)));return 'base+perto '+Math.round(dB)+' m';}).join(' | ')));
  await pg.evaluate(()=>{const p=HELI.pilotos[0].p;JJ.EU.pos.set(p.x-40,p.y+30,p.z+40);HELI.agl=30;HELI_ZOOM=0.45;EU.vida=1e6;});await pg.waitForTimeout(4000);await pg.screenshot({path:__dirname+'/f_res_perto.png'});
  await pg.evaluate(()=>{HELI_ZOOM=0.12;});await pg.waitForTimeout(2500);await pg.screenshot({path:__dirname+'/f_res_zoom.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
