// (19/11) altitude mantida: solto segura a altura; E sobe ~13 m/s; contra o morro bate (dano) em vez de subir sozinho
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message+' '+(e.stack||'').split('\n')[1]));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.click('#bHeli');await pg.waitForTimeout(1500);await pg.click('#hmOk');
  const y=()=>pg.evaluate(()=>Math.round(JJ.EU.pos.y));const t=()=>pg.evaluate(()=>performance.now());
  const y0=await y();await pg.waitForTimeout(2000);const y1=await y();
  let t0=await t();await pg.keyboard.down('KeyE');await pg.waitForTimeout(3000);await pg.keyboard.up('KeyE');let t1=await t();const y2=await y();
  console.log(`solto: ${y0} -> ${y1} | E por ${(t1-t0)/1000|0}s (tempo real, jogo lento): -> ${y2}`);
  // achar um morro alto e voar contra ele baixo
  const r=await pg.evaluate(()=>{let best=null;for(let a=0;a<6.28;a+=0.05)for(let d=1500;d<6000;d+=60){const x=Math.cos(a)*d,z=Math.sin(a)*d,h=relevo(x,z);if(h>250&&(!best||h>best.h))best={x,z,h};}
    const dir=new THREE.Vector3(best.x,0,best.z).normalize();JJ.EU.pos.set(best.x-dir.x*500,0,best.z-dir.z*500);JJ.EU.pos.y=Math.max(relevo(JJ.EU.pos.x,JJ.EU.pos.z),0)+40;HELI.vel.set(dir.x*72,0,dir.z*72);HELI.vs=0;EU.vida=100;
    window._dir=dir;window._m=best;return Math.round(best.h);});
  // empurra p/ o morro (seta na direção do morro via vel forçada a cada quadro)
  await pg.evaluate(()=>{const f=()=>{if(!HELI.on)return;HELI.vel.lerp(_dir.clone().multiplyScalar(72),0.2);requestAnimationFrame(f);};f();});
  await pg.waitForTimeout(12000);await pg.screenshot({path:__dirname+'/f_alt_morro.png'});
  console.log(await pg.evaluate(()=>`morro ${Math.round(_m.h)} m | heli y ${Math.round(JJ.EU.pos.y)} chão ${Math.round(relevo(JJ.EU.pos.x,JJ.EU.pos.z))} | vida ${Math.round(EU.vida)} | msg: ${$('#heliMsg').textContent}`));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
