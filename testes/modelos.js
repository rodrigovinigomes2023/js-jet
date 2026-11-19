// (19/11) visualizador modelos.html carrega e desenha?  node testes/modelos.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:520}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/modelos.html');await pg.waitForTimeout(3000);await pg.screenshot({path:__dirname+'/f_modelos_navio.png'});
  await pg.click('#ui button:nth-child(4)');await pg.waitForTimeout(1500);await pg.screenshot({path:__dirname+'/f_modelos_radar.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
