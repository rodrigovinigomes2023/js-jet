// (10/11) placar EU x CHAT: host mata alguém do chat = +1 pra ele; chat mata o host = +1 pro chat.  PORTA=8792 node testes/live_vs.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const P=process.env.PORTA||8791,U='http://localhost:'+P;
const ev=e=>fetch(U+'/api/live',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e)}).then(r=>r.json());
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:800,height:370},hasTouch:true,isMobile:true});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto(U+'/?toque');await pg.waitForTimeout(1500);await pg.tap('#bConvidado');await pg.waitForTimeout(400);await pg.tap('#salaLive');await pg.waitForTimeout(2500);
  await ev({tipo:'zerar'});
  const vs=()=>pg.evaluate(()=>document.querySelector('#vs').innerText.replace(/\n/g,' '));
  console.log('início:',await vs());
  await ev({tipo:'comentario',id:'ana',nome:'ana',texto:'oi'});await pg.waitForTimeout(1500);
  // host mata a ana: manda acertos até ela cair (perto dela, como se estivesse atirando)
  const id=await pg.evaluate(()=>[...JJ.OUT.entries()].find(([i,o])=>o.nome==='ana')[0]);
  for(let i=0;i<20;i++){await pg.evaluate(id=>{const o=JJ.OUT.get(id);JJ.EU.pos.copy(o.pos).y+=60;JJ.EU.vida=100;},id);await pg.waitForTimeout(150);
    await pg.evaluate(id=>JJ.envia({t:'acerto',alvo:id}),id);}
  console.log('ana viva?',await pg.evaluate(id=>JJ.OUT.get(id)?.vivo,id),'eu vivo?',await pg.evaluate(()=>JJ.EU.vivo));
  await pg.waitForTimeout(800);console.log('depois do host atirar:',await vs());
  await ev({tipo:'presente',id:'ana',nome:'ana',presente:'Donut',moedas:30});
  await ev({tipo:'presente',id:'bia',nome:'bia',presente:'Donut',moedas:30});
  let t0=Date.now();while(Date.now()-t0<60000&&await pg.evaluate(()=>JJ.EU.vivo))await pg.waitForTimeout(500);
  await pg.waitForTimeout(600);console.log('depois do chat matar:',await vs());
  await pg.screenshot({path:__dirname+'/f_live_vs.png'});await b.close();})();
