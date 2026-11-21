// (21/11) rotor de cauda girando de verdade, câmera do jogo bem perto, de lado
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:900,height:600}});pg.setDefaultTimeout(120000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:90000});await pg.click('#bConvidado');await pg.evaluate(()=>document.querySelector('#bHeli').click());
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:90000});await pg.evaluate(()=>document.querySelector('#hmOk').click());await pg.waitForTimeout(1500);
  await pg.evaluate(()=>{HELI.motor=1;HELI.part=true;HELI_ZOOM=0.16;HCAM.az=Math.PI-HELI.yaw-Math.PI/2;HCAM.el=0.26;heliCamAplica();});await pg.waitForTimeout(3000);
  const out=[];for(let i=0;i<6;i++){await pg.evaluate(a=>{JATO.userData.cauda.rotation.z=a;JATO.userData.rotor.rotation.y=a;HELI.pausa=true;},i*0.45);await pg.waitForTimeout(400);await pg.screenshot({path:__dirname+`/f_cauda_j${i}.png`});
    out.push(await pg.evaluate(()=>{const c=JATO.userData.cauda;JATO.updateMatrixWorld(true);const v=new THREE.Vector3();c.children[0].geometry.computeBoundingBox();const bb=c.children[0].geometry.boundingBox;bb.getCenter(v);c.children[0].localToWorld(v);return v.toArray().map(x=>x.toFixed(2)).join(',');}));}
  console.log(out.join('\n'));console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
