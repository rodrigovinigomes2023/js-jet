// (19/11) missão 2: 2 bombardeiros, 3 escoltas, 2 alas seguindo o jogador.  PORTA=8795 node testes/missao2.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[],msgs=[];pg.on('pageerror',e=>erros.push(e.message));
  pg.on('websocket',w=>w.on('framereceived',f=>{try{const d=JSON.parse(f.payload);if(d.t==='radio')msgs.push(d.quem+': '+d.txt);}catch(e){}}));
  await pg.goto('http://localhost:'+(process.env.PORTA||8795)+'/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});
  await pg.evaluate(()=>localStorage.setItem('jsjet-missoes','{"1":3}'));await pg.click('#bConvidado');await pg.click('#bMissoes');await pg.waitForTimeout(500);
  await pg.click('#mGrade .mc[data-n="2"]');await pg.screenshot({path:__dirname+'/f_mis2_brief.png'});await pg.click('#mVai');
  const est=()=>pg.evaluate(()=>{const E=JJ.EU.pos;return [...JJ.OUT.values()].map(o=>`${o.nome}${o.aliado?'[ala]':''} ${(o.pos.distanceTo(E)/1000).toFixed(1)}km ${o.vivo?'':'✝'}`).join(' | ');});
  await pg.waitForTimeout(4000);console.log('t=4s :',await est());
  await pg.waitForTimeout(16000);console.log('t=20s:',await est());await pg.screenshot({path:__dirname+'/f_mis2_alas.png'});
  console.log('rádio:\n  '+msgs.join('\n  '));console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
