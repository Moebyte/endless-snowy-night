// 无尽雪夜 20轮AI决策模拟 - 自包含脚本

const C={
  cm:{n:"ChenMo",r:"memory",f:"h"},jb:{n:"JiangBai",r:"villager",f:"h"},
  sw:{n:"SuWan",r:"villager",f:"h"},zs:{n:"ZhengShoushan",r:"villager",f:"h"},
  fh:{n:"FangHeng",r:"prophet",f:"g"},yz:{n:"YeZhiqiu",r:"witch",f:"g"},
  lx:{n:"LinXiaoman",r:"knight",f:"g"},ss:{n:"ShenShen",r:"magician",f:"g"},
  zy:{n:"ZhouYang",r:"wolf_king",f:"w"},gy:{n:"GuYan",r:"mech_wolf",f:"w"},
  tx:{n:"TangXiaotang",r:"hidden_wolf",f:"w"},zm:{n:"ZhaoMingcheng",r:"wolf",f:"w"}
};
const W=["zy","gy","tx","zm"];
function p(a){return a[Math.floor(Math.random()*a.length)]}
function r(a,i){return a.filter(x=>x!==i)}

function GS(){
  return {d:1,a:Object.keys(C),dd:[],wu:0,wr:0,kd:0,kl:0,kt:null,ms:[],pc:{},gss:null,gsu:false,zru:false};
}

function wd(g){
  const aw=W.filter(w=>g.a.includes(w));if(!aw.length)return null;
  const v={};aw.forEach(w=>{
    const ts=g.a.filter(i=>!W.includes(i));if(!ts.length)return;
    const sc={};ts.forEach(t=>{
      let s=20+Math.random()*20;const ch=C[t];
      if(w==="zy"){if(ch.f==="g")s+=30;if(ch.r==="witch")s+=50;if(ch.r==="prophet")s+=40;}
      if(w==="gy"){if(ch.f==="g")s+=40;if(ch.r==="prophet")s+=50;if(ch.r==="witch")s+=40;}
      if(w==="tx"){if(t==="cm"||t==="lx")s-=50;if(ch.f==="g")s+=20;if(ch.r==="villager")s+=30;}
      if(w==="zm"){if(ch.r==="villager")s+=30;if(ch.f==="g")s+=10;}
      sc[t]=s+Math.random()*20-10;
    });v[w]=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0][0];
  });
  const tl={};aw.forEach(w=>{const t=v[w];tl[t]=(tl[t]||0)+1;});
  const mv=Math.max(...Object.values(tl));
  const top=Object.entries(tl).filter(([_,v])=>v===mv).map(([k])=>k);
  return {t:p(top),tl};
}

function wa(g,wt){
  const tot=g.wu+g.wr;if(tot>=3)return{};
  if(Math.random()<0.65&&g.wr<3)return{a:"r",t:wt};
  if(Math.random()<0.15&&g.wu<3){
    const c=g.a.filter(i=>i!=="yz"&&!W.includes(i));
    if(c.length)return{a:"c",t:p(c)};
  }return{};
}

function pd(g){
  const o=g.a.filter(i=>i!=="fh");if(!o.length)return null;
  const uc=o.filter(i=>!g.pc[i]);
  const t=uc.length?p(uc):p(o);
  const ch=C[t];g.pc[t]=ch.r==="hidden_wolf"?"a":(ch.f==="w"?"e":"a");
  return{t,r:g.pc[t]};
}

function kd(g){
  if(g.kd>0)return{a:"r"};
  const su=g.a.filter(i=>!W.includes(i)&&i!=="lx");
  if(!su.length)return{a:"n"};
  if(Math.random()<0.3){
    let t;if(g.a.includes("tx"))t=p(su.filter(s=>s!=="tx"));else t=p(su);
    return{a:"c",t,s:C[t].f==="w"};
  }
  if(Math.random()<0.5){
    const ts=g.a.filter(i=>i!=="lx"&&!W.includes(i));
    if(ts.length)return{a:"g",t:p(ts)};
  }return{a:"n"};
}

function md(g){
  const o=g.a.filter(i=>i!=="ss");
  if(o.length<2)return{a:"n"};
  const b=g.ms||[];const e=o.filter(i=>!b.includes(i));
  if(e.length<2)return{a:"n"};
  const sh=[...e].sort(()=>Math.random()-0.5);return{a:"s",p:[sh[0],sh[1]]};
}

