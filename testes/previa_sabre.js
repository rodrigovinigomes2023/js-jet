// (19/11) fotos da prévia do AH-2 Sabre de vários ângulos
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
  const pg=await b.newPage({viewport:{width:1000,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error')erros.push(m.text());});
  await pg.goto('http://localhost:8791/previa_sabre.html');await pg.waitForFunction(()=>window.PV,null,{timeout:30000});await pg.waitForTimeout(800);
  const vis=async(n,p,m='sabre',pi='fab',po=false)=>{await pg.evaluate(([p,m,pi,po])=>{PV.set(m,pi,po);PV.cam.position.set(...p);PV.ctl.update();},[p,m,pi,po]);await pg.waitForTimeout(500);await pg.screenshot({path:__dirname+'/f_sabre_'+n+'.png'});};
  await vis('3d34',[20,9,22],'sabre3d');await vis('3dlado',[0,3,30],'sabre3d');await vis('3dtras',[-24,10,-18],'sabre3d');await vis('3dcinza',[18,6,-20],'sabre3d','cinza');await vis('3djogo',[-95,165,95],'sabre3d');await vis('34',[20,9,22]);await vis('lado',[0,3,30]);await vis('frente',[28,5,4]);await vis('tras',[-24,10,-18]);await vis('cima',[0.1,40,0.1]);await vis('porta',[14,6,22],'sabre','cinza',true);
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
