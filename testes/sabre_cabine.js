// (19/11) prévia: vista de dentro da cabine do Sabre (piloto e atirador)
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1000,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/previa_sabre.html');await pg.waitForFunction(()=>window.PV,null,{timeout:30000});await pg.waitForTimeout(500);
  await pg.evaluate(()=>PV.cabine(3.55,2.62));await pg.waitForTimeout(700);await pg.screenshot({path:__dirname+'/f_cab_piloto.png'});
  await pg.evaluate(()=>PV.cabine(5.72,2.08,0.3));await pg.waitForTimeout(700);await pg.screenshot({path:__dirname+'/f_cab_atirador.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
