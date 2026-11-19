// (19/11) câmera trava atrás do nariz ao andar p/ frente (W): gira a câmera, segura W e D -> az segue PI-yaw
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(1500);await pg.click('#hmOk');
  const st=()=>pg.evaluate(()=>{const d=((Math.PI-HELI.yaw-HCAM.az+Math.PI*3)%(Math.PI*2))-Math.PI;return `diferença câmera x nariz ${Math.round(Math.abs(d)*57.3)}°`;});
  await pg.evaluate(()=>{HCAM.az+=2;heliCamAplica();});console.log('girada:',await st());
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(9000);console.log('W 9s:',await st());
  await pg.keyboard.down('KeyD');await pg.waitForTimeout(6000);console.log('W+D 6s:',await st());await pg.keyboard.up('KeyD');await pg.keyboard.up('KeyW');
  await pg.screenshot({path:__dirname+'/f_camsegue.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
