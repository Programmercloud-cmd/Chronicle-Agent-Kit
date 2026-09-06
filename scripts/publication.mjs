// Guarded local publication only. Chronicle CLI owns data validity.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { now, checkPath, flatConfig, tracking, sourceBytes } from './chronicle-kit.mjs';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const encode = v => Buffer.from(`${JSON.stringify(v, null, 2)}\n`);
const fail = m => { throw new Error(m); };
const same = (a,b) => JSON.stringify(a) === JSON.stringify(b);
const digest = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
function instant(v) {
  if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:Z|[+-]\d\d:\d\d)$/.test(v)||!Number.isFinite(Date.parse(v)))return false;
  const local=`${v.slice(0,19)}Z`, parsed=Date.parse(local);
  return Number.isFinite(parsed)&&new Date(parsed).toISOString().replace(/\.\d{3}Z$/,'Z')===local;
}

const uuid = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const bundleID = id => typeof id === 'string' && new RegExp(`^DSP-${uuid}$`).test(id);
const classes = ['NO_CHRONICLE_UPDATE','ENGINEERING_EVENT','CURRENT_STATE_UPDATE','MILESTONE_CANDIDATE','BRANCH_OR_DIRECTION_CHANGE'];
const inside = (a,b) => b === a || b.startsWith(`${a.endsWith('/') ? a.slice(0,-1) : a}/`);
const mutable = ['project.yaml','current.yaml','roadmap.yaml'];
function object(v, required, optional=[]) {
  if (!v || typeof v !== 'object' || Array.isArray(v) || required.some(k=>!Object.hasOwn(v,k)) || Object.keys(v).some(k=>![...required,...optional].includes(k))) fail(`Malformed workflow object; expected ${required.join(', ')}`);
}
function text(v) { if (typeof v !== 'string' || !v.trim()) fail('Expected nonempty workflow string'); }
function list(v) { if (!Array.isArray(v)) fail('Expected workflow array'); }
// Parse JSON normally, then walk original tokens to detect duplicate keys at every nesting level.
export function strictJSON(bytes) {
  const s = bytes.toString('utf8'), result = JSON.parse(s); let i=0;
  const ws=()=>{while (/\s/.test(s[i] || '') && i<s.length) i++;};
  function string() { const start=i++; while(i<s.length) { if(s[i]==='\\') i+=2; else if(s[i++]==='"') return JSON.parse(s.slice(start,i)); } fail('Unterminated JSON string'); }
  function value() { ws(); if(s[i]==='{') { i++; ws(); const keys=new Set(); if(s[i]==='}') {i++;return;} while(true) { ws(); const k=string(); if(keys.has(k)) fail(`Duplicate JSON key: ${k}`); keys.add(k); ws(); i++; value(); ws(); if(s[i++]==='}') break; } } else if(s[i]==='[') { i++; ws(); if(s[i]===']') {i++;return;} while(true) {value();ws();if(s[i++]===']')break;} } else if(s[i]==='"') string(); else {while(i<s.length && !/[\s,}\]]/.test(s[i]))i++;} }
  value(); return result;
}
function relative(p) {
  text(p); if(/[\\:\x00-\x1f\x7f]/.test(p) || p.startsWith('/') || p.split('/').some(s=>!s||s==='.'||s==='..'||/[. ]$/.test(s))) fail('Unsafe relative workflow/dataset path'); return p;
}
function read(root, rel) { return sourceBytes(checkPath(path.join(root,relative(rel)),{absent:false})); }
function json(root, rel) { return strictJSON(read(root,rel)); }
function exclusive(file, bytes) {
  checkPath(file); fs.mkdirSync(path.dirname(file),{recursive:true}); checkPath(file);
  const fd=fs.openSync(file,fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o644);
  try {fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);} finally {fs.closeSync(fd);}
}
function put(root, rel, value) { exclusive(path.join(root,relative(rel)),encode(value)); return {path:rel,sha256:sha(read(root,rel))}; }
function bind(root, rel) { return {path:rel,sha256:sha(read(root,rel))}; }
function ref(root, value) { object(value,['path','sha256']); if(!digest(value.sha256)||sha(read(root,value.path))!==value.sha256)fail(`Artifact digest mismatch: ${value.path}`); return value; }
function inventory(root) {
  const files=[]; function walk(dir,base='') {
    checkPath(dir,{absent:false}); const names=fs.readdirSync(dir).sort(); const aliases=new Set();
    for(const name of names) { const folded=name.normalize('NFC').toLowerCase(); if(aliases.has(folded)) fail('Case/Unicode collision in inventory'); aliases.add(folded); const rel=base ? `${base}/${name}`:name; relative(rel); const file=path.join(root,rel), st=fs.lstatSync(file); if(st.isDirectory())walk(file,rel); else if(st.isFile())files.push({path:rel,sha256:sha(read(root,rel))}); else fail(`Nonregular/symlink inventory entry: ${rel}`); }
  } walk(root); return files.sort((a,b)=>a.path.localeCompare(b.path,'en'));
}
function state(root) {
  const files=inventory(root), directories=[];
  function walk(dir,base=''){for(const name of fs.readdirSync(dir).sort()){const rel=base?`${base}/${name}`:name;if(fs.lstatSync(path.join(root,rel)).isDirectory()){directories.push(rel);walk(path.join(root,rel),rel);}}}
  walk(root);return {files,directories:directories.sort(),absent:mutable.filter(p=>!files.some(f=>f.path===p))};
}
function identity(bytes) {
  const s=bytes.toString('utf8'); if(s.trimStart().startsWith('{')) {const v=strictJSON(bytes); text(v.project?.id); return v.project.id;}
  // Deliberately only a flat block mapping with single-line scalar leaves. No YAML interpreter.
  let scope='', result=null; const keys=new Set();
  for(const line of s.split(/\r?\n/)) {
    if(!line.trim()||/^\s*#/.test(line))continue;
    const m=/^( {0}| {2})([A-Za-z_][A-Za-z_0-9]*):(?: (.*))?$/.exec(line);
    if(!m)fail('Unsupported project identity YAML; use simple block mappings or JSON');
    const [,indent,key,raw]=m;
    if(!indent)scope=key;
    const compound=indent?`${scope}.${key}`:key; if(keys.has(compound))fail('Ambiguous project identity keys'); keys.add(compound);
    if(raw===undefined) {if(indent)fail('Unsupported project YAML nesting');continue;}
    let scalar;
    if(raw.startsWith('"')) {try{scalar=JSON.parse(raw);}catch{fail('Unsupported quoted project scalar');} if(typeof scalar!=='string')fail('Unsupported project scalar');}
    else if(/^'([^']|'')*'$/.test(raw)) scalar=raw.slice(1,-1).replaceAll("''", "'");
    else {if(!/^[A-Za-z0-9][A-Za-z0-9_. /-]*$/.test(raw))fail('Unsupported project YAML scalar');scalar=raw;}
    if(compound==='project.id') {text(scalar);result=scalar;}
  }
  if(!result)fail('Missing unambiguous project.id'); return result;
}
function config(filename, proposed=[]) {
  if(!filename)fail('Publication requires explicit --config'); const location=checkPath(filename,{absent:false}), bytes=sourceBytes(location), v=flatConfig(bytes.toString());
  const dataset=checkPath(path.resolve(path.dirname(location),v.dataset_path),{absent:false}), workflow=checkPath(path.resolve(path.dirname(location),v.workflow_path));
  const fold=s=>s.normalize('NFC').toLowerCase(); if(inside(fold(dataset),fold(workflow))||inside(fold(workflow),fold(dataset))||inside(fold(dataset),fold(location)))fail('Configuration/workflow must be outside and disjoint from dataset');
  if(!fs.statSync(dataset).isDirectory())fail('Expected existing dataset');
  for(const p of ['project.yaml','roadmap.yaml'])read(dataset,p);
  checkPath(path.join(workflow,'operations/capture.lock'));
  tracking(dataset,v.dataset_tracking,proposed.map(p=>path.join(dataset,relative(p)))); tracking(workflow,v.workflow_tracking,[path.join(workflow,'operations/capture.lock'),path.join(workflow,'operations/capture.lock/operation.json')]);
  return {config_path:location,config_base:path.dirname(location),config_sha256:sha(bytes),dataset,workflow,dataset_tracking:v.dataset_tracking,workflow_tracking:v.workflow_tracking};
}
function coreIdentity() {
  let executable; for(const entry of (process.env.PATH||'').split(path.delimiter)) {const candidate=path.resolve(entry,'chronicle');try{fs.accessSync(candidate,fs.constants.X_OK);if(fs.statSync(candidate).isFile()){executable=fs.realpathSync(candidate);break;}}catch{}}
  if(!executable)fail('Installed chronicle CLI unavailable');
  let dir=path.dirname(executable), metadata;
  while(dir!==path.dirname(dir)) {const p=path.join(dir,'package.json');if(fs.existsSync(p)){const v=JSON.parse(fs.readFileSync(p));if(v.name==='project-chronicle'){if(v.version!=='0.2.1')fail('Core v0.2.1 required');metadata={path:p,sha256:sha(fs.readFileSync(p)),version:v.version};break;}}dir=path.dirname(dir);}
  if(!metadata)fail('Cannot identify public Core package metadata');
  return {executable,executable_sha256:sha(fs.readFileSync(executable)),package:metadata,target_commit:'7ed80d3b64b7affef12b8509a5adb814d7ce14b1'};
}
function validate(dataset, workflow, prefix, expectedCore) {
  const core=coreIdentity(); if(expectedCore&&!same(core,expectedCore))fail('Core execution identity changed');
  const run=spawnSync(core.executable,['validate',dataset],{maxBuffer:64*1024*1024,timeout:60000});
  exclusive(path.join(workflow,`${prefix}/stdout.bin`),run.stdout||Buffer.alloc(0));exclusive(path.join(workflow,`${prefix}/stderr.bin`),run.stderr||Buffer.alloc(0));
  let status='EXECUTION_ERROR', payload=null;
  if(!run.error&&!run.signal) {try{payload=strictJSON(run.status===0?run.stdout:run.stderr);if(run.status===0&&run.stderr.length===0) {object(payload,['valid','warnings']);list(payload.warnings);if(payload.valid===true&&payload.warnings.every(w=>w&&typeof w==='object'&&!Array.isArray(w)))status='VALID';} else if(run.status===1&&run.stdout.length===0) {object(payload,['valid','diagnostics']);list(payload.diagnostics);if(payload.valid===false)status='INVALID';}}catch{status='PROTOCOL_ERROR';}}
  const result={status,exit_status:run.status,signal:run.signal,error:run.error?.message||null,core,argv:[core.executable,'validate',dataset],stdout:bind(workflow,`${prefix}/stdout.bin`),stderr:bind(workflow,`${prefix}/stderr.bin`),payload};
  return {...result,record:put(workflow,`${prefix}/result.json`,result)};
}
function validationBinding(workflow,v,{prefix,dataset,core}) {
  object(v,['status','exit_status','signal','error','core','argv','stdout','stderr','payload','record']);
  if(v.record.path!==`${prefix}/result.json`||v.stdout.path!==`${prefix}/stdout.bin`||v.stderr.path!==`${prefix}/stderr.bin`||!same(v.argv,[core.executable,'validate',dataset])||!same(v.core,core))fail('Validation phase/operation/dataset binding mismatch');
  const actual=json(workflow,ref(workflow,v.record).path), copy={...v};delete copy.record;if(!same(actual,copy))fail('Validation result mismatch');
  ref(workflow,v.stdout);ref(workflow,v.stderr);if(v.status!=='VALID'||v.exit_status!==0||v.signal||v.error||v.payload?.valid!==true)fail('Proposal validation is not successful');
  const payload=strictJSON(read(workflow,v.stdout.path));object(payload,['valid','warnings']);list(payload.warnings);if(!same(payload,v.payload)||read(workflow,v.stderr.path).length)fail('Validation output mismatch');
}
function warningReviews(warnings,reviews) {
  list(reviews);if(warnings.length!==reviews.length)fail('Every Core warning requires explicit reviewed disposition');
  for(let i=0;i<warnings.length;i++){object(reviews[i],['warning','decision','reason']);text(reviews[i].reason);if(reviews[i].decision!=='accept'||!same(reviews[i].warning,warnings[i]))fail('Warning review mismatch');}
}
function evidence(cfg,e,role='reference') {
  object(e,['locator','sha256']);if(!digest(e.sha256))fail('Invalid evidence digest');text(e.locator);
  const coreID=/^[A-Z][A-Z0-9]*-[A-Z0-9-]+$/.test(e.locator);let raw;
  if(coreID) {
    if(!['record','reference'].includes(role))fail('Chronicle ID requires record evidence role');
    const matches=inventory(cfg.dataset).filter(f=>path.posix.basename(f.path)===`${e.locator}.yaml`&&!f.path.startsWith('evidence/artifacts/'));
    if(matches.length!==1||matches[0].sha256!==e.sha256)fail(`Chronicle locator not uniquely digest-bound: ${e.locator}`);raw=read(cfg.dataset,matches[0].path);
    if(!e.locator.startsWith('EVD-'))return null;
  } else if(e.locator.startsWith('evidence/artifacts/')) {
    if(!['artifact','reference'].includes(role))fail('Dataset artifact requires artifact evidence role');raw=read(cfg.dataset,e.locator);if(sha(raw)!==e.sha256)fail('Evidence artifact digest mismatch');return null;
  } else {ref(cfg.workflow,{path:e.locator,sha256:e.sha256});raw=read(cfg.workflow,e.locator);if(role!=='record')return null;}
  let record;try{record=strictJSON(raw);}catch{fail('Declared/Core-ID record evidence requires supported JSON serialization');}
  if(!record||typeof record!=='object'||Array.isArray(record)||record.schema_version!==1||typeof record.id!=='string'||!record.id)fail('Malformed declared Core record evidence');
  if(coreID&&record.id!==e.locator)fail('Core record identity does not match locator');
  if(record.id.startsWith('EVD-')) {if(!record.source||!['artifact','url','repository_ref'].includes(record.source.kind))fail('Malformed Core evidence source');if(record.source.kind==='artifact'){if(!digest(record.source.sha256))fail('Malformed record artifact digest');relative(record.source.path);return {sha256:record.source.sha256};}}
  return null;
}
function evidenceRoles(inputs,roles) {
  list(roles);const locators=new Set();list(inputs);for(const input of inputs){list(input.evidence);for(const e of input.evidence){object(e,['locator','sha256']);text(e.locator);locators.add(e.locator);}}
  const declared=new Map();for(const r of roles){object(r,['locator','role']);text(r.locator);if(!['record','artifact','opaque'].includes(r.role)||declared.has(r.locator)||!locators.has(r.locator))fail('Duplicate, unknown or invalid evidence role declaration');declared.set(r.locator,r.role);}
  if(declared.size!==locators.size)fail('Every input evidence locator requires exactly one explicit role');return declared;
}
function inputBindings(cfg,inputs,bundle) {
  const roles=evidenceRoles(inputs,json(cfg.workflow,`${bundle}/context.json`).evidence_roles);
  list(inputs);if(!inputs.length)fail('Empty work packet inputs');const ids=new Set();let combined=false;
  for(const x of inputs){object(x,['packet_id','summary','evidence']);text(x.packet_id);if(ids.has(x.packet_id))fail('Duplicate packet ID');ids.add(x.packet_id);ref(cfg.workflow,x.summary);if(x.summary.path===`${bundle}/work-summary.md`)combined=true;else{const summary=read(cfg.workflow,`${bundle}/work-summary.md`).toString();if(!summary.includes(x.summary.path)||!summary.includes(x.summary.sha256))fail('Combined summary must list and hash each packet summary');}list(x.evidence);for(const e of x.evidence){const artifact=evidence(cfg,e,roles.get(e.locator));if(artifact&&!x.evidence.some(b=>roles.get(b.locator)==='artifact'&&b.sha256===artifact.sha256&&b.locator!==e.locator))fail('Evidence record requires exact artifact binding');}}
  if(!combined)fail('Combined work-summary.md must be bound');
}
function contextBindings(cfg,bundle,baseline,inputs,{live=true}={}) {
  const c=json(cfg.workflow,`${bundle}/context.json`);object(c,['format_version','project_id','current','previous_milestone','roadmap','history','acceptance','prior_dispositions','prior_receipts','snapshots','packet_review','evidence_roles']);
  evidenceRoles(inputs,c.evidence_roles);if(c.format_version!==1)fail('Unsupported context version');text(c.project_id);if(c.project_id!==identity(read(cfg.dataset,'project.yaml')))fail('Context project identity mismatch');
  const current=baseline.files.find(f=>f.path==='current.yaml');if(!current){if(c.current!==null)fail('Context Current must explicitly be absent');}else{ref(cfg.workflow,c.current);if(c.current.sha256!==current.sha256)fail('Stale Current context snapshot');}
  ref(cfg.workflow,c.roadmap);if(c.roadmap.sha256!==baseline.files.find(f=>f.path==='roadmap.yaml')?.sha256)fail('Stale roadmap context snapshot');
  object(c.acceptance,['actors','scope']);list(c.acceptance.actors);if(!c.acceptance.actors.length)fail('Missing accountable actors');c.acceptance.actors.forEach(text);text(c.acceptance.scope);
  for(const field of ['history','snapshots','prior_dispositions','prior_receipts'])list(c[field]);for(const r of [...c.history,...c.snapshots,...c.prior_receipts])ref(cfg.workflow,r);
  if(c.previous_milestone!==null)evidence(cfg,c.previous_milestone);
  object(c.packet_review,['mode','reason','contributors']);if(!['new','reconsider','aggregate'].includes(c.packet_review.mode))fail('Invalid packet review mode');text(c.packet_review.reason);list(c.packet_review.contributors);c.packet_review.contributors.forEach(text);
  for(const p of c.prior_dispositions){object(p,['id','sha256']);if(!bundleID(p.id)||!digest(p.sha256))fail('Invalid prior disposition reference');ref(cfg.workflow,{path:`dispositions/${p.id}/disposition.json`,sha256:p.sha256});}
  if(live)inputBindings(cfg,inputs,bundle); return c;
}
function actionsCheck(cfg,actions,baseline) {
  list(actions);if(!actions.length)fail('Empty proposal');const paths=new Set();
  for(const a of actions){object(a,['path','action','source']);relative(a.path);relative(a.source);if(!['create','replace'].includes(a.action))fail('Deletion/unknown action forbidden');
    if(!mutable.includes(a.path)&&! /^(branches|milestones|engineering-events|revisions)\/[^/]+\.yaml$/.test(a.path)&&!/^evidence\/records\/[^/]+\.yaml$/.test(a.path)&&!a.path.startsWith('evidence/artifacts/'))fail('Unauthorized dataset target');
    const fold=a.path.normalize('NFC').toLowerCase();if(paths.has(fold))fail('Case/duplicate action collision');paths.add(fold);checkPath(path.join(cfg.dataset,a.path));
    const old=baseline.files.find(f=>f.path===a.path);if(a.action==='replace'&&(!mutable.includes(a.path)||!old))fail('Historical overwrite or missing mutable replacement forbidden');if(a.action==='replace'&&fs.lstatSync(path.join(cfg.dataset,a.path)).nlink!==1)fail('Mutable hardlink destination forbidden');if(a.action==='create'&&old)fail('Create-only target already exists');
    read(cfg.workflow,a.source);if(a.path==='project.yaml'&&identity(read(cfg.workflow,a.source))!==identity(read(cfg.dataset,'project.yaml')))fail('Project identity replacement forbidden');
  }
}
function locked(cfg,operation,fn) {
  const lock=path.join(cfg.workflow,'operations/capture.lock');checkPath(lock);fs.mkdirSync(path.dirname(lock),{recursive:true});fs.mkdirSync(lock);
  const marker=encode({operation,id:crypto.randomUUID(),started_at:now(),dataset:cfg.dataset});exclusive(path.join(lock,'operation.json'),marker);
  let retain=false;const release=()=>{if(sha(sourceBytes(checkPath(path.join(lock,'operation.json'),{absent:false})))!==sha(marker)||fs.readdirSync(lock).length!==1)fail('Ambiguous lock ownership; retained for reconciliation');fs.unlinkSync(path.join(lock,'operation.json'));fs.rmdirSync(lock);};const control={retain:()=>{retain=true;},lock,release};
  try{return fn(control);}finally{if(!retain)release();}
}
function bundlePath(id){if(!bundleID(id))fail('Expected tool-generated DSP-UUID bundle ID');return `dispositions/${id}`;}
function disposition(cfg,id,{full=true,chain=[]}={}) {
  if(chain.includes(id))fail('Cyclic supersession reference');
  const b=bundlePath(id), d=json(cfg.workflow,`${b}/disposition.json`);
  object(d,['format_version','id','recorded_at','actor','inputs','context_digest','recommendation_digest','classification','decision','reason'],['proposal_digest','supersedes']);
  if(d.format_version!==1||d.id!==id||!instant(d.recorded_at))fail('Malformed disposition identity/time');
  text(d.actor);text(d.reason);if(!classes.includes(d.classification)||!['author','no_update','defer','reject'].includes(d.decision))fail('Malformed disposition decision');
  if((d.decision==='author')!==Object.hasOwn(d,'proposal_digest')||(d.decision==='author'&&(!digest(d.proposal_digest)||d.classification==='NO_CHRONICLE_UPDATE')))fail('Author disposition requires proposal digest and authorable classification');
  for(const [key,file] of [['context_digest','context.json'],['recommendation_digest','recommendation.md']])if(!digest(d[key])||d[key]!==sha(read(cfg.workflow,`${b}/${file}`)))fail(`Disposition ${key} mismatch`);
  if(full)inputBindings(cfg,d.inputs,b);else {list(d.inputs);for(const x of d.inputs){object(x,['packet_id','summary','evidence']);text(x.packet_id);ref(cfg.workflow,x.summary);list(x.evidence);}}
  const c=json(cfg.workflow,`${b}/context.json`);
  const assessedBaseline=d.decision==='author'?json(cfg.workflow,`${b}/proposal.json`).baseline:{files:[{path:'roadmap.yaml',sha256:c.roadmap?.sha256},...(c.current?[{path:'current.yaml',sha256:c.current.sha256}]:[])]};
  contextBindings(cfg,b,assessedBaseline,d.inputs,{live:false});if(!c.acceptance.actors.includes(d.actor))fail('Disposition actor outside assessed authority');
  if(d.supersedes!==undefined&&(!bundleID(d.supersedes)||d.supersedes===id))fail('Invalid supersession reference');
  if(d.supersedes)disposition(cfg,d.supersedes,{full,chain:[...chain,id]});
  if(d.decision==='author'&&sha(read(cfg.workflow,`${b}/proposal.json`))!==d.proposal_digest)fail('Disposition proposal digest mismatch');
  return d;
}
function priorReview(cfg,inputs,context,currentID) {
  const dir=path.join(cfg.workflow,'dispositions');if(!fs.existsSync(dir))return;
  const prior=[];
  for(const id of fs.readdirSync(dir).sort()){bundlePath(id);if(id===currentID)continue;const b=`dispositions/${id}`;if(!fs.existsSync(path.join(cfg.workflow,b,'disposition.json'))) {if(fs.existsSync(path.join(cfg.workflow,b,'proposal.json')))fail('Unresolved prepared bundle requires reconciliation');continue;}const d=disposition(cfg,id);prior.push(d);}
  const indexed=new Map(context.prior_dispositions.map(r=>[r.id,r]));
  const overlap=prior.filter(d=>d.inputs.some(x=>inputs.some(y=>x.packet_id===y.packet_id)));
  for(const d of overlap)if(!indexed.has(d.id))fail('Prior packet disposition must be explicitly reviewed');
  for(const r of context.prior_dispositions)if(!prior.some(d=>d.id===r.id))fail('Missing prior disposition');
  if(overlap.length&&context.packet_review.mode==='new')fail('Replayed packet requires explicit reconsideration, not changed digests');
  if(context.packet_review.mode==='reconsider'&&(!overlap.length||!context.prior_dispositions.length))fail('Reconsideration requires prior same-packet assessment');
  if(context.packet_review.mode==='aggregate'){if(overlap.length)fail('Aggregate promotion requires a new packet ID');if(!context.packet_review.contributors.length)fail('Aggregate must cite contributing prior dispositions');for(const id of context.packet_review.contributors)if(!indexed.has(id))fail('Aggregate contributor missing bound prior disposition');}
  const reviewedReceipts=new Set();
  for(const d of prior.filter(d=>indexed.has(d.id)&&d.decision==='author')) {const attempt=path.join(cfg.workflow,`dispositions/${d.id}/attempt.json`);if(!fs.existsSync(attempt))fail('Prior author proposal remains pending');verifySuccess(cfg,d,false);const receipt=json(cfg.workflow,`dispositions/${d.id}/attempt.json`).receipt;if(!context.prior_receipts.some(r=>r.path===receipt&&r.sha256===sha(read(cfg.workflow,receipt))))fail('Prior success receipt must be retained in assessed context');reviewedReceipts.add(receipt);}
  if(context.prior_receipts.some(r=>!reviewedReceipts.has(r.path)))fail('Unresolved prior receipt reference');
}
function expectedState(baseline,actions) {const files=new Map(baseline.files.map(f=>[f.path,f.sha256])),directories=new Set(baseline.directories);for(const a of actions){files.set(a.path,a.sha256);let parent=path.posix.dirname(a.path);while(parent!=='.'){directories.add(parent);parent=path.posix.dirname(parent);}}return {files:[...files].map(([p,h])=>({path:p,sha256:h})).sort((a,b)=>a.path.localeCompare(b.path,'en')),directories:[...directories].sort(),absent:mutable.filter(p=>!files.has(p))};}
export function prepare(options) {
  const b=bundlePath(options.bundle), cfg=config(options.config);relative(options.request);
  const request=json(cfg.workflow,options.request);object(request,['format_version','inputs','actions','warning_reviews']);if(request.format_version!==1)fail('Unsupported request version');
  const baseline=state(cfg.dataset);actionsCheck(cfg,request.actions,baseline);config(options.config,request.actions.map(a=>a.path));
  const context=contextBindings(cfg,b,baseline,request.inputs);priorReview(cfg,request.inputs,context,options.bundle);
  read(cfg.workflow,`${b}/recommendation.md`);if(fs.existsSync(path.join(cfg.workflow,b,'proposal.json'))||fs.existsSync(path.join(cfg.workflow,b,'proposal')))fail('Prepared proposal already exists; reconcile rather than replace');
  const stagedPrefix=`${b}/proposal/staged`;
  const generated=[`${b}/proposal.json`,`${b}/proposal/review.json`,`${b}/proposal/baseline.json`,...['stdout.bin','stderr.bin','result.json'].map(n=>`${b}/proposal/validation/${n}`),...baseline.files.map(f=>`${stagedPrefix}/${f.path}`),...request.actions.flatMap((a,i)=>[`${stagedPrefix}/${a.path}`,`${b}/proposal/payload/${i}.bin`])];
  tracking(cfg.workflow,cfg.workflow_tracking,generated.map(p=>path.join(cfg.workflow,p)));
  return locked(cfg,'prepare',()=>{
    if(!same(config(options.config,request.actions.map(a=>a.path)),cfg)||!same(state(cfg.dataset),baseline))fail('Configuration/dataset changed during prepare');
    put(cfg.workflow,`${b}/proposal/baseline.json`,baseline);
    const staged=`${b}/proposal/staged`;for(const dir of baseline.directories)fs.mkdirSync(path.join(cfg.workflow,staged,dir),{recursive:true});for(const f of baseline.files)exclusive(path.join(cfg.workflow,staged,f.path),read(cfg.dataset,f.path));
    const actions=request.actions.map((a,i)=>{const bytes=read(cfg.workflow,a.source), payload=`${b}/proposal/payload/${i}.bin`, old=baseline.files.find(f=>f.path===a.path)?.sha256||null;exclusive(path.join(cfg.workflow,payload),bytes);const target=path.join(cfg.workflow,staged,a.path);if(a.action==='replace')fs.unlinkSync(target);exclusive(target,bytes);return {path:a.path,action:a.action,previous_sha256:old,source:bind(cfg.workflow,a.source),payload:{path:payload,sha256:sha(bytes)},sha256:sha(bytes)};});
    const validation=validate(path.join(cfg.workflow,staged),cfg.workflow,`${b}/proposal/validation`);if(validation.status!=='VALID')fail(`Staged Core validation ${validation.status}; raw evidence retained`);warningReviews(validation.payload.warnings,request.warning_reviews);
    if(!same(state(cfg.dataset),baseline)||!same(config(options.config,request.actions.map(a=>a.path)),cfg))fail('Live state changed while staging');
    const manifest={format_version:1,bundle:options.bundle,configuration:cfg,project_id:context.project_id,baseline,baseline_digest:bind(cfg.workflow,`${b}/proposal/baseline.json`).sha256,inputs:request.inputs,context:bind(cfg.workflow,`${b}/context.json`),summary:bind(cfg.workflow,`${b}/work-summary.md`),recommendation:bind(cfg.workflow,`${b}/recommendation.md`),request:bind(cfg.workflow,options.request),actions,result:expectedState(baseline,actions),staged,validation,warning_reviews:request.warning_reviews};
    if(!same(state(path.join(cfg.workflow,staged)),manifest.result))fail('Staged state differs from exact proposal');
    put(cfg.workflow,`${b}/proposal.json`,manifest);const review={format_version:1,state:'PREPARED_UNAPPROVED',proposal:bind(cfg.workflow,`${b}/proposal.json`),baseline_digest:manifest.baseline_digest,validation:validation.record,warning_reviews:request.warning_reviews,prepared_at:now()};put(cfg.workflow,`${b}/proposal/review.json`,review);return review;
  });
}
function proposalBindings(cfg,id) {
  const b=bundlePath(id), p=json(cfg.workflow,`${b}/proposal.json`);
  object(p,['format_version','bundle','configuration','project_id','baseline','baseline_digest','inputs','context','summary','recommendation','request','actions','result','staged','validation','warning_reviews']);
  if(p.format_version!==1||p.bundle!==id||!same(p.configuration,cfg)||p.baseline_digest!==sha(read(cfg.workflow,`${b}/proposal/baseline.json`))||!same(json(cfg.workflow,`${b}/proposal/baseline.json`),p.baseline))fail('Proposal configuration/baseline binding mismatch');
  for(const k of ['context','summary','recommendation','request'])ref(cfg.workflow,p[k]);
  if(p.context.path!==`${b}/context.json`||p.summary.path!==`${b}/work-summary.md`||p.recommendation.path!==`${b}/recommendation.md`||p.staged!==`${b}/proposal/staged`)fail('Proposal bundle path mismatch');
  const request=json(cfg.workflow,p.request.path);object(request,['format_version','inputs','actions','warning_reviews']);if(request.format_version!==1||!same(request.inputs,p.inputs)||!same(request.warning_reviews,p.warning_reviews)||request.actions.length!==p.actions.length)fail('Request binding mismatch');
  for(let i=0;i<p.actions.length;i++){const a=p.actions[i], original=request.actions[i];object(a,['path','action','previous_sha256','source','payload','sha256']);if(a.path!==original.path||a.action!==original.action||a.source.path!==original.source)fail('Proposed action changed');ref(cfg.workflow,a.source);ref(cfg.workflow,a.payload);if(a.sha256!==a.payload.sha256||a.sha256!==a.source.sha256||a.previous_sha256!==(p.baseline.files.find(f=>f.path===a.path)?.sha256||null))fail('Proposed byte/previous-state mismatch');}
  if(!same(expectedState(p.baseline,p.actions),p.result)||!same(state(path.join(cfg.workflow,p.staged)),p.result))fail('Staged proposal changed');
  validationBinding(cfg.workflow,p.validation,{prefix:`${b}/proposal/validation`,dataset:path.join(cfg.workflow,p.staged),core:p.validation.core});warningReviews(p.validation.payload.warnings,p.warning_reviews);
  const review=json(cfg.workflow,`${b}/proposal/review.json`);object(review,['format_version','state','proposal','baseline_digest','validation','warning_reviews','prepared_at']);ref(cfg.workflow,review.proposal);if(review.proposal.path!==`${b}/proposal.json`||review.baseline_digest!==p.baseline_digest||!same(review.validation,p.validation.record)||!same(review.warning_reviews,p.warning_reviews)||review.state!=='PREPARED_UNAPPROVED'||review.format_version!==1||!instant(review.prepared_at))fail('Review receipt mismatch');return p;
}
function verifySuccess(cfg,d,checkLive=true) {
  const b=bundlePath(d.id), attempt=json(cfg.workflow,`${b}/attempt.json`);object(attempt,['format_version','operation_id','proposal_digest','disposition','receipt']);
  ref(cfg.workflow,attempt.disposition);if(attempt.format_version!==1||!new RegExp(`^receipts/PUB-${uuid}\\.json$`).test(attempt.receipt)||attempt.disposition.path!==`${b}/disposition.json`||attempt.proposal_digest!==d.proposal_digest||!new RegExp(`^OP-${uuid}$`).test(attempt.operation_id))fail('RECONCILIATION_REQUIRED: inconsistent publication attempt');
  const receipt=json(cfg.workflow,attempt.receipt);object(receipt,['format_version','id','state','recorded_at','disposition_id','disposition','proposal_digest','baseline_digest','dataset','project_id','operation_id','journal','writes','result','validation','warning_reviews','error']);
  const p=proposalBindings(cfg,d.id);if(receipt.format_version!==1||attempt.receipt!==`receipts/${receipt.id}.json`||!new RegExp(`^PUB-${uuid}$`).test(receipt.id)||!instant(receipt.recorded_at)||receipt.state!=='PUBLISHED'||receipt.error!==null||receipt.disposition_id!==d.id||receipt.proposal_digest!==d.proposal_digest||receipt.operation_id!==attempt.operation_id||receipt.baseline_digest!==p.baseline_digest||receipt.dataset!==cfg.dataset||receipt.project_id!==p.project_id||!same(receipt.disposition,attempt.disposition)||!same(receipt.result,p.result)||!same(receipt.warning_reviews,p.warning_reviews))fail('RECONCILIATION_REQUIRED: no consistent successful publication receipt');
  validationBinding(cfg.workflow,receipt.validation,{prefix:`operations/${attempt.operation_id}/validation`,dataset:cfg.dataset,core:p.validation.core});if(!same(receipt.validation.core,p.validation.core)||!same(receipt.validation.payload.warnings,p.validation.payload.warnings))fail('Receipt Core validation mismatch');
  ref(cfg.workflow,receipt.journal);const journal=json(cfg.workflow,receipt.journal.path);object(journal,['state','operation_id','proposal_digest','writes']);if(receipt.journal.path!==`operations/${attempt.operation_id}/journal.json`||journal.operation_id!==attempt.operation_id||!same(journal.writes,receipt.writes)||journal.writes.length!==p.actions.length||journal.state!=='WRITES_COMPLETE'||journal.proposal_digest!==d.proposal_digest)fail('Receipt journal mismatch');
  const intent=json(cfg.workflow,`operations/${attempt.operation_id}/intent.json`);object(intent,['format_version','operation_id','proposal_digest','disposition','baseline_digest','actions','started_at']);if(intent.format_version!==1||!instant(intent.started_at)||intent.operation_id!==attempt.operation_id||intent.proposal_digest!==d.proposal_digest||!same(intent.disposition,attempt.disposition)||intent.baseline_digest!==p.baseline_digest||!same(intent.actions,p.actions))fail('Operation intent mismatch');
  for(let i=0;i<p.actions.length;i++){const w=receipt.writes[i],a=p.actions[i];object(w,['path','action','sha256','dev','ino']);if(w.path!==a.path||w.sha256!==a.sha256||w.action!==a.action||!same(json(cfg.workflow,`operations/${attempt.operation_id}/write-${i}.json`),w)||!same(json(cfg.workflow,`operations/${attempt.operation_id}/intent-${i}.json`),{path:a.path,action:a.action,sha256:a.sha256,previous_sha256:a.previous_sha256}))fail('Receipt writes mismatch');if(a.action==='replace'&&sha(read(cfg.workflow,`operations/${attempt.operation_id}/before/${a.path}`))!==a.previous_sha256)fail('Retained preimage mismatch');}
  if(checkLive&&!same(state(cfg.dataset),p.result))fail('RECONCILIATION_REQUIRED: published dataset no longer matches receipt');return receipt;
}
export function apply(options) {
  const b=bundlePath(options.bundle), cfg=config(options.config), d=disposition(cfg,options.bundle);
  if(d.decision!=='author')fail('Explicit author disposition required');const p=proposalBindings(cfg,options.bundle);
  if(!same(d.inputs,p.inputs)||d.context_digest!==p.context.sha256||d.recommendation_digest!==p.recommendation.sha256)fail('Disposition inputs/context/recommendation differ from proposal');
  if(p.actions.some(a=>a.path.startsWith('milestones/'))&&!['MILESTONE_CANDIDATE','BRANCH_OR_DIRECTION_CHANGE'].includes(d.classification))fail('Milestone requires explicit milestone/direction disposition');
  const op=`OP-${crypto.randomUUID()}`, opdir=`operations/${op}`, pub=`PUB-${crypto.randomUUID()}`, receiptPath=`receipts/${pub}.json`;
  const generated=[`${b}/attempt.json`,receiptPath,`${opdir}/intent.json`,`${opdir}/journal.json`,`${opdir}/failure.json`,`${opdir}/failure-journal.json`,...['stdout.bin','stderr.bin','result.json'].map(n=>`${opdir}/validation/${n}`),...p.actions.flatMap((a,i)=>[`${opdir}/intent-${i}.json`,`${opdir}/write-${i}.json`,...(a.action==='replace'?[`${opdir}/before/${a.path}`]:[])])];
  tracking(cfg.workflow,cfg.workflow_tracking,generated.map(p=>path.join(cfg.workflow,p)));
  return locked(cfg,'apply',control=>{
    if(!same(config(options.config,p.actions.map(a=>a.path)),cfg))fail('Configuration changed before apply');
    const attemptPath=path.join(cfg.workflow,b,'attempt.json');
    if(fs.existsSync(attemptPath)){try{return verifySuccess(cfg,d);}catch(error){fail(`RECONCILIATION_REQUIRED: ${error.message}`);}}
    const operations=path.join(cfg.workflow,'operations');for(const name of fs.readdirSync(operations)){if(name==='capture.lock')continue;if(!new RegExp(`^OP-${uuid}$`).test(name))fail('RECONCILIATION_REQUIRED: unknown operation state');const oldIntent=json(cfg.workflow,`operations/${name}/intent.json`);if(oldIntent.proposal_digest===d.proposal_digest||oldIntent.disposition?.path===`${b}/disposition.json`)fail('RECONCILIATION_REQUIRED: operation exists without attempt');}
    const receipts=path.join(cfg.workflow,'receipts');if(fs.existsSync(receipts))for(const file of fs.readdirSync(receipts)){const r=json(cfg.workflow,`receipts/${file}`);if(r.disposition_id===d.id||r.proposal_digest===d.proposal_digest)fail('RECONCILIATION_REQUIRED: receipt exists without attempt');}
    if(!same(state(cfg.dataset),p.baseline))fail('Stale live dataset baseline');if(!same(coreIdentity(),p.validation.core))fail('Core execution identity changed before publication');
    actionsCheck(cfg,json(cfg.workflow,p.request.path).actions,p.baseline);const c=contextBindings(cfg,b,p.baseline,p.inputs);priorReview(cfg,p.inputs,c,d.id);
    if(c.packet_review.mode==='reconsider'&&(!d.supersedes||!c.prior_dispositions.some(r=>r.id===d.supersedes)))fail('Reconsideration requires bound supersedes disposition');if(d.supersedes&&!c.prior_dispositions.some(r=>r.id===d.supersedes))fail('Unbound supersession reference');
    // Re-read the immutable approval/payloads under the shared writer guard.
    const fresh=disposition(cfg,d.id);if(!same(fresh,d))fail('Disposition changed');proposalBindings(cfg,d.id);
    const approval=bind(cfg.workflow,`${b}/disposition.json`), writes=[];
    const intent={format_version:1,operation_id:op,proposal_digest:d.proposal_digest,disposition:approval,baseline_digest:p.baseline_digest,actions:p.actions,started_at:now()};put(cfg.workflow,`${opdir}/intent.json`,intent);
    for(const a of p.actions)if(a.action==='replace')exclusive(path.join(cfg.workflow,opdir,'before',a.path),read(cfg.dataset,a.path));
    put(cfg.workflow,`${b}/attempt.json`,{format_version:1,operation_id:op,proposal_digest:d.proposal_digest,disposition:approval,receipt:receiptPath});control.retain();
    let validation=null, journal=null;
    try {
      for(let i=0;i<p.actions.length;i++) {const a=p.actions[i], dest=checkPath(path.join(cfg.dataset,a.path)), bytes=read(cfg.workflow,a.payload.path);put(cfg.workflow,`${opdir}/intent-${i}.json`,{path:a.path,action:a.action,sha256:a.sha256,previous_sha256:a.previous_sha256});
        if(a.action==='create')exclusive(dest,bytes);
        else {if(sha(read(cfg.dataset,a.path))!==a.previous_sha256)fail('Mutable destination changed');const fd=fs.openSync(dest,fs.constants.O_WRONLY|fs.constants.O_NOFOLLOW);try{const st=fs.fstatSync(fd);if(!st.isFile()||st.nlink!==1)fail('Mutable target not regular or independently owned');fs.ftruncateSync(fd,0);fs.writeFileSync(fd,bytes);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
        if(sha(read(cfg.dataset,a.path))!==a.sha256)fail('Written bytes differ');const st=fs.lstatSync(dest), entry={path:a.path,action:a.action,sha256:a.sha256,dev:st.dev,ino:st.ino};put(cfg.workflow,`${opdir}/write-${i}.json`,entry);writes.push(entry);
      }
      journal=put(cfg.workflow,`${opdir}/journal.json`,{state:'WRITES_COMPLETE',operation_id:op,proposal_digest:d.proposal_digest,writes});
      if(!same(state(cfg.dataset),p.result))fail('Published dataset differs from approved resulting state');
      validation=validate(cfg.dataset,cfg.workflow,`${opdir}/validation`,p.validation.core);if(validation.status!=='VALID')fail(`Final Core validation ${validation.status}`);warningReviews(validation.payload.warnings,p.warning_reviews);
      if(!same(state(cfg.dataset),p.result)||sha(read(cfg.workflow,`${b}/disposition.json`))!==approval.sha256)fail('Dataset/approval changed during final validation');proposalBindings(cfg,d.id);
      const receipt={format_version:1,id:pub,state:'PUBLISHED',recorded_at:now(),disposition_id:d.id,disposition:approval,proposal_digest:d.proposal_digest,baseline_digest:p.baseline_digest,dataset:cfg.dataset,project_id:p.project_id,operation_id:op,journal,writes,result:p.result,validation,warning_reviews:p.warning_reviews,error:null};put(cfg.workflow,receiptPath,receipt);
      // Only remove our verified, unchanged marker. No dataset cleanup or rollback.
      control.release();return receipt;
    } catch(error) {
      if(!journal){try{journal=put(cfg.workflow,`${opdir}/failure-journal.json`,{state:'RECONCILIATION_REQUIRED',operation_id:op,proposal_digest:d.proposal_digest,writes,uncertain_next_action:p.actions[writes.length]?.path||null,error:error.message});}catch{}}
      try{put(cfg.workflow,`${opdir}/failure.json`,{state:'RECONCILIATION_REQUIRED',error:error.message,writes,journal,validation,observed:state(cfg.dataset),recorded_at:now()});}catch{}
      try{put(cfg.workflow,receiptPath,{format_version:1,id:pub,state:'RECONCILIATION_REQUIRED',recorded_at:now(),disposition_id:d.id,disposition:approval,proposal_digest:d.proposal_digest,baseline_digest:p.baseline_digest,dataset:cfg.dataset,project_id:p.project_id,operation_id:op,journal,writes,result:null,validation,warning_reviews:p.warning_reviews,error:error.message});}catch{}
      fail(`RECONCILIATION_REQUIRED: ${error.message}; completed writes ${writes.length}/${p.actions.length}; retain ${opdir} and shared lock`);
    }
  });
}
