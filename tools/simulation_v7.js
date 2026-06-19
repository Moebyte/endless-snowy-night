// ESN v7 - ChenMo immune to wolf kills
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
function rm(a,i){return a.filter(x=>x!==i)}
function gs(){return {a:Object.keys(C),dd:[],wu:0,wr:0,kd:0,kl:0,kt:null,ms:[],pc:{},gs:null,zr:false};}
const EV=[
  {t:"[RE]TXwhispersSwhides",sus:"sw",amt:25},
  {t:"[RE]FHandZYargueloudly",sus:"zy",amt:20},
  {t:"[RE]SScountingcards",sus:"ss",amt:20},
  {t:"[RE]YZtreatingwound",trust:"yz",amt:15},
  {t:"[RE]BrokenwindowZMseesJBrunning",sus:"jb",amt:25},
  {t:"[RE]LXfoundscratchmsgGTOUT",trust:"lx",amt:15},
  {t:"[RE]GYaskingtoomanyQs",sus:"gy",amt:20},
  {t:"[RE]SWcryinginchapel",trust:"sw",amt:15},
  {t:"[RE]TXluggageopened",sus:"tx",amt:20},
  {t:"[RE]FHsenseevilbasement",sus:"zy",amt:20},
  {t:"[RE]ZSoldphotos",sus:"zs",amt:20},
  {t:"[RE]CMfoundlockedroom",trust:"cm",amt:15}
];
function wv(g,ev,day){
  const aw=W.filter(w=>g.a.includes(w));if(!aw.length)return null;const vo={};
  aw.forEach(w=>{const tg=g.a.filter(i=>!W.includes(i)&&i!=="cm");if(!tg.length)return;const sc={};
  tg.forEach(t=>{
    let s=20+Math.random()*35;
    if(w==="zy"){if(t==="lx")s+=18;}
    if(w==="gy"){s+=Math.random()*25;}
    if(w==="tx"){if(t==="lx")s-=35;if(t==="sw")s+=30;if(t==="zs")s+=5;}
    if(w==="zm"){if(t==="zs")s+=30;if(t==="jb")s+=8;}
    if(ev&&ev.sus&&t===ev.sus)s+=ev.amt||20;
    if(ev&&ev.trust&&t===ev.trust)s-=Math.min(s-5,(ev.amt||10)+5);
    if(day===2){if(t==="zs"||t==="yz")s+=12;}
    if(day===3)s+=5;
    if(day===5){if(t==="jb"||t==="ss")s+=15;if(t==="gy")s+=10;}
    if(Math.random()<0.15)s+=Math.random()*30-15;
    sc[t]=s;});vo[w]=Object.entries(sc).sort((a,b)=>b[1]-a[1])[0][0];});
  const tl={};aw.forEach(w=>{const t=vo[w];tl[t]=(tl[t]||0)+1;});
  const ents=Object.entries(tl).sort((a,b)=>b[1]-a[1]);
  if(ents[0][1]>=2)return{target:ents[0][0],tl,detail:vo,mode:"C"};
  return{target:ents[0][0],tl,detail:vo,mode:"P"};}
