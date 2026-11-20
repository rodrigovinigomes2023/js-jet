// (19/11) escada de corda no resgate + gancho nas caixas
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});pg.setDefaultTimeout(60000);const erros=[];pg.on('pageerror',e=>erros.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.goto('http://localhost:8791/',{timeout:120000});await pg.waitForFunction(()=>window.JJ,null,{timeout:90000});await pg.click('#bConvidado');await pg.click('#bHeli');
  await pg.waitForFunction(()=>window.MI35&&JATO&&!JATO.userData.simples,null,{timeout:60000});await pg.waitForTimeout(600);await pg.click('#hmOk');
  const fixa=(x,y,z)=>pg.evaluate(([x,y,z])=>{JJ.EU.pos.set(x,y,z);HELI.vel.set(0,0,0);HELI.vs=0;EU.vida=1e6;HELI_ZOOM=0.25;HCAM.el=0.25;heliCamAplica();},[x,y,z]);
  const p=await pg.evaluate(()=>{const p=HELI.pilotos[0].p;return[p.x,p.y,p.z];});await fixa(p[0]-1.5,p[1]+18,p[2]);
  await pg.waitForTimeout(1100);await pg.screenshot({path:__dirname+'/f_escada.png'});
  console.log('escada:',await pg.evaluate(()=>({L:HELI.escL.toFixed(2),vis:HELI.esc.visible,sobe:(HELI.pilotos[0].sobe||0).toFixed(2),t:HELI.tGuincho.toFixed(2)})));
  for(let i=0;i<6;i++){await pg.waitForTimeout(1500);console.log(await pg.evaluate(()=>{const p=HELI.pilotos[0];return 't '+HELI.tGuincho.toFixed(2)+' sobe '+(p.sobe||0).toFixed(2)+' dh '+Math.hypot(p.p.x-EU.pos.x,p.p.z-EU.pos.z).toFixed(1)+' agl '+(EU.pos.y-p.p.y).toFixed(1)+' bordo '+HELI.bordo;}));if(i==1)await pg.screenshot({path:__dirname+'/f_escada2.png'});}
  console.log('a bordo:',await pg.evaluate(()=>HELI.bordo));
  const c=await pg.evaluate(()=>{const c=HELI.caixas[0].p;return[c.x,c.y,c.z];});await fixa(c[0],c[1]+16,c[2]);
  await pg.waitForTimeout(800);await pg.screenshot({path:__dirname+'/f_gancho.png'});
  console.log('gancho:',await pg.evaluate(()=>({L:HELI.ganL.toFixed(2),vis:HELI.gan.visible,t:HELI.tGancho.toFixed(2)})));
  for(let i=0;i<4;i++){await pg.waitForTimeout(1200);console.log(await pg.evaluate(()=>'t '+HELI.tGancho.toFixed(2)+' ok '+HELI.caixas[0].ok));if(i==0)await pg.screenshot({path:__dirname+'/f_gancho2.png'});}
  console.log('caixa pega:',await pg.evaluate(()=>HELI.caixas[0].ok));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
