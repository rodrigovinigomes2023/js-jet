// (10/11) live: balão de comentário + avatar, close no matador com foto/nome/contagem.  PORTA=8792 node testes/live_close.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const P=process.env.PORTA||8791,U='http://localhost:'+P;
const ev=e=>fetch(U+'/api/live',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e)}).then(r=>r.json());
// avatar de teste: imagem servida pelo próprio jogo não serve (precisa https) — usa sem foto (inicial) e um com URL https falsa
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:800,height:370},hasTouch:true,isMobile:true});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto(U+'/?toque');await pg.waitForTimeout(1500);await pg.tap('#bConvidado');await pg.waitForTimeout(400);await pg.tap('#salaLive');await pg.waitForTimeout(2500);
  await ev({tipo:'zerar'});
  await ev({tipo:'comentario',id:'mari',nome:'mari_campeche',texto:'oi'});await pg.waitForTimeout(1200);
  // põe o avião da mari na frente do host e ela comenta: balão tem que aparecer em cima dele
  await pg.evaluate(()=>{const o=[...JJ.OUT.values()].find(o=>o.nome==='mari_campeche');const {EU}=JJ;EU.solo=false;EU.vel=118;
    const f=new THREE.Vector3(1,0,0).applyQuaternion(EU.q);EU.pos.copy(o.pos).addScaledVector(o.vel.clone().normalize(),-180).setY(o.pos.y+15);EU.q.setFromUnitVectors(new THREE.Vector3(1,0,0),o.vel.clone().normalize());});
  await ev({tipo:'comentario',id:'mari',nome:'mari_campeche',texto:'vou te derrubar 😈'});
  await pg.waitForTimeout(500);
  console.log('balão:',await pg.evaluate(()=>[...document.querySelectorAll('.rot .bal')].map(b=>b.style.display+' '+b.textContent)));
  console.log('linha do chat:',await pg.evaluate(()=>document.querySelector('#liveA .la.fala')?.innerText));
  await pg.screenshot({path:__dirname+'/f_live_balao.png'});
  // a mari manda donut (mísseis) até derrubar o host
  let t0=Date.now(),tp=0;while(Date.now()-t0<60000&&await pg.evaluate(()=>JJ.EU.vivo)){if(Date.now()-tp>4000){tp=Date.now();ev({tipo:'presente',id:'mari',nome:'mari_campeche',presente:'Donut',moedas:30});}await pg.waitForTimeout(150);}
  await pg.waitForTimeout(700);
  console.log('cartão:',await pg.evaluate(()=>document.querySelector('#morte').innerText.replace(/\n/g,' | ')));
  await pg.screenshot({path:__dirname+'/f_live_close.png'});
  await pg.waitForTimeout(900);await pg.screenshot({path:__dirname+'/f_live_close2.png'});
  console.log('câmera em http:',await pg.evaluate(()=>{document.querySelector('#bCam').click();return new Promise(r=>setTimeout(()=>r(document.querySelector('#liveA').innerText.split('\n')[0]),300));}));
  await b.close();})();
