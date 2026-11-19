const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});await pg.goto('http://localhost:8791/previa_modelos.html#kc');await pg.waitForTimeout(3000);
  await pg.addStyleTag({content:'#ui,#nome,#dica{display:none!important}'});
  await pg.evaluate(()=>{ctl.autoRotate=false;cam.position.set(28,22,32);ctl.target.set(0,12,0);ctl.update();});await pg.waitForTimeout(700);
  await pg.screenshot({path:'/tmp/claude-1000/-home-gomes/8b394382-d042-4748-9348-bf0d23872cfc/scratchpad/kc_perto.png'});await b.close();})();
