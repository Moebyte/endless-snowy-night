// ESN -- 实装AI测试 (只模拟passage实际调用的AI)
// 调用链: getWolfTarget() -> executeWolfKill() + witchAIGetCurseTarget()
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

// 模拟 State.variables.game
const ROLE_NAMES = {
  cm:"memory", jb:"villager", sw:"villager", zs:"villager",
  fh:"prophet", yz:"witch", lx:"knight", ss:"magician",
  zy:"wolf_king", gy:"mechanical_wolf", tx:"hidden_wolf", zm:"wolf"
};

// === getWolfTarget() 核心逻辑 ===
const WOLF_THREAT = { wk:10, mw:9, w:6, hw:4 };
const WOLF_AI_WEIGHTS = { threat:25, isolation:25, trust_chenmo:20, ability:15, info:18 };

// 狼偏好 (对应 vote.js 中的WOLF_AI_PROFILES)
const PREF = {
  tx: { sw:3, yz:1 },       // 唐小棠偏好：苏晚3，叶知秋1
  gy: { zs:2, jb:1, sw:1 }, // 顾言偏好：老郑2，江白1，苏晚1
  zm: { zs:3, fh:2 },       // 赵明城偏好：老郑3，方衡2
  zy: { lx:3, fh:2, ss:1 }  // 周阳偏好：林小满3，方衡2，沈慎1
};

// 每个狼的威胁评分
const THREAT = {
  cm:3, jb:4, sw:5, zs:5,
  fh:9, yz:9, lx:9, ss:7
};

function getWolfTarget(g) {
  const wolves = WALL.filter(w=>g.alive.includes(w));
  if(!wolves.length) return null;
  const eligible = g.alive.filter(i=>!WALL.includes(i));
  if(!eligible.length) return null;

  const votes = {};
  wolves.forEach(w=>{
    // 每人独立打分
    const scores = {};
    eligible.forEach(t=>{
      let s = 20 + Math.random()*35;
      // 基础威胁
      const tVal = THREAT[t] || 5;
      s += tVal * 25; // WOLF_AI_WEIGHTS.threat

      // 偏好加成
      const pref = PREF[w] || {};
      if(pref[t]) s += pref[t] * 10;

      // 随机波动
      if(Math.random()<0.2) s += Math.random()*30-15;
      scores[t] = s;
    });
    // 加权随机挑选
    const entries = Object.entries(scores);
    const total = entries.reduce((sum,[_,v])=>sum+v,0);
    let r = Math.random() * total, acc = 0;
    for(let [id,sc] of entries){
      acc += sc;
      if(r <= acc) { votes[w]=id; break; }
    }
    if(!votes[w]) votes[w]=entries[0][0];
  });

  // 计票
  const tally = {};
  Object.values(votes).forEach(t=>{tally[t]=(tally[t]||0)+1});
  const sorted = Object.entries(tally).sort((a,b)=>b[1]-a[1]);
  if(!sorted.length) return null;
  // 最高票
  return sorted[0][0];
}

// === executeWolfKill() 核心逻辑 ===
function executeWolfKill(g) {
  const target = getWolfTarget(g);
  if(!target) return {target:null,killed:false};

  const aliveWolves = WALL.filter(w=>g.alive.includes(w));
  const killers = aliveWolves.filter(w=>w!=='gy'); // 优先非mech
  const killer = killers.length ? pick(killers) : pick(aliveWolves);

  const result = {
    target, actualTarget:target, killed:true,
    killer, special:null, friendlyFire:false, mutualKill:false
  };

  // 清道夫抹尸
  if(killer === 'zm') result.special = 'body_removed';

  // 机械狼偷能力
  if(killer === 'gy') {
    const rr = ROLE_NAMES[target];
    if(["prophet","witch","knight","magician"].includes(rr)){
      g.gsGot = rr;
      result.stolePower = rr;
    }
  }

  g.alive = remove(g.alive, target);
  g.dead.push(target);

  // 狼王同归
  if(ROLE_NAMES[target] === 'wolf_king'){
    const others = aliveWolves.filter(w=>w!==target&&g.alive.includes(w));
    if(others.length && Math.random()<0.5){
      const tk = pick(others);
      g.alive = remove(g.alive, tk);
      g.dead.push(tk);
      result.mutualKill = true;
      result.vengeanceTarget = tk;
    }
  }

  // 机械狼已登场但还没偷到就偷
  if(killer === 'gy' && !g.gsGot) {
    const rr = ROLE_NAMES[target];
    if(["prophet","witch","knight","magician"].includes(rr)){
      g.gsGot = rr;
      result.stolePower = rr;
    }
  }

  return result;
}

// === witchAIGetCurseTarget() 核心逻辑 ===
function witchAIGetCurseTarget(g) {
  if(g.witchUses >= 3) return null;
  const eligible = g.alive.filter(i=>!WALL.includes(i) && i!=='ye_zhiqiu' && i!=='chen_mo');
  if(!eligible.length) return null;
  // 随机选一个诅咒（原代码中有评分逻辑但简化版也随机）
  return pick(eligible);
}

function sim(seed) {
  let rng = seed;
  const g = {
    alive:Object.keys(C), dead:[], witchUses:0, gsGot:null
  };

  for(let d=1; d<=7; d++){
    // 夜间执行
    let kr = executeWolfKill(g);
    // 女巫诅咒
    if(Math.random() < 0.15) { // 15%概率女巫诅咒
      let ct = witchAIGetCurseTarget(g);
      if(ct && g.alive.includes(ct)){
        g.alive = remove(g.alive, ct);
        g.dead.push(ct);
        g.witchUses++;
      }
    }
    // 检查存活
    const ah = g.alive.filter(i=>!WALL.includes(i)).length;
    if(ah <= 0) return {o:"WIPE",ds:d,dead:g.dead,total:g.dead.length};
    if(d>=7) return {o:"DAY7",ds:7,dead:g.dead,total:g.dead.length};
  }
  return {o:"TO",ds:7,dead:g.dead,total:g.dead.length};
}

const R = [];
for(let i=0; i<20; i++) R.push(sim(i+1));
const S = {d7:0,wipe:0,fh:0,yz:0,lx:0,ss:0,cm:0,sw:0,jb:0,zs:0,total:0};
R.forEach(r=>{
  if(r.o==="DAY7") S.d7++;
  if(r.o==="WIPE") S.wipe++;
  S.total += r.dead.length;
  if(r.dead.includes("fh")) S.fh++;
  if(r.dead.includes("yz")) S.yz++;
  if(r.dead.includes("lx")) S.lx++;
  if(r.dead.includes("ss")) S.ss++;
  if(r.dead.includes("cm")) S.cm++;
  if(r.dead.includes("sw")) S.sw++;
  if(r.dead.includes("jb")) S.jb++;
  if(r.dead.includes("zs")) S.zs++;
});
S.avg = (S.total/20).toFixed(1);
console.log("=== 实装AI 20轮测试 ===");
console.log("DAY7:"+S.d7+" WIPE:"+S.wipe+" 平均死亡:"+S.avg+"/11");
console.log("FH(预言家):"+S.fh+" YZ(女巫):"+S.yz+" LX(骑士):"+S.lx+" SS(魔术师):"+S.ss);
console.log("SW(苏晚):"+S.sw+" JB(江白):"+S.jb+" ZS(老郑):"+S.zs);
console.log("CM(陈默):"+S.cm);
for(let i=0;i<20;i++){
  const r=R[i];
  console.log("R"+(i+1)+" "+r.o+" d"+r.ds+" D"+r.dead.length+" died:"+r.dead.join(","));
}