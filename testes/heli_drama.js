// (19/11) modo heli: briefing c/ mapa, destroço pegando fogo, lancha afundando, poeira do rotor, sombra, mapa (M)
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message+' '+(e.stack||'').split('\n')[1]));
  const f=n=>pg.screenshot({path:__dirname+'/f_hd_'+n+'.png'});
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(2500);
  await f('brief');await pg.click('#hmOk');await pg.waitForTimeout(500);
  // radar: destrói e chega perto p/ ver o fogo
  await pg.evaluate(()=>{const o=HELI.alvos.find(o=>o.tipo==='radar');heliDestroi(o);JJ.EU.pos.set(o.pos.x-60,o.pos.y+45,o.pos.z+40);HELI.agl=45;});await pg.waitForTimeout(5000);await f('fogo');
  // lancha
  await pg.evaluate(()=>{const o=HELI.alvos.find(o=>o.tipo==='lancha');heliDestroi(o);JJ.EU.pos.set(o.pos.x-90,60,o.pos.z+60);HELI.agl=60;});await pg.waitForTimeout(3000);await f('lancha3s');
  await pg.evaluate(()=>{const o=HELI.alvos.find(o=>o.tipo==='lancha');JJ.EU.pos.set(o.pos.x-90,60,o.pos.z+60);});await pg.waitForTimeout(6000);await f('lancha9s');
  // poeira na água (baixo)
  await pg.evaluate(()=>{HELI.agl=8;});await pg.waitForTimeout(2500);await f('spray');
  // poeira em terra
  await pg.evaluate(()=>{const p=HELI.pilotos[0].p;JJ.EU.pos.set(p.x+80,p.y+10,p.z);HELI.agl=8;});await pg.waitForTimeout(3000);await f('poeira');
  await pg.keyboard.press('KeyM');await pg.waitForTimeout(500);await f('mapa');
  console.log(await pg.evaluate(()=>`fogos ${HELI.fogos.length} fx ${JJ.nFX()} afunda ${JSON.stringify(HELI.alvos.find(o=>o.afunda).afunda.t.toFixed(1))} pausa ${HELI.pausa}`));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
