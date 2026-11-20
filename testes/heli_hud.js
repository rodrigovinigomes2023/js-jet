// (19/11) objetivo no canto + rádio do Cel. Moraes + zonas das antiaéreas
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});pg.setDefaultTimeout(60000);const erros=[];pg.on('pageerror',e=>erros.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.goto('http://localhost:8791/',{timeout:120000});await pg.waitForFunction(()=>window.JJ,null,{timeout:90000});await pg.click('#bConvidado');await pg.click('#bHeli');
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:60000});await pg.waitForTimeout(600);await pg.click('#hmOk');await pg.waitForTimeout(3000);
  await pg.screenshot({path:__dirname+'/f_hud_ini.png'});
  await pg.evaluate(()=>{const o=HELI.alvos.find(a=>a.tipo==='aa');JJ.EU.pos.set(o.pos.x+500,o.pos.y+60,o.pos.z);HELI.vel.set(0,0,0);EU.vida=1e6;HELI_ZOOM=3;});await pg.waitForTimeout(3500);
  await pg.screenshot({path:__dirname+'/f_hud_zona.png'});
  console.log(await pg.evaluate(()=>({alerta:$('#heliAlerta').style.display,radio:$('#hrTxt').textContent.slice(0,40)})));
  await pg.evaluate(()=>{for(const o of HELI.alvos)if(o.tipo==='radar')heliDestroi(o);});await pg.waitForTimeout(1500);
  console.log(await pg.evaluate(()=>({tit:document.querySelector('.hobj .tit').textContent,det:document.querySelector('.hobj .det').textContent})));
  await pg.screenshot({path:__dirname+'/f_hud_fase2.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
