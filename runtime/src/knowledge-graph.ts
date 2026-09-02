import {readdirSync,readFileSync,statSync,writeFileSync,mkdirSync} from "node:fs";
import {createHash,randomUUID} from "node:crypto";
import {homedir} from "node:os";
import {extname,basename,join,resolve} from "node:path";

export type GraphSource={name:string;path:string;enabled?:boolean;kind?:string};
export type GraphNode={id:string;label:string;kind:"concept"|"source";mentions:number};
export type GraphEdge={id:string;source:string;target:string;relation:string;weight:number;evidence:string[]};
export type GraphResult={status:"REAL"|"PARTIAL"|"BLOCKED";model:string;sourceCount:number;fileCount:number;chunkCount:number;nodes:GraphNode[];edges:GraphEdge[];output:string;receipt:string};

const TEXT_EXT=new Set([".txt",".md",".markdown",".json",".jsonl",".csv",".tsv",".html",".htm",".xml",".rtf",".yaml",".yml"]);
const SKIP=new Set([".git","node_modules","Caches",".Trash","dist","build"]);
const DEFAULT_MODEL=process.env.SYNTAX_GRAPH_MODEL||"qwen2.5:1.5b";
const OLLAMA=process.env.OLLAMA_URL||"http://127.0.0.1:11434";

function walk(root:string,files:string[]){const stack=[resolve(root)];while(stack.length){const p=stack.pop()!;let s;try{s=statSync(p)}catch{continue}if(s.isFile()){const e=extname(p).toLowerCase();if(TEXT_EXT.has(e)||e===".pdf"||e===".docx"||e===".xlsx"||e===".pptx")files.push(p);continue}if(!s.isDirectory()||SKIP.has(basename(p)))continue;try{for(const n of readdirSync(p))stack.push(join(p,n))}catch{}}}

function readText(path:string){try{const e=extname(path).toLowerCase();if(TEXT_EXT.has(e))return readFileSync(path,"utf8");return ""}catch{return ""}}
function chunks(text:string,size=1800,overlap=180){const out:string[]=[];for(let i=0;i<text.length;i+=size-overlap){const c=text.slice(i,i+size).trim();if(c)out.push(c);if(i+size>=text.length)break}return out}
function id(s:string){return createHash("sha256").update(s).digest("hex").slice(0,16)}

async function extract(chunk:string,model:string){
  const prompt=`Extract a small set of important concepts and typed relationships from this text. Return ONLY JSON in this shape: {"concepts":["..."],"relations":[{"from":"...","to":"...","relation":"..."}]}. Use 3-12 concise concepts. Only include relations supported by the text. Do not invent facts.\n\nTEXT:\n${chunk}`;
  const r=await fetch(`${OLLAMA}/api/generate`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({model,prompt,stream:false,format:"json",options:{temperature:0}})});
  if(!r.ok)throw new Error(`Ollama HTTP ${r.status}`);const j:any=await r.json();return JSON.parse(j.response||"{}");
}

function normalise(s:string){return s.trim().replace(/\s+/g," ").replace(/^[-•]+\s*/,"").slice(0,120)}
function sourceId(path:string){return `src_${id(path)}`}

