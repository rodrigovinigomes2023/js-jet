// (10/11) Gripen: cocar nas duas asas e bocal do motor (vista de cima e de trás).  node testes/gripen2.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:900,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/?foto');await pg.waitForTimeout(2500);await pg.evaluate(()=>{document.querySelector('#menu').style.display='none';});
  for(const [nome,cx,cy,cz] of [['cima',-2,26,0.01],['tras',-24,4,6],['lado',2,-1,20]]){
    await pg.evaluate(([cx,cy,cz])=>{window.__foto=[cx,cy,cz];},[cx,cy,cz]);await pg.waitForTimeout(600);await pg.screenshot({path:__dirname+'/f_gripen_'+nome+'.png'});}
  await b.close();})();
