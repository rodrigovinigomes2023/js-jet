// (11/11) pele do Gripen (painéis/rebites/sujeira): fotos de perto.  node testes/pele.js [pele=metal|camo=0]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:650}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/?foto'+(process.argv[2]?'&'+process.argv[2]:''));await pg.waitForTimeout(2500);await pg.evaluate(()=>{document.querySelector('#menu').style.display='none';});
  for(const [nome,cx,cy,cz] of [['cima',-3,9,7],['lado',3,1,11]]){
    await pg.evaluate(([cx,cy,cz])=>{window.__foto=[cx,cy,cz];},[cx,cy,cz]);await pg.waitForTimeout(600);await pg.screenshot({path:__dirname+'/f_pele_'+(process.argv[2]||'real').replace(/[=&]/g,'')+'_'+nome+'.png'});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
