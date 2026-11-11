// (10/11) seta do inimigo: desligada na base, liga dentro da arena, some quando o outro sai/fica calado.  PORTA=8792 node testes/seta.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const URL='http://localhost:'+(process.env.PORTA||8791)+'/';
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const abre=async()=>{const pg=await b.newPage({viewport:{width:1000,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));
    await pg.goto(URL);await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(500);await pg.click('#salaPvp');await pg.waitForTimeout(2500);return pg;};
  const A=await abre(),B=await abre();
  const est=()=>A.evaluate(()=>({seta:document.querySelector('#seta').style.display,outros:[...JJ.OUT.values()].map(o=>o.nome+(o.vivo?'':'(morto)')),x:Math.round(JJ.EU.pos.x),z:Math.round(JJ.EU.pos.z),base:JJ.EU.solo}));
  console.log('A na pista (fora da arena):',JSON.stringify(await est()));
  await A.evaluate(()=>{const {EU}=JJ;EU.solo=false;EU.vel=150;EU.pos.set(2000,800,0);});await A.waitForTimeout(1500);
  console.log('A dentro da arena:',JSON.stringify(await est()));await A.screenshot({path:__dirname+'/f_seta.png'});
  // B fica calado (como celular com tela apagada): servidor tem que tirar em ~10 s
  await B.evaluate(()=>{WebSocket.prototype.send=function(){};});const t0=Date.now();
  let r;for(let i=0;i<20;i++){await A.waitForTimeout(1000);await A.evaluate(()=>{JJ.EU.pos.set(2000,800,0);});r=await est();if(!r.outros.length)break;}
  console.log(`B calado -> sumiu em ${Math.round((Date.now()-t0)/1000)} s:`,JSON.stringify(r));
  const C=await abre();await A.waitForTimeout(1000);console.log('C entrou:',JSON.stringify(await est()));
  await C.close();await A.waitForTimeout(1500);console.log('C fechou a aba:',JSON.stringify(await est()));
  await b.close();})();
