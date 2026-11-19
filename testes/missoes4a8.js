// (19/11) missões 4–8: entra em cada uma, confere objetos/objetivo/rádio, foto; vence a 4, 6, 7 e 8 "na marra" (acertos).  PORTA=8795 node testes/missoes4a8.js [n...]
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const LISTA=process.argv.slice(2).map(Number);const NS=LISTA.length?LISTA:[4,5,6,7,8];
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];let msgs=[];pg.on('pageerror',e=>erros.push(e.message));
  pg.on('websocket',w=>w.on('framereceived',f=>{try{const d=JSON.parse(f.payload);if(d.t==='radio')msgs.push(d.quem+': '+d.txt);if(d.t==='obj')msgs.obj=d.txt;if(d.t==='fim')msgs.push('FIM ok='+d.ok+' '+d.estrelas+'★ '+(d.motivo||'')+' '+JSON.stringify(d.crit));if(d.t==='missil')msgs.push('MÍSSIL de '+d.dono);}catch(e){}}));
  await pg.goto('http://localhost:'+(process.env.PORTA||8795)+'/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});
  await pg.click('#bConvidado');await pg.click('#bMissoes');await pg.waitForTimeout(400);
  console.log('liberadas:',await pg.$$eval('#mGrade .mc:not([disabled])',l=>l.map(x=>x.dataset.n).join(',')));await pg.screenshot({path:__dirname+'/f_mis_todas.png'});
  for(const n of NS){msgs=[];if(!(await pg.isVisible('#missoes'))){await pg.evaluate(()=>JJ.abreMissoes());await pg.waitForTimeout(400);}
    await pg.click(`#mGrade .mc[data-n="${n}"]`);await pg.click('#mVai');await pg.waitForTimeout(6000);
    const est=()=>pg.evaluate(()=>[...JJ.OUT.values()].map(o=>`${o.nome}${o.vivo?'':'✝'}@${Math.round(o.pos.y)}`).join(' | '));
    console.log(`\n=== missão ${n}: ${await est()}\n    obj: ${msgs.obj}`);await pg.screenshot({path:__dirname+`/f_m${n}_voo.png`});
    if(n===4){await pg.evaluate(()=>{const r=[...JJ.OUT.values()].find(o=>o.nome.includes('Radar'));JJ.EU.pos.set(r.pos.x+800,r.pos.y+700,r.pos.z);JJ.EU.vida=100;});await pg.waitForTimeout(6000);
      await pg.evaluate(()=>{const r=[...JJ.OUT.values()].find(o=>o.nome.includes('Radar'));window.__camFixa=[[r.pos.x+260,Math.max(r.pos.y+160,relevo(r.pos.x+260,r.pos.z+260)+80),r.pos.z+260],[r.pos.x,r.pos.y+20,r.pos.z]];});await pg.waitForTimeout(1500);
      await pg.screenshot({path:__dirname+'/f_m4_radar.png'});await pg.evaluate(()=>{window.__camFixa=null;});}
    if(n===5){await pg.waitForTimeout(3000);console.log('    obj depois:',msgs.obj);}
    if(n!==5){for(let k=0;k<60;k++){const r=await pg.evaluate(()=>{const o=[...JJ.OUT.entries()].find(([i,o])=>o.vivo&&!o.aliado&&!o.nome.startsWith('Patrulha'));if(!o)return 'fim';
        JJ.EU.pos.copy(o[1].pos).add(new THREE.Vector3(0,o[1].navio?120:40,0));JJ.EU.vida=100;for(let i=0;i<10;i++)JJ.envia({t:'acerto',alvo:o[0]});return o[1].nome;});
      if(r==='fim'||msgs.some(m=>m.startsWith('FIM')))break;await pg.waitForTimeout(450);}
      await pg.waitForTimeout(3500);await pg.screenshot({path:__dirname+`/f_m${n}_fim.png`});}
    console.log('    rádio: '+msgs.join('\n           '));
    await pg.evaluate(()=>{for(const b of document.querySelectorAll('#fimMis'))b.style.display='none';});await pg.keyboard.press('Escape');await pg.waitForTimeout(500);}
  console.log('\nerros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
