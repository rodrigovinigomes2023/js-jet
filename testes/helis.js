// (21/11 ?helis) helis inimigos: patrulha, caça, tiro, flare, queda
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');const SP=__dirname+'/';
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.setDefaultTimeout(150000);const er=[];pg.on('pageerror',e=>er.push(e.message));
  await pg.goto('http://localhost:8791/?helis&fob');await pg.waitForFunction(()=>window.JJ,null,{timeout:150000});await pg.click('#bConvidado');await pg.evaluate(()=>document.querySelector('#bHeli').click());
  await pg.waitForFunction(()=>HELI.brief);await pg.screenshot({path:SP+'f_helis_mapa.png'});await pg.evaluate(()=>heliMapaFecha());await pg.waitForTimeout(800);
  console.log(await pg.evaluate(()=>{const H=HELI.alvos.filter(o=>o.tipo==='heliI');const o=H[0];HELI.motor=1;HELI.part=true;
    EU.pos.copy(o.pos).add(new THREE.Vector3(500,10,0));EU.vida=100;const v0=EU.vida;
    for(let i=0;i<300;i++)heliPasso(1/30);   // 10 s
    return `helis ${H.length} | estado ${o.estado} | dist ${o.pos.distanceTo(EU.pos).toFixed(0)} m | vida do jogador ${v0}→${EU.vida.toFixed(0)}`;}));
  await pg.evaluate(()=>{HELI.pausa=true;window.heliCamera=()=>{};const o=HELI.alvos.find(o=>o.tipo==='heliI');o.g.rotation.set(0,0,0);cam.position.copy(o.pos).add(new THREE.Vector3(0,3,16));cam.lookAt(o.pos.clone().setY(o.pos.y+1.5));});await pg.waitForTimeout(2500);await pg.screenshot({path:SP+'f_helis_perto.png'});await pg.evaluate(()=>{const o=HELI.alvos.find(o=>o.tipo==='heliI');cam.position.copy(o.pos).add(new THREE.Vector3(0.1,18,0));cam.lookAt(o.pos);});await pg.waitForTimeout(1200);await pg.screenshot({path:SP+'f_helis_cima.png'});
  console.log(await pg.evaluate(()=>{HELI.pausa=false;const o=HELI.alvos.find(o=>o.tipo==='heliI');heliDestroi(o);const y0=o.pos.y;for(let i=0;i<400;i++)heliInimigo(o,1/30,performance.now());return `abatido: caiu de ${y0.toFixed(0)} m p/ ${o.pos.y.toFixed(0)} m, fim ${!!o.cai.fim}`;}));
  console.log('erros:',er.join(' | ')||'nenhum');await b.close();})();
