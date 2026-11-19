// (19/11) modelos novos dentro do jogo: missão 4 (radares) e 6 (navios) — na cena, variados, sem erro.  node testes/modelos_jogo.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');
  for(const n of [4,6]){await pg.evaluate(()=>JJ.abreMissoes());await pg.waitForTimeout(400);await pg.click(`#mGrade .mc[data-n="${n}"]`);await pg.click('#mVai');await pg.waitForTimeout(5000);
    console.log('missão',n,await pg.evaluate(()=>[...JJ.OUT.values()].filter(o=>o.navio).map(o=>`${o.nome}: ${o.g.children.length} peças, na cena=${!!o.g.parent}, visível=${o.g.visible}`).join(' | ')));
    for(let i=0;i<10;i++){await pg.evaluate(()=>{const o=[...JJ.OUT.values()].find(o=>o.navio&&o.vivo);const p=o.pos.clone().add(new THREE.Vector3(-260,o.pos.y<5?70:110,-90));
      JJ.EU.pos.copy(p);JJ.EU.q.setFromUnitVectors(new THREE.Vector3(1,0,0),o.pos.clone().add(new THREE.Vector3(0,10,0)).sub(p).normalize());JJ.EU.vel=60;JJ.EU.vida=100;});await pg.waitForTimeout(150);}
    await pg.screenshot({path:__dirname+`/f_modelos_m${n}.png`});await pg.keyboard.press('Escape');await pg.waitForTimeout(400);}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
