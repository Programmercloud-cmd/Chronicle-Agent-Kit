// Repository-only release gate. Never part of the consumer payload.
import fs from 'node:fs';
import path from 'node:path';
import {audit} from '../../scripts/audit-distribution.mjs';
export function distributionAudit(root,options={}){
 const result=audit(root,options),m=JSON.parse(fs.readFileSync(path.join(root,'RELEASE.json')));
 for(const p of ['RELEASE.json',...Object.keys(m.files)])if(/\b(?:HERA|ARIS)\b/i.test(fs.readFileSync(path.join(root,p),'utf8')))throw new Error(`Consumer-specific dependency: ${p}`);
 return result;
}
