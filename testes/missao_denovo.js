// (21/11) "tentar de novo" na missão: cenário volta inteiro ao início
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.setDefaultTimeout(150000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:150000});await pg.click('#bConvidado');
  const est=()=>pg.evaluate(()=>`OUT ${OUT.size} vivos ${[...OUT.values()].filter(o=>o.vivo).length} destroços ${DESTROCOS.length} pilotos ${PILOTOS.length} fx ${FX.length} trilhas ${TRILHAS.size} lanc ${BASES.map(B=>B.lanc.filter(l=>!l.vivo).length).join('')} sala ${SALA}`);
  await pg.evaluate(()=>iniciaMissao(1));await pg.waitForFunction(()=>SALA==='missao'&&OUT.size>0,null,{timeout:120000});await pg.waitForTimeout(3000);console.log('início  :',await est());
  await pg.evaluate(()=>{let k=0;for(const o of OUT.values()){if(k++>2)break;queda(o.g,o.pos,o.q,o.vel,{});}ejetar&&0;BASES[0].lanc[0].vivo=false;BASES[0].lanc[0].L.visible=false;});
  await pg.waitForTimeout(1500);console.log('sujo    :',await est());
  await pg.evaluate(()=>{sair();iniciaMissao(1);});console.log('logo após:',await est());
  await pg.waitForFunction(()=>SALA==='missao'&&OUT.size>0,null,{timeout:120000});await pg.waitForTimeout(3000);console.log('de novo :',await est());
  console.log('erros:',erros.join(' | ')||'nenhum');await b.close();})();
