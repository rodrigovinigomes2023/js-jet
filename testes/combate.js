// (10/11) tutorial: canhão, míssil, flare e bombardeio (pula as etapas de voo).  node testes/combate.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(1500);
  await pg.evaluate(()=>{JJ.EU.solo=false;JJ.EU.vel=150;JJ.EU.pos.y=900;});await pg.waitForTimeout(300);
  for(let i=0;i<14;i++){if(await pg.evaluate(()=>document.querySelector('#treino b').textContent.includes('Canhão')))break;await pg.click('#tPula').catch(()=>{});await pg.waitForTimeout(250);}
  const passo=()=>pg.evaluate(()=>JJ.TREINO.passo+' '+document.querySelector('#treino b').textContent+' | '+(document.querySelector('#tExtra')?.textContent||'')+' | vida '+JJ.EU.vida+' feed: '+document.querySelector('#feed').innerText.replace(/\n/g,' / '));
  const log=async m=>console.log(m.padEnd(14),await passo());
  await log('pulou p/');
  // persegue o drone: fica 250 m atrás dele, apontado p/ ele
  const atras=(d)=>pg.evaluate((d)=>{const o=[...JJ.OUT.values()].find(o=>o.vivo);if(!o)return;const f=o.vel.clone().normalize();JJ.EU.pos.copy(o.pos).addScaledVector(f,-d);
    JJ.EU.q.setFromUnitVectors(new THREE.Vector3(1,0,0),o.pos.clone().sub(JJ.EU.pos).normalize());JJ.EU.vel=75;},d);
  await pg.keyboard.down('Space');for(let i=0;i<40;i++){await atras(220);await pg.waitForTimeout(100);}await pg.keyboard.up('Space');await log('canhão');
  for(let i=0;i<14;i++){await atras(600);await pg.waitForTimeout(100);}await pg.screenshot({path:__dirname+'/f_trava_treino.png'});
  await pg.keyboard.press('KeyF');for(let i=0;i<30;i++){await atras(600);await pg.waitForTimeout(100);}await log('míssil');
  await pg.evaluate(()=>{JJ.EU.pos.y=1200;JJ.EU.vel=150;});
  for(let i=0;i<40;i++){await pg.waitForTimeout(150);if(await pg.evaluate(()=>document.querySelector('#alerta').style.display==='block'))break;}
  await pg.waitForTimeout(600);await pg.screenshot({path:__dirname+'/f_flare_treino.png'});await pg.keyboard.press('KeyX');await pg.waitForTimeout(800);await log('flare');
  // bombardeio: corrige a posição até o anel CCIP cair no barco, aí solta
  await pg.evaluate(()=>{const B=JJ.TREINO.barcos[0].g.position;JJ.EU.pos.set(B.x-1500,350,B.z);JJ.EU.q.setFromAxisAngle(new THREE.Vector3(0,0,1),-0.12);JJ.EU.vel=150;});await pg.waitForTimeout(2000);
  console.log('ccip visível?',await pg.evaluate(()=>JJ.ccip.visible));await pg.screenshot({path:__dirname+'/f_ccip.png'});
  for(let k=0;k<3;k++){await pg.evaluate(()=>{const B=JJ.TREINO.barcos.find(x=>x.vivo).g.position;JJ.EU.pos.set(B.x-1200,500,B.z);JJ.EU.q.setFromAxisAngle(new THREE.Vector3(0,0,1),-0.12);JJ.EU.vel=150;});
    await pg.waitForTimeout(200);await pg.evaluate(()=>{const B=JJ.TREINO.barcos.find(x=>x.vivo).g.position,d=B.clone().sub(JJ.ccip.position);d.y=0;JJ.EU.pos.add(d);});
    await pg.waitForTimeout(20);await pg.keyboard.press('KeyB');await pg.waitForTimeout(9000);await log('bomba '+(k+1));console.log('  impactos',JSON.stringify(await pg.evaluate(()=>JJ.impactos)),'barcos',JSON.stringify(await pg.evaluate(()=>JJ.TREINO.barcos.map(B=>[Math.round(B.g.position.x),Math.round(B.g.position.z),B.vivo]))));}
  await pg.waitForTimeout(12000);await log('bombas');console.log('  impactos',JSON.stringify(await pg.evaluate(()=>JJ.impactos)));await pg.screenshot({path:__dirname+'/f_bomba_treino.png'});
  await b.close();})();