function fj(g,d){
  if(!g.a.includes("tx")||d<2)return null;
  if(Math.random()<0.3){
    const t=p(g.a.filter(i=>i!=="tx"));return{t,c:"e"};
  }return null;
}

function sim(sd){
  let s=sd;function rng(){s=(s*16807)%2147483647;return(s-1)/2147483646;}
  const g=GS();const log=[];
  for(let d=1;d<=20;d++){
    const dl=[];
    const f=fj(g,d);if(f)dl.push("[HJ]TX claim "+C[f.t].n+" is wolf");
    const ka=kd(g);
    if(ka.a==="c"){
      if(ka.s){dl.push("[KT]LX kill "+C[ka.t].n+"(wolf)");g.a=r(g.a,ka.t);g.dd.push(ka.t);g.kd=1;}
      else{dl.push("[KT]LX kill "+C[ka.t].n+"(good)");g.a=r(g.a,ka.t);g.dd.push(ka.t);g.kd=2;}
    }else if(ka.a==="g"){g.kl=true;g.kt=ka.t;dl.push("[GRD]LX guard "+C[ka.t].n);}
    else{if(g.kd>0){g.kd--;dl.push("[KT]weak");}g.kl=false;}
    const pc=pd(g);if(pc)dl.push("[PR]FH check "+C[pc.t].n+":"+(pc.r==="a"?"ally":"enemy"));
    const ma=md(g);
    if(ma.a==="s"){g.ms=[...ma.p];dl.push("[MG]SS swap "+C[ma.p[0]].n+" & "+C[ma.p[1]].n);}
    log.push("Day "+d);dl.forEach(e=>log.push("  "+e));
    const nl=["Night "+d];
    const w=wd(g);if(!w){log.push("  wolves dead");log.push("");break;}
    let at=w.t;const sp=g.ms||[];
    if(sp.length===2&&g.a.includes("ss")){
      if(sp.includes(w.t)&&rng()<0.5){
        const o=sp.find(i=>i!==w.t);at=o;nl.push("[MG]wolf confused,target->"+C[o].n);
      }
    }g.ms=[];
    nl.push("[W]vote:"+Object.entries(w.tl).map(([k,v])=>C[k].n+":"+v).join());
    let guard=false;if(g.kt&&g.kl){guard=g.kt===at;g.kt=null;}
    const wa2=wa(g,at);let saved=false;
    if(wa2.a==="r"){
      if(guard){nl.push("[W+GRD]conflict!YZ repelled,"+C[at].n+" dies");g.wr++;}
      else{nl.push("[W]YZ save "+C[at].n);g.wr++;saved=true;}
    }else if(wa2.a==="c"){
      nl.push("[W]YZ curse "+C[wa2.t].n);g.wu++;
    }
    if(!saved&&!guard){
      const ch=C[at];g.a=r(g.a,at);g.dd.push(at);
      nl.push("[DEATH]"+ch.n+" killed by wolves");
      if(ch.r==="wolf_king"&&!g.zru){
        g.zru=true;const ow=W.filter(w=>w!==at&&g.a.includes(w));
        if(ow.length){const tk=p(ow);g.a=r(g.a,tk);g.dd.push(tk);nl.push("[WK]ZY takes "+C[tk].n);}
      }
      if(g.a.includes("gy")&&ch.f==="g"&&!g.gss){g.gss=ch.r;nl.push("[MW]GY steals "+ch.n+" ability:"+ch.r);}
    }
    if(g.a.includes("zm"))nl.push("[CL]ZMC cleans up");
    const tu=g.wu+g.wr;if(tu>0)nl.push("[W]used "+tu+"/3");
    nl.forEach(e=>log.push("  "+e));log.push("");
    const ah=g.a.filter(i=>!W.includes(i)).length;
    const aw=g.a.filter(i=>W.includes(i)).length;
    if(aw===0)return{o:"HUMAN",ds:d,dd:g.dd,a:g.a,l:log};
    if(ah===0||ah<=aw)return{o:"WOLF",ds:d,dd:g.dd,a:g.a,l:log};
  }return{o:"TIMEOUT",ds:20,dd:g.dd,a:g.a,l:log};
}

for(let i=0;i<20;i++){const r=sim(i+1);
  console.log("Round "+(i+1)+" | "+r.o+" | "+r.ds+"d | Dead:["+r.dd.map(id=>C[id].n).join()+"] | Alive:["+r.a.map(id=>C[id].n).join()+"]");
  r.l.forEach(l=>console.log(l));
  console.log("");
}