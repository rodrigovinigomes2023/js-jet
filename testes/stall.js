// (10/11) leme A/D, freio E e stall.  PORTA=8792 node testes/stall.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(500);await pg.click('#decolar');await pg.waitForTimeout(2500);
  const est=()=>pg.evaluate(()=>{const {EU}=JJ,f=new THREE.Vector3(1,0,0).applyQuaternion(EU.q);return{kmh:Math.round(EU.vel*3.6),y:Math.round(EU.pos.y),rumo:Math.round(Math.atan2(f.z,f.x)*57.3),nariz:Math.round(Math.asin(f.y)*57.3),stall:+(EU.stall||0).toFixed(2),aviso:document.querySelector('#aviso').style.display==='block'?document.querySelector('#aviso').textContent:''};});
  await pg.evaluate(()=>{JJ.EU.pos.y=2500;});
  console.log('início',JSON.stringify(await est()));
  await pg.keyboard.down('KeyD');await pg.waitForTimeout(1500);await pg.keyboard.up('KeyD');console.log('leme D 1,5 s',JSON.stringify(await est()));
  await pg.keyboard.down('KeyA');await pg.waitForTimeout(1500);await pg.keyboard.up('KeyA');console.log('leme A 1,5 s',JSON.stringify(await est()));
  await pg.keyboard.down('KeyE');for(let i=0;i<4;i++){await pg.waitForTimeout(1500);console.log(' freando',JSON.stringify(await est()));}
  await pg.keyboard.down('ArrowDown');await pg.waitForTimeout(2000);console.log('freio + puxando',JSON.stringify(await est()));await pg.screenshot({path:__dirname+'/f_stall.png'});
  await pg.keyboard.up('ArrowDown');await pg.keyboard.up('KeyE');
  for(let i=0;i<4;i++){await pg.waitForTimeout(1500);console.log(' soltou',JSON.stringify(await est()));}
  await b.close();})();
