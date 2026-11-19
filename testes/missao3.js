// (19/11) missão 3 (escolta): Pelicano + 2 alas, ondas aparecem, vitória ao chegar.  PORTA=8795 node testes/missao3.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[],msgs=[];pg.on('pageerror',e=>erros.push(e.message));
  pg.on('websocket',w=>w.on('framereceived',f=>{try{const d=JSON.parse(f.payload);if(d.t==='radio')msgs.push(d.quem+': '+d.txt);if(d.t==='obj')msgs.obj=d.txt;if(d.t==='fim')msgs.push('FIM '+JSON.stringify(d));}catch(e){}}));
  await pg.goto('http://localhost:'+(process.env.PORTA||8795)+'/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});
  await pg.evaluate(()=>localStorage.setItem('jsjet-missoes','{"1":3,"2":2}'));await pg.click('#bConvidado');await pg.click('#bMissoes');await pg.waitForTimeout(500);
  await pg.screenshot({path:__dirname+'/f_mis3_lista.png'});await pg.click('#mGrade .mc[data-n="3"]');await pg.screenshot({path:__dirname+'/f_mis3_brief.png'});await pg.click('#mVai');
  const est=()=>pg.evaluate(()=>[...JJ.OUT.values()].map(o=>`${o.nome} ${Math.round(o.vida)}/${o.vidaMax}${o.vivo?'':'✝'}`).join(' | '));
  // o jogador fica parado no ar (teste não pilota): segue o Pelicano p/ não ser derrubado de cara
  for(let s=0;s<150;s+=10){await pg.evaluate(()=>{const c=[...JJ.OUT.values()].find(o=>o.nome.includes('Pelicano'));if(c){JJ.EU.pos.copy(c.pos).add(new THREE.Vector3(0,200,0));JJ.EU.vida=100;}});
    await pg.waitForTimeout(10000);console.log('t='+(s+10)+'s',msgs.obj,'||',await est());if(msgs.some(m=>m.startsWith('FIM')))break;}
  await pg.waitForTimeout(3000);await pg.screenshot({path:__dirname+'/f_mis3_fim.png'});
  console.log('rádio:\n  '+msgs.join('\n  '));console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
