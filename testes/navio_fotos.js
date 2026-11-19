// (19/11) fotos do modelo do navio (missão 6): lado, frente e de cima.  node testes/navio_fotos.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});
  await pg.click('#bConvidado');await pg.click('#bMissoes');await pg.waitForTimeout(400);await pg.click('#mGrade .mc[data-n="6"]');await pg.click('#mVai');await pg.waitForTimeout(5000);
  for(const [nome,off] of [['lado',[0,25,1]],['frente',[1,18,0.15]],['cima',[0.2,120,0.2]],['tras',[-1,22,0.3]]]){
    for(let i=0;i<14;i++){await pg.evaluate(([off])=>{const o=[...JJ.OUT.values()].find(o=>o.navio&&o.vivo);const f=new THREE.Vector3(1,0,0).applyQuaternion(o.q);const s=new THREE.Vector3(-f.z,0,f.x);
      const d=off[1]>100?60:150,p=o.pos.clone().addScaledVector(f,off[0]*d).addScaledVector(s,off[2]*d).setY(off[1]);
      window.__camFixa=[[p.x,p.y,p.z],[o.pos.x,8,o.pos.z]];JJ.EU.pos.set(o.pos.x,3000,o.pos.z);JJ.EU.vida=100;},[off]);await pg.waitForTimeout(120);}
    await pg.screenshot({path:__dirname+'/f_navio_'+nome+'.png'});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
