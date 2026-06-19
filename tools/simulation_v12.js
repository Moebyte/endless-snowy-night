// ESN v12 - ZhaoMingcheng OR GuYan random fake jump, or none
const C={
  cm:{n:"CM",r:"mem",f:"h"},jb:{n:"JB",r:"vil",f:"h"},
  sw:{n:"SW",r:"vil",f:"h"},zs:{n:"ZS",r:"vil",f:"h"},
  fh:{n:"FH",r:"pro",f:"g"},yz:{n:"YZ",r:"wit",f:"g"},
  lx:{n:"LX",r:"kni",f:"g"},ss:{n:"SS",r:"mag",f:"g"},
  zy:{n:"ZY",r:"wk",f:"w"},gy:{n:"GY",r:"mw",f:"w"},
  tx:{n:"TX",r:"hw",f:"w"},zm:{n:"ZM",r:"w",f:"w"}
};
const W=["zy","gy","tx","zm"];
function p(a){return a[Math.floor(Math.random()*a.length)]}
function r(a,i){return a.filter(x=>x!==i)}
function gs(){return {a:Object.keys(C),dd:[],wu:0,wr:0,kd:0,kl:0,kt:null,ms:[],pc:{},gs:null,zr:false};}
const EV=[
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
function fakeJump(g,d){
  if(d<2)return null;
  const candidates=[];
  if(g.a.includes("zm"))candidates.push("zm");
  if(g.a.includes("gy"))candidates.push("gy");
  if(candidates.length===0||Math.random()>0.4)return null;
  const jumper=p(candidates);
  const targets=g.a.filter(i=>!W.includes(i)&&i!==jumper&&i!=="cm");
  if(!targets.length)return null;
  const target=p(targets);
  return{jumper,target,claim:"enemy"};
}
function wv(g,ev,day){
  const aw=W.filter(w=>g.a.includes(w));if(!aw.length)return null;const vo={};
  aw.forEach(w=>{const tg=g.a.filter(i=>!W.includes(i)&&i!=="cm");if(!tg.length)return;const sc={};
  tg.forEach(t=>{let s=20+Math.random()*35;
    if(w==="zy"){if(t==="lx")s+=12;}
    if(w==="gy"){s+=Math.random()*20;}
    if(w==="tx"){if(t==="lx")s-=25;if(t==="sw")s+=15;}
    if(w==="zm"){if(t==="zs")s+=25;if(t==="jb")s+=8;}
    if(ev&&ev.type==="fight"){if(t===ev.p1||t===ev.p2)s+=25;}
    if(ev&&ev.type==="help"){if(t===ev.p1)s+=20;}
    if(ev&&ev.type==="suspicious"){if(t===ev.p1)s+=20;}
    if(Math.random()<0.2)s+=Math.random()*30-15;
    sc[t]=s;});vo[w]=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0][0];});
  const tl={};aw.forEach(w=>{if(vo[w]){const t=vo[w];tl[t]=(tl[t]||0)+1;}});
  const ents=Object.entries(tl).sort((a,b)=>b[1]-a[1]);if(!ents.length)return null;
  if(ents[0][1]>=2)return{target:ents[0][0],tl,detail:vo,mode:"C"};
  return{target:ents[0][0],tl,detail:vo,mode:"P"};}
