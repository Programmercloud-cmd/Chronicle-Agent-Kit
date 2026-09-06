import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { now, capture } from '../scripts/chronicle-kit.mjs';
const cli = path.resolve('scripts/chronicle-kit.mjs');
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function run(command, args, cwd, env = process.env) {
  const r = spawnSync(command, args, { cwd, env, encoding: 'utf8' });
  assert.equal(r.status, 0, `${command} ${args.join(' ')}: ${r.stderr}`); return r.stdout;
}
function setup(t, configChanges = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-capture-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dataset = path.join(root, 'selected-history');
  run('/usr/bin/chronicle', ['init', dataset]);
  const config = path.join(root, 'config.json'), source = path.join(root, 'source.bin');
  fs.writeFileSync(source, 'source\r\nbytes\0');
  const value = { format_version: 1, dataset_path: 'selected-history', dataset_tracking: 'local', workflow_path: 'persistent-decisions', workflow_tracking: 'local', ...configChanges };
  fs.writeFileSync(config, JSON.stringify(value));
  return { root, dataset, config, source, value, options: { config, source, id: 'EVD-0001', artifact: 'capture.bin', title: 'Test capture', kind: 'file', 'media-type': 'application/octet-stream' } };
}
function inventory(root) {
  const result = {};
  function walk(location) { for (const name of fs.readdirSync(location).sort()) { const file = path.join(location, name), stat = fs.lstatSync(file); result[path.relative(root, file)] = stat.isDirectory() ? 'directory' : stat.isSymbolicLink() ? fs.readlinkSync(file) : sha(fs.readFileSync(file)); if (stat.isDirectory()) walk(file); } }
  walk(root); return result;
}
function unchangedReject(f, action, regex) { const before = inventory(f.root); assert.throws(action, regex); assert.deepEqual(inventory(f.root), before); }
function validate(f) { const output = JSON.parse(run('/usr/bin/chronicle', ['validate', f.dataset])); assert.equal(output.valid, true); return output; }
function repository(t) {
  const f = setup(t), repo = path.join(f.root, 'source-repo'); fs.mkdirSync(repo);
  const git = (...args) => run('git', ['-C', repo, ...args]);
  git('init', '-q'); git('config', 'user.email', 'fixture@example.invalid'); git('config', 'user.name', 'Fixture');
  fs.writeFileSync(path.join(repo, 'text.txt'), 'before\n'); fs.writeFileSync(path.join(repo, 'binary.bin'), Buffer.from([0, 1, 2, 3]));
  git('add', '.'); git('commit', '-qm', 'base'); const base = git('rev-parse', 'HEAD').trim();
  fs.writeFileSync(path.join(repo, 'text.txt'), 'after\n'); fs.writeFileSync(path.join(repo, 'binary.bin'), Buffer.from([0, 255, 2, 3, 4]));
  git('add', '.'); git('commit', '-qm', 'target'); const target = git('rev-parse', 'HEAD').trim();
  return { ...f, repo, git, base, target, gitOptions: { config: f.config, repository: repo, base, target, id: 'EVD-0001', artifact: 'selected.patch', title: 'Explicit comparison' } };
}

