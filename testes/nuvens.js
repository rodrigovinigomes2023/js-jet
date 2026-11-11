// (10/11) nuvens acompanham o horizonte no giro (tunô).  node testes/nuvens.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(2000);
  await pg.evaluate(()=>{JJ.EU.solo=false;JJ.EU.vel=150;JJ.EU.pos.set(0,1300,3000);});await pg.waitForTimeout(500);
  await pg.keyboard.press('KeyV');await pg.waitForTimeout(300);
  await pg.evaluate(()=>{JJ.EU.q.setFromAxisAngle(new THREE.Vector3(1,0,0),0.9);});await pg.waitForTimeout(150);await pg.screenshot({path:__dirname+'/f_nuvens.png'});
  await b.close();})();
