#!/usr/bin/env node
// Synthetic example construction, not a project installer or general authoring API.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
export const kitRoot=path.resolve(here,'../..');
export const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const encode=v=>JSON.stringify(v,null,2)+'\n';
export function write(p,v){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,typeof v==='string'||Buffer.isBuffer(v)?v:encode(v),{flag:'wx'});}
export const read=p=>JSON.parse(fs.readFileSync(p));
export function run(command,args,{env=process.env,cwd}={}){const r=spawnSync(command,args,{encoding:'utf8',env,cwd,maxBuffer:64*1024*1024});assert.equal(r.error,undefined,String(r.error));assert.equal(r.status,0,`${command}: ${r.stderr}`);return r.stdout;}
export const invoke=(args,options)=>run(process.execPath,[path.join(kitRoot,'scripts/chronicle-kit.mjs'),...args],options);
const clock=options=>invoke(['now'],options).trim();
export function locations(config){const c=read(config);return {dataset:path.resolve(path.dirname(config),c.dataset_path),workflow:path.resolve(path.dirname(config),c.workflow_path)};}
export function inventory(root){const result={};function walk(p=''){for(const n of fs.readdirSync(path.join(root,p)).sort()){const q=p?`${p}/${n}`:n,s=fs.lstatSync(path.join(root,q));if(s.isDirectory())walk(q);else result[q]=hash(fs.readFileSync(path.join(root,q)));}}walk();return result;}
export function prepareExample(config,options={}){
 const {dataset,workflow}=locations(config);assert.ok(!fs.existsSync(dataset),'Example initializes only an explicitly selected absent dataset');assert.ok(!fs.existsSync(workflow),'Use absent synthetic workflow storage');
 run('chronicle',['init',dataset],options);
 // Fixture initialization only: establish a visibly synthetic identity before any history.
 fs.writeFileSync(path.join(dataset,'project.yaml'),encode({schema_version:1,project:{id:'lumen-synthetic',title:'Lumen specimen index — synthetic exercise'},display:{timezone:'UTC'}}));
 assert.equal(JSON.parse(run('chronicle',['validate',dataset],options)).valid,true);
 const id=`DSP-${crypto.randomUUID()}`,base=`dispositions/${id}`;
 const at=p=>path.join(workflow,p),ref=p=>({path:p,sha256:hash(fs.readFileSync(at(p)))});
 const packet=read(path.join(here,'first-packet.json'));
 const result=' iris '.trim();assert.equal(result,'iris');
 const report={scope:'This one synthetic label only',expression:'" iris ".trim()',result,expected:'iris',observed_at:clock(options),limitations:'Not an ingestion capability or gate acceptance.'};
 write(at('sources/trim-report.json'),report);
 const evd=JSON.parse(invoke(['capture','artifact','--config',config,'--source',at('sources/trim-report.json'),'--id','EVD-0001','--artifact','observations/trim-report.json','--title','Explicit specimen-label trimming observation','--kind','test_output','--media-type','application/json'],options));
 assert.deepEqual(fs.readFileSync(path.join(dataset,evd.source.path)),fs.readFileSync(at('sources/trim-report.json')));
 const evidence=[{locator:'EVD-0001',sha256:hash(fs.readFileSync(path.join(dataset,'evidence/records/EVD-0001.yaml')))},{locator:evd.source.path,sha256:evd.source.sha256}];
 write(at(`${base}/work-summary.md`),`# ${packet.packet_id}\n\n${encode(packet)}\n\nActual observation: ${encode(report)}\n\nEvidence bindings: ${encode(evidence)}\n`);
 write(at(`${base}/recommendation.md`),'# Read-only recommendation\n\nPrimary classification: ENGINEERING_EVENT\n\nRetain the new scoped diagnostic observation. It does not change project-level capability, chosen direction or important validated knowledge.\nEvidence: EVD-0001 and its exact captured artifact; the observed result supports only the selected label.\nUnresolved questions: none for this narrow observation; broader ingestion acceptance remains unestablished.\nCompanion Current/roadmap effects: none.\nCandidate history: none. Leave the event unlinked; no accepted milestone exists.\nDisposition handling: new assessment of lumen-trim-observation-1.\nThis scripted teaching recommendation is independently reviewed against the admission policy; it never approves publication.\n');
 write(at(`${base}/context/roadmap.yaml`),fs.readFileSync(path.join(dataset,'roadmap.yaml')));
 const metadata=read(path.join(kitRoot,'RELEASE.json')),pin=`pins/kit-${metadata.content_sha256}.json`;
 write(at(pin),fs.readFileSync(path.join(kitRoot,'RELEASE.json')));
 const context={format_version:1,project_id:'lumen-synthetic',current:null,previous_milestone:null,roadmap:ref(`${base}/context/roadmap.yaml`),history:[],acceptance:{actors:['collection-steward'],scope:'Retain this synthetic subordinate observation only; no milestone or capability acceptance.'},prior_dispositions:[],prior_receipts:[],snapshots:[ref(pin)],evidence_roles:[{locator:'EVD-0001',role:'record'},{locator:evd.source.path,role:'artifact'}],packet_review:{mode:'new',reason:'New scoped observation with no prior packet or disposition.',contributors:[]}};
 write(at(`${base}/context.json`),context);
 write(at(`${base}/inputs/event.yaml`),{schema_version:1,id:'EVT-000001',occurred_at:report.observed_at,recorded_at:clock(options),kind:'test',actor:{type:'tool',label:'specimen assistant'},outcome:'passed',summary:'The explicitly selected specimen label " iris " trims to "iris"; no broader capability accepted.',evidence:['EVD-0001']});
 const request={format_version:1,inputs:[{packet_id:packet.packet_id,summary:ref(`${base}/work-summary.md`),evidence}],actions:[{path:'engineering-events/EVT-000001.yaml',action:'create',source:`${base}/inputs/event.yaml`}],warning_reviews:[]};
 write(at(`${base}/request.json`),request);
 const before=inventory(dataset),review=JSON.parse(invoke(['prepare','--config',config,'--bundle',id,'--request',`${base}/request.json`],options));
 assert.deepEqual(inventory(dataset),before);assert.equal(review.state,'PREPARED_UNAPPROVED');
 write(at('example-state.json'),{synthetic:true,id,base,packet_id:packet.packet_id,adopted_pin:pin,prepared_dataset:before});
 return {config,dataset,workflow,id,base,review};
}
export function approveExample(config,options={}){
 const {dataset,workflow}=locations(config),s=read(path.join(workflow,'example-state.json'));assert.equal(s.synthetic,true);assert.equal(read(path.join(dataset,'project.yaml')).project.id,'lumen-synthetic');
 const at=p=>path.join(workflow,p),digest=p=>hash(fs.readFileSync(at(p))),request=read(at(`${s.base}/request.json`));
 const d={format_version:1,id:s.id,recorded_at:clock(options),actor:'collection-steward',inputs:request.inputs,context_digest:digest(`${s.base}/context.json`),recommendation_digest:digest(`${s.base}/recommendation.md`),classification:'ENGINEERING_EVENT',decision:'author',reason:'Explicit synthetic collection-steward approval of this exact subordinate event proposal after reviewing successful staged Core validation; no milestone.',proposal_digest:digest(`${s.base}/proposal.json`)};
 write(at(`${s.base}/disposition.json`),d);return d;
}
export function applyExample(config,options={}){
 const {dataset,workflow}=locations(config),s=read(path.join(workflow,'example-state.json'));
 const receipt=JSON.parse(invoke(['apply','--config',config,'--bundle',s.id],options));assert.equal(receipt.state,'PUBLISHED');assert.equal(receipt.validation.status,'VALID');assert.equal(JSON.parse(run('chronicle',['validate',dataset],options)).valid,true);assert.equal(fs.readdirSync(path.join(dataset,'engineering-events')).length,1);assert.equal(fs.existsSync(path.join(dataset,'milestones'))?fs.readdirSync(path.join(dataset,'milestones')).length:0,0);assert.ok(!fs.existsSync(path.join(dataset,'current.yaml')));return receipt;
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{
 const [mode,root,...extra]=process.argv.slice(2);assert.ok(['prepare','approve','apply'].includes(mode)&&root&&!extra.length,'Usage: node examples/consumer/exercise.mjs prepare|approve|apply <synthetic-sandbox>');const config=path.resolve(root,'settings/notes.json');
 if(mode==='prepare'){assert.ok(!fs.existsSync(path.resolve(root)),'Sandbox must be absent');fs.mkdirSync(path.resolve(root),{recursive:true});write(config,{format_version:1,dataset_path:'../specimen-ledger',dataset_tracking:'local',workflow_path:'../decision-cabinet',workflow_tracking:'local'});process.stdout.write(encode(prepareExample(config)));}
 if(mode==='approve')process.stdout.write(encode(approveExample(config)));
 if(mode==='apply')process.stdout.write(encode(applyExample(config)));
}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
