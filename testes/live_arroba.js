// (19/11) sala da live: tela do @ antes de entrar; liga a ponte do TikTok p/ esse @
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});pg.setDefaultTimeout(60000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8795/',{timeout:90000});await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');
  await pg.click('#salaLive');await pg.screenshot({path:__dirname+'/f_live_arroba.png'});
  await pg.fill('#liveUser','@a b');await pg.click('#bLiveIr');console.log('inválido:',await pg.textContent('#liveEst'));
  await pg.fill('#liveUser','@yodamalhumorado');await pg.click('#bLiveIr');await pg.waitForTimeout(4000);
  console.log('sala:',await pg.evaluate(()=>SALA),'| menu visível:',await pg.isVisible('#menu'));
  console.log('ponte:',await pg.evaluate(async()=>JSON.stringify(await (await fetch('/api/live/ponte')).json())));
  await pg.waitForTimeout(8000);console.log('ponte depois:',await pg.evaluate(async()=>JSON.stringify(await (await fetch('/api/live/ponte')).json())),'| alertas:',await pg.textContent('#liveA'));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
