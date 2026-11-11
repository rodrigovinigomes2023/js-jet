// (10/11) pouso facilitado: anéis verdes + arredondamento automático.  node testes/pouso_facil.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#bTreino');await pg.waitForTimeout(2000);
  const st=()=>pg.evaluate(()=>{const E=JJ.EU;return{solo:E.solo,vivo:E.vivo,kmh:Math.round(E.vel*3.6),y:Math.round(E.pos.y),reab:E.reab,feed:document.querySelector('#feed').innerText.replace(/\n/g,' / ')};});
  const caso=async(nome,dist,alt,nariz,asa,foto)=>{
    await pg.evaluate(([dist,alt,nariz,asa])=>{const B=JJ.BASES[0],E=JJ.EU;E.pos.set(B.x-B.dx*dist,18+alt,B.z-B.dz*dist);
      E.q.setFromAxisAngle(new THREE.Vector3(0,1,0),B.yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),nariz)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),asa));
      E.vel=88;E.acel=1;E.trem=E.tremAlvo=1;E.solo=false;E.vivo=true;},[dist,alt,nariz,asa]);
    if(foto){await pg.waitForTimeout(1500);await pg.screenshot({path:__dirname+'/f_ils.png'});}
    let s;for(let i=0;i<160;i++){await pg.waitForTimeout(500);s=await st();if(s.solo||!s.vivo)break;}
    console.log(nome.padEnd(22),s.vivo?'✅':'💥',JSON.stringify(s));
    for(let i=0;i<120&&s.vivo&&!s.reab;i++){await pg.waitForTimeout(500);s=await st();}if(s.vivo)console.log('   depois',JSON.stringify(s));
    await pg.evaluate(()=>{JJ.EU.solo=false;});await pg.waitForTimeout(4000);};
  await caso('seguindo os anéis',1400,1400*0.07,-0.07,0,true);
  await caso('íngreme e torto',900,140,-0.16,0.25,false);
  await b.close();})();
