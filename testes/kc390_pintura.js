const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:520}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  await pg.goto('http://localhost:8791/previa_modelos.html#kc');await pg.waitForTimeout(3000);
  await pg.addStyleTag({content:'#ui,#nome,#dica{display:none!important}'});
  for(const [n,p,t] of [['geral',[26,20,30],[0,12,0]],['nariz',[24,15,9],[13,12,0]]]){await pg.evaluate(([p,t])=>{ctl.autoRotate=false;agua.visible=false;cam.position.set(...p);ctl.target.set(...t);ctl.update();},[p,t]);await pg.waitForTimeout(700);
    await pg.screenshot({path:`/tmp/claude-1000/-home-gomes/8b394382-d042-4748-9348-bf0d23872cfc/scratchpad/kcp_${n}.png`});}
  console.log('erros:',erros.length?erros.join(' | ').slice(0,600):'nenhum');await b.close();})();
