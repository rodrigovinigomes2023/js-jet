// (20/11) faixa "acordando o servidor": simula servidor dormindo (ping falha 8 s) no localhost.
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));let n=0;
  await pg.route('**/config.js',r=>r.fulfill({contentType:'text/javascript',body:"window.JJ_SERVIDOR='x';window.JJ_PUBLICO=true;"}));
  await pg.route(/api\/ping/,r=>++n<4?r.abort():r.fulfill({body:'ok'}));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForFunction(()=>document.querySelector('#sfSeg'));await pg.waitForTimeout(800);
  await pg.screenshot({path:__dirname+'/f_faixa_acordando.png'});console.log('faixa:',await pg.textContent('#servFaixa'));
  await pg.waitForFunction(()=>document.querySelector('#servFaixa.ok'),null,{timeout:20000});await pg.screenshot({path:__dirname+'/f_faixa_ok.png'});console.log('depois:',await pg.textContent('#servFaixa'));
  await pg.waitForTimeout(3500);console.log('visível no fim:',await pg.isVisible('#servFaixa'));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
