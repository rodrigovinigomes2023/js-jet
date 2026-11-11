// (10/11) leme do celular (barra à direita).  PORTA=8792 node testes/leme.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:800,height:370},hasTouch:true,isMobile:true});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto('http://localhost:'+(process.env.PORTA||8791)+'/?toque');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(500);await pg.click('#decolar');await pg.waitForTimeout(2500);
  await pg.evaluate(()=>{JJ.EU.pos.y=2500;});
  const rumo=()=>pg.evaluate(()=>{const f=new THREE.Vector3(1,0,0).applyQuaternion(JJ.EU.q);return Math.round(Math.atan2(f.z,f.x)*57.3);});
  const bx=await pg.locator('#leme').boundingBox();console.log('barra',JSON.stringify(bx));
  const r0=await rumo();await pg.mouse.move(bx.x+bx.width/2,bx.y+bx.height/2);await pg.mouse.down();await pg.mouse.move(bx.x+bx.width-5,bx.y+bx.height/2,{steps:4});
  await pg.waitForTimeout(300);await pg.screenshot({path:__dirname+'/f_leme.png'});await pg.waitForTimeout(1200);await pg.mouse.up();
  console.log('direita 1,5 s: rumo',r0,'->',await rumo(),' leme solto volta a 0?',await pg.evaluate(()=>document.querySelector('#lemeK').style.transform||'centro'));
  await b.close();})();
