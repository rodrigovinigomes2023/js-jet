// (19/11) rodas pretas do Sabre (foto de perto na prévia)
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1000,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/previa_sabre.html');await pg.waitForFunction(()=>window.PV,null,{timeout:30000});
  await pg.evaluate(()=>{PV.set('sabre3d','fab',false);PV.cam.position.set(6,1.5,9);PV.ctl.target.set(1,0.8,0);PV.ctl.update();});await pg.waitForTimeout(800);await pg.screenshot({path:__dirname+'/f_rodas.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
