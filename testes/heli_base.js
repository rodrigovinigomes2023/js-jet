// (19/11) heli reabastece em qualquer base (não só a de origem)
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(2000);await pg.click('#hmOk');
  await pg.evaluate(()=>{const B=JJ.BASES[6];JJ.EU.pos.set(B.x+50,BASE_H+30,B.z);HELI.comb=20;EU.vida=40;MUN=2;});await pg.waitForTimeout(6000);
  console.log(await pg.evaluate(()=>`comb ${Math.round(HELI.comb)} vida ${Math.round(EU.vida)} mun ${MUN} msg ${$('#heliMsg').textContent}`));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