export async function compileKnowledgeGraph(sources:GraphSource[],outDir:string,model=DEFAULT_MODEL):Promise<GraphResult>{
  const files:string[]=[];const active=sources.filter(s=>s.enabled!==false);for(const s of active)walk(s.path,files);
  if(!files.length)return {status:"BLOCKED",model,sourceCount:active.length,fileCount:0,chunkCount:0,nodes:[],edges:[],output:"",receipt:""};
  const nodes=new Map<string,GraphNode>();const edges=new Map<string,GraphEdge>();let chunkCount=0;let degraded=false;
  for(const file of files){const text=readText(file);if(!text)continue;for(const chunk of chunks(text)){chunkCount++;let x:any;try{x=await extract(chunk,model)}catch{degraded=true;continue}const concepts=(Array.isArray(x.concepts)?x.concepts:[]).map(normalise).filter(Boolean).slice(0,12);for(const c of concepts){const k=c.toLowerCase();const n=nodes.get(k)||{id:`n_${id(k)}`,label:c,kind:"concept",mentions:0};n.mentions++;nodes.set(k,n)}
      const rels=Array.isArray(x.relations)?x.relations:[];for(const rel of rels){const a=normalise(String(rel.from||"")),b=normalise(String(rel.to||"")),r=normalise(String(rel.relation||"related to"));if(!a||!b||a.toLowerCase()===b.toLowerCase())continue;const ak=a.toLowerCase(),bk=b.toLowerCase();if(!nodes.has(ak))nodes.set(ak,{id:`n_${id(ak)}`,label:a,kind:"concept",mentions:1});if(!nodes.has(bk))nodes.set(bk,{id:`n_${id(bk)}`,label:b,kind:"concept",mentions:1});const k=[ak,bk,r].join("|");const e=edges.get(k)||{id:`e_${id(k)}`,source:nodes.get(ak)!.id,target:nodes.get(bk)!.id,relation:r,weight:0,evidence:[]};e.weight++;if(e.evidence.length<3)e.evidence.push(chunk.slice(0,360));edges.set(k,e)}
    }}
  mkdirSync(outDir,{recursive:true});const graph={version:1,generated_at:new Date().toISOString(),model,sources:active,nodes:[...nodes.values()],edges:[...edges.values()]};const stamp=new Date().toISOString().replace(/[:.]/g,"-");const output=join(outDir,`graph-${stamp}.json`);writeFileSync(output,JSON.stringify(graph,null,2));
  const receiptPath=join(outDir,`receipt-${stamp}.json`);const receiptObj={receipt_id:randomUUID(),status:degraded?"PARTIAL":"REAL",operation:"knowledge-graph.compile",model,sources:active.map(s=>s.path),file_count:files.length,chunk_count:chunkCount,node_count:nodes.size,edge_count:edges.size,output,created_at:new Date().toISOString()};writeFileSync(receiptPath,JSON.stringify(receiptObj,null,2));
  return {status:degraded?"PARTIAL":"REAL",model,sourceCount:active.length,fileCount:files.length,chunkCount,nodes:[...nodes.values()],edges:[...edges.values()],output,receipt:receiptPath};
}

export function renderKnowledgeGraph(graph:Pick<GraphResult,"nodes"|"edges"|"model"|"output">,outDir:string){mkdirSync(outDir,{recursive:true});const target=join(outDir,basename(graph.output).replace(/\.json$/,".html"));const data=JSON.stringify({nodes:graph.nodes,edges:graph.edges}).replace(/</g,"\\u003c");const html=`<!doctype html><meta charset="utf-8"><title>Syntax Knowledge Graph</title><style>body{margin:0;font:14px system-ui;background:#111;color:#eee}header{padding:14px 18px;border-bottom:1px solid #333}svg{width:100vw;height:calc(100vh - 60px)}.edge{stroke:#666;stroke-width:1.5}.node{cursor:pointer}.label{fill:#ddd;font-size:12px;pointer-events:none}.hint{fill:#999}</style><header><b>Syntax Knowledge Graph</b> · model: ${graph.model} · source: ${basename(graph.output)}</header><svg id="g"></svg><script>const D=${data};const s=document.querySelector('svg'),W=innerWidth,H=innerHeight-60;let ns=D.nodes.map((n,i)=>({...n,x:W/2+(Math.random()-.5)*W*.7,y:H/2+(Math.random()-.5)*H*.7}));let es=D.edges;for(let k=0;k<350;k++){for(const e of es){let a=ns.find(n=>n.id===e.source),b=ns.find(n=>n.id===e.target);if(!a||!b)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1,f=(d-140)*.002;a.x+=dx/d*f;b.x-=dx/d*f;a.y+=dy/d*f;b.y-=dy/d*f}for(const a of ns)for(const b of ns){if(a===b)continue;let dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy)||1;if(d<90){let f=(90-d)/d*.35;a.x-=dx*f;a.y-=dy*f;b.x+=dx*f;b.y+=dy*f}}for(const n of ns){n.x=Math.max(30,Math.min(W-30,n.x));n.y=Math.max(30,Math.min(H-30,n.y))}}let out='';for(const e of es){let a=ns.find(n=>n.id===e.source),b=ns.find(n=>n.id===e.target);out+=\`<line class="edge" x1="\${a.x}" y1="\${a.y}" x2="\${b.x}" y2="\${b.y}"/><text class="label" x="\${(a.x+b.x)/2}" y="\${(a.y+b.y)/2}">\${esc(e.relation)}</text>\`}for(const n of ns){let r=Math.max(5,Math.min(18,5+Math.log2(n.mentions+1)*3));out+=\`<circle class="node" cx="\${n.x}" cy="\${n.y}" r="\${r}"/><text class="label" x="\${n.x+10}" y="\${n.y-10}">\${esc(n.label)}</text>\`}s.innerHTML=out;function esc(x){return String(x).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}</script>`;writeFileSync(target,html);return target}

export function defaultGraphSources():GraphSource[]{const home=homedir();return [
  {name:"mac-documents",kind:"mac",path:join(home,"Documents")},
  {name:"llm-chats",kind:"llm-chats",path:join(home,"Documents","LLM-Chats")},
  {name:"google-drive",kind:"gdrive",path:join(home,"Library","CloudStorage")}
]}
