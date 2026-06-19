// ESN v14 -- Silent Night Voting + TangXiaotang low kill intent
// Each wolf silently votes. 2+ same target => KILL. No consensus => SAFE night.
const C = {
  cm:{n:"CM",r:"mem",f:"h"}, jb:{n:"JB",r:"vil",f:"h"},
  sw:{n:"SW",r:"vil",f:"h"}, zs:{n:"ZS",r:"vil",f:"h"},
  fh:{n:"FH",r:"pro",f:"g"}, yz:{n:"YZ",r:"wit",f:"g"},
  lx:{n:"LX",r:"kni",f:"g"}, ss:{n:"SS",r:"mag",f:"g"},
  zy:{n:"ZY",r:"wk",f:"w"}, gy:{n:"GY",r:"mw",f:"w"},
  tx:{n:"TX",r:"hw",f:"w"}, zm:{n:"ZM",r:"w",f:"w"}
};
const WALL = ["zy","gy","tx","zm"];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function remove(a,i){return a.filter(x=>x!==i)}
function freshState(){return{alive:Object.keys(C),dead:[],witchUses:0,witchRevs:0,knightCD:0,knightGuard:false,guardTgt:null,magSwap:[],prophetChecks:{},gsGot:null,zrTriggered:false,fj:null};}
const EVENTS=[
  {t:"[RE]SWaccusesFHoflying",p1:"sw",p2:"fh",type:"fight"},
  {t:"[RE]FHandLXargueoverfood",p1:"fh",p2:"lx",type:"fight"},
  {t:"[RE]YZnursesJBbacktohealth",p1:"yz",p2:"jb",type:"help"},
  {t:"[RE]SSgambleswithZY,losesbig",p1:"ss",p2:"zy",type:"fight"},
  {t:"[RE]TXandSWhaveloudargument",p1:"tx",p2:"sw",type:"fight"},
  {t:"[RE]ZMfoundnearLXroomatnight",p1:"zm",p2:"lx",type:"suspicious"},
  {t:"[RE]GYcaughtstealingfromkitchen",p1:"gy",p2:"zs",type:"fight"},
  {t:"[RE]FHwarnsYzaboutsomeone",p1:"fh",p2:"yz",type:"help"},
  {t:"[RE]LXprotectsSWfromZM",p1:"lx",p2:"sw",type:"help"},
  {t:"[RE]ZMorningSSlateatnight",p1:"zs",p2:"ss",type:"suspicious"},
  {t:"[RE]CMandJBexploretogether",p1:"cm",p2:"jb",type:"help"},
  {t:"[RE]TXmanipulatesFHintoarguing",p1:"tx",p2:"fh",type:"fight"}
];
function genFJ(g,day){
  if(day<2||Math.random()>0.4){g.fj=null;return null;}
  let cand=[];
  if(g.alive.includes("zm"))cand.push({id:"zm",name:"Zhao"});
  if(g.alive.includes("gy"))cand.push({id:"gy",name:"Gu"});
  if(!cand.length){g.fj=null;return null;}
  const fj=pick(cand);
  const tg=g.alive.filter(i=>!WALL.includes(i)&&i!==fj.id&&i!=="cm");
  if(!tg.length){g.fj=null;return null;}
  g.fj={jumper:fj.id,name:fj.name,target:pick(tg)};
  return g.fj;
}
function silentVote(g,ev,day){
  const aw=WALL.filter(w=>g.alive.includes(w));if(!aw.length)return null;
  const eligible=g.alive.filter(i=>!WALL.includes(i)&&i!=="cm");if(!eligible.length)return null;
  const votes={};
  aw.forEach(w=>{
    const scores={};
    eligible.forEach(t=>{
      let s=20+Math.random()*35;
      if(w==="zy"){if(t==="lx")s+=15;if(t==="fh")s+=5;}
      if(w==="gy"){s+=Math.random()*20;}
      if(w==="tx"){s-=35;if(t==="lx")s-=60;if(t==="sw")s-=20;if(t==="cm")s-=80;if(t==="fh")s+=5;}
      if(w==="zm"){if(t==="zs")s+=20;if(t==="fh")s+=10;if(t==="lx")s+=10;}
      if(ev){if(ev.type==="fight"&&(t===ev.p1||t===ev.p2))s+=25;if(ev.type==="help"&&t===ev.p1)s+=20;if(ev.type==="suspicious"&&t===ev.p1)s+=20;}
      if(g.fj&&t===g.fj.target)s+=35;
      if(Math.random()<0.2)s+=Math.random()*30-15;
      scores[t]=s;
    });
    if(w==="tx"&&Math.random()<0.55){votes[w]=null;return;}
    votes[w]=Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];
  });
  const tally={};Object.values(votes).forEach(t=>{if(t)tally[t]=(tally[t]||0)+1;});
  const sorted=Object.entries(tally).sort((a,b)=>b[1]-a[1]);
  if(!sorted.length)return{target:null,votes,tally,mode:"S"};
  if(sorted[0][1]>=2)return{target:sorted[0][0],votes,tally,mode:"K"};
  return{target:null,votes,tally,mode:"S"};
}
function witchAct(g,tgt){
  let t=g.witchUses+g.witchRevs;if(t>=3)return{a:"limit"};
  if(Math.random()<0.6&&g.witchRevs<3)return{a:"revive",t:tgt};
  if(Math.random()<0.08&&g.witchUses<3){let c=g.alive.filter(i=>i!=="yz"&&!WALL.includes(i)&&i!=="cm");if(c.length)return{a:"curse",t:pick(c)};}
  return{a:"none"};
}
function prophetCheck(g){
  let o=g.alive.filter(i=>i!=="fh");if(!o.length)return null;
  let uc=o.filter(i=>!g.prophetChecks[i]);let t=uc.length?pick(uc):pick(o);
  g.prophetChecks[t]=C[t].r==="hw"?"ally":(C[t].f==="w"?"enemy":"ally");
  return{t,r:g.prophetChecks[t]};
}
function knightAct(g){
  if(g.knightCD>0)return{a:"rest",cd:g.knightCD};
  let su=g.alive.filter(i=>!WALL.includes(i)&&i!=="lx"&&i!=="cm");if(!su.length)return{a:"none"};
  if(Math.random()<0.13){let t;if(g.alive.includes("tx")&&Math.random()<0.35){let nc=su.filter(s=>s!=="lx");t=nc.length?pick(nc):pick(su);}else t=pick(su);return{a:"duel",t,isWolf:C[t].f==="w"};}
  if(Math.random()<0.3){let ts=g.alive.filter(i=>i!=="lx"&&!WALL.includes(i)&&i!=="cm");if(ts.length){let wk=ts.filter(t=>t==="yz"||t==="sw");return{a:"guard",t:wk.length?pick(wk):pick(ts)};}}
  return{a:"none"};
}
function magicianAct(g){
  let o=g.alive.filter(i=>i!=="ss");if(o.length<2)return{a:"none"};
  let banned=g.magSwap||[];let e=o.filter(i=>!banned.includes(i));if(e.length<2)return{a:"none"};
  let sh=[...e].sort(()=>Math.random()-0.5);return{a:"swap",pair:[sh[0],sh[1]]};
}
function genEvents(){let s=[...EVENTS];for(let i=s.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}let r={};for(let d=2;d<=6;d++){let idx=Math.floor(Math.random()*s.length);r[d]=s.splice(idx,1)[0];}return r;}
function sim(seed){
  let rng=seed;function rn(){rng=(rng*16807)%2147483647;return(rng-1)/2147483646;}
  const g=freshState();const ev=genEvents();const log=[];
  const FD=["","","[FD]Body","[FD]Search","[FD]Supplies","[FD]Escape","[FD]Split",""];
  const fjDay=2+Math.floor(Math.random()*4);g.fj=null;
  for(let d=1;d<=7;d++){
    let dl=[];if(FD[d])dl.push(FD[d]);let re=ev[d];if(re)dl.push(re.t);
    if(d===fjDay){let fj=genFJ(g,d);if(fj)dl.push("[HJ]"+fj.name+" claims prophet, accuses "+C[fj.target].n+"!");}
    let k=knightAct(g);
    if(k.a==="duel"){if(k.isWolf){dl.push("[KT]LXk"+C[k.t].n+"(w)");g.alive=remove(g.alive,k.t);g.dead.push(k.t);g.knightCD=2;}
    else{dl.push("[KT]LXk"+C[k.t].n+"(g)");g.alive=remove(g.alive,k.t);g.dead.push(k.t);g.knightCD=3;}
    }else if(k.a==="guard"){g.knightGuard=true;g.guardTgt=k.t;dl.push("[GD]LXg"+C[k.t].n);
    }else{if(g.knightCD>0){g.knightCD--;if(g.knightCD>0)dl.push("[KT]r"+g.knightCD);}g.knightGuard=false;g.guardTgt=null;}
    let pc=prophetCheck(g);if(pc)dl.push("[PR]FHc"+C[pc.t].n+":"+(pc.r==="ally"?"A":"E"));
    let mg=magicianAct(g);if(mg.a==="swap"){g.magSwap=[...mg.pair];dl.push("[MG]SSs"+C[mg.pair[0]].n+"x"+C[mg.pair[1]].n);}
    log.push("D"+d);dl.forEach(e=>log.push(" "+e));
    let nl=["N"+d];
    let wv=silentVote(g,ev[d],d);
    if(!wv||!Object.values(wv.votes||{}).some(v=>v!==null&&v!==undefined)){log.push(" SAFE(allabstain)");log.push("");continue;}
    let target=wv.target;
    if(g.alive.includes("ss")&&g.magSwap.length===2&&target&&g.magSwap.includes(target)&&rn()<0.5){target=g.magSwap.find(i=>i!==target);nl.push("[MG]wc->"+C[target].n);}
    let oldSwap=g.magSwap;g.magSwap=[];
    Object.entries(wv.votes).forEach(([k,v])=>{if(v)nl.push("[W]"+C[k].n+"->"+C[v].n);else nl.push("[W]"+C[k].n+"->ABSTAIN");});
    nl.push("[V]"+wv.mode+(target?" "+C[target].n:""));
    if(!target){if(g.knightGuard)g.knightGuard=false;nl.forEach(e=>log.push(" "+e));log.push("");continue;}
    let guarded=false;
    if(g.knightGuard&&g.guardTgt===target){guarded=true;nl.push("[G]lxs "+C[target].n);g.knightGuard=false;g.guardTgt=null;}
    let wa=witchAct(g,target);let saved=false;
    if(wa.a==="revive"){if(guarded){nl.push("[W+G]conflict,"+C[target].n+"d");g.witchRevs++;}else{nl.push("[W]YZs"+C[target].n);g.witchRevs++;saved=true;}
    }else if(wa.a==="curse"){if(wa.t)nl.push("[W]YZc"+C[wa.t].n);g.witchUses++;}
    if(!saved&&!guarded){let ch=C[target];g.alive=remove(g.alive,target);g.dead.push(target);nl.push("[X]"+ch.n);
      if(ch.r==="wk"&&!g.zrTriggered){g.zrTriggered=true;let ow=WALL.filter(w=>w!==target&&g.alive.includes(w));if(ow.length){let tk=pick(ow);g.alive=remove(g.alive,tk);g.dead.push(tk);nl.push("[WK]ZYt"+C[tk].n);}}
      if(g.alive.includes("gy")&&!g.gsGot){let rr=C[target].r;if(["pro","wit","kni","mag"].includes(rr)){g.gsGot=rr;nl.push("[MW]GYs"+ch.n+":"+rr);}}}
    if(g.alive.includes("zm"))nl.push("[CL]ZMc");
    let tu=g.witchUses+g.witchRevs;if(tu>0)nl.push("[W]"+tu+"/3");
    log.push(" "+nl.join(" "));log.push("");
    let ah=g.alive.filter(i=>!WALL.includes(i)).length;
    if(d>=7)return{o:(ah>0?"DAY7":"WIPE"),ds:7,dd:g.dead,a:g.alive,l:log,dead:g.dead.length};
    if(ah<=1)return{o:"NEAR_WIPE",ds:d,dd:g.dead,a:g.alive,l:log,dead:g.dead.length};
    g.fj=null;
  }
  return{o:"TO",ds:7,dd:g.dead,a:g.alive,l:log,dead:g.dead.length};
}
const R=[];for(let i=0;i<20;i++)R.push(sim(i+1));
const S={d7:0,nw:0,ad:0,avgd:0,fh:0,yz:0,lx:0,ss:0,cm:0,sw:0,jb:0,zs:0,total:0,fj_zm:0,fj_gy:0,fj_no:0};
R.forEach(r=>{if(r.o==="DAY7")S.d7++;if(r.o==="NEAR_WIPE")S.nw++;S.ad+=r.ds;S.total+=r.dead;
if(r.dd.includes("fh"))S.fh++;if(r.dd.includes("yz"))S.yz++;if(r.dd.includes("lx"))S.lx++;if(r.dd.includes("ss"))S.ss++;
if(r.dd.includes("cm"))S.cm++;if(r.dd.includes("sw"))S.sw++;if(r.dd.includes("jb"))S.jb++;if(r.dd.includes("zs"))S.zs++;
if(r.fj)S[r.fj.jumper==="zm"?"fj_zm":"fj_gy"]++;else S.fj_no++;});
S.avgd=(S.total/20).toFixed(1);S.ad=(S.ad/20).toFixed(1);
console.log("=== ESN v14 SilentNightVote 20r ===");
console.log("DAY7:"+S.d7+" NEAR_WIPE:"+S.nw+" AvgD:"+S.avgd+"/11 CM:"+S.cm);
console.log("FJ: ZM:"+S.fj_zm+" GY:"+S.fj_gy+" None:"+S.fj_no);
console.log("");console.log("Deaths:");
console.log("  FH:"+S.fh+" YZ:"+S.yz+" LX:"+S.lx+" SS:"+S.ss);
console.log("  SW:"+S.sw+" JB:"+S.jb+" ZS:"+S.zs);
console.log("  CM:"+S.cm);console.log("");
for(let i=0;i<20;i++){let r=R[i];console.log("==R"+(i+1)+" "+r.o+" d"+r.ds+" A"+r.a.length+" D"+r.dead+" FJ:"+(r.fj?r.fj.name:"none"));r.l.forEach(l=>console.log(l));console.log("");}