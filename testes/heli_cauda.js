// (21/11) rotor de cauda: fotos de perto girando
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:900,height:600}});pg.setDefaultTimeout(120000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:90000});await pg.click('#bConvidado');await pg.evaluate(()=>document.querySelector('#bHeli').click());
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:90000});await pg.waitForFunction(()=>HELI.brief);await pg.evaluate(()=>heliMapaFecha());await pg.waitForTimeout(1500);
  await pg.evaluate(()=>{HELI.pausa=true;});
  for(const [nome,ang] of [['s0',0],['s1',0.5],['s2',1.0],['s3',1.5],['s4',2.0],['s5',2.5]]){
    const info=await pg.evaluate(a=>{const c=JATO.userData.cauda;c.rotation.z=a;JATO.updateMatrixWorld(true);const p=c.getWorldPosition(new THREE.Vector3());
      const ax=new THREE.Vector3(0,0,1).transformDirection(c.matrixWorld);window.heliCamera=()=>{};
      cam.position.copy(p).addScaledVector(ax,-5);cam.lookAt(p);cam.fov=40;cam.updateProjectionMatrix();return p.toArray().map(x=>x.toFixed(2)).join(',');},ang);
    await pg.screenshot({path:__dirname+`/f_cauda_${nome}.png`});console.log(nome,info);}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
