// (19/11) versão publicada: Vercel (site) + Render (servidor). Entra na sala com bots e confere conexão e botão da live escondido.
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});pg.setDefaultTimeout(90000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto(process.argv[2]||'https://js-jet-alpha.vercel.app/',{timeout:120000});await pg.waitForFunction(()=>window.JJ,null,{timeout:120000});
  await pg.waitForTimeout(3000);console.log('status:',await pg.textContent('#servEst'));
  await pg.click('#bConvidado');console.log('live visível:',await pg.isVisible('#salaLive'),'| deathmatch:',await pg.isVisible('#salaPvp'));
  await pg.screenshot({path:__dirname+'/f_pub_menu.png'});
  await pg.click('#decolar');await pg.waitForTimeout(10000);
  console.log('conectado:',await pg.evaluate(()=>typeof conectado!=='undefined'&&conectado),'| sala:',await pg.evaluate(()=>SALA),'| placar:',(await pg.textContent('#placar')).slice(0,120));
  await pg.screenshot({path:__dirname+'/f_pub_jogo.png'});
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
