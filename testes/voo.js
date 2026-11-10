// teste headless: decola, voa atirando e tira fotos.  node testes/voo.js [toque]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const toque=process.argv[2]==='toque';
  const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:toque?{width:844,height:390}:{width:1280,height:720},hasTouch:toque,isMobile:toque});
  const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  await pg.goto('http://localhost:8791/'+(toque?'?toque':''));await pg.waitForTimeout(2500);
  await pg.screenshot({path:__dirname+'/f_menu'+(toque?'_t':'')+'.png'});
  await pg.fill('#nome','Gomes');await pg.click('#decolar');await pg.waitForTimeout(3000);
  await pg.keyboard.down('Space');await pg.keyboard.down('KeyD');await pg.waitForTimeout(700);await pg.keyboard.up('KeyD');
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(900);await pg.keyboard.up('KeyW');
  await pg.screenshot({path:__dirname+'/f_voo1'+(toque?'_t':'')+'.png'});
  await pg.waitForTimeout(4000);await pg.keyboard.up('Space');
  await pg.screenshot({path:__dirname+'/f_voo2'+(toque?'_t':'')+'.png'});
  console.log("erros-cedo:",erros.join(" | "));
  const est=await pg.evaluate(()=>{const {EU,OUT}=window.JJ;return{id:EU.id,vivo:EU.vivo,vida:EU.vida,y:Math.round(EU.pos.y),outros:[...OUT.values()].map(o=>o.nome+(o.vivo?'':'✝')),placar:document.querySelector("#placar").innerText};});
  console.log(JSON.stringify(est));console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