function wa(g,wt){const t=g.wu+g.wr;if(t>=3)return{};if(Math.random()<0.6&&g.wr<3)return{a:"r",t:wt};if(Math.random()<0.08&&g.wu<3){const c=g.a.filter(i=>i!=="yz"&&!W.includes(i)&&i!=="cm");if(c.length)return{a:"c",t:p(c)};}return{};}
function pr(g){const o=g.a.filter(i=>i!=="fh");if(!o.length)return null;const uc=o.filter(i=>!g.pc[i]);const t=uc.length?p(uc):p(o);const ch=C[t];g.pc[t]=ch.r==="hw"?"a":(ch.f==="w"?"e":"a");return{t,r:g.pc[t]};}
function kn(g){if(g.kd>0)return{a:"r"};const su=g.a.filter(i=>!W.includes(i)&&i!=="lx"&&i!=="cm");if(!su.length)return{a:"n"};if(Math.random()<0.13){let t;if(g.a.includes("tx")&&Math.random()<0.35){const nc=su.filter(s=>s!=="lx");t=nc.length?p(nc):p(su);}else t=p(su);return{a:"d",t,s:C[t].f==="w"};}if(Math.random()<0.3){const ts=g.a.filter(i=>i!=="lx"&&!W.includes(i)&&i!=="cm");if(ts.length){const wk=ts.filter(t=>t==="yz"||t==="sw");return{a:"g",t:wk.length?p(wk):p(ts)};}}return{a:"n"};}
function mg(g){const o=g.a.filter(i=>i!=="ss");if(o.length<2)return{a:"n"};const b=g.ms||[];const e=o.filter(i=>!b.includes(i));if(e.length<2)return{a:"n"};const sh=[...e].sort(()=>Math.random()-0.5);return{a:"s",p:[sh[0],sh[1]]};}
function genE(){const s=[...EV];for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}const r={};for(let d=2;d<=6;d++){const idx=Math.floor(Math.random()*s.length);r[d]=s.splice(idx,1)[0];}return r;}
function sim(sd){let s=sd;function rn(){s=(s*16807)%2147483647;return(s-1)/2147483646;}const g=gs();const ev=genE();const lg=[];
const FD=["","","[FD]Body","[FD]Search","[FD]Supplies","[FD]Escape","[FD]Split",""];
for(let d=1;d<=7;d++){const dl=[];
  if(FD[d])dl.push(FD[d]);const re=ev[d];if(re)dl.push(re.t);
const fj=fakeJump(g,d);
if(fj){
  const cn=C[fj.jumper].n+" claims prophet, accuses "+C[fj.target].n;
  dl.push("[HJ]"+cn+"!");
  // Fake jump affects wolves votes - they support the jumper
  if(fj.jumper==="zm"){dl.push("  (Zhao convincing...)");}
  if(fj.jumper==="gy"){dl.push("  (Gu rational...)");}
}
const k=kn(g);if(k.a==="d"){if(k.s){dl.push("[KT]LXk"+C[k.t].n+"(w)");g.a=r(g.a,k.t);g.dd.push(k.t);g.kd=2;}else{dl.push("[KT]LXk"+C[k.t].n+"(g)");g.a=r(g.a,k.t);g.dd.push(k.t);g.kd=3;}}else if(k.a==="g"){g.kl=true;g.kt=k.t;dl.push("[GD]LXg"+C[k.t].n);}else{if(g.kd>0){g.kd--;if(g.kd>0)dl.push("[KT]r"+g.kd);}g.kl=false;}
const p2=pr(g);if(p2)dl.push("[PR]FHc"+C[p2.t].n+":"+(p2.r==="a"?"A":"E"));
const m2=mg(g);if(m2.a==="s"){g.ms=[...m2.p];dl.push("[MG]SSs"+C[m2.p[0]].n+"x"+C[m2.p[1]].n);}
lg.push("D"+d);dl.forEach(e=>lg.push(" "+e));
const nl=["N"+d];const w=wv(g,ev[d],d);if(!w){lg.push(" wdead");lg.push("");continue;}
let at=w.target;const sp=g.ms||[];if(sp.length===2&&g.a.includes("ss")){if(sp.includes(w.target)&&rn()<0.5){const o=sp.find(i=>i!==w.target);at=o;nl.push("[MG]wc->"+C[o].n);}}g.ms=[];
Object.entries(w.detail).forEach(([k,v])=>{nl.push("[W]"+C[k].n+"->"+C[v].n);});
nl.push("[V]"+w.mode+" "+C[w.target].n);
let gd=false;if(g.kt&&g.kl){gd=g.kt===at;g.kt=null;}
const wx=wa(g,at);let sv=false;
if(wx.a==="r"){if(gd){nl.push("[W+G]c,"+C[at].n+"d");g.wr++;}else{nl.push("[W]YZs"+C[at].n);g.wr++;sv=true;}}else if(wx.a==="c"){nl.push("[W]YZc"+C[wx.t].n);g.wu++;}
if(!sv&&!gd){const ch=C[at];g.a=r(g.a,at);g.dd.push(at);nl.push("[X]"+ch.n);
if(ch.r==="wk"&&!g.zr){g.zr=true;const ow=W.filter(w=>w!==at&&g.a.includes(w));if(ow.length){const tk=p(ow);g.a=r(g.a,tk);g.dd.push(tk);nl.push("[WK]ZYt"+C[tk].n);}}
if(g.a.includes("gy")&&!g.gs){const rr=C[at].r;if(["pro","wit","kni","mag"].includes(rr)){g.gs=rr;nl.push("[MW]GYs"+ch.n+":"+rr);}}}
if(g.a.includes("zm"))nl.push("[CL]ZMCc");
const tu=g.wu+g.wr;if(tu>0)nl.push("[W]"+tu+"/3");
nl.forEach(e=>lg.push(" "+e));lg.push("");
const ah=g.a.filter(i=>!W.includes(i)).length;
if(d>=7)return{o:ah>0?"DAY7":"WIPE",ds:7,dd:g.dd,a:g.a,l:lg};
if(ah<=1)return{o:"NEAR_WIPE",ds:d,dd:g.dd,a:g.a,l:lg};
}return{o:"TO",ds:7,dd:g.dd,a:g.a,l:lg};}
const R=[];for(let i=0;i<20;i++)R.push(sim(i+1));
const S={d7:0,nw:0,ad:0,fh:0,yz:0,lx:0,ss:0,cm:0,sw:0,jb:0,zs:0,total:0,fj_zm:0,fj_gy:0,fj_none:0};
R.forEach(r=>{S[r.o]++;S.ad+=r.ds;
if(r.dd.includes("fh"))S.fh++;if(r.dd.includes("yz"))S.yz++;if(r.dd.includes("lx"))S.lx++;if(r.dd.includes("ss"))S.ss++;
if(r.dd.includes("cm"))S.cm++;if(r.dd.includes("sw"))S.sw++;if(r.dd.includes("jb"))S.jb++;if(r.dd.includes("zs"))S.zs++;
S.total+=r.dd.length;
const logText=r.l.join(" ");
if(logText.includes("Zhao convincing"))S.fj_zm++;
else if(logText.includes("Gu rational"))S.fj_gy++;
else S.fj_none++;
});S.ad=(S.ad/20).toFixed(1);S.avgd=(S.total/20).toFixed(1);
console.log("=== ESN v12 RandomFakeJump 20r ===");
console.log("DAY7:"+S.d7+" NW:"+S.nw+" AvgD:"+S.avgd+"/11  CM:"+S.cm+"/20");
console.log("FakeJump: ZM:"+S.fj_zm+" GY:"+S.fj_gy+" None:"+S.fj_none);
console.log("");
console.log("FH:"+S.fh+" YZ:"+S.yz+" LX:"+S.lx+" SS:"+S.ss);
console.log("SW:"+S.sw+" JB:"+S.jb+" ZS:"+S.zs);
console.log("");
for(let i=0;i<20;i++){const r=R[i];
console.log("==R"+(i+1)+" "+r.o+" d"+r.ds+" A"+r.a.length+" D"+r.dd.length);
r.l.forEach(l=>console.log(l));console.log("");}