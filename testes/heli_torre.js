// (19/11) canhão giratório: com alvo na tela e ao lado (não na frente), a torre vira e acerta
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(2000);await pg.click('#hmOk');
  const ini=await pg.evaluate(()=>{const o=HELI.alvos.find(o=>o.tipo==='lancha');JJ.EU.pos.set(o.pos.x-120,40,o.pos.z+120);HELI.agl=40;HELI.yaw=Math.atan2(-(o.pos.z-JJ.EU.pos.z),o.pos.x-JJ.EU.pos.x)+1.2;EU.vida=1e6;window._o=o;return o.vida;});
  await pg.waitForTimeout(1500);await pg.keyboard.down('Space');await pg.waitForTimeout(5000);await pg.keyboard.up('Space');await pg.screenshot({path:__dirname+'/f_torre.png'});
  console.log(await pg.evaluate(ini=>`vida lancha ${ini} -> ${_o.vida} viva ${_o.vivo} torre ${JATO.userData.torre.rotation.toArray().slice(0,3).map(x=>x.toFixed(2))}`,ini));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
