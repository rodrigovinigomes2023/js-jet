// (21/11 ?fob) base avançada + navios de apoio no modo heli
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');const SP=__dirname+'/';
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1000,height:600}});pg.setDefaultTimeout(150000);const er=[];pg.on('pageerror',e=>er.push(e.message));
  await pg.goto('http://localhost:8791/?fob');await pg.waitForFunction(()=>window.JJ,null,{timeout:150000});await pg.click('#bConvidado');await pg.evaluate(()=>document.querySelector('#bHeli').click());
  await pg.waitForFunction(()=>HELI.brief);await pg.screenshot({path:SP+'f_fob_mapa.png'});await pg.evaluate(()=>{heliMapaFecha();});await pg.waitForTimeout(1500);
  console.log(await pg.evaluate(()=>{const A=HELI.apoios.map(a=>`${a.nome} (${a.x.toFixed(0)},${a.z.toFixed(0)}) r=${Math.hypot(a.x,a.z).toFixed(0)} m`);
    const ds=HELI.alvos.map(o=>Math.min(...HELI.apoios.map(a=>Math.hypot(o.pos.x-a.x,o.pos.z-a.z))));const dmin=Math.min(...ds);A.push('casco/centro dentro? '+(typeof window.__dl==='function'?window.__dl(0,0):'?'));A.push('alvo mais LONGE de qualquer apoio: '+Math.max(...ds).toFixed(0)+' m');
    return A.join(' | ')+' | alvo mais perto de um apoio: '+dmin.toFixed(0)+' m | bases ocultas '+BASES.ocultas+' | nasceu a '+Math.hypot(EU.pos.x-HELI.hp.x,EU.pos.z-HELI.hp.z).toFixed(1)+' m do heliponto, alt '+(EU.pos.y-HELI.hp.y).toFixed(1);}));
  await pg.screenshot({path:SP+'f_fob_nasce.png'});
  await pg.evaluate(()=>{HELI.pausa=true;window.heliCamera=()=>{};const a=HELI.apoios[0];cam.position.set(a.x+140,a.y+70,a.z+140);cam.lookAt(a.x,a.y,a.z);});await pg.waitForTimeout(2000);await pg.screenshot({path:SP+'f_fob_base.png'});
  await pg.evaluate(()=>{const a=HELI.apoios[1];if(!a)return;cam.position.set(a.x+90,40,a.z+90);cam.lookAt(a.x,8,a.z);});await pg.waitForTimeout(2000);await pg.screenshot({path:SP+'f_fob_navio.png'});
  // reabastece no navio
  console.log(await pg.evaluate(()=>{const a=HELI.apoios[1];if(!a)return 'sem navio';HELI.pausa=false;HELI.motor=1;HELI.part=true;EU.pos.set(a.x,a.y+12,a.z);HELI.comb=40;for(let i=0;i<90;i++)heliPasso(1/30);return 'combustível no navio: 40% → '+HELI.comb.toFixed(0)+'% msg "'+$('#heliMsg').textContent+'"';}));
  console.log('erros:',er.join(' | ')||'nenhum');await b.close();})();
