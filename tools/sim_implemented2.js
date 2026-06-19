// ESN v7 -- 楠戝＋鍐虫枟20% + 濂冲帆姣掔嫾70%
const C = {
  cm:{n:"CM",r:"mem",f:"h"}, jb:{n:"JB",r:"vil",f:"h"},
  sw:{n:"SW",r:"vil",f:"h"}, zs:{n:"ZS",r:"vil",f:"h"},
  fh:{n:"FH",r:"pro",f:"g"}, yz:{n:"YZ",r:"wit",f:"g"},
  lx:{n:"LX",r:"kni",f:"g"}, ss:{n:"SS",r:"mag",f:"g"},
  zy:{n:"ZY",r:"wk",f:"w"}, gy:{n:"GY",r:"mw",f:"w"},
  tx:{n:"TX",r:"hw",f:"w"}, zm:{n:"ZM",r:"w",f:"w"}
};
const WALL=["zy","gy","tx","zm"];
function pick(a){return a[Math.floor(Math.random()*a.length)]}
function remove(a,i){return a.filter(x=>x!==i)}
const ROLE_NAMES={cm:"memory",jb:"villager",sw:"villager",zs:"villager",fh:"prophet",yz:"witch",lx:"knight",ss:"magician",zy:"wolf_king",gy:"mechanical_wolf",tx:"hidden_wolf",zm:"wolf"};
const THREAT={cm:3,jb:4,sw:4,zs:5,fh:6,yz:6,lx:6,ss:5};
const PREF_WEIGHT=15;
const PREF={tx:{sw:4,yz:1},gy:{zs:3,jb:2,sw:1},zm:{zs:4,fh:3},zy:{lx:4,fh:3,ss:2}};
const PROXIMITY={su_wan:10,jiang_bai:8,lin_xiaoman:7,chen_mo:5,tang_xiaotang:4,ye_zhiqiu:3,gu_yan:3,zhou_yang:2,zhao_mingcheng:2,fang_heng:1,shen_shen:1,zheng_shoushan:1};

function wolfVote(g){
  const aw=WALL.filter(w=>g.alive.includes(w));if(!aw.length)return null;
  const eligible=g.alive.filter(i=>!WALL.includes(i));
  if(!eligible.length)return null;
  const votes={};
  aw.forEach(w=>{
    const scores={};let bestScore=-1,best=null;
    eligible.forEach(t=>{
      let s=20+Math.random()*35;s+=(THREAT[t]||3)*6;
      const pref=PREF[w]||{};if(pref[t])s+=pref[t]*PREF_WEIGHT;
      if(Math.random()<0.25)s+=Math.random()*40-20;scores[t]=s;
      if(s>bestScore){bestScore=s;best=t;}
    });
    if(best)votes[w]=best;
  });
  const tally={};Object.values(votes).forEach(t=>{tally[t]=(tally[t]||0)+1});
  const sorted=Object.entries(tally).sort((a,b)=>b[1]-a[1]);
  if(!sorted.length)return null;
  if(sorted[0][1]>=2)return{target:sorted[0][0],mode:"K"};
  return{target:null,mode:"S"};
}

function witchShouldSave(g,target){
  if(g.witchUses>=3)return false;
  const prox=PROXIMITY[target]||1;let score=prox*12;
  const role=ROLE_NAMES[target];
  if(["prophet","witch","knight","magician"].includes(role))score+=60;
  else score+=25;
  const aliveGood=g.alive.filter(i=>!WALL.includes(i)).length;
  score+=(12-aliveGood)*25;
  return score>170;
}
function witchDecideNight(g,target){
  if(g.witchUses>=3)return{a:"pass"};
  if(target&&witchShouldSave(g,target))return{a:"save",target};
  if(Math.random()<0.25){ // 25%璇呭拻
    const wolfTargets=WALL.filter(w=>g.alive.includes(w));
    if(wolfTargets.length&&Math.random()<0.7){
      // 70%浼樺厛姣掔嫾
      const ct=pick(wolfTargets);
      if(ct)return{a:"curse",target:ct};
    }
    const eligible=g.alive.filter(i=>!WALL.includes(i)&&i!=='ye_zhiqiu');
    if(eligible.length)return{a:"curse",target:pick(eligible)};
  }
  return{a:"pass"};
}

function knightAIAct(g){
  if(g.knightCD>0)return;
  const eligible=g.alive.filter(i=>i!=='lin_xiaoman');
  if(!eligible.length)return;
  // 20%鍐虫枟
  if(Math.random()<0.20){
    const t=pick(eligible);
    const role=ROLE_NAMES[t];
    if(WALL.includes(t)){
      g.alive=remove(g.alive,t);g.dead.push(t);
      if(role==='wolf_king'){g.alive=remove(g.alive,'lin_xiaoman');g.dead.push('lin_xiaoman');}
      g.knightCD=2;
    }else{
      g.alive=remove(g.alive,'lin_xiaoman');g.dead.push('lin_xiaoman');
    }
    return;
  }
  // 25%瀹堝崼
  if(Math.random()<0.25){
    const targets=eligible.filter(i=>!WALL.includes(i)).filter(t=>t==='su_wan'||t==='tang_xiaotang'||t==='chen_mo');
    if(targets.length){g.knightGuardTgt=pick(targets);g.knightCD=2;}
  }
}

