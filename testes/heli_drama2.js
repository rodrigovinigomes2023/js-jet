// (19/11) olhar de longe: radar queimando e lancha no meio do naufrágio
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  const f=n=>pg.screenshot({path:__dirname+'/f_hd2_'+n+'.png'});
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(2000);await pg.click('#hmOk');
  await pg.evaluate(()=>{const o=HELI.alvos.find(o=>o.tipo==='aa');heliDestroi(o);JJ.EU.pos.set(o.pos.x-150,o.pos.y+60,o.pos.z+150);HELI.agl=60;HELI_ZOOM=0.8;});await pg.waitForTimeout(9000);await f('aa');
  await pg.evaluate(()=>{const o=HELI.alvos.find(o=>o.tipo==='lancha');heliDestroi(o);o.afunda.t=8;JJ.EU.pos.set(o.pos.x-100,60,o.pos.z+100);HELI.agl=60;});await pg.waitForTimeout(5000);await f('naufragio');
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
