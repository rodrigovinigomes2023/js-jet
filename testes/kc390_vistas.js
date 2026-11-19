const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:600}});await pg.goto('http://localhost:8791/previa_modelos.html#kc');await pg.waitForTimeout(3000);
  await pg.addStyleTag({content:'#ui,#nome,#dica{display:none!important}'});
  for(const [n,p,t] of [['cima',[0.01,55,0],[0,12,0]],['lado',[0,13,42],[0,12,0]],['meio',[-6,26,10],[0,15,0]],['baixo',[8,-2,22],[2,11,0]]]){await pg.evaluate(([p,t])=>{ctl.autoRotate=false;agua.visible=false;cam.position.set(...p);ctl.target.set(...t);ctl.update();},[p,t]);await pg.waitForTimeout(600);
    await pg.screenshot({path:`/tmp/claude-1000/-home-gomes/8b394382-d042-4748-9348-bf0d23872cfc/scratchpad/kcv_${n}.png`});}
  await b.close();})();
