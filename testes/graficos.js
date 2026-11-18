// (11/11) fotos do visual novo (céu, mar, ilhas, nuvens).  node testes/graficos.js [toque]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const toque=process.argv[2]==='toque';
  const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:toque?{width:844,height:390}:{width:1280,height:720},hasTouch:toque,isMobile:toque});
  const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/'+(toque?'?toque':''));await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(2000);
  const poses=[['baixo',[600,180,1800],[0,-0.12,0]],['alto',[0,1500,4200],[0,-0.35,0]],['sol',[2500,600,-1500],[0,0.15,2.2]]];
  for(const [n,p,r] of poses){await pg.evaluate(([p,r])=>{JJ.EU.solo=false;JJ.EU.vel=150;JJ.EU.pos.set(...p);JJ.EU.q.setFromEuler(new THREE.Euler(r[1],r[2],0,'YXZ'));},[p,r]);
    await pg.waitForTimeout(700);await pg.screenshot({path:__dirname+'/f_graf_'+n+(toque?'_t':'')+'.png'});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
