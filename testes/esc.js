// Esc sai p/ o menu e dá p/ decolar de novo.  node testes/esc.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1280,height:720}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForTimeout(1500);await pg.fill('#nome','TesteEsc');await pg.click('#decolar');await pg.waitForTimeout(2500);
  await pg.keyboard.press('Escape');await pg.waitForTimeout(500);
  const menu=await pg.evaluate(()=>getComputedStyle(document.querySelector('#menu')).display);
  await pg.click('#decolar');await pg.waitForTimeout(2500);
  const st=await pg.evaluate(()=>({vivo:JJ.EU.vivo,outros:JJ.OUT.size}));
  console.log('menu depois do Esc:',menu,'| decolou de novo:',JSON.stringify(st),'| erros:',erros.join(' | ')||'nenhum');await b.close();})();
