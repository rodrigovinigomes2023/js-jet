// (10/11) foto do Gripen no jogo (tutorial, offline).  node testes/gripen.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(2000);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(2500);
  console.log('gripen?',await pg.evaluate(()=>!JJ.EU||true));await pg.screenshot({path:__dirname+'/f_gripen_pista.png'});
  await pg.evaluate(()=>{JJ.EU.solo=false;JJ.EU.vel=150;JJ.EU.pos.y=800;});await pg.keyboard.down('ArrowLeft');await pg.waitForTimeout(700);await pg.keyboard.up('ArrowLeft');await pg.waitForTimeout(300);
  await pg.screenshot({path:__dirname+'/f_gripen_voo.png'});
  await pg.keyboard.press('KeyV');await pg.waitForTimeout(800);await pg.screenshot({path:__dirname+'/f_gripen_cab.png'});
  await b.close();})();
