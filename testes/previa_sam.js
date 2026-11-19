// (19/11) prato do SAM: de lado.  node testes/previa_sam.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:520}});await pg.goto('http://localhost:8791/previa_modelos.html');await pg.waitForTimeout(2000);
  await pg.click('#lR button:nth-of-type(4)');await pg.evaluate(()=>{ctl.autoRotate=false;cam.position.set(45,16,0);ctl.target.set(0,10,0);});await pg.waitForTimeout(800);
  await pg.screenshot({path:__dirname+'/f_prev_sam_lado.png',clip:{x:250,y:100,width:400,height:330}});await b.close();})();
