// (11/11) fotos da base 0 (sala sem bots/treino) de vários ângulos.  node testes/base_foto.js [nome]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1280,height:720}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{document.querySelectorAll('.hud,#treinoBox,#tutorial').forEach(e=>e.style&&(e.style.opacity=0));});
  const vistas=[['alto',[-700,520,-500],[0,0,60]],['patio',[120,60,-60],[-100,8,180]],['pista',[620,14,-60],[-200,0,40]]];
  for(const [n,o,a] of vistas){await pg.evaluate(([o,a])=>{const B=JJ.BASES[0],c=Math.cos(B.yaw),s=Math.sin(B.yaw);
      const W=([x,y,z])=>[B.x+x*c+z*s,y+18,B.z-x*s+z*c];window.__camFixa=[W(o),W(a)];},[o,a]);
    await pg.waitForTimeout(700);await pg.screenshot({path:__dirname+'/f_base_'+(process.argv[2]||'agora')+'_'+n+'.png'});}
  console.log('erros:',erros.join(' | ')||'nenhum');await b.close();})();
