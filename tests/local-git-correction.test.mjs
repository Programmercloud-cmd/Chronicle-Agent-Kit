import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import childProcess from 'node:child_process';
import { syncBuiltinESMExports } from 'node:module';
import { capture, now } from '../scripts/chronicle-kit.mjs';
import { prepare, apply } from '../scripts/publication.mjs';

const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const encoded = value => `${JSON.stringify(value, null, 2)}\n`;
function save(filename, value) {
  fs.mkdirSync(path.dirname(filename), { recursive: true });
  fs.writeFileSync(filename, typeof value === 'string' || Buffer.isBuffer(value) ? value : encoded(value));
}
function run(command, args) {
  const result = childProcess.spawnSync(command, args, { encoding: 'utf8' });
  assert.equal(result.status, 0, result.error?.message || result.stderr);
  return result.stdout;
}
function inventory(root) {
  const result = {};
  function walk(directory) {
    for (const name of fs.readdirSync(directory).sort()) {
      const filename = path.join(directory, name), stat = fs.lstatSync(filename);
      result[path.relative(root, filename)] = stat.isDirectory() ? 'directory'
        : stat.isSymbolicLink() ? `symlink:${fs.readlinkSync(filename)}` : sha(fs.readFileSync(filename));
      if (stat.isDirectory()) walk(filename);
    }
  }
  walk(root); return result;
}
function fixture(t, tracking = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-local-git-correction-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const bin = path.join(root, 'node-core-only');
  fs.mkdirSync(bin);
  fs.symlinkSync(process.execPath, path.join(bin, 'node'));
  // Resolve installed public CLI before restricting PATH; no Core source imports.
  let core;
  for (const entry of process.env.PATH.split(path.delimiter)) {
    const candidate = path.join(entry, 'chronicle');
    if (fs.existsSync(candidate)) { core = fs.realpathSync(candidate); break; }
  }
  assert.ok(core, 'Installed Chronicle Core required by integration tests');
  fs.symlinkSync(core, path.join(bin, 'chronicle'));
  const dataset = path.join(root, 'history'), workflow = path.join(root, 'decisions');
  const config = path.join(root, 'config.json'), source = path.join(root, 'report.bin');
  const value = { format_version: 1, dataset_path: 'history', dataset_tracking: 'local', workflow_path: 'decisions', workflow_tracking: 'local', ...tracking };
  save(config, value); save(source, Buffer.from('Exact check output\r\n\0\xff', 'latin1'));
  const f = { root, bin, dataset, workflow, config, source, value };
  f.capture = { config, source, id: 'EVD-0001', artifact: 'check.bin', title: 'Bounded check output', kind: 'test_output', 'media-type': 'application/octet-stream' };
  return f;
}
function withNoGit(f, fn) {
  const originalPath = process.env.PATH;
  process.env.PATH = f.bin;
  try {
    assert.deepEqual(fs.readdirSync(f.bin).sort(), ['chronicle', 'node']);
    const absent = childProcess.spawnSync('git', ['--version']);
    assert.equal(absent.error?.code, 'ENOENT', 'Git must actually be unavailable');
    return fn();
  } finally { process.env.PATH = originalPath; }
}
function observeCommands(fn) {
  const methods = ['spawnSync', 'spawn', 'execSync', 'exec', 'execFileSync', 'execFile'];
  const originals = Object.fromEntries(methods.map(name => [name, childProcess[name]]));
  const calls = [];
  for (const name of methods) childProcess[name] = function(command, ...args) {
    calls.push({ method: name, command: String(command) });
    return originals[name].call(this, command, ...args);
  };
  // Update named ESM bindings already imported by both accepted helper modules.
  syncBuiltinESMExports();
  try { fn(calls); } finally {
    for (const name of methods) childProcess[name] = originals[name];
    syncBuiltinESMExports();
  }
  return calls;
}
function zeroGit(fn) {
  const calls = observeCommands(fn);
  assert.ok(calls.every(call => !/(^|[\s/])git(?:\s|$)/.test(call.command)), encoded(calls));
  return calls;
}
function init(f) { run('chronicle', ['init', f.dataset]); }
function validate(f) { assert.deepEqual(JSON.parse(run('chronicle', ['validate', f.dataset])), { valid: true, warnings: [] }); }
function packet(f, evidence = false) {
  f.id = `DSP-${crypto.randomUUID()}`;
  f.bundle = `dispositions/${f.id}`;
  const filename = name => path.join(f.workflow, f.bundle, name);
  const ref = name => ({ path: `${f.bundle}/${name}`, sha256: sha(fs.readFileSync(filename(name))) });
  save(filename('work-summary.md'), 'Packet local-check: retain a bounded check as a subordinate engineering event. No milestone consequence.\n');
  save(filename('recommendation.md'), '- **Primary classification:** ENGINEERING_EVENT\nA bounded retained check, not project-level history.\n');
  save(filename('roadmap.yaml'), fs.readFileSync(path.join(f.dataset, 'roadmap.yaml')));
  const bindings = evidence ? [
    { locator: 'EVD-0001', sha256: sha(fs.readFileSync(path.join(f.dataset, 'evidence/records/EVD-0001.yaml'))) },
    { locator: 'evidence/artifacts/check.bin', sha256: sha(fs.readFileSync(f.source)) },
  ] : [];
  save(filename('context.json'), {
    format_version: 1, project_id: 'history', current: null, previous_milestone: null,
    roadmap: ref('roadmap.yaml'), history: [], acceptance: { actors: ['maintainer'], scope: 'bounded check' },
    prior_dispositions: [], prior_receipts: [], snapshots: [],
    evidence_roles: bindings.map((item, index) => ({ locator: item.locator, role: index ? 'artifact' : 'record' })),
    packet_review: { mode: 'new', reason: 'No prior disposition for this bounded packet', contributors: [] },
  });
  save(filename('event.yaml'), {
    schema_version: 1, id: 'EVT-000001', occurred_at: now(), recorded_at: now(), kind: 'investigation',
    actor: { type: 'human', label: 'maintainer' }, outcome: 'completed', summary: 'Retained bounded check output.',
    ...(evidence ? { evidence: ['EVD-0001'] } : {}),
  });
  f.request = { format_version: 1, inputs: [{ packet_id: 'local-check', summary: ref('work-summary.md'), evidence: bindings }], actions: [{ path: 'engineering-events/EVT-000001.yaml', action: 'create', source: `${f.bundle}/event.yaml` }], warning_reviews: [] };
  save(filename('request.json'), f.request);
  f.options = { config: f.config, bundle: f.id, request: `${f.bundle}/request.json` };
  f.author = () => save(filename('disposition.json'), {
    format_version: 1, id: f.id, recorded_at: now(), actor: 'maintainer', inputs: f.request.inputs,
    context_digest: ref('context.json').sha256, recommendation_digest: ref('recommendation.md').sha256,
    classification: 'ENGINEERING_EVENT', decision: 'author', reason: 'Approve exact subordinate proposal.',
    proposal_digest: ref('proposal.json').sha256,
  });
}
function rejectsWithoutMutation(f, operation, pattern = /Git executable unavailable.*requires Git/) {
  const before = inventory(f.root);
  assert.throws(operation, pattern);
  assert.deepEqual(inventory(f.root), before);
}

