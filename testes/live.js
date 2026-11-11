// (10/11) sala da LIVE: chat vira avião, presentes, times.  PORTA=8792 node testes/live.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const P=process.env.PORTA||8791,U='http://localhost:'+P;
const ev=e=>fetch(U+'/api/live',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(e)}).then(r=>r.json());
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:800,height:370},hasTouch:true,isMobile:true});pg.on('pageerror',e=>console.log('ERRO',e.message));
  await pg.goto(U+'/?toque');await pg.waitForTimeout(1500);await pg.tap('#bConvidado');await pg.waitForTimeout(400);await pg.tap('#salaLive');await pg.waitForTimeout(2500);
  console.log('sala',await pg.evaluate(()=>[JJ.EU.id,document.body.className]));
  for(const n of ['ana.flor','zé_da_lancha','bia_surf','kaique77'])console.log('comenta',n,JSON.stringify(await ev({tipo:'comentario',id:n,nome:n,texto:'bora'})));
  await ev({tipo:'comentario',id:'gabi',nome:'gabi',texto:'!time azul'});
  await pg.waitForTimeout(1500);
  const outs=()=>pg.evaluate(()=>[...JJ.OUT.values()].map(o=>`${o.nome}${o.aliado?'(ALIADO)':''}${o.esc>1?'(x'+o.esc+')':''} vida ${o.vida}`));
  console.log('aviões:',await outs());
  await pg.screenshot({path:__dirname+'/f_live1.png'});
  console.log('mun antes',await pg.evaluate(()=>window.MUN??'?'));
  await ev({tipo:'presente',id:'gabi',nome:'gabi',presente:'Donut',moedas:30});
  await ev({tipo:'presente',id:'ana.flor',nome:'ana.flor',presente:'Galáxia',moedas:1000});
  await ev({tipo:'seguir',id:'bia_surf',nome:'bia_surf'});
  await pg.waitForTimeout(400);
  console.log('alertas:',await pg.evaluate(()=>[...document.querySelectorAll('#liveA .la')].map(d=>d.textContent)));
  await pg.screenshot({path:__dirname+'/f_live2.png'});
  console.log('hud mísseis',await pg.locator('#bMissil').textContent());
  await pg.waitForTimeout(1200);console.log('aviões:',await outs());
  console.log('curtidas',JSON.stringify(await ev({tipo:'curtida',id:'x',nome:'x',n:500})));
  await ev({tipo:'presente',id:'kaique77',nome:'kaique77',presente:'Donut',moedas:30});   // salva de mísseis no host
  await pg.waitForTimeout(2500);
  console.log('mísseis no ar:',await pg.evaluate(()=>[...(JJ.MISV?.values?.()||[])].length));
  // deixa a briga rolar e vê se o host morre e o pódio aparece
  let t0=Date.now(),morreu=false;while(Date.now()-t0<90000){await pg.waitForTimeout(1000);
    const s=await pg.evaluate(()=>[JJ.EU.vivo,Math.round(JJ.EU.vida),document.querySelector('#morte').innerText]);if(!s[0]){morreu=true;console.log('morte:',s[2].replace(/\n/g,' | '));break;}}
  if(!morreu)console.log('host sobreviveu 90 s, vida',await pg.evaluate(()=>JJ.EU.vida));
  console.log('EU x CHAT:',await pg.evaluate(()=>document.querySelector('#vs').innerText.replace(/\n/g,' ')));
  console.log('placar:',await pg.evaluate(()=>document.querySelector('#placar').innerText.replace(/\n/g,' | ')));
  await pg.screenshot({path:__dirname+'/f_live3.png'});await b.close();})();
