// (18/11) os bots descem p/ o rasante no mar? Entra na sala com bots, fica 50 s parado na pista e mede a menor altura de cada bot.  node testes/bots_rasante.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:640,height:360}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');
  const min={};for(let i=0;i<50;i++){await pg.waitForTimeout(1000);const r=await pg.evaluate(()=>[...JJ.OUT.values()].filter(o=>o.vivo&&!o.navio).map(o=>[o.nome,Math.round(o.pos.y)]));for(const [n,y] of r)min[n]=Math.min(min[n]??1e9,y);}
  console.log(JSON.stringify(min));console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