test('local/local with genuinely no Git: exact capture, real prepare/apply/Core validation and zero attempted Git commands', t => {
  const f = fixture(t);
  withNoGit(f, () => {
    const calls = zeroGit(() => {
      init(f); validate(f);
      capture('artifact', f.capture);
      assert.deepEqual(fs.readFileSync(path.join(f.dataset, 'evidence/artifacts/check.bin')), fs.readFileSync(f.source));
      packet(f, true);
      const before = inventory(f.dataset), review = prepare(f.options);
      assert.equal(review.state, 'PREPARED_UNAPPROVED');
      assert.deepEqual(inventory(f.dataset), before);
      f.author();
      const receipt = apply(f.options);
      assert.equal(receipt.state, 'PUBLISHED');
      assert.equal(receipt.validation.exit_status, 0);
      assert.equal(receipt.validation.core.package.version, '0.2.1');
      validate(f);
      const published = inventory(f.root);
      assert.deepEqual(apply(f.options), receipt);
      assert.deepEqual(inventory(f.root), published);
    });
    assert.ok(calls.length >= 5, 'Observer must see actual Core subprocess calls');
  });
});

for (const field of ['dataset_tracking', 'workflow_tracking']) {
  for (const operation of ['capture', 'prepare', 'apply']) test(`${field}=tracked: ${operation} requires unavailable Git before any mutation`, t => {
    const f = fixture(t, { [field]: 'tracked' });
    init(f); packet(f);
    if (operation === 'apply') {
      run('git', ['init', '-q', f.root]);
      prepare(f.options); f.author(); // Policy unchanged; only Git disappears before apply.
    }
    withNoGit(f, () => {
      const calls = observeCommands(() => rejectsWithoutMutation(f, () => {
        if (operation === 'capture') capture('artifact', f.capture);
        else if (operation === 'prepare') prepare(f.options);
        else apply(f.options);
      }));
      assert.ok(calls.some(call => call.command === 'git'), 'Explicit tracked policy must check Git');
    });
  });
}