function magicianSwap(g){
  if(!g.alive.includes('ss'))return null;
  if(Math.random()>0.20)return null;
  const o=g.alive.filter(i=>i!=='ss');
  if(o.length<2)return null;
  const banned=g.magBanned||[];
  const e=o.filter(i=>!banned.includes(i));
  if(e.length<2)return null;
  const sh=[...e].sort(()=>Math.random()-0.5);
  g.magSwap={a:sh[0],b:sh[1]};
  g.magBanned=[sh[0],sh[1]];
}

function wolfResolve(g,target){
  if(g.knightGuardTgt===target&&g.knightAlive&&g.alive.includes('lin_xiaoman'))return{target,special:"guarded"};
  let actual=target;
  if(g.magSwap){
    if((g.magSwap.a===target||g.magSwap.b===target)&&Math.random()<0.5){
      actual=g.magSwap.a===target?g.magSwap.b:g.magSwap.a;
    }
  }
  g.magSwap=null;

  const wd=witchDecideNight(g,actual);
  if(wd.a==="save"){
    if(g.knightGuardTgt===actual&&g.knightAlive&&g.alive.includes('lin_xiaoman')){
      g.alive=remove(g.alive,actual);g.dead.push(actual);g.witchUses++;
      return{target:actual,special:"witch_knight_conflict",killed:true};
    }
    g.witchUses++;return{target:actual,special:"saved",killed:false};
  }

  // 濂冲帆璇呭拻锛堜紭鍏堟潃鐙硷級
  if(wd.a==="curse"){
    const ct=wd.target;
    if(ct&&g.alive.includes(ct)){
      g.alive=remove(g.alive,ct);g.dead.push(ct);g.witchUses++;
    }
  }

  // 鐙兼潃
  if(g.alive.includes(actual)){
    g.alive=remove(g.alive,actual);g.dead.push(actual);
    const aw=WALL.filter(w=>g.alive.includes(w));
    if(ROLE_NAMES[actual]==='wolf_king'){
      const ow=aw.filter(w=>w!==actual&&g.alive.includes(w));
      if(ow.length&&Math.random()<0.5){const tk=pick(ow);g.alive=remove(g.alive,tk);g.dead.push(tk);}
    }
  }
  return{target:actual,special:"killed",killed:true};
}

function sim(seed){
  const g={alive:Object.keys(C),dead:[],witchUses:0,gsGot:null,knightAlive:true,knightCD:0,knightGuardTgt:null,magSwap:null,magBanned:[]};
  for(let d=1;d<=7;d++){
    if(g.knightCD>0){g.knightCD--;if(g.knightCD<=0)g.knightGuardTgt=null;}
    if(g.alive.includes('lin_xiaoman')){g.knightAlive=true;knightAIAct(g);}else g.knightAlive=false;
    if(g.alive.includes('ss'))magicianSwap(g);

    const wv=wolfVote(g);
    if(!wv||!wv.target)continue;
    wolfResolve(g,wv.target);

    const ah=g.alive.filter(i=>!WALL.includes(i)).length;
    const wh=WALL.filter(w=>g.alive.includes(w)).length;
    if(ah<=0||wh<=0)return{o:"END",ds:d,dead:g.dead,total:g.dead.length,wolvesDead:4-WALL.filter(w=>g.alive.includes(w)).length};
    if(d>=7)return{o:"DAY7",ds:7,dead:g.dead,total:g.dead.length,wolvesDead:4-WALL.filter(w=>g.alive.includes(w)).length};
  }
  return{o:"DAY7",ds:7,dead:g.dead,total:g.dead.length,wolvesDead:0};
}

const R=[];for(let i=0;i<20;i++)R.push(sim(i+1));
const S={d7:0,end:0,fh:0,yz:0,lx:0,ss:0,cm:0,sw:0,jb:0,zs:0,total:0,zy:0,gy:0,tx:0,zm:0,wDeaths:0};
R.forEach(r=>{
  S[r.o]++;S.total+=r.dead.length;S.wDeaths+=r.wolvesDead||0;
  if(r.dead.includes("fh"))S.fh++;if(r.dead.includes("yz"))S.yz++;if(r.dead.includes("lx"))S.lx++;
  if(r.dead.includes("ss"))S.ss++;if(r.dead.includes("cm"))S.cm++;
  if(r.dead.includes("sw"))S.sw++;if(r.dead.includes("jb"))S.jb++;if(r.dead.includes("zs"))S.zs++;
  if(r.dead.includes("zy"))S.zy++;if(r.dead.includes("gy"))S.gy++;if(r.dead.includes("tx"))S.tx++;if(r.dead.includes("zm"))S.zm++;
});
S.avg=(S.total/20).toFixed(1);S.wavg=(S.wDeaths/20).toFixed(1);
console.log("=== v7 (鍐虫枟20%+姣掔嫾70%) 20杞?===");
console.log("DAY7:"+S.d7+" END:"+S.end+" 濂戒汉骞冲潎姝?"+S.avg+"/11 鐙煎钩鍧囨:"+S.wavg+"/4");
console.log("濂戒汉: FH:"+S.fh+" YZ:"+S.yz+" LX:"+S.lx+" SS:"+S.ss+" SW:"+S.sw+" JB:"+S.jb+" ZS:"+S.zs+" CM:"+S.cm);
console.log("鐙? ZY:"+S.zy+" GY:"+S.gy+" TX:"+S.tx+" ZM:"+S.zm);
for(let i=0;i<20;i++){const r=R[i];console.log("R"+(i+1)+" "+r.o+" d"+r.ds+" H"+r.dead.filter(x=>!WALL.includes(x)).length+" W"+(r.wolvesDead||0)+" died:"+r.dead.join(","));}