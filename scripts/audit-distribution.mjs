#!/usr/bin/env node
// Read-only release allowlist/integrity audit. No installation or authoring behavior.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const fail=m=>{throw new Error(m);};
const safe=p=>typeof p==='string'&&/^[A-Za-z0-9_.\/-]+$/.test(p)&&!p.startsWith('/')&&!p.split('/').some(x=>!x||x==='.'||x==='..');
const required=['README.md','AGENTS.fragment.md','LICENSE','docs/adoption.md','docs/distribution.md','agents/progress_curator.md','policies/milestone_admission.md','policies/chronicle_authoring.md','policies/evidence_capture.md','policies/current_state.md','templates/project_config.json','templates/work_summary.md','templates/curator_recommendation.md','templates/disposition.json','scripts/chronicle-kit.mjs','scripts/publication.mjs','scripts/audit-distribution.mjs','examples/README.md','examples/consumer/README.md','examples/consumer/exercise.mjs','examples/consumer/producer-packets.json'];
function checkContents(text,p){
  // Catch private home/temp/drive paths; public illustrative /work, /workspace,
  // /srv paths and literal /dev/null in accepted Git isolation are not private paths.
  if(/\/(?:home|Users|tmp|private\/var\/folders)\/|[A-Za-z]:\\(?:Users|Temp)\\/.test(text))fail(`Absolute machine path leak: ${p}`);
  if(/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\bgh[pousr]_[A-Za-z0-9]{20,}|\bsk-[A-Za-z0-9]{20,}|\bAKIA[A-Z0-9]{16}\b/.test(text))fail(`Potential secret: ${p}`);
}
// SemVer syntax only; review authority and immutable promotion are external checks.
function releaseIdentity(version,status){
 const v=typeof version==='string'&&version.match(/^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/);
 if(!v||v[0]!==version||(v[4]||'').split('.').some(id=>/^0[0-9]+$/.test(id)))return false;
 return status==='review-candidate'||(status==='stable'&&!v[4]);
}
export function audit(root,{source=false}={}){
 root=path.resolve(root);const metadata=path.join(root,'RELEASE.json');if(!fs.lstatSync(metadata).isFile()||fs.lstatSync(metadata).isSymbolicLink())fail('Release metadata must be a regular non-symlink file');const metadataText=fs.readFileSync(metadata,'utf8');checkContents(metadataText,'RELEASE.json');const m=JSON.parse(metadataText);
 if(Object.keys(m).some(k=>!['format_version','name','version','status','core_version','core_commit','config_version','workflow_version','node_minimum','content_sha256','files'].includes(k)))fail('Unsupported release metadata fields');
 if(m.format_version!==1||m.name!=='Chronicle-Agent-Kit'||!releaseIdentity(m.version,m.status)||m.core_version!=='0.2.1'||m.config_version!==1||m.workflow_version!==1||m.core_commit!=='7ed80d3b64b7affef12b8509a5adb814d7ce14b1'||m.node_minimum!==22||!m.files||Array.isArray(m.files))fail('Unsupported release metadata');
 const names=Object.keys(m.files);if(JSON.stringify(names)!==JSON.stringify([...names].sort()))fail('Unsorted release allowlist');
 if(m.content_sha256!==hash(JSON.stringify(m.files)+'\n'))fail('Release content pin mismatch');
 for(const p of required)if(!names.includes(p))fail(`Missing required Kit file: ${p}`);
 for(const p of names){
  if(!safe(p)||/(^|\/)(dev|\.git|receipts|operations|dispositions|staging)(\/|$)|(?:acceptance|critic)[-_]report/i.test(p))fail(`Forbidden payload path: ${p}`);
  let cursor=root;for(const segment of p.split('/')){cursor=path.join(cursor,segment);if(fs.lstatSync(cursor).isSymbolicLink())fail(`Symlink payload entry: ${p}`);}
  if(!fs.statSync(cursor).isFile())fail(`Not a regular payload file: ${p}`);
  const bytes=fs.readFileSync(cursor);if(!/^[a-f0-9]{64}$/.test(m.files[p])||hash(bytes)!==m.files[p])fail(`Payload digest mismatch: ${p}`);
  const text=bytes.toString('utf8');
  checkContents(text,p);
  if(p.endsWith('.md'))for(const match of text.matchAll(/\]\(([^)]+)\)/g)){
   const link=match[1].split('#')[0];if(!link||/^[a-z]+:/i.test(link))continue;
   const target=path.posix.normalize(path.posix.join(path.posix.dirname(p),link));if(!names.includes(target)&&target!=='RELEASE.json')fail(`Broken payload link: ${p} -> ${link}`);
  }
 }
 if(!source){const actual=[];function walk(p=''){for(const n of fs.readdirSync(path.join(root,p))){const q=p?`${p}/${n}`:n,s=fs.lstatSync(path.join(root,q));if(s.isSymbolicLink())fail(`Symlink payload entry: ${q}`);if(s.isDirectory()){if(!names.some(f=>f.startsWith(q+'/')))fail(`Unlisted payload directory: ${q}`);walk(q);}else actual.push(q);}}walk();for(const p of actual)if(p!=='RELEASE.json'&&!names.includes(p))fail(`Unlisted payload file: ${p}`);}
 return {valid:true,version:m.version,status:m.status,content_sha256:m.content_sha256,files:names.length,mode:source?'source-allowlist':'copied-payload'};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))try{const args=process.argv.slice(2);if(args.length<1||args.length>2||(args[1]&&args[1]!=='--source'))fail('Usage: node scripts/audit-distribution.mjs <kit-directory> [--source]');process.stdout.write(JSON.stringify(audit(args[0],{source:args[1]==='--source'}))+'\n');}catch(e){process.stderr.write(e.message+'\n');process.exitCode=1;}