test('now: UTC second precision, actual clock interval, timezone independent and stateless regressions', () => {
  assert.equal(now(() => Date.parse('2025-03-01T12:00:00.987+03:00')), '2025-03-01T09:00:00Z');
  const sequence = [2000, 2000, 1000].map(time => now(() => time));
  assert.deepEqual(sequence, ['1970-01-01T00:00:02Z', '1970-01-01T00:00:02Z', '1970-01-01T00:00:01Z']);
  const before = Date.now(), output = run(process.execPath, [cli, 'now'], undefined, { ...process.env, TZ: 'Pacific/Honolulu' }).trim(), after = Date.now();
  assert.match(output, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/); assert.ok(Date.parse(output) >= before - 1000 && Date.parse(output) <= after);
});
for (const [name, bytes, filename] of [['CRLF and NUL', Buffer.from('a\r\nb\r\n\0'), 'exact.txt'], ['empty', Buffer.alloc(0), 'empty'], ['binary', Buffer.from(Array.from({ length: 256 }, (_, i) => i)), 'all.bin'], ['Unicode', Buffer.from('Δοκιμή 中文 🦊\r\n'), '測定/é🦊.txt']]) {
  test(`artifact: ${name} exact bytes, captured SHA-256 and Core validation`, t => {
    const f = setup(t); fs.writeFileSync(f.source, bytes); const attrs = fs.readFileSync(path.join(f.dataset, '.gitattributes'));
    const record = capture('artifact', { ...f.options, artifact: filename });
    assert.deepEqual(fs.readFileSync(path.join(f.dataset, record.source.path)), bytes); assert.equal(record.source.sha256, sha(bytes));
    assert.deepEqual(fs.readFileSync(f.source), bytes); assert.deepEqual(fs.readFileSync(path.join(f.dataset, '.gitattributes')), attrs); validate(f);
    assert.ok(!fs.readdirSync(f.dataset).includes('operations')); assert.ok(!fs.existsSync(path.join(f.root, 'persistent-decisions/operations/capture.lock')));
  });
}
test('derivative provenance identifies declared transformation and limitations', t => { const f = setup(t); const r = capture('artifact', { ...f.options, derivative: 'Redacted account identifiers upstream', limitations: 'Cannot establish original identifiers' }); assert.match(r.description, /Declared derivative: Redacted/); assert.match(r.description, /Cannot establish/); validate(f); });
test('derivative declaration requires limitations before writes', t => { const f = setup(t); unchangedReject(f, () => capture('artifact', { ...f.options, derivative: 'redacted' }), /both/); });
test('integrity and capture provenance do not prove semantic support', t => { const f = setup(t); fs.writeFileSync(f.source, 'Routine unit tests passed; production gate was not assessed.\n'); const r = capture('artifact', { ...f.options, kind: 'test_output', title: 'Unit test report' }); assert.equal(r.source.sha256, sha(fs.readFileSync(f.source))); validate(f); const claimed = 'Production gate accepted'; assert.ok(!fs.readFileSync(f.source, 'utf8').includes(claimed)); assert.match(r.description, /authenticity is not established/); });
test('missing source makes no writes', t => { const f = setup(t); unchangedReject(f, () => capture('artifact', { ...f.options, source: `${f.source}.missing` }), /ENOENT/); });
test('unreadable source makes no writes', t => { const f = setup(t); const before = inventory(f.root); fs.chmodSync(f.source, 0); try { assert.throws(() => capture('artifact', f.options), /EACCES/); } finally { fs.chmodSync(f.source, 0o600); } assert.deepEqual(inventory(f.root), before); });
test('directory source rejected', t => { const f = setup(t); unchangedReject(f, () => capture('artifact', { ...f.options, source: f.root }), /regular file/); });
for (const target of ['artifact', 'record']) test(`existing ${target} is never overwritten`, t => {
  const f = setup(t); const destination = path.join(f.dataset, target === 'artifact' ? 'evidence/artifacts/capture.bin' : 'evidence/records/EVD-0001.yaml'); fs.mkdirSync(path.dirname(destination), { recursive: true }); fs.writeFileSync(destination, 'accepted prior bytes'); unchangedReject(f, () => capture('artifact', f.options), /already exists/);
});
for (const unsafe of ['../escape', '/absolute', 'a/../../escape', 'a\\escape', 'a//b', './x', 'C:drive', 'a/..', 'trailing.']) test(`unsafe destination ${JSON.stringify(unsafe)}`, t => { const f = setup(t); unchangedReject(f, () => capture('artifact', { ...f.options, artifact: unsafe }), /safe relative/); });
test('symlink artifact ancestor rejected', t => { const f = setup(t); fs.mkdirSync(path.join(f.dataset, 'evidence'), { recursive: true }); fs.symlinkSync(f.root, path.join(f.dataset, 'evidence/artifacts')); unchangedReject(f, () => capture('artifact', f.options), /Symlink/); });
test('dangling symlink destination rejected', t => { const f = setup(t); fs.mkdirSync(path.join(f.dataset, 'evidence/artifacts'), { recursive: true }); fs.symlinkSync(path.join(f.root, 'absent'), path.join(f.dataset, 'evidence/artifacts/capture.bin')); unchangedReject(f, () => capture('artifact', f.options), /Symlink/); });
test('case collision rejected on case-sensitive filesystem', t => { const f = setup(t); fs.mkdirSync(path.join(f.dataset, 'evidence/artifacts'), { recursive: true }); fs.writeFileSync(path.join(f.dataset, 'evidence/artifacts/CAPTURE.bin'), 'prior'); unchangedReject(f, () => capture('artifact', f.options), /collision/); });
for (const [name, change] of [['missing', v => { delete v.workflow_path; }], ['unknown', v => { v.extra = 1; }], ['unsupported version', v => { v.format_version = 2; }], ['nested paths', v => { v.workflow_path = 'selected-history/workflow'; }], ['tracking choice', v => { v.dataset_tracking = 'guess'; }], ['root workflow', v => { v.workflow_path = '/'; }]]) test(`configuration ${name} causes no writes`, t => { const f = setup(t); change(f.value); fs.writeFileSync(f.config, JSON.stringify(f.value)); unchangedReject(f, () => capture('artifact', f.options)); });
test('missing config option makes no writes', t => { const f = setup(t); unchangedReject(f, () => capture('artifact', { ...f.options, config: undefined }), /explicit --config/); });
test('duplicate escaped config key rejected', t => { const f = setup(t); fs.writeFileSync(f.config, fs.readFileSync(f.config, 'utf8').replace('"format_version":1', '"format_version":1,"format_versi\\u006fn":1')); unchangedReject(f, () => capture('artifact', f.options), /Duplicate/); });
test('configuration cannot reside in dataset', t => { const f = setup(t); const config = path.join(f.dataset, 'config.json'); fs.writeFileSync(config, JSON.stringify({ ...f.value, dataset_path: '.', workflow_path: '../persistent-decisions' })); unchangedReject(f, () => capture('artifact', { ...f.options, config }), /outside dataset/); });
test('absolute explicit local configuration works outside a Git worktree', t => { const f = setup(t); fs.writeFileSync(f.config, JSON.stringify({ ...f.value, dataset_path: f.dataset, workflow_path: path.join(f.root, 'absolute-workflow') })); capture('artifact', f.options); validate(f); });
test('tracked location outside Git rejected', t => { const f = setup(t, { dataset_tracking: 'tracked' }); unchangedReject(f, () => capture('artifact', f.options), /requires a Git worktree/); });
for (const dataset_tracking of ['local', 'tracked']) for (const workflow_tracking of ['local', 'tracked']) test(`independent tracking: dataset=${dataset_tracking}, workflow=${workflow_tracking}`, t => { const f = setup(t, { dataset_tracking, workflow_tracking }); run('git', ['init', '-q', f.root]); fs.writeFileSync(path.join(f.root, '.gitignore'), `${dataset_tracking === 'local' ? 'selected-history/\n' : ''}${workflow_tracking === 'local' ? 'persistent-decisions/\n' : ''}`); capture('artifact', f.options); validate(f); assert.equal(run('git', ['-C', f.root, 'ls-files']).length, 0); });
test('local in Git does not require or create exclusion', t => { const f = setup(t); run('git', ['init', '-q', f.root]); const before = run('git', ['-C', f.root, 'ls-files']); capture('artifact', f.options); validate(f); assert.equal(run('git', ['-C', f.root, 'ls-files']), before); assert.ok(!fs.existsSync(path.join(f.root, '.gitignore'))); });
test('local leaves already tracked content and explicit ignore policy alone', t => { const f = setup(t); run('git', ['init', '-q', f.root]); run('git', ['-C', f.root, 'add', 'selected-history']); fs.writeFileSync(path.join(f.root, '.gitignore'), 'selected-history/\npersistent-decisions/\n'); const before = run('git', ['-C', f.root, 'ls-files']), ignore = fs.readFileSync(path.join(f.root, '.gitignore')); capture('artifact', f.options); validate(f); assert.equal(run('git', ['-C', f.root, 'ls-files']), before); assert.deepEqual(fs.readFileSync(path.join(f.root, '.gitignore')), ignore); });
test('tracked obeys global exclusion rules', t => {
  const f = setup(t, { dataset_tracking: 'tracked', workflow_tracking: 'tracked' }); run('git', ['init', '-q', f.root]);
  const home = path.join(f.root, 'isolated-home'); fs.mkdirSync(home); fs.writeFileSync(path.join(home, 'excluded'), 'selected-history/\n'); fs.writeFileSync(path.join(home, '.gitconfig'), `[core]\nexcludesFile = ${home}/excluded\n`);
  const before = inventory(f.root); const r = spawnSync(process.execPath, [cli, 'capture', 'artifact', ...Object.entries(f.options).flatMap(([k,v]) => [`--${k}`, v])], { env: { ...process.env, HOME: home }, encoding: 'utf8' }); assert.equal(r.status, 1); assert.match(r.stderr, /ignore rules/); assert.deepEqual(inventory(f.root), before);
});
test('existing capture lock refuses concurrent writer without changing its bytes', t => { const f = setup(t); const lock = path.join(f.root, 'persistent-decisions/operations/capture.lock'); fs.mkdirSync(lock, { recursive: true }); fs.writeFileSync(path.join(lock, 'operation.json'), 'other writer'); unchangedReject(f, () => capture('artifact', f.options), /EEXIST/); });
test('CLI rejects invented timestamps and deferred working tree mode', t => { const f = setup(t); const before = inventory(f.root); for (const args of [['now', '--timestamp', '2020-01-01T00:00:00Z'], ['capture', 'working-tree'], ['capture', 'artifact', '--timestamp', 'fake']]) { const r = spawnSync(process.execPath, [cli, ...args]); assert.equal(r.status, 1); } assert.deepEqual(inventory(f.root), before); });

