// Test-only lifecycle regression cases. No historical files are written.
import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
import {fileURLToPath} from 'node:url';
import {model,hash,digest,boundJSON,verifyRelease,currentState,sourceExpectations,checkHashes,stageStableCopy} from './fixtures/dogfood/lifecycle.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(p));
function fixture(kind,fn){const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kit-c7-negative-')),copy=path.join(dir,'kit');try{
 if(kind==='historical')fs.cpSync(path.join(root,'tools/chronicle-kit'),copy,{recursive:true});else stageStableCopy(root,copy);
 fn(copy);
}finally{fs.rmSync(dir,{recursive:true,force:true});}}
function mutateMetadata(copy,fn){const p=path.join(copy,'RELEASE.json'),m=read(p);fn(m);fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');}
for(const kind of ['historical','stable']){
 const state=kind==='historical'?model.historical:model.current.stable;
 test(`${kind}: fixed metadata and public audit validate`,()=>fixture(kind,p=>verifyRelease(p,state)));
 test(`${kind}: payload byte changes fail`,()=>fixture(kind,p=>{fs.appendFileSync(path.join(p,'scripts/chronicle-kit.mjs'),'\n// changed behavior\n');assert.throws(()=>verifyRelease(p,state),/Payload digest mismatch/);}));
 test(`${kind}: changed payload with recomputed hashes cannot bless itself`,()=>fixture(kind,p=>{fs.appendFileSync(path.join(p,'scripts/publication.mjs'),'\n// changed\n');mutateMetadata(p,m=>{m.files['scripts/publication.mjs']=hash(path.join(p,'scripts/publication.mjs'));m.content_sha256=digest(JSON.stringify(m.files)+'\n');});assert.throws(()=>verifyRelease(p,state),/Exact release metadata/);}));
 test(`${kind}: release status cannot be normalized`,()=>fixture(kind,p=>{mutateMetadata(p,m=>{m.status=m.status==='stable'?'review-candidate':'stable';});assert.throws(()=>verifyRelease(p,state),/Exact release metadata/);}));
 test(`${kind}: missing payload fails`,()=>fixture(kind,p=>{fs.unlinkSync(path.join(p,'README.md'));assert.throws(()=>verifyRelease(p,state),/ENOENT/);}));
 test(`${kind}: unlisted consumer control state fails`,()=>fixture(kind,p=>{fs.mkdirSync(path.join(p,'dev'));fs.writeFileSync(path.join(p,'dev/local-report.md'),'not payload');assert.throws(()=>verifyRelease(p,state),/Unlisted payload directory/);}));
}
test('current accepted final-version review candidate validates independently',()=>fixture('stable',p=>{mutateMetadata(p,m=>{m.status='review-candidate';});verifyRelease(p,model.current.candidate);}));
test('candidate to stable retains all 29 payload bytes and only changes metadata status',()=>fixture('stable',p=>{const a={...read(path.join(root,'RELEASE.json')),status:'review-candidate'},b=read(path.join(p,'RELEASE.json'));assert.equal(digest(JSON.stringify(a,null,2)+'\n'),model.current.candidate.metadata_sha256);assert.equal(Object.keys(a.files).length,29);assert.deepEqual(Object.keys(a).filter(k=>JSON.stringify(a[k])!==JSON.stringify(b[k])),['status']);for(const n of Object.keys(a.files))assert.equal(hash(path.join(root,n)),hash(path.join(p,n)),n);}));
test('historical and current version, status and content differences are explicit',()=>{assert.equal(model.historical.version,'0.1.0-rc.1');assert.equal(model.historical.status,'review-candidate');assert.equal(model.current.stable.version,'0.1.0');assert.equal(model.current.stable.status,'stable');assert.notEqual(model.historical.metadata_sha256,model.current.stable.metadata_sha256);assert.notEqual(model.historical.content_sha256,model.current.stable.content_sha256);assert.equal(model.current.candidate.content_sha256,model.current.stable.content_sha256);});
test('unknown current release state is rejected',()=>fixture('stable',p=>{mutateMetadata(p,m=>{m.status='released';});assert.throws(()=>currentState(p),/explicitly accepted state/);}));
test('historical snapshot cannot substitute for the current candidate',()=>fixture('historical',p=>assert.throws(()=>currentState(p),/explicitly accepted state/)));
for(const name of ['baseline','accepted_transition'])test(`changed ${name} provenance fails before expectations are used`,()=>{const dir=fs.mkdtempSync(path.join(os.tmpdir(),'kit-c7-provenance-'));try{const binding=model[name],p=path.join(dir,binding.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,fs.readFileSync(path.join(root,binding.path))+'\n');assert.throws(()=>boundJSON(dir,binding),/Immutable provenance/);}finally{fs.rmSync(dir,{recursive:true,force:true});}});
const baseline=boundJSON(root,model.baseline),verdict=boundJSON(root,model.accepted_transition);
const expected=sourceExpectations(baseline,verdict,currentState(root).metadata_sha256);
test('source expectations preserve every unreviewed baseline entry and all reviewed additions',()=>{for(const[p,h]of Object.entries(baseline.files))if(!(p in verdict.reviewed_files))assert.equal(expected[p],h);for(const[p,h]of Object.entries(verdict.reviewed_files))assert.equal(expected[p],p==='RELEASE.json'?currentState(root).metadata_sha256:h);checkHashes(expected,p=>hash(path.join(root,p)));});
for(const [name,lookup] of [['unexpected unrelated change',p=>p==='README.md'?'0'.repeat(64):expected[p]],['unexpected reviewed change',p=>p==='scripts/audit-distribution.mjs'?'0'.repeat(64):expected[p]],['deletion',p=>p==='LICENSE'?undefined:expected[p]],['missing reviewed addition',p=>p==='tests/stable-release-correction.test.mjs'?undefined:expected[p]]])test(`${name} fails exact source evolution`,()=>assert.throws(()=>checkHashes(expected,lookup)));
test('non-accepted transition cannot authorize replacements',()=>assert.throws(()=>sourceExpectations(baseline,{...verdict,verdict:'BLOCKED'},model.current.candidate.metadata_sha256)));
test('wrong accepted release identity cannot authorize replacements',()=>assert.throws(()=>sourceExpectations(baseline,{...verdict,content_sha256:'0'.repeat(64)},model.current.candidate.metadata_sha256)));
