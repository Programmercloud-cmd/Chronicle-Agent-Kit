import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {audit} from '../scripts/audit-distribution.mjs';
const source=path.resolve('.'),meta=JSON.parse(fs.readFileSync('RELEASE.json'));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function inventory(root){const out={};function walk(p=''){for(const n of fs.readdirSync(path.join(root,p)).sort()){const q=p?`${p}/${n}`:n,s=fs.lstatSync(path.join(root,q));if(s.isDirectory())walk(q);else out[q]=s.isSymbolicLink()?`symlink:${fs.readlinkSync(path.join(root,q))}`:hash(fs.readFileSync(path.join(root,q)));}}walk();return out;}
function fixture(t){const root=fs.mkdtempSync(path.join(os.tmpdir(),'kit-release-state-'));t.after(()=>fs.rmSync(root,{recursive:true,force:true}));for(const p of ['RELEASE.json',...Object.keys(meta.files)]){fs.mkdirSync(path.dirname(path.join(root,p)),{recursive:true});fs.copyFileSync(path.join(source,p),path.join(root,p),fs.constants.COPYFILE_EXCL);}return root;}
function metadata(root,change){const p=path.join(root,'RELEASE.json'),m=JSON.parse(fs.readFileSync(p));change(m);fs.writeFileSync(p,JSON.stringify(m,null,2)+'\n');return m;}
for(const [version,status] of [
 ['0.1.0-rc.1','review-candidate'],['1.0.0-alpha.0','review-candidate'],
 ['0.1.0-rc.1+synthetic-upgrade-b','review-candidate'],['0.1.0','review-candidate'],
 ['1.2.3+build.01','review-candidate'],['0.1.0','stable'],['1.2.3+build.01','stable']
])test(`allowed release identity ${version} / ${status} preserves audit immutability`,t=>{const r=fixture(t);metadata(r,m=>{m.version=version;m.status=status;});const before=inventory(r);const a=audit(r);assert.equal(a.version,version);assert.equal(a.status,status);assert.deepEqual(inventory(r),before);});
const invalid=[
 ['prerelease stable','0.1.0-rc.1','stable'],['prerelease/build stable','1.2.3-beta+build','stable'],
 ['unknown state','0.1.0','released'],['empty state','0.1.0',''],['status case','0.1.0','Stable'],
 ['status object','0.1.0',{}],['status array','0.1.0',['stable']],['status missing','0.1.0',undefined],
 ['version number',1,'stable'],['version null',null,'review-candidate'],['version missing',undefined,'stable'],
 ['version empty','','review-candidate'],['prefix','v0.1.0','stable'],['missing patch','0.1','stable'],
 ['leading zero major','01.1.0','stable'],['leading zero minor','1.01.0','review-candidate'],
 ['leading zero patch','1.0.01','stable'],['leading zero prerelease','1.0.0-rc.01','review-candidate'],
 ['empty prerelease','1.0.0-','review-candidate'],['empty build','1.0.0+','stable'],
 ['empty prerelease identifier','1.0.0-rc..1','review-candidate'],['empty build identifier','1.0.0+a..b','stable'],
 ['underscore','1.0.0-rc_1','review-candidate'],['trailing newline','1.0.0\n','stable'],
 ['leading whitespace',' 1.0.0','review-candidate'],['trailing whitespace','1.0.0 ','stable'],
 ['duplicate build delimiter','1.0.0+a+b','stable'],['unicode digits','１.0.0','stable']
];
for(const [label,version,status] of invalid)test(`release identity fails closed: ${label}`,t=>{const r=fixture(t);metadata(r,m=>{m.version=version;m.status=status;});const before=inventory(r);assert.throws(()=>audit(r),/Unsupported release metadata/);assert.deepEqual(inventory(r),before);});
for(const start of ['0.1.0-rc.1','0.1.0','0.1.0-rc.1+build.1'])test(`manual frozen promotion ${start} changes only metadata`,t=>{const r=fixture(t);const candidate=metadata(r,m=>{m.version=start;m.status='review-candidate';});assert.equal(audit(r).valid,true);const before=inventory(r),saved=fs.readFileSync(path.join(r,'RELEASE.json'));
 const final=start.includes('+')?'0.1.0+build.1':'0.1.0';const stable=metadata(r,m=>{m.version=final;m.status='stable';});const after=inventory(r);assert.deepEqual(Object.keys(before).filter(p=>before[p]!==after[p]),['RELEASE.json']);assert.deepEqual(candidate.files,stable.files);assert.equal(candidate.content_sha256,stable.content_sha256);assert.equal(Object.keys(stable.files).length,29);assert.equal(JSON.parse(saved).status,'review-candidate');
 const run=spawnSync(process.execPath,[path.join(r,'scripts/audit-distribution.mjs'),r],{encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(JSON.parse(run.stdout).status,'stable');assert.deepEqual(inventory(r),after);
});
test('new auditor still verifies the exact previously adopted rc.1 artifact',()=>{const old=path.join(source,'tools/chronicle-kit'),before=inventory(old);const a=audit(old);assert.equal(a.version,'0.1.0-rc.1');assert.equal(a.status,'review-candidate');assert.equal(a.content_sha256,'dc469ff1d861bf4ccf7c39e6ac6fa3a264f27c919a55925706dbc616bc6bcb6c');assert.deepEqual(inventory(old),before);});
for(const [label,change,pattern] of [
 ['extra metadata field',(r)=>metadata(r,m=>m.approved=true),/Unsupported release metadata fields/],
 ['unsupported contract',(r)=>metadata(r,m=>m.format_version=2),/Unsupported release metadata/],
 ['wrong Core identity',(r)=>metadata(r,m=>m.core_commit='0'.repeat(40)),/Unsupported release metadata/],
 ['wrong content pin',(r)=>metadata(r,m=>m.content_sha256='0'.repeat(64)),/pin mismatch/],
 ['payload changed',(r)=>fs.appendFileSync(path.join(r,'README.md'),'\n'),/digest mismatch/],
 ['missing required file',(r)=>fs.unlinkSync(path.join(r,'scripts/publication.mjs')),/ENOENT/],
 ['extra workflow directory',(r)=>fs.mkdirSync(path.join(r,'receipts')),/Unlisted payload directory/],
 ['symlink metadata',(r)=>{fs.unlinkSync(path.join(r,'RELEASE.json'));fs.symlinkSync(path.join(source,'RELEASE.json'),path.join(r,'RELEASE.json'));},/non-symlink/]
])test(`stable retains existing fail-closed guard: ${label}`,t=>{const r=fixture(t);metadata(r,m=>{m.version='0.1.0';m.status='stable';});change(r);assert.throws(()=>audit(r),pattern);});
