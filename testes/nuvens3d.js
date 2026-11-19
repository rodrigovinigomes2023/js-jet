// (18/11) nuvens 3D: foto do menu, de dentro do céu (horizontal) e de cabeça p/ baixo.  node testes/nuvens3d.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.waitForTimeout(1500);await pg.screenshot({path:__dirname+'/f_nuv_menu.png'});
  await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{window.__camFixa=[[0,1250,9000],[0,1300,0]];});await pg.waitForTimeout(2000);await pg.screenshot({path:__dirname+'/f_nuv_ceu.png'});
  await pg.evaluate(()=>{window.__camFixa=[[0,2600,8000],[0,1100,2000]];});await pg.waitForTimeout(2000);await pg.screenshot({path:__dirname+'/f_nuv_cima.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
