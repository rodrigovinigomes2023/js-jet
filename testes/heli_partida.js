// (20/11) heli nasce desligado no heliponto; câmera padrão baixa (horizonte)
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(2000);await pg.click('#hmOk');
  await pg.waitForTimeout(3000);const st=()=>pg.evaluate(()=>`motor ${HELI.motor.toFixed(2)} y ${(EU.pos.y-HELI.hp.y).toFixed(1)} comb ${HELI.comb.toFixed(1)} msg "${$('#heliMsg').textContent}"`);
  console.log('parado:',await st());console.log(await pg.evaluate(()=>`relevo ${HELI.hp.y.toFixed(2)} BASE_H ${BASE_H}`));await pg.screenshot({path:__dirname+'/f_heli_partida1.png'});
  await pg.evaluate(()=>heliZoom(0.3));await pg.waitForTimeout(1500);await pg.screenshot({path:__dirname+'/f_heli_partida1z.png'});await pg.evaluate(()=>heliZoom(2));
  await pg.keyboard.down('KeyE');await pg.waitForTimeout(300);await pg.evaluate(()=>HELI.motor=0.97);await pg.waitForTimeout(2500);console.log('partida:',await st());
  await pg.waitForTimeout(6000);console.log('decolando:',await st());await pg.keyboard.up('KeyE');await pg.screenshot({path:__dirname+'/f_heli_partida2.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
