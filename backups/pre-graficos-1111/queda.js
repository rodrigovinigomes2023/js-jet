// (11/11) abatido: carcaça cai pegando fogo, piloto ejeta e abre paraquedas, espirro/explosão no chão; rastro nas asas em curva.  PORTA=8792 node testes/queda.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const P=process.env.PORTA||8791,U='http://localhost:'+P;
const ev=e=>fetch(U+'/api/live',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e)}).then(r=>r.json());
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});let NERR=0;pg.on('pageerror',e=>{if(NERR++<1)console.log('ERRO',e.message,e.stack.split('\n').slice(0,5).join(' / '));});
  await pg.goto(U+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#salaLive');await pg.waitForTimeout(2500);
  // rastro: puxa o manche em alta velocidade
  await pg.evaluate(()=>{JJ.EU.vel=230;JJ.EU.pos.y=1200;});await pg.keyboard.down('ShiftLeft');await pg.keyboard.down('ArrowDown');await pg.waitForTimeout(1500);
  await pg.screenshot({path:__dirname+'/f_rastro.png'});await pg.keyboard.up('ArrowDown');await pg.keyboard.up('ShiftLeft');
  console.log('rastro visível:',await pg.evaluate(()=>JJ.efeitos().trilhaVis));
  // abate de um avião do chat na frente do host
  await ev({tipo:'comentario',id:'vitima',nome:'vitima',texto:'oi'});await pg.waitForTimeout(1500);
  const id=await pg.evaluate(()=>[...JJ.OUT.entries()].find(([i,o])=>o.nome==='vitima')[0]);
  await pg.evaluate(id=>{const o=JJ.OUT.get(id),{EU}=JJ;EU.pos.copy(o.pos).addScaledVector(o.vel.clone().normalize(),-250).y+=40;EU.q.setFromUnitVectors(new THREE.Vector3(1,0,0),o.pos.clone().sub(EU.pos).normalize());EU.vel=o.vel.length();},id);
  for(let i=0;i<40&&await pg.evaluate(id=>JJ.OUT.get(id)?.vivo,id);i++){await pg.evaluate(id=>{const o=JJ.OUT.get(id);JJ.envia({t:'acerto',alvo:id});JJ.EU.pos.copy(o.pos).addScaledVector(o.vel.clone().normalize(),-250).y+=40;},id);await pg.waitForTimeout(120);}
  await pg.waitForTimeout(200);
  for(let k=0;k<12;k++){const e=await pg.evaluate(()=>{const E=JJ.efeitos();return{destrocos:E.destrocos,pilotos:E.pilotos,para:E.para,fumos:E.fumos};});console.log('t',k*4,'s',JSON.stringify(e));
    if(k===1)await pg.screenshot({path:__dirname+'/f_queda.png'});if(k===2)await pg.screenshot({path:__dirname+'/f_queda2.png'});if(!e.destrocos.length&&k>2){await pg.screenshot({path:__dirname+'/f_queda_fim.png'});break;}await pg.waitForTimeout(4000);}
  await b.close();})();
