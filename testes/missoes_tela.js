// (20/11) tela de missões nova: foto no PC e no celular
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});const erros=[];
  for(const [n,w,h,m] of [['pc',1280,800,false],['cel',412,915,true]]){const pg=await b.newPage({viewport:{width:w,height:h},isMobile:m,hasTouch:m});pg.setDefaultTimeout(60000);pg.on('pageerror',e=>erros.push(e.message));
    await pg.goto('http://localhost:8791/',{timeout:120000});await pg.waitForFunction(()=>window.JJ,null,{timeout:90000});await pg.click('#bConvidado');await pg.click('#bMissoes');await pg.waitForTimeout(1500);
    if(!m)await pg.hover('#mGrade .mc[data-n="3"]');await pg.waitForTimeout(400);await pg.screenshot({path:__dirname+'/f_mis_'+n+'.png',fullPage:true});await pg.close();}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
