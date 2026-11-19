// (19/11) KC-390 montado: 3 ângulos no visualizador.  node testes/kc390_foto.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:900,height:520}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/previa_modelos.html#kc');await pg.waitForTimeout(3000);await pg.addStyleTag({content:'#ui,#nome,#dica{display:none!important}'});
  for(const [n,p] of [['lado',[0,6,60]],['frente',[45,18,40]],['cima',[2,70,1]]]){await pg.evaluate(p=>{ctl.autoRotate=false;cam.position.set(...p);ctl.target.set(0,12,0);ctl.update();},p);await pg.waitForTimeout(700);await pg.screenshot({path:__dirname+'/f_kc_'+n+'.png'});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