test('explicit commit-range capture still requires unavailable Git before mutation under local/local', t => {
  const f = fixture(t); init(f);
  run('git', ['init', '-q', f.root]);
  withNoGit(f, () => {
    const calls = observeCommands(() => rejectsWithoutMutation(f, () => capture('git', {
      config: f.config, repository: f.root, base: 'HEAD~1', target: 'HEAD', id: 'EVD-0001', artifact: 'range.patch', title: 'Explicit selected range',
    })));
    assert.equal(calls.filter(call => call.command === 'git').length, 1);
  });
});

test('local paths inside a worktree need no exclusions and do not touch index/ignore policy or invoke Git', t => {
  const f = fixture(t); init(f);
  run('git', ['init', '-q', f.root]);
  run('git', ['-C', f.root, 'add', 'history']);
  const gitBefore = inventory(path.join(f.root, '.git'));
  withNoGit(f, () => zeroGit(() => {
    capture('artifact', f.capture); packet(f, true); prepare(f.options); f.author();
    assert.equal(apply(f.options).state, 'PUBLISHED'); validate(f);
  }));
  assert.deepEqual(inventory(path.join(f.root, '.git')), gitBefore);
  assert.ok(!fs.existsSync(path.join(f.root, '.gitignore')));
});

for (const defect of ['missing policy', 'disjointness', 'symlink']) test(`local without Git retains ${defect} checks before mutation`, t => {
  const f = fixture(t); init(f); packet(f);
  if (defect === 'missing policy') delete f.value.workflow_tracking;
  if (defect === 'disjointness') f.value.workflow_path = 'history/workflow';
  if (defect === 'symlink') {
    fs.symlinkSync(f.workflow, path.join(f.root, 'workflow-link'));
    f.value.workflow_path = 'workflow-link';
  }
  save(f.config, f.value);
  withNoGit(f, () => zeroGit(() => {
    rejectsWithoutMutation(f, () => capture('artifact', f.capture), /Configuration|disjoint|Symlink/);
    rejectsWithoutMutation(f, () => prepare(f.options), /Configuration|disjoint|Symlink/);
  }));
});

for (const location of ['dataset', 'workflow']) test(`local without Git still rejects nested ${location} symlinks before mutation`, t => {
  const f = fixture(t); init(f); packet(f);
  const link = path.join(f[location], 'nested', 'linked-source');
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(f.source, link);
  withNoGit(f, () => zeroGit(() => {
    rejectsWithoutMutation(f, () => capture('artifact', f.capture), /Symlink|Nonregular/);
    rejectsWithoutMutation(f, () => prepare(f.options), /Symlink|Nonregular/);
  }));
});
