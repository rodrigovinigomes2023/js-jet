const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:600}});await pg.goto('http://localhost:8791/previa_modelos.html#kc');await pg.waitForTimeout(3000);
  await pg.addStyleTag({content:'#ui,#nome,#dica{display:none!important}'});
  await pg.evaluate(()=>{cena.background.set('#9cc9ec');cena.fog=null;agua.visible=false;chao.visible=false;ctl.autoRotate=false;});
  for(const [n,p,t] of [['a',[22,18,26],[0,12,0]],['b',[-20,16,-24],[0,12,0]],['c',[10,5,30],[0,11,0]],['d',[-28,24,6],[0,13,0]]]){await pg.evaluate(([p,t])=>{cam.position.set(...p);ctl.target.set(...t);ctl.update();},[p,t]);await pg.waitForTimeout(600);
    await pg.screenshot({path:`/tmp/claude-1000/-home-gomes/8b394382-d042-4748-9348-bf0d23872cfc/scratchpad/kcb_${n}.png`});}
  await b.close();})();
