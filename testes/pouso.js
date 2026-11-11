// (10/11) trem de pouso: G baixa/recolhe, pouso na pista, freio até parar, reabastece; e pouso sem trem = acidente.  node testes/pouso.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(2000);
  const st=()=>pg.evaluate(()=>{const E=JJ.EU;return{solo:E.solo,vivo:E.vivo,kmh:Math.round(E.vel*3.6),y:Math.round(E.pos.y),trem:+E.trem.toFixed(2),alvo:E.tremAlvo,acel:+E.acel.toFixed(2),reab:E.reab,hud:document.querySelector('#tAlt').textContent,aviso:document.querySelector('#aviso').style.display==='block'?document.querySelector('#aviso').textContent:'',feed:document.querySelector('#feed').innerText.replace(/\n/g,' / ')};});
  const log=async m=>console.log(m.padEnd(18),JSON.stringify(await st()));
  await log('pista');await pg.keyboard.press('KeyG');await pg.waitForTimeout(200);await log('G no chão (trava)');
  await pg.keyboard.down('ShiftLeft');await pg.keyboard.down('ArrowDown');for(let i=0;i<40;i++){await pg.waitForTimeout(500);if(!(await st()).solo)break;}await pg.keyboard.up('ArrowDown');await pg.keyboard.up('ShiftLeft');await log('decolou');
  await pg.keyboard.press('KeyG');for(let i=0;i<30;i++){await pg.waitForTimeout(500);if((await st()).trem===0)break;}await log('G recolheu');
  await pg.keyboard.down('KeyS');await pg.waitForTimeout(1000);await pg.keyboard.up('KeyS');await log('S manete');
  await pg.keyboard.down('KeyW');await pg.waitForTimeout(1500);await pg.keyboard.up('KeyW');await log('W manete');
  // aproximação: 1,5 km antes da pista da base 0, 60 m acima, nariz -3°, alinhado, trem baixado
  const aprox=(trem)=>pg.evaluate((trem)=>{const B=JJ.BASES[0],E=JJ.EU;E.pos.set(B.x-B.dx*900,18+35,B.z-B.dz*900);
    E.q.setFromAxisAngle(new THREE.Vector3(0,1,0),B.yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),-0.05));E.vel=82;E.acel=0.4;E.trem=E.tremAlvo=trem;E.solo=false;},trem);
  await aprox(1);for(let i=0;i<120;i++){await pg.waitForTimeout(500);const s=await st();if(s.solo||!s.vivo){await log('toque');break;}}
  await pg.screenshot({path:__dirname+'/f_pouso.png'});
  await pg.keyboard.down('KeyE');for(let i=0;i<60;i++){await pg.waitForTimeout(500);const s=await st();if(s.kmh<3)break;}await log('freou');
  await pg.keyboard.up('KeyE');for(let i=0;i<30;i++){await pg.waitForTimeout(500);if((await st()).reab)break;}await log('parado (reabast.)');await pg.screenshot({path:__dirname+'/f_parado.png'});
  // decola de novo da pista (W + turbo)
  await pg.keyboard.down('KeyW');await pg.keyboard.down('ShiftLeft');for(let i=0;i<60;i++){await pg.waitForTimeout(500);if(!(await st()).solo)break;}await pg.keyboard.up('ShiftLeft');await pg.keyboard.up('KeyW');await log('decolou de novo');
  // pouso sem trem
  await aprox(0);for(let i=0;i<120;i++){await pg.waitForTimeout(500);const s=await st();if(s.aviso&&!s.aviso.includes('STALL'))console.log('   aviso:',s.aviso);if(!s.vivo){await log('sem trem');break;}}
  await b.close();})();
