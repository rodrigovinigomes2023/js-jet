// (10/11) botão 🛞 no celular (toque de verdade).  node testes/trem_toque.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:800,height:370},hasTouch:true,isMobile:true});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/?toque');await pg.waitForTimeout(1500);await pg.tap('#bConvidado');await pg.waitForTimeout(400);await pg.tap('#bTreino');await pg.waitForTimeout(2000);
  await pg.evaluate(()=>{JJ.EU.solo=false;JJ.EU.vel=150;JJ.EU.pos.y=800;});await pg.waitForTimeout(300);
  const bx=await pg.locator('#bTrem').boundingBox();console.log('botão',JSON.stringify(bx));
  for(let i=0;i<2;i++){await pg.tap('#bTrem');await pg.waitForTimeout(400);console.log('toque',i+1,'-> trem alvo',await pg.evaluate(()=>JJ.EU.tremAlvo),await pg.locator('#bTrem').textContent());}
  await pg.screenshot({path:__dirname+'/f_trem_toque.png'});await b.close();})();
