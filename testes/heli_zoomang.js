// (21/11) ângulo da câmera igual em todo zoom
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});pg.setDefaultTimeout(120000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.evaluate(()=>document.querySelector('#bHeli').click());await pg.waitForTimeout(2000);await pg.evaluate(()=>document.querySelector('#hmOk').click());
  for(const z of[3,1,0.5,0.25,0.16]){await pg.evaluate(z=>{HELI_ZOOM=z;},z);await pg.waitForTimeout(2500);
    console.log('zoom',z,await pg.evaluate(()=>{const d=cam.position.clone().sub(EU.pos);return 'ângulo '+(Math.atan2(d.y,Math.hypot(d.x,d.z))*180/Math.PI).toFixed(1)+'° dist '+d.length().toFixed(0)+' m';}));}
  await pg.screenshot({path:__dirname+'/f_heli_zoomperto.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
