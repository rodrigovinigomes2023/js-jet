const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:500}});await pg.goto('http://localhost:8791/previa_modelos.html#kc');await pg.waitForTimeout(3000);
  await pg.addStyleTag({content:'#ui,#nome,#dica{display:none!important}'});
  for(const [n,p] of [['dir',[6,13,22]],['esq',[6,13,-22]]]){await pg.evaluate(p=>{ctl.autoRotate=false;agua.visible=false;cam.position.set(...p);ctl.target.set(4,12,0);ctl.update();},p);await pg.waitForTimeout(600);
    await pg.screenshot({path:`/tmp/claude-1000/-home-gomes/8b394382-d042-4748-9348-bf0d23872cfc/scratchpad/kct_${n}.png`});}
  await b.close();})();
