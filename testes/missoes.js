// (19/11) modo história: lista com cadeados, briefing, missão 1 (vence "na marra" mandando acertos) e missão 2 liberada.  PORTA=8795 node testes/missoes.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
const URL='http://localhost:'+(process.env.PORTA||8795)+'/';
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[],msgs=[];pg.on('pageerror',e=>erros.push(e.message));
  pg.on('websocket',w=>w.on('framereceived',f=>{try{const d=JSON.parse(f.payload);if(['radio','obj','fim','bemvindo'].includes(d.t))msgs.push(d.t==='bemvindo'?'bemvindo '+d.sala+' m'+d.missao:d.t+': '+(d.txt||JSON.stringify(d)));}catch(e){}}));
  await pg.goto(URL);await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.waitForTimeout(800);
  await pg.click('#bConvidado');await pg.waitForTimeout(300);await pg.screenshot({path:__dirname+'/f_mis_menu.png'});
  await pg.click('#bMissoes');await pg.waitForTimeout(600);await pg.screenshot({path:__dirname+'/f_mis_lista.png'});
  console.log('liberadas:',await pg.$$eval('#mGrade .mc:not([disabled])',l=>l.map(x=>x.dataset.n).join(',')));
  await pg.click('#mGrade .mc[data-n="1"]');await pg.waitForTimeout(300);await pg.screenshot({path:__dirname+'/f_mis_brief.png'});
  await pg.click('#mVai');await pg.waitForTimeout(4000);await pg.screenshot({path:__dirname+'/f_mis_voo.png'});
  console.log('inimigos:',await pg.evaluate(()=>[...JJ.OUT.values()].map(o=>o.nome).join(', ')));
  // vence: encosta em cada inimigo e manda "acerto" (o servidor confere distância e munição)
  for(let k=0;k<40;k++){const r=await pg.evaluate(()=>{const o=[...JJ.OUT.entries()].find(([i,o])=>o.vivo);if(!o)return 'todos mortos';
      JJ.EU.pos.copy(o[1].pos).add(new THREE.Vector3(0,30,0));for(let i=0;i<8;i++)JJ.envia({t:'acerto',alvo:o[0]});return o[1].nome+' '+o[1].vida;});
    if(r==='todos mortos')break;await pg.waitForTimeout(500);}
  await pg.waitForTimeout(3500);await pg.screenshot({path:__dirname+'/f_mis_fim.png'});
  console.log('fim visível:',await pg.isVisible('#fimMis'),'| guardado:',await pg.evaluate(()=>localStorage.getItem('jsjet-missoes')));
  await pg.click('#fMis');await pg.waitForTimeout(800);await pg.screenshot({path:__dirname+'/f_mis_lista2.png'});
  console.log('liberadas depois:',await pg.$$eval('#mGrade .mc:not([disabled])',l=>l.map(x=>x.dataset.n).join(',')));
  await pg.click('#mGrade .mc[data-n="2"]');await pg.click('#mVai');await pg.waitForTimeout(5000);await pg.screenshot({path:__dirname+'/f_mis2_voo.png'});
  console.log('inimigos m2:',await pg.evaluate(()=>[...JJ.OUT.values()].map(o=>o.nome+'('+Math.round(o.pos.y)+'m)').join(', ')));
  await pg.evaluate(()=>JJ.envia({t:'caiu'}));await pg.waitForTimeout(3500);
  console.log('m2 fracasso visível:',await pg.isVisible('#fimMis'),await pg.textContent('#fimMis h2').catch(()=>'-'));
  console.log('msgs:\n  '+msgs.join('\n  '));
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
