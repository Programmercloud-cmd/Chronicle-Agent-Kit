#!/usr/bin/env node
// Evidence acquisition and guarded publication. Core owns schema/semantic validation.
import fs from 'node:fs';
import { prepare, apply } from './publication.mjs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export function now(clock = Date.now) {
  return new Date(clock()).toISOString().replace(/\.\d{3}Z$/, 'Z');
}
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fail = message => { throw new Error(message); };
const folded = value => value.normalize('NFC').toLowerCase();
const contains = (parent, child) => child === parent || child.startsWith(parent.endsWith(path.sep) ? parent : `${parent}${path.sep}`);
const gitEnv = () => {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  return { ...env, LC_ALL: 'C', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null', GIT_ATTR_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0', GIT_NO_REPLACE_OBJECTS: '1' };
};
function git(cwd, args, { env = gitEnv(), allowFailure = false } = {}) {
  const result = spawnSync('git', ['--no-replace-objects', '-C', cwd, ...args], { env, maxBuffer: 64 * 1024 * 1024 });
  if (result.error?.code === 'ENOENT') fail('Git executable unavailable: this Git operation requires Git on PATH');
  if (result.error || result.signal || (!allowFailure && result.status !== 0)) {
    fail(`Git execution failed: ${result.error?.message || result.stderr?.toString().trim() || result.signal}`);
  }
  return result;
}
function checkPath(location, { absent = true } = {}) {
  const absolute = path.resolve(location);
  let cursor = path.parse(absolute).root;
  for (const segment of absolute.slice(cursor.length).split(path.sep).filter(Boolean)) {
    if (fs.existsSync(cursor)) {
      const collisions = fs.readdirSync(cursor).filter(name => folded(name) === folded(segment) && name !== segment);
      if (collisions.length) fail(`Case/Unicode path collision at ${path.join(cursor, segment)}`);
    }
    cursor = path.join(cursor, segment);
    let stat;
    try { stat = fs.lstatSync(cursor); } catch (error) {
      if (error.code === 'ENOENT' && absent) continue;
      throw error;
    }
    if (stat.isSymbolicLink()) fail(`Symlink destination or ancestor: ${cursor}`);
  }
  return absolute;
}
function relativeArtifact(value) {
  if (!value || /[\\:\x00-\x1f\x7f]/u.test(value) || path.posix.isAbsolute(value) || value.split('/').some(part => !part || part === '.' || part === '..' || /[. ]$/.test(part))) {
    fail('Artifact must be a safe relative path below evidence/artifacts');
  }
  return `evidence/artifacts/${value}`;
}
function flatConfig(bytes) {
  const parsed = JSON.parse(bytes);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') fail('Configuration must be an object');
  // Format 1 contains only scalar values. Scan the original tokens to reject duplicate keys.
  const token = /\s*("(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*")\s*:\s*("(?:[^"\\\x00-\x1f]|\\(?:["\\/bfnrt]|u[0-9a-fA-F]{4}))*"|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|true|false|null)\s*([,}])/y;
  let offset = bytes.indexOf('{') + 1;
  const keys = new Set();
  while (true) {
    token.lastIndex = offset;
    const match = token.exec(bytes);
    if (!match) fail('Configuration requires exactly five scalar fields');
    const key = JSON.parse(match[1]);
    if (keys.has(key)) fail(`Duplicate configuration key: ${key}`);
    keys.add(key); offset = token.lastIndex;
    if (match[3] === '}') break;
  }
  const expected = ['format_version', 'dataset_path', 'dataset_tracking', 'workflow_path', 'workflow_tracking'];
  if (keys.size !== expected.length || expected.some(key => !keys.has(key))) fail('Configuration requires exactly five known fields');
  if (parsed.format_version !== 1) fail('Unsupported configuration version');
  for (const key of ['dataset_path', 'workflow_path']) if (typeof parsed[key] !== 'string' || !parsed[key].trim() || parsed[key].includes('\0')) fail(`Invalid ${key}`);
  for (const key of ['dataset_tracking', 'workflow_tracking']) if (!['local', 'tracked'].includes(parsed[key])) fail(`Invalid ${key}`);
  return parsed;
}
function existingFiles(root) {
  if (!fs.existsSync(root)) return [];
  const stat = fs.lstatSync(root);
  if (stat.isSymbolicLink()) fail(`Symlink in configured location: ${root}`);
  if (!stat.isDirectory()) return [root];
  return fs.readdirSync(root).flatMap(name => existingFiles(path.join(root, name)));
}
function tracking(location, policy, proposed) {
  // Local is a filesystem policy, not a promise about Git exclusion. Callers
  // enforce configuration and path safety independently of tracking checks.
  if (policy === 'local') { existingFiles(location); return; }
  if (policy !== 'tracked') fail(`Invalid tracking policy: ${policy}`);
  let ancestor = location;
  while (!fs.existsSync(ancestor)) ancestor = path.dirname(ancestor);
  const trackingEnv = gitEnv();
  delete trackingEnv.GIT_CONFIG_NOSYSTEM; delete trackingEnv.GIT_CONFIG_GLOBAL;
  for (const [key, value] of Object.entries(process.env)) if (key.startsWith('GIT_CONFIG')) trackingEnv[key] = value;
  const trackGit = (cwd, args, extra = {}) => git(cwd, args, { ...extra, env: trackingEnv });
  const probe = trackGit(ancestor, ['rev-parse', '--show-toplevel'], { allowFailure: true });
  if (probe.status !== 0) fail(`Tracked location requires a Git worktree: ${location}`);
  const worktree = fs.realpathSync(probe.stdout.toString().trim());
  if (!contains(worktree, location)) fail('Selected location is outside its owning Git worktree');
  const rel = file => path.relative(worktree, file).split(path.sep).join('/') || '.';
  const candidates = [location, ...existingFiles(location), ...proposed];
  for (const candidate of candidates) {
    const result = trackGit(worktree, ['check-ignore', '--no-index', '-q', '--', `${rel(candidate)}${candidate === location || (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) ? '/' : ''}`], { allowFailure: true });
    if (![0, 1].includes(result.status)) fail(`Could not inspect Git ignore rules: ${result.stderr}`);
    if (result.status === 0) fail(`Tracked location conflicts with ignore rules: ${candidate}`);
  }
}
function configuration(filename, artifact, id) {
  if (!filename) fail('Capture requires explicit --config');
  const configPath = checkPath(filename, { absent: false });
  const configBytes = fs.readFileSync(configPath, 'utf8');
  const config = flatConfig(configBytes);
  const dataset = checkPath(path.resolve(path.dirname(configPath), config.dataset_path), { absent: false });
  const workflow = checkPath(path.resolve(path.dirname(configPath), config.workflow_path));
  if (contains(folded(dataset), folded(workflow)) || contains(folded(workflow), folded(dataset))) fail('Dataset and workflow locations must be disjoint');
  if (contains(folded(dataset), folded(configPath))) fail('Configuration must be outside dataset');
  if (!fs.statSync(dataset).isDirectory()) fail('Dataset must be an existing directory');
  for (const name of ['project.yaml', 'roadmap.yaml']) {
    const required = checkPath(path.join(dataset, name), { absent: false });
    if (!fs.statSync(required).isFile()) fail(`Expected initialized dataset file ${name}`);
  }
  const artifactPath = checkPath(path.join(dataset, artifact));
  const recordPath = checkPath(path.join(dataset, 'evidence/records', `${id}.yaml`));
  if (fs.existsSync(artifactPath) || fs.existsSync(recordPath)) fail('Historical evidence destination already exists');
  const lock = path.join(workflow, 'operations', 'capture.lock');
  checkPath(lock);
  tracking(dataset, config.dataset_tracking, [artifactPath, recordPath]);
  tracking(workflow, config.workflow_tracking, [lock, path.join(lock, 'operation.json')]);
  return { dataset, workflow, artifactPath, recordPath, lock, configDigest: hash(configBytes) };
}
function sourceBytes(source) {
  const fd = fs.openSync(source, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK);
  try {
    const before = fs.fstatSync(fd);
    if (!before.isFile()) fail('Source must be a regular file');
    const bytes = fs.readFileSync(fd);
    const after = fs.fstatSync(fd);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || before.ctimeMs !== after.ctimeMs || after.size !== bytes.length) fail('Source changed during capture');
    return bytes;
  } finally { fs.closeSync(fd); }
}
function gitSelection(options) {
  const repository = fs.realpathSync(options.repository);
  // Git 2.34 can lazily fetch even during rev-parse. Inspect effective included
  // repository config before resolving any object, and conservatively refuse
  // partial/promisor setup (even a configured false value or unused remote).
  const partial = git(repository, ['config', '--includes', '--name-only', '--get-regexp', '^(extensions\\.partialclone|remote\\..*\\.(promisor|partialclonefilter))$'], { allowFailure: true });
  if (![0, 1].includes(partial.status)) fail(`Cannot inspect Git partial-clone configuration: ${partial.stderr}`);
  if (partial.status === 0) fail('Partial/promisor repositories are unsupported: capture never fetches missing objects');
  const resolve = value => git(repository, ['rev-parse', '--verify', '--end-of-options', `${value}^{commit}`]).stdout.toString().trim();
  const base = resolve(options.base), target = resolve(options.target);
  const format = git(repository, ['rev-parse', '--show-object-format']).stdout.toString().trim();
  if (!['sha1', 'sha256'].includes(format) || ![base, target].every(id => new RegExp(`^[0-9a-f]{${format === 'sha1' ? 40 : 64}}$`).test(id))) fail('Unexpected Git object identity');
  const objects = fs.realpathSync(path.resolve(repository, git(repository, ['rev-parse', '--git-path', 'objects']).stdout.toString().trim()));
  if (/[\r\n]/.test(objects)) fail('Unsupported object database path');
  // Legacy grafts can change object interpretation and are deliberately unsupported.
  const grafts = path.resolve(repository, git(repository, ['rev-parse', '--git-path', 'info/grafts']).stdout.toString().trim());
  if (fs.existsSync(grafts) && fs.statSync(grafts).size) fail('Git grafts are not supported');
  return { repository, base, target, format, objects };
}
function gitPatch(selection, scratch) {
  git(path.dirname(scratch), ['init', '--bare', '--template=', `--object-format=${selection.format}`, scratch]);
  fs.writeFileSync(path.join(scratch, 'objects/info/alternates'), `${selection.objects}\n`, { flag: 'wx' });
  const args = ['-c', 'core.attributesFile=/dev/null', '-c', 'diff.algorithm=myers', '-c', 'diff.indentHeuristic=false', 'diff', '--no-ext-diff', '--no-textconv', '--binary', '--full-index', '--no-color', '--no-renames', '--no-relative', '--src-prefix=a/', '--dst-prefix=b/', '--unified=3', '--inter-hunk-context=0', '--ignore-submodules=none', '--submodule=short', `${selection.base}..${selection.target}`, '--'];
  return { bytes: git(scratch, args).stdout, args: ['--no-replace-objects', '-C', scratch, ...args] };
}
function mkdirs(location, ownedDirs) {
  checkPath(location);
  if (fs.existsSync(location)) return;
  mkdirs(path.dirname(location), ownedDirs);
  fs.mkdirSync(location); ownedDirs.push(location);
}
function writeExclusive(filename, bytes, ownedFiles) {
  checkPath(filename);
  const fd = fs.openSync(filename, fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | fs.constants.O_NOFOLLOW, 0o644);
  const stat = fs.fstatSync(fd);
  const entry = { filename, dev: stat.dev, ino: stat.ino, digest: null };
  ownedFiles.push(entry);
  try { fs.writeFileSync(fd, bytes); fs.fsyncSync(fd); entry.digest = hash(bytes); }
  finally { fs.closeSync(fd); }
}
function cleanup(ownedFiles, ownedDirs) {
  let complete = true;
  for (const entry of [...ownedFiles].reverse()) {
    try {
      const stat = fs.lstatSync(entry.filename);
      if (!stat.isFile() || stat.dev !== entry.dev || stat.ino !== entry.ino || !entry.digest || hash(fs.readFileSync(entry.filename)) !== entry.digest) { complete = false; continue; }
      fs.unlinkSync(entry.filename);
    } catch (error) { if (error.code !== 'ENOENT') complete = false; }
  }
  for (const directory of [...ownedDirs].reverse()) { try { fs.rmdirSync(directory); } catch { /* Never remove another writer's content. */ } }
  return complete;
}
export function capture(mode, options) {
  if (!['artifact', 'git'].includes(mode)) fail('Capture mode must be artifact or git; working-tree capture is deferred');
  for (const name of ['id', 'artifact', 'title', ...(mode === 'artifact' ? ['source', 'kind', 'media-type'] : ['repository', 'base', 'target'])]) {
    if (typeof options[name] !== 'string' || !options[name].trim()) fail(`Missing --${name}`);
  }
  if (!/^EVD-[0-9]{4,}$/.test(options.id)) fail('Expected Core evidence ID EVD- followed by at least four digits');
  if (/[\r\n]/.test(options.title)) fail('Title must be one line');
  const kinds = ['test_output', 'benchmark', 'critic_report', 'screenshot', 'log', 'profile', 'experiment_report', 'diff', 'file', 'other'];
  if (mode === 'artifact' && !kinds.includes(options.kind)) fail('Unsupported Core evidence kind');
  if (options.derivative !== undefined || options.limitations !== undefined) {
    if (![options.derivative, options.limitations].every(value => typeof value === 'string' && value.trim())) fail('Derivative capture requires both --derivative and --limitations with meaningful text');
  }
  if (mode === 'git' && (options.derivative || options.limitations)) fail('Git patch mode captures raw patch output only');
  const artifact = relativeArtifact(options.artifact);
  const locations = configuration(options.config, artifact, options.id);
  let bytes = mode === 'artifact' ? sourceBytes(path.resolve(options.source)) : null;
  const selection = mode === 'git' ? gitSelection(options) : null;
  const ownedDirs = [], ownedFiles = [];
  let locked = false;
  try {
    mkdirs(path.dirname(locations.lock), ownedDirs);
    checkPath(locations.lock);
    fs.mkdirSync(locations.lock); locked = true;
    const journal = { operation: 'capture', id: crypto.randomUUID(), started_at: now(), dataset: locations.dataset, artifact, record: path.relative(locations.dataset, locations.recordPath) };
    fs.writeFileSync(path.join(locations.lock, 'operation.json'), `${JSON.stringify(journal, null, 2)}\n`, { flag: 'wx' });
    // Recheck after acquiring the cooperating-writer lock, before any dataset write.
    if (JSON.stringify(configuration(options.config, artifact, options.id)) !== JSON.stringify(locations)) fail('Configuration changed during capture');
    let patch;
    if (selection) { patch = gitPatch(selection, path.join(locations.lock, 'git')); bytes = patch.bytes; }
    const description = mode === 'artifact'
      ? `Exact bytes read from selected source ${JSON.stringify(path.resolve(options.source))}. ${options.derivative ? `Declared derivative: ${options.derivative}. Limitations: ${options.limitations}.` : 'No transformation performed by capture; earlier source authenticity is not established.'}`
      : `Actual commit-range patch from repository ${JSON.stringify(selection.repository)}. All paths in the two selected commit trees; no working-tree, index or untracked content. Isolated bare comparison ignores repository/user/system attributes and diff configuration; no rename detection. Submodules are commit-pointer changes only; LFS files remain pointer blobs, without fetching payloads. Object identities establish provenance, not claim truth.`;
    const record = {
      schema_version: 1, id: options.id, captured_at: now(), kind: mode === 'git' ? 'diff' : options.kind,
      title: options.title, description,
      source: { kind: 'artifact', path: artifact, media_type: mode === 'git' ? 'text/x-diff' : options['media-type'], sha256: hash(bytes) },
      origin: mode === 'git'
        ? { tool: 'git (Chronicle Agent Kit isolated commit comparison)', command: JSON.stringify(['git', ...patch.args]), base_revision: selection.base, target_revision: selection.target }
        : { tool: 'Chronicle Agent Kit exact-file capture', command: JSON.stringify(['capture', 'artifact', '--source', path.resolve(options.source)]) },
    };
    mkdirs(path.dirname(locations.artifactPath), ownedDirs);
    mkdirs(path.dirname(locations.recordPath), ownedDirs);
    writeExclusive(locations.artifactPath, bytes, ownedFiles);
    writeExclusive(locations.recordPath, Buffer.from(`${JSON.stringify(record, null, 2)}\n`), ownedFiles);
    fs.rmSync(locations.lock, { recursive: true }); locked = false;
    return record;
  } catch (error) {
    const complete = cleanup(ownedFiles, ownedDirs);
    if (locked) {
      // Keep operation evidence and the lock for explicit reconciliation. Never claim success.
      try { fs.writeFileSync(path.join(locations.lock, 'failure.json'), `${JSON.stringify({ error: error.message, cleanup_complete: complete, verified_writes: ownedFiles }, null, 2)}\n`, { flag: 'wx' }); } catch { /* Original error and retained lock remain visible. */ }
      error.message += `; operation lock retained for reconciliation: ${locations.lock}`;
    }
    throw error;
  }
}
export { checkPath, flatConfig, tracking, sourceBytes };
export function main(argv) {
  if (['prepare', 'apply'].includes(argv[0])) {
    const options = {}, allowed = argv[0] === 'prepare' ? ['config', 'bundle', 'request'] : ['config', 'bundle'];
    for (let i = 1; i < argv.length; i += 2) {
      const key = argv[i]?.slice(2);
      if (!argv[i].startsWith('--') || !allowed.includes(key) || key in options || typeof argv[i + 1] !== 'string') fail(`Invalid or repeated option: ${argv[i]}`);
      options[key] = argv[i + 1];
    }
    process.stdout.write(`${JSON.stringify(argv[0] === 'prepare' ? prepare(options) : apply(options), null, 2)}\n`); return;
  }
  if (argv[0] === 'now' && argv.length === 1) { process.stdout.write(`${now()}\n`); return; }
  if (argv[0] !== 'capture') fail('Usage: chronicle-kit.mjs now | capture artifact|git --config <file> ...');
  const mode = argv[1], options = {};
  const allowed = ['config', 'id', 'artifact', 'title', ...(mode === 'artifact' ? ['source', 'kind', 'media-type', 'derivative', 'limitations'] : ['repository', 'base', 'target'])];
  for (let i = 2; i < argv.length; i += 2) {
    const key = argv[i]?.slice(2);
    if (!argv[i].startsWith('--') || !allowed.includes(key) || key in options || typeof argv[i + 1] !== 'string') fail(`Invalid or repeated option: ${argv[i]}`);
    options[key] = argv[i + 1];
  }
  process.stdout.write(`${JSON.stringify(capture(mode, options), null, 2)}\n`);
}
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try { main(process.argv.slice(2)); } catch (error) { process.stderr.write(`chronicle-kit: ${error.message}\n`); process.exitCode = 1; }
}
