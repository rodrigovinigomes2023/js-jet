// (19/11) missão 4: o radar aparece vivo? encosta o caça a 500 m dele, olhando p/ ele.  node testes/radar_modelo.js (servidor 8791)
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});
  await pg.click('#bConvidado');await pg.click('#bMissoes');await pg.waitForTimeout(400);await pg.click('#mGrade .mc[data-n="4"]');await pg.click('#mVai');await pg.waitForTimeout(5000);
  const r=await pg.evaluate(()=>{const o=[...JJ.OUT.values()].find(o=>o.nome.includes('Radar'));return {vis:o.g.visible,naCena:!!o.g.parent,y:Math.round(o.pos.y)};});console.log('radar:',JSON.stringify(r));
  for(let i=0;i<12;i++){await pg.evaluate(()=>{const o=[...JJ.OUT.values()].find(o=>o.nome.includes('Radar'));const p=o.pos.clone().add(new THREE.Vector3(-420,90,-120));
    JJ.EU.pos.copy(p);JJ.EU.q.setFromUnitVectors(new THREE.Vector3(1,0,0),o.pos.clone().add(new THREE.Vector3(0,20,0)).sub(p).normalize());JJ.EU.vel=60;JJ.EU.vida=100;});await pg.waitForTimeout(150);}
  await pg.screenshot({path:__dirname+'/f_radar_modelo.png'});console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
