// (19/11) close do militar acenando (helicóptero escondido p/ a foto)
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:30000});await pg.click('#hmOk');
  await pg.evaluate(()=>{const p=HELI.pilotos[1].p;JJ.EU.pos.set(p.x+60,p.y+60,p.z-60);HELI.agl=60;HELI_ZOOM=0.06;EU.vida=1e6;HCAM.el=0.55;heliCamAplica();});await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{const P=HELI.pilotos[1];window.heliCamera=()=>{const p=P.p;cam.position.set(p.x+9,p.y+6,p.z+9);cam.lookAt(p.x,p.y+1.2,p.z);cam.updateMatrixWorld();};JJ.EU.pos.set(P.p.x+25,P.p.y+20,P.p.z-15);});
  for(let i=0;i<3;i++){await pg.evaluate(()=>{});await pg.waitForTimeout(600);await pg.screenshot({path:__dirname+'/f_mil_'+i+'.png'});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
