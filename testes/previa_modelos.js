// (19/11) prévia navios/radares: carrega e fotografa cada um.  node testes/previa_modelos.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:520}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/previa_modelos.html');await pg.waitForTimeout(2500);
  for(const [lin,k,n] of [['lN',3,'nA'],['lN',4,'nB'],['lN',5,'nC'],['lR',3,'rA'],['lR',4,'rB'],['lR',5,'rC']]){await pg.click(`#${lin} button:nth-of-type(${k-1})`);await pg.waitForTimeout(900);await pg.screenshot({path:__dirname+'/f_prev_'+n+'.png'});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
