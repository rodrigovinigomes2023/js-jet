// (21/11) lote 4 no jogo: Tu-95, míssil, bomba, piloto c/ paraquedas, soldado; navios corrigidos
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');const SP=__dirname+'/';
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.setDefaultTimeout(150000);const erros=[];pg.on('pageerror',e=>erros.push(e.message));pg.on('console',m=>{if(m.type()==='error')erros.push(m.text().slice(0,150));});
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:150000});
  await pg.evaluate(()=>{document.getElementById('menu').style.display='none';const X=9000,Z=-9000;
    const t=MOD.bombardeiro();t.position.set(X,40,Z);cena.add(t);const m=criarMissil();m.position.set(X+40,30,Z+30);const bo=criarBomba();bo.position.set(X+40,28,Z+30);
    const p=heliPiloto();p.position.set(X+60,0.5,Z+60);const s=heliMilitar();s.position.set(X+62,0.5,Z+58);cena.add(s);
    for(let i=0;i<3;i++){const n=criarNavio('#d33',i);n.position.set(X-200+i*110,0,Z+150);}});
  await pg.waitForTimeout(6000);
  for(const [n,c,a] of[['tu95',[9070,60,-8930],[9000,40,-9000]],['armas',[9045,31,-8963],[9040,29,-8970]],['piloto',[9068,3,-8930],[9061,1.5,-8940]],['navios',[8880,40,-8720],[8900,8,-8850]]]){
    await pg.evaluate(([c,a])=>{window.__camFixa=[c,a];},[c,a]);await pg.waitForTimeout(2500);await pg.screenshot({path:SP+'f_l4_'+n+'.png'});}
  console.log('erros:',erros.filter(e=>!/GL Driver|404/.test(e)).join(' | ')||'nenhum');await b.close();})();
