// (10/11) navios do chat: metralhadora só até 900 m; de cima dá p/ bombardear.  PORTA=8792 node testes/live_navio.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const P=process.env.PORTA||8791,U='http://localhost:'+P;
const ev=e=>fetch(U+'/api/live',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e)}).then(r=>r.json());
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto(U+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#salaLive');await pg.waitForTimeout(2500);
  await ev({tipo:'zerar'});console.log('presente:',JSON.stringify(await ev({tipo:'presente',id:'rafa',nome:'rafa',presente:'Corgi',moedas:299})));
  await pg.waitForTimeout(1500);
  const navios=()=>pg.evaluate(()=>[...JJ.OUT.entries()].filter(([i,o])=>o.navio&&o.vivo).map(([i,o])=>({id:i,nome:o.nome,x:Math.round(o.pos.x),y:Math.round(o.pos.y),z:Math.round(o.pos.z)})));
  const N=await navios();console.log('navios:',JSON.stringify(N));
  const id=N[0].id;
  // perto do navio a 300 m de altura (dentro do alcance): tem que levar tiro
  async function pairar(alt,lado,seg){await pg.evaluate(()=>{JJ.EU.vida=100;});let v0=null;const t0=Date.now();
    while(Date.now()-t0<seg*1000){await pg.evaluate(([id,alt,lado])=>{const o=JJ.OUT.get(id),{EU}=JJ;EU.solo=false;EU.vel=150;EU.pos.set(o.pos.x+lado,alt,o.pos.z);},[id,alt,lado]);await pg.waitForTimeout(100);}
    return pg.evaluate(()=>Math.round(JJ.EU.vida));}
  console.log('a 300 m de altura, 200 m de lado, 8 s → vida',await pairar(300,200,8));
  console.log('a 1100 m de altura, em cima, 8 s → vida',await pairar(1100,0,8));
  await pg.screenshot({path:__dirname+'/f_navio_cima.png'});
  // bombardeio de 1000 m: alinha o CCIP no navio (com a dianteira do movimento dele) e solta
  for(let k=0;k<4&&await pg.evaluate(id=>JJ.OUT.get(id)?.vivo,id);k++){
    await pg.evaluate(id=>{const o=JJ.OUT.get(id),{EU}=JJ;EU.solo=false;EU.vel=150;EU.vida=100;EU.pos.set(o.pos.x-1500,1000,o.pos.z);EU.q.setFromAxisAngle(new THREE.Vector3(0,0,1),-0.15);},id);
    await pg.waitForTimeout(250);
    const ok=await pg.evaluate(id=>{const o=JJ.OUT.get(id);if(!JJ.ccip.visible)return false;const alvo=o.pos.clone().addScaledVector(o.vel,12);const d=alvo.sub(JJ.ccip.position);d.y=0;JJ.EU.pos.add(d);return Math.round(d.length());},id);
    await pg.waitForTimeout(20);await pg.keyboard.press('KeyB');console.log('bomba',k+1,'ccip ajustado',ok);
    await pg.waitForTimeout(14000);console.log('  navio vida',await pg.evaluate(id=>JJ.OUT.get(id)?.vivo?JJ.OUT.get(id).vida:'AFUNDOU',id));}
  console.log('EU x CHAT:',await pg.evaluate(()=>document.querySelector('#vs').innerText.replace(/\n/g,' ')));
  await pg.screenshot({path:__dirname+'/f_navio.png'});await b.close();})();
