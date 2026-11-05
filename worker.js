/* Dictionary work runs off the UI thread. All queries stay in this browser. */
let entries=[], hanzi={}, zhIndex=new Map(), enIndex=new Map(), exactEnglish=new Map(), pyIndex=new Map(), keys=[], pyKeys=[];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f1-5]/g,'').replace(/u:/g,'u').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const add=(map,key,id)=>{if(!key)return; if(!map.has(key))map.set(key,[]);map.get(key).push(id);};
function build(data, chars){
 entries=data;hanzi=chars;
 entries.forEach((e,i)=>{
  for(const z of new Set([e[0],e[1]]))add(zhIndex,z,i);
  add(pyIndex,norm(e[2]).replace(/ /g,''),i);
  const words=new Set();
  for(const d of e[3]){const n=norm(d);add(exactEnglish,n,i);for(const t of n.split(' '))if(t)words.add(t);}
  for(const t of words)add(enIndex,t,i);
 });keys=[...enIndex.keys()].sort();pyKeys=[...pyIndex.keys()].sort();
}
function prefixKeys(all,prefix){let lo=0,hi=all.length;while(lo<hi){const m=(lo+hi)>>1;if(all[m]<prefix)lo=m+1;else hi=m;}const out=[];for(let i=lo;i<all.length&&all[i].startsWith(prefix)&&out.length<180;i++)out.push(all[i]);return out;}
function rank(ids,q){const n=norm(q);const seen=new Set();return [...new Set(ids)].map(i=>({i,score:entries[i][3].some(d=>norm(d)===n)?0:entries[i][3].some(d=>norm(d).startsWith(n))?1:2})).sort((a,b)=>a.score-b.score||Math.min(...entries[a.i][3].map(d=>norm(d).startsWith(n)?d.length:999))-Math.min(...entries[b.i][3].map(d=>norm(d).startsWith(n)?d.length:999))||entries[a.i][1].length-entries[b.i][1].length||a.i-b.i).filter(x=>{const key=entries[x.i][3].find(d=>norm(d).startsWith(n))||entries[x.i][3][0];if(norm(key)===n)return true;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,12).map(x=>({id:x.i,entry:entries[x.i]}));}
function search(q){q=q.trim();if(!q)return [];
 if(/\p{Script=Han}/u.test(q)){
  let ids=[...(zhIndex.get(q)||[])];for(let i=0;i<entries.length&&ids.length<150;i++)if(entries[i][0].startsWith(q)||entries[i][1].startsWith(q))ids.push(i);
  return [...new Set(ids)].slice(0,12).map(id=>({id,entry:entries[id]}));
 }
 const n=norm(q),tokens=n.split(' '),last=tokens.at(-1);let ids=[...(exactEnglish.get(n)||[])];
 for(const k of prefixKeys(keys,last)){for(const id of enIndex.get(k)){if(tokens.slice(0,-1).every(t=>entries[id][3].some(d=>norm(d).split(' ').includes(t))))ids.push(id);}}
 for(const k of prefixKeys(pyKeys,n.replace(/ /g,'')))ids.push(...pyIndex.get(k));
 return rank(ids,q);
}
function best(ids){return ids?.find(i=>!entries[i][3].every(d=>/^(surname|variant of|old variant|see |CL:)/.test(d)))??ids?.[0];}
function segment(q){
 const chinese=/\p{Script=Han}/u.test(q), units=chinese?Array.from(q):q.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*|\d+|[^\w\s]/gu)||[];const result=[];
 for(let i=0;i<units.length;){let found=false;for(let n=Math.min(chinese?12:8,units.length-i);n>0;n--){const raw=units.slice(i,i+n).join(chinese?'':' ');const id=best((chinese?zhIndex:exactEnglish).get(chinese?raw:norm(raw)));if(id!==undefined){result.push({text:raw,id,entry:entries[id]});i+=n;found=true;break;}}if(!found){result.push({text:units[i],unknown:/[\p{L}\p{N}]/u.test(units[i])});i++;}}
 return result;
}
self.onmessage=async({data:m})=>{try{
 if(m.type==='init'){
  const results=await Promise.allSettled([fetch('data/cedict.json').then(r=>{if(!r.ok)throw Error('Word dictionary could not load');return r.json();}),fetch('data/hanzi.jsonl').then(r=>{if(!r.ok)throw Error('Character dictionary could not load');return r.text();})]);
  if(results[0].status==='rejected')throw results[0].reason;
  const chars={};if(results[1].status==='fulfilled')for(const line of results[1].value.split('\n'))if(line.trim()){const c=JSON.parse(line);chars[c.character]=c;}
  build(results[0].value,chars);self.postMessage({type:'ready',count:entries.length,characters:Object.keys(chars).length});return;
 }
 if(m.type==='search')self.postMessage({...m,results:search(m.q)});
 if(m.type==='lookup'){const ids=zhIndex.get(m.q)||exactEnglish.get(norm(m.q))||pyIndex.get(norm(m.q).replace(/ /g,''));self.postMessage({...m,results:ids?ids.map(id=>({id,entry:entries[id]})).slice(0,20):[],segments:ids?[]:segment(m.q)});}
 if(m.type==='char'){
  const c=hanzi[m.q],components=[...new Set(Array.from(c?.decomposition||'').filter(x=>!/[\u2ff0-\u2fff？?]/u.test(x)))];
  self.postMessage({...m,character:c,entries:(zhIndex.get(m.q)||[]).map(i=>entries[i]),components:components.map(ch=>({ch,data:hanzi[ch],entries:(zhIndex.get(ch)||[]).map(i=>entries[i])})),examples:entries.filter(e=>e[1].includes(m.q)&&e[1].length>1&&e[1].length<5).slice(0,6)});
 }
 }catch(e){self.postMessage({type:'error',id:m.id,message:e.message});}};
