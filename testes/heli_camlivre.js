// (19/11) câmera livre do heli: arrastar gira/inclina, W segue a tela, 🎥 volta ao padrão
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  const f=n=>pg.screenshot({path:__dirname+'/f_cl_'+n+'.png'});
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(2000);await pg.click('#hmOk');
  await pg.mouse.move(800,300);await pg.mouse.down();for(let i=1;i<=10;i++){await pg.mouse.move(800+i*25,300+i*8);await pg.waitForTimeout(40);}await pg.mouse.up();await pg.waitForTimeout(2500);await f('girada');
  const a=await pg.evaluate(()=>({az:HCAM.az.toFixed(2),el:HCAM.el.toFixed(2),p0:JJ.EU.pos.toArray().map(Math.round)}));
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(3000);await pg.keyboard.up('KeyW');
  const d=await pg.evaluate(p0=>{const p=JJ.EU.pos,v=[p.x-p0[0],p.z-p0[2]],n=Math.hypot(...v);return{mov:[v[0]/n,v[1]/n].map(x=>x.toFixed(2)),fw:[_hF.x.toFixed(2),_hF.z.toFixed(2)]};},a.p0);
  await pg.click('#bCamPadrao');const z=await pg.evaluate(()=>HCAM.az.toFixed(2));
  console.log(JSON.stringify({a,d,padrao:z}));console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
