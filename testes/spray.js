// (18/11) teste do spray d'água no rasante: põe o caça a 12 m sobre o mar e fotografa sem e com afterburner.  node testes/spray.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');await pg.waitForTimeout(3000);
  const poe=()=>pg.evaluate(()=>{const E=JJ.EU;E.solo=false;E.trem=E.tremAlvo=0;E.pos.set(3000,12,-2500);E.q.setFromAxisAngle(new THREE.Vector3(0,1,0),0.3);E.vel=190;E.acel=1;});
  await poe();await pg.waitForTimeout(2200);await pg.screenshot({path:__dirname+"/f_spray.png"});
  await poe();await pg.keyboard.down('ShiftLeft');await pg.waitForTimeout(1600);await pg.screenshot({path:__dirname+'/f_spray_ab.png'});
  await pg.evaluate(()=>{const f=()=>{const E=JJ.EU,fw=new THREE.Vector3(1,0,0).applyQuaternion(E.q);window.__camFixa=[[E.pos.x-fw.z*70-fw.x*10,E.pos.y+12,E.pos.z+fw.x*70-fw.z*10],[E.pos.x-fw.x*25,E.pos.y+2,E.pos.z-fw.z*25]];requestAnimationFrame(f);};f();});
  await pg.waitForTimeout(1500);await pg.screenshot({path:__dirname+'/f_spray_lado.png'});await pg.keyboard.up('ShiftLeft');
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