function wa(g,wt){const t=g.wu+g.wr;if(t>=3)return{};if(Math.random()<0.6&&g.wr<3)return{a:"r",t:wt};if(Math.random()<0.08&&g.wu<3){const c=g.a.filter(i=>i!=="yz"&&!W.includes(i)&&i!=="cm");if(c.length)return{a:"c",t:p(c)};}return{};}
function pr(g){const o=g.a.filter(i=>i!=="fh");if(!o.length)return null;const uc=o.filter(i=>!g.pc[i]);const t=uc.length?p(uc):p(o);const ch=C[t];g.pc[t]=ch.r==="hw"?"a":(ch.f==="w"?"e":"a");return{t,r:g.pc[t]};}
function kn(g){if(g.kd>0)return{a:"r"};const su=g.a.filter(i=>!W.includes(i)&&i!=="lx"&&i!=="cm");if(!su.length)return{a:"n"};if(Math.random()<0.13){let t;if(g.a.includes("tx")&&Math.random()<0.35){const nc=su.filter(s=>s!=="lx");t=nc.length?p(nc):p(su);}else t=p(su);return{a:"d",t,s:C[t].f==="w"};}if(Math.random()<0.3){const ts=g.a.filter(i=>i!=="lx"&&!W.includes(i)&&i!=="cm");if(ts.length){const wk=ts.filter(t=>t==="yz"||t==="sw");return{a:"g",t:wk.length?p(wk):p(ts)};}}return{a:"n"};}
function mg(g){const o=g.a.filter(i=>i!=="ss");if(o.length<2)return{a:"n"};const b=g.ms||[];const e=o.filter(i=>!b.includes(i));if(e.length<2)return{a:"n"};const sh=[...e].sort(()=>Math.random()-0.5);return{a:"s",p:[sh[0],sh[1]]};}
function fj(g,d){if(!g.a.includes("tx")||d<2)return null;if(Math.random()<0.18){const t=p(g.a.filter(i=>i!=="tx"&&i!=="cm"));return{t,c:"e"};}return null;}
function genE(){const s=[...EV];for(let i=s.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[s[i],s[j]]=[s[j],s[i]];}const r={};for(let d=2;d<=6;d++){const idx=Math.floor(Math.random()*s.length);r[d]=s.splice(idx,1)[0];}return r;}
function sim(sd){let s=sd;function rn(){s=(s*16807)%2147483647;return(s-1)/2147483646;}const g=gs();const ev=genE();const lg=[];
const FD=["","","[FD]Bodyfound","[FD]Roomsearch","[FD]Supplieslow","[FD]Escapeattempt","[FD]Survivorssplit",""];
for(let d=1;d<=7;d++){const dl=[];
  if(FD[d])dl.push(FD[d]);const re=ev[d];if(re)dl.push(re.t);
const j=fj(g,d);if(j)dl.push("[HJ]TX->"+C[j.t].n);
const k=kn(g);if(k.a==="d"){if(k.s){dl.push("[KT]LXk"+C[k.t].n+"(w)");g.a=rm(g.a,k.t);g.dd.push(k.t);g.kd=2;}else{dl.push("[KT]LXk"+C[k.t].n+"(g)");g.a=rm(g.a,k.t);g.dd.push(k.t);g.kd=3;}}else if(k.a==="g"){g.kl=true;g.kt=k.t;dl.push("[GD]LXg"+C[k.t].n);}else{if(g.kd>0){g.kd--;if(g.kd>0)dl.push("[KT]r"+g.kd);}g.kl=false;}
const p2=pr(g);if(p2)dl.push("[PR]FHc"+C[p2.t].n+":"+(p2.r==="a"?"A":"E"));
const m2=mg(g);if(m2.a==="s"){g.ms=[...m2.p];dl.push("[MG]SSs"+C[m2.p[0]].n+"x"+C[m2.p[1]].n);}
lg.push("D"+d);dl.forEach(e=>lg.push(" "+e));
const nl=["N"+d];const w=wv(g,ev[d],d);if(!w){lg.push(" wdead");lg.push("");break;}
let at=w.target;const sp=g.ms||[];if(sp.length===2&&g.a.includes("ss")){if(sp.includes(w.target)&&rn()<0.5){const o=sp.find(i=>i!==w.target);at=o;nl.push("[MG]wc->"+C[o].n);}}g.ms=[];
Object.entries(w.detail).forEach(([k,v])=>{nl.push("[W]"+C[k].n+"->"+C[v].n);});
nl.push("[V]"+w.mode+" "+C[w.target].n);
let gd=false;if(g.kt&&g.kl){gd=g.kt===at;g.kt=null;}
const wx=wa(g,at);let sv=false;
if(wx.a==="r"){if(gd){nl.push("[W+G]c,"+C[at].n+"d");g.wr++;}else{nl.push("[W]YZs"+C[at].n);g.wr++;sv=true;}}else if(wx.a==="c"){nl.push("[W]YZc"+C[wx.t].n);g.wu++;}
if(!sv&&!gd){const ch=C[at];g.a=rm(g.a,at);g.dd.push(at);nl.push("[X]"+ch.n);
if(ch.r==="wk"&&!g.zr){g.zr=true;const ow=W.filter(w=>w!==at&&g.a.includes(w));if(ow.length){const tk=p(ow);g.a=rm(g.a,tk);g.dd.push(tk);nl.push("[WK]ZYt"+C[tk].n);}}
if(g.a.includes("gy")&&!g.gs){const rr=C[at].r;if(["pro","wit","kni","mag"].includes(rr)){g.gs=rr;nl.push("[MW]GYs"+ch.n+":"+rr);}}}
if(g.a.includes("zm"))nl.push("[CL]ZMCc");
const tu=g.wu+g.wr;if(tu>0)nl.push("[W]"+tu+"/3");
nl.forEach(e=>lg.push(" "+e));lg.push("");
const ah=g.a.filter(i=>!W.includes(i)).length;const aw=g.a.filter(i=>W.includes(i)).length;
if(d>=7)return{o:ah>0?"DAY7":"WIPE",ds:7,dd:g.dd,a:g.a,l:lg};
if(ah<=1)return{o:"NEAR_WIPE",ds:d,dd:g.dd,a:g.a,l:lg};
}return{o:"TO",ds:7,dd:g.dd,a:g.a,l:lg};}
const R=[];for(let i=0;i<20;i++)R.push(sim(i+1));
const S={d7:0,nw:0,ad:0,fh:0,yz:0,lx:0,ss:0,cm:0,sw:0,jb:0,zs:0,total:0};
R.forEach(r=>{S[r.o]++;S.ad+=r.ds;
if(r.dd.includes("fh"))S.fh++;if(r.dd.includes("yz"))S.yz++;if(r.dd.includes("lx"))S.lx++;if(r.dd.includes("ss"))S.ss++;
if(r.dd.includes("cm"))S.cm++;if(r.dd.includes("sw"))S.sw++;if(r.dd.includes("jb"))S.jb++;if(r.dd.includes("zs"))S.zs++;
S.total+=r.dd.length;});S.ad=(S.ad/20).toFixed(1);S.avgd=(S.total/20).toFixed(1);
console.log("=== ESN v7 CM immune 20r ===");
console.log("DAY7:"+S.d7+" NW:"+S.nw+" AvgDth:"+S.avgd+"/11");
console.log("");
console.log("Deaths:");
console.log(" FH:"+S.fh+" YZ:"+S.yz+" LX:"+S.lx+" SS:"+S.ss);
console.log(" CM:"+S.cm+" SW:"+S.sw+" JB:"+S.jb+" ZS:"+S.zs);
console.log("");
for(let i=0;i<20;i++){const r=R[i];
console.log("==R"+(i+1)+" "+r.o+" d"+r.ds+" A"+r.a.length+" D"+r.dd.length);
r.l.forEach(l=>console.log(l));console.log("");}