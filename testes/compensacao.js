// (11/11) sem mira assistida: mirar direto no avião que cruza erra; mirar no losango de compensação acerta.  PORTA=8792 node testes/compensacao.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const P=process.env.PORTA||8791,U='http://localhost:'+P;
const ev=e=>fetch(U+'/api/live',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e)}).then(r=>r.json());
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto(U+'/');await pg.waitForTimeout(1500);await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#salaLive');await pg.waitForTimeout(2500);
  async function rodada(nome,modo){await ev({tipo:'comentario',id:nome,nome,texto:'oi'});await pg.waitForTimeout(1200);
    const id=await pg.evaluate(n=>[...JJ.OUT.entries()].find(([i,o])=>o.nome===n)[0],nome);
    const v0=await pg.evaluate(id=>JJ.OUT.get(id).vida,id);await pg.keyboard.down('Space');const t0=Date.now();let fotos=0;
    // começa de lado p/ o alvo (ele cruza na frente), a 600 m; depois o avião voa de verdade e o teste só aponta o nariz
    await pg.evaluate(id=>{const o=JJ.OUT.get(id),{EU}=JJ;EU.solo=false;EU.vel=150;const vv=o.vel.clone().normalize(),lado=new THREE.Vector3(-vv.z,0,vv.x);EU.pos.copy(o.pos).addScaledVector(lado,-600);},id);
    while(Date.now()-t0<5000){await pg.evaluate(([id,modo])=>{const o=JJ.OUT.get(id),{EU}=JJ;if(!o||!o.vivo)return;EU.vida=100;EU.vel=150;
        if(o.pos.distanceTo(EU.pos)<150){const vv=o.vel.clone().normalize(),lado=new THREE.Vector3(-vv.z,0,vv.x);EU.pos.copy(o.pos).addScaledVector(lado,-600);}   // passou do alvo: recomeça
        const L=JJ.lead(),mira=modo==='lead'&&L?L.clone():o.pos.clone();EU.q.setFromUnitVectors(new THREE.Vector3(1,0,0),mira.sub(EU.pos).normalize());},[id,modo]);
      if(!fotos&&Date.now()-t0>1800&&modo==='lead'){fotos=1;await pg.screenshot({path:__dirname+'/f_compensacao.png'});}
      await pg.waitForTimeout(40);}
    await pg.keyboard.up('Space');await pg.waitForTimeout(500);
    console.log(modo==='lead'?'mirando no ◇ (compensação):':'mirando direto no avião:   ','vida',v0,'→',await pg.evaluate(id=>{const o=JJ.OUT.get(id);return o&&o.vivo?o.vida:'DERRUBADO';},id));}
  await rodada('alvo_direto','direto');await rodada('alvo_lead','lead');
  await b.close();})();
