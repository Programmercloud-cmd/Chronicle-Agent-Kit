// Project test support only. Immutable provenance plus exact reviewed evolution.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {audit} from '../../../scripts/audit-distribution.mjs';
export const digest=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
export const hash=p=>digest(fs.readFileSync(p));
export const model=JSON.parse(fs.readFileSync(new URL('./adoption-lifecycle.json',import.meta.url)));
export function boundJSON(root,binding){
 const bytes=fs.readFileSync(path.join(root,binding.path));
 assert.equal(digest(bytes),binding.sha256,`Immutable provenance: ${binding.path}`);
 return JSON.parse(bytes);
}
export function verifyRelease(root,state,{source=false}={}){
 const bytes=fs.readFileSync(path.join(root,'RELEASE.json')),m=JSON.parse(bytes);
 assert.equal(digest(bytes),state.metadata_sha256,'Exact release metadata');
 assert.equal(m.version,state.version);assert.equal(m.status,state.status);
 assert.equal(m.content_sha256,state.content_sha256);
 const result=audit(root,{source});assert.equal(result.valid,true);return m;
}
export function currentState(root){
 const bytes=fs.readFileSync(path.join(root,'RELEASE.json'));
 const state=Object.values(model.current).find(s=>s.metadata_sha256===digest(bytes));
 assert(state,'Current release must match an explicitly accepted state');return state;
}
export function sourceExpectations(baseline,verdict,metadataHash){
 assert.equal(verdict.verdict,'ACCEPT');assert.equal(verdict.content_sha256,model.current.candidate.content_sha256);
 assert.equal(verdict.reviewed_files['RELEASE.json'],model.current.candidate.metadata_sha256);
 assert(Object.values(model.current).some(s=>s.metadata_sha256===metadataHash));
 // The pinned verdict is the complete reviewed transition, never a path exemption.
 return {...baseline.files,...verdict.reviewed_files,'RELEASE.json':metadataHash};
}
export function checkHashes(expected,lookup){
 for(const [p,h]of Object.entries(expected))assert.equal(lookup(p),h,p);
}
export function verifySourceEvolution(root){
 const baseline=boundJSON(root,model.baseline),verdict=boundJSON(root,model.accepted_transition);
 assert.equal(Object.keys(baseline.files).length,model.baseline.file_count);
 const state=currentState(root);verifyRelease(root,state,{source:true});
 checkHashes(sourceExpectations(baseline,verdict,state.metadata_sha256),p=>hash(path.join(root,p)));
}
export function stageStableCopy(root,destination){
 const state=currentState(root),m=verifyRelease(root,state,{source:true});
 fs.mkdirSync(destination);for(const p of Object.keys(m.files)){
  const to=path.join(destination,p);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.join(root,p),to,fs.constants.COPYFILE_EXCL);
 }
 const stable={...m,status:'stable'};
 fs.writeFileSync(path.join(destination,'RELEASE.json'),JSON.stringify(stable,null,2)+'\n',{flag:'wx'});
 verifyRelease(destination,model.current.stable);return stable;
}
