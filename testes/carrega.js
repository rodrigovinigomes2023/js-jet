// (19/11) só abre o jogo e vê se dá erro no carregamento.  node testes/carrega.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:900,height:500}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000}).catch(()=>erros.push('JJ não apareceu'));
  console.log('bases c/ estação:',await pg.evaluate(()=>JJ.BASES.map(B=>B.lanc.length).join(',')).catch(e=>'?'));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