test('Git exact known-commit binary/full-index diff, full IDs, Core validation', t => {
  const f = repository(t); const expected = Buffer.from(f.git('diff', '--binary', '--full-index', `${f.base}..${f.target}`));
  const record = capture('git', { ...f.gitOptions, base: `${f.base.slice(0, 12)}`, target: 'HEAD' });
  const patch = fs.readFileSync(path.join(f.dataset, record.source.path)); assert.deepEqual(patch, expected); assert.match(patch.toString(), /GIT binary patch/); assert.match(patch.toString(), /index [a-f0-9]{40}\.\.[a-f0-9]{40}/); assert.equal(record.origin.base_revision, f.base); assert.equal(record.origin.target_revision, f.target); assert.equal(record.source.sha256, sha(patch)); validate(f);
});
test('invalid Git revision makes no writes', t => { const f = repository(t); unchangedReject(f, () => capture('git', { ...f.gitOptions, base: 'not-a-real-revision' }), /Git execution failed/); });
test('Git patch resists external diff, textconv, dirty index/worktree attributes, config and environment overrides', t => {
  const f = repository(t); const expected = Buffer.from(f.git('diff', '--binary', '--full-index', `${f.base}..${f.target}`));
  const marker = path.join(f.root, 'SHOULD_NOT_EXECUTE'); const script = path.join(f.root, 'external.sh'); fs.writeFileSync(script, `#!/bin/sh\ntouch '${marker}'\nprintf 'forged output'\n`, { mode: 0o755 });
  f.git('config', 'diff.external', script); f.git('config', 'diff.forged.textconv', script); f.git('config', 'diff.forged.command', script); f.git('config', 'diff.forged.binary', 'true'); f.git('config', 'diff.noprefix', 'true');
  fs.writeFileSync(path.join(f.repo, '.gitattributes'), '*.txt diff=forged\n*.bin diff=forged\n'); f.git('add', '.gitattributes'); fs.writeFileSync(path.join(f.repo, 'text.txt'), 'UNRELATED DIRTY CHANGE'); fs.writeFileSync(path.join(f.repo, 'untracked.txt'), 'UNTRACKED');
  fs.writeFileSync(path.join(f.repo, '.git/info/attributes'), '* -diff\n');
  const r = spawnSync(process.execPath, [cli, 'capture', 'git', ...Object.entries(f.gitOptions).flatMap(([k,v]) => [`--${k}`, v])], { encoding: 'utf8', env: { ...process.env, GIT_EXTERNAL_DIFF: script, GIT_DIFF_OPTS: '--unified=99', GIT_DIR: '/nonexistent', GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'diff.external', GIT_CONFIG_VALUE_0: script } });
  assert.equal(r.status, 0, r.stderr); const record = JSON.parse(r.stdout); assert.deepEqual(fs.readFileSync(path.join(f.dataset, record.source.path)), expected); assert.ok(!fs.existsSync(marker)); validate(f);
});
test('replace refs cannot substitute the selected immutable commit', t => { const f = repository(t); const expected = Buffer.from(f.git('diff', '--binary', '--full-index', `${f.base}..${f.target}`)); f.git('replace', f.target, f.base); const r = capture('git', f.gitOptions); assert.equal(r.origin.target_revision, f.target); assert.deepEqual(fs.readFileSync(path.join(f.dataset, r.source.path)), expected); });
test('artifact contents never execute commands', t => { const f = setup(t), marker = path.join(f.root, 'executed'); fs.writeFileSync(f.source, `$(touch ${marker})\n\`touch ${marker}\`\n`); capture('artifact', { ...f.options, title: `$(touch ${marker})` }); assert.ok(!fs.existsSync(marker)); validate(f); });
test('source symlink rejected without dereferencing', t => { const f = setup(t), link = path.join(f.root, 'link'); fs.symlinkSync(f.source, link); unchangedReject(f, () => capture('artifact', { ...f.options, source: link }), /ELOOP/); });
test('record-write failure removes only its own unchanged artifact and retains recovery lock', t => {
  const f = setup(t), original = fs.writeFileSync;
  fs.writeFileSync = function(file, data, ...rest) { if (typeof file === 'number' && Buffer.isBuffer(data) && data.toString().includes('"schema_version"')) throw new Error('simulated record failure'); return original.call(this, file, data, ...rest); };
  try { assert.throws(() => capture('artifact', f.options), /simulated record failure.*lock retained/); } finally { fs.writeFileSync = original; }
  assert.ok(!fs.existsSync(path.join(f.dataset, 'evidence/artifacts/capture.bin')));
  // A created but incompletely written record cannot be verified by hash; retain it for reconciliation.
  assert.ok(fs.existsSync(path.join(f.dataset, 'evidence/records/EVD-0001.yaml')));
  const recovery = JSON.parse(fs.readFileSync(path.join(f.root, 'persistent-decisions/operations/capture.lock/failure.json'))); assert.equal(recovery.cleanup_complete, false);
  assert.throws(() => capture('artifact', f.options), /already exists/);
});
test('failure cleanup preserves an artifact changed after capture', t => {
  const f = setup(t), original = fs.writeFileSync, artifact = path.join(f.dataset, 'evidence/artifacts/capture.bin');
  fs.writeFileSync = function(file, data, ...rest) { if (typeof file === 'number' && Buffer.isBuffer(data) && data.toString().includes('"schema_version"')) { original(artifact, 'unrelated replacement'); throw new Error('simulated interference'); } return original.call(this, file, data, ...rest); };
  try { assert.throws(() => capture('artifact', f.options), /simulated interference/); } finally { fs.writeFileSync = original; }
  assert.equal(fs.readFileSync(artifact, 'utf8'), 'unrelated replacement'); const recovery = JSON.parse(fs.readFileSync(path.join(f.root, 'persistent-decisions/operations/capture.lock/failure.json'))); assert.equal(recovery.cleanup_complete, false);
});
test('configuration changed while acquiring lock rejected before dataset writes', t => {
  const f = setup(t), original = fs.mkdirSync, baseline = inventory(f.dataset);
  fs.mkdirSync = function(directory, ...rest) { const result = original.call(this, directory, ...rest); if (directory.endsWith('/capture.lock')) fs.writeFileSync(f.config, `${JSON.stringify(f.value)}\n`); return result; };
  try { assert.throws(() => capture('artifact', f.options), /Configuration changed/); } finally { fs.mkdirSync = original; }
  assert.deepEqual(inventory(f.dataset), baseline); assert.ok(fs.existsSync(path.join(f.root, 'persistent-decisions/operations/capture.lock/failure.json')));
});
test('tracked proposed artifact conflicting with repository ignore rule rejected without writes', t => { const f = setup(t, { dataset_tracking: 'tracked', workflow_tracking: 'tracked' }); run('git', ['init', '-q', f.root]); fs.writeFileSync(path.join(f.root, '.gitignore'), '*.bin\n'); unchangedReject(f, () => capture('artifact', f.options), /ignore rules/); });
test('explicit GIT_CONFIG_GLOBAL ignore override honored', t => {
  const f = setup(t, { dataset_tracking: 'tracked', workflow_tracking: 'tracked' }); run('git', ['init', '-q', f.root]); const exclusions = path.join(f.root, 'exclusions'), globalConfig = path.join(f.root, 'global-config'); fs.writeFileSync(exclusions, 'selected-history/\n'); fs.writeFileSync(globalConfig, `[core]\nexcludesFile = ${exclusions}\n`); const before = inventory(f.root);
  const r = spawnSync(process.execPath, [cli, 'capture', 'artifact', ...Object.entries(f.options).flatMap(([k,v]) => [`--${k}`, v])], { env: { ...process.env, GIT_CONFIG_GLOBAL: globalConfig }, encoding: 'utf8' }); assert.equal(r.status, 1); assert.match(r.stderr, /ignore rules/); assert.deepEqual(inventory(f.root), before);
});

