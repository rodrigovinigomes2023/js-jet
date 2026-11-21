// (21/11) heli não atravessa torre / árvore; zoom mais perto
const {chromium}=require('/home/gomes/Área de Trabalho/tnb/node_modules/playwright-core');
(async()=>{const b=await chromium.launch({executablePath:process.env.HOME+'/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',args:['--use-gl=swiftshader','--enable-unsafe-swiftshader','--mute-audio']});
  const pg=await b.newPage({viewport:{width:1100,height:620}});const erros=[];pg.on('pageerror',e=>erros.push(e.message));
  await pg.goto('http://localhost:8791/');await pg.waitForFunction(()=>window.JJ,null,{timeout:60000});await pg.click('#bConvidado');await pg.evaluate(()=>document.querySelector('#bHeli').click());await pg.waitForTimeout(2000);await pg.click('#hmOk');
  console.log(await pg.evaluate(()=>{let n=0,a=0;for(const l of OBST.values())for(const o of l){n++;}return 'refs na grade '+n+' zoom '+HELI_ZOOM;}));
  await pg.screenshot({path:__dirname+'/f_heli_zoom.png'});
  const voa=async(nome,alvo)=>{await pg.evaluate(a=>{HELI.motor=1;HELI.part=true;const [tx,tz,ty]=a;JJ.EU.pos.set(tx+55,ty,tz+10);const h=JJ.EU.pos;
      HCAM.az=Math.atan2(h.z-tz,h.x-tx);heliCamAplica();HCAM.tMan=performance.now()+1e6;EU.vida=100;},alvo);
    await pg.evaluate(()=>{TEC.KeyW=true;let mn=1e9;for(let i=0;i<240;i++){heliPasso(1/30);}TEC.KeyW=false;for(let i=0;i<10;i++)heliPasso(1/30);});await pg.waitForTimeout(800);
    console.log(nome,await pg.evaluate(a=>`dist ${Math.hypot(EU.pos.x-a[0],EU.pos.z-a[1]).toFixed(1)} vida ${Math.round(EU.vida)} msg "${$('#heliMsg').textContent}"`,alvo));
    await pg.screenshot({path:__dirname+`/f_heli_bate_${nome}.png`});};
  const torre=await pg.evaluate(()=>{const B=BASES[HELI_CASA],c=Math.cos(B.yaw),s=Math.sin(B.yaw);return[B.x+160*c-90*s,B.z-160*s-90*c,BASE_H+12];});
  await voa('torre',torre);
  const arv=await pg.evaluate(()=>{for(const l of OBST.values())for(const o of l)if(o.tag==='arv'&&o.top-o.bot>14&&o.bot>5)return[o.x,o.z,o.bot+6];});
  await voa('arvore',arv);
  console.log('erros:',erros.length?erros.join(' | '):'nenhum');await b.close();})();
