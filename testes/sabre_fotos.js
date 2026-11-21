// (21/11) fotos fixas do Sabre (lado, cima-trás, detalhe) — uso: node sabre_fotos.js prefixo
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');const PFX=process.argv[2]||'sab';
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:640}});pg.setDefaultTimeout(120000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:90000});await pg.click('#bConvidado');await pg.evaluate(()=>document.querySelector('#bHeli').click());
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:90000});await pg.waitForFunction(()=>HELI.brief);await pg.evaluate(()=>heliMapaFecha());await pg.waitForTimeout(1500);
  await pg.evaluate(()=>{HELI.pausa=true;window.heliCamera=()=>{};document.querySelectorAll('#hud,.hud,#heliRadio,#painelMis,#radar').forEach(e=>e.style.visibility='hidden');});
  const vistas=process.argv[3]?JSON.parse(process.argv[3]):{lado:[[-3,3,-14],[-3,2.5,0]],tras:[[-16,7,-6],[-4,2.5,0]],cima:[[-2,12,-6],[-2,2.5,0]],exaust:[[-1,5.5,-6],[-1,3,0]],cauda:[[-10,5,-6],[-12.2,4.2,0]],escudo:[[-4,2.6,-7],[-4,2.6,0]],ladoD:[[-3,3,14],[-3,2.5,0]]};
  for(const [n,[c,a]] of Object.entries(vistas)){await pg.evaluate(([c,a])=>{const m=JATO.matrixWorld;cam.position.copy(new THREE.Vector3(...c).multiplyScalar(0.89).applyMatrix4(m.clone().scale(new THREE.Vector3(1/0.89,1/0.89,1/0.89))));
      cam.position.copy(JATO.localToWorld(new THREE.Vector3(...c)));cam.lookAt(JATO.localToWorld(new THREE.Vector3(...a)));cam.fov=40;cam.updateProjectionMatrix();},[c,a]);
    await pg.waitForTimeout(500);await pg.screenshot({path:__dirname+`/f_${PFX}_${n}.png`});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
