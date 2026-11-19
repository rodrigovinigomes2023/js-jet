// (19/11) foto dos botões no celular deitado (bomba à esquerda).  node testes/botoes_celular.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:800,height:380},hasTouch:true,isMobile:true});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/?toque');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});
  await pg.click('#bConvidado');await pg.click('#bMissoes');await pg.waitForTimeout(400);await pg.click('#mGrade .mc[data-n="6"]');await pg.click('#mVai');await pg.waitForTimeout(5000);
  await pg.screenshot({path:__dirname+'/f_botoes_celular.png'});console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