test('whitespace derivative or limitations refused before writes', t => { const f = setup(t); for (const fields of [{ derivative: ' ', limitations: 'redactions limit scope' }, { derivative: 'redacted names', limitations: '\t' }]) unchangedReject(f, () => capture('artifact', { ...f.options, ...fields }), /meaningful text/); });
for (const included of [false, true]) test(`partial/promisor repository rejected before object resolution${included ? ' through included config' : ''}`, t => {
  const f = repository(t), client = path.join(f.root, 'empty-promisor-client');
  run('git', ['init', '-q', client]);
  const marker = path.join(f.root, 'transport-invoked'), uploadpack = path.join(f.root, 'upload-pack.sh');
  fs.writeFileSync(uploadpack, `#!/bin/sh\ntouch '${marker}'\nexec /usr/bin/git-upload-pack "$@"\n`, { mode: 0o755 });
  const settings = `[remote "origin"]\nurl = ${f.repo}\npromisor = true\npartialCloneFilter = blob:none\nuploadpack = ${uploadpack}\n`;
  if (included) {
    const config = path.join(f.root, 'included-promisor.config'); fs.writeFileSync(config, settings);
    run('git', ['-C', client, 'config', 'include.path', config]);
  } else fs.appendFileSync(path.join(client, '.git/config'), settings);
  const before = inventory(f.root), objectsBefore = inventory(path.join(client, '.git/objects')), refsBefore = inventory(path.join(client, '.git/refs'));
  assert.throws(() => capture('git', { ...f.gitOptions, repository: client }), /Partial\/promisor repositories are unsupported/);
  assert.deepEqual(inventory(f.root), before); assert.deepEqual(inventory(path.join(client, '.git/objects')), objectsBefore); assert.deepEqual(inventory(path.join(client, '.git/refs')), refsBefore);
  assert.ok(!fs.existsSync(marker)); assert.ok(!fs.existsSync(path.join(f.root, 'persistent-decisions')));
});
for (const [key, value] of [['extensions.partialClone', 'origin'], ['remote.origin.promisor', 'false'], ['remote.origin.partialCloneFilter', 'blob:none']]) test(`conservative no-fetch gate rejects ${key} alone`, t => {
  const f = repository(t); f.git('config', key, value);
  unchangedReject(f, () => capture('git', f.gitOptions), /Partial\/promisor repositories are unsupported/);
});
