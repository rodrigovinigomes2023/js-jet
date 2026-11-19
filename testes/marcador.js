// (19/11) marcador A 45°: foto longe, perto e travado (câmera fixa atrás do bot).  node testes/marcador.js
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:560}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.waitForTimeout(1200);
  await pg.click('#bConvidado');await pg.waitForTimeout(400);await pg.click('#decolar');await pg.waitForTimeout(2500);
  const poe=(dist,trav)=>pg.evaluate(([dist,trav])=>new Promise(res=>{const {EU,OUT,TRAVA}=window.JJ;const ids=[...OUT.keys()].filter(k=>{const o=OUT.get(k);return o.vivo&&!o.navio;});
    const id=ids[0],o=OUT.get(id);const c=[o.pos.x-dist*0.8,o.pos.y+dist*0.25,o.pos.z-dist*0.55];window.__camFixa=[c,[o.pos.x,o.pos.y,o.pos.z]];EU.pos.set(...c);EU.vida=100;
    if(trav){TRAVA.id=id;TRAVA.t=5;}let n=0;const f=()=>{window.__camFixa=[c,[o.pos.x,o.pos.y,o.pos.z]];EU.pos.set(...c);if(trav){TRAVA.id=id;TRAVA.t=5;}if(++n<8)return requestAnimationFrame(f);const a=o.aq,r=a.getBoundingClientRect();res([o.nome+' '+a.style.display+' '+a.style.width+' trav='+a.classList.contains('trav'),r.x,r.y]);};f();}),[dist,trav]);
  for(const [dist,trav,arq] of [[1500,0,'longe'],[160,0,'perto'],[600,1,'travado']]){const r=await poe(dist,trav);console.log(arq,r[0]);await pg.screenshot({path:__dirname+'/f_aq_'+arq+'.png',clip:{x:Math.max(0,Math.min(800,r[1]-100)),y:Math.max(0,Math.min(400,r[2]-90)),width:200,height:160}});}
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
