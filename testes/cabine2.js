// (11/11) foto da cabine (V) no treino, voo reto.  node testes/cabine2.js [nome]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1280,height:720}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(2000);
  await pg.evaluate(()=>{JJ.EU.solo=false;JJ.EU.vel=150;JJ.EU.pos.set(0,500,6000);JJ.EU.q.set(0,0,0,1);});await pg.waitForTimeout(300);
  await pg.keyboard.press('KeyV');await pg.waitForTimeout(800);await pg.screenshot({path:__dirname+'/f_cab_'+(process.argv[2]||'agora')+'.png'});
  console.log('erros:',erros.join(' | ')||'nenhum');await b.close();})();
