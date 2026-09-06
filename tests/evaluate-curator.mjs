// Test-only response evaluator. This does not classify work or write workflow data.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const labels = ['NO_CHRONICLE_UPDATE', 'ENGINEERING_EVENT', 'CURRENT_STATE_UPDATE', 'MILESTONE_CANDIDATE', 'BRANCH_OR_DIRECTION_CHANGE'];
const fields = ['id', 'primary_classification', 'established_fact', 'rationale', 'evidence_references', 'unresolved_questions', 'companion_actions', 'candidate_history', 'disposition_handling', 'main_agent_note'];
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const strings = value => Array.isArray(value) && value.every(nonempty);

export function evaluateResponses(cases, responses) {
  const errors = [];
  const outcomes = [];
  const fail = (id, message) => errors.push(`${id}: ${message}`);
  if (!Array.isArray(responses)) return { passed: false, evaluated: 0, errors: ['Response must be a JSON array'], outcomes };
  const byId = new Map();
  for (const response of responses) {
    if (!response || typeof response !== 'object' || Array.isArray(response)) { fail('<response>', 'Expected object'); continue; }
    if (byId.has(response.id)) fail(response.id, 'Duplicate response');
    byId.set(response.id, response);
    if (!cases.some(f => f.id === response.id)) fail(response.id, 'Unknown case');
  }
  for (const fixture of cases) {
    const { id, input, expected } = fixture;
    const result = byId.get(id);
    if (!result) { fail(id, 'Missing response'); continue; }
    const before = errors.length;
    for (const field of fields) if (!Object.hasOwn(result, field)) fail(id, `Missing ${field}`);
    for (const field of Object.keys(result)) if (!fields.includes(field)) fail(id, `Unexpected ${field}`);
    if (!labels.includes(result.primary_classification)) fail(id, 'Invalid primary classification');
    if (result.primary_classification !== expected.primary_classification) fail(id, `Expected ${expected.primary_classification}, received ${result.primary_classification}`);
    if (expected.forbidden_classifications.includes(result.primary_classification)) fail(id, 'Forbidden classification');
    for (const field of ['established_fact', 'rationale', 'main_agent_note']) if (!nonempty(result[field])) fail(id, `Empty ${field}`);
    if (!strings(result.evidence_references)) fail(id, 'Evidence references must be an array of source IDs');
    else {
      const sources = new Set(input.packet.evidence.map(e => e.id));
      for (const ref of result.evidence_references) if (!sources.has(ref)) fail(id, `Unknown evidence ${ref}`);
      if (sources.size > 0 && result.evidence_references.length === 0) fail(id, 'Must identify assessed source(s), including irrelevant evidence');
      if (new Set(result.evidence_references).size !== result.evidence_references.length) fail(id, 'Duplicate evidence references');
    }
    if (!strings(result.unresolved_questions)) fail(id, 'Questions must be an array of non-empty strings');
    else if (expected.requires_unresolved_question && !result.unresolved_questions.length) fail(id, 'Must surface unresolved evidence/reconciliation question');
    if (!Array.isArray(result.companion_actions)) fail(id, 'Companions must be an array');
    else {
      const seen = new Set();
      for (const companion of result.companion_actions) {
        if (!companion || typeof companion !== 'object') { fail(id, 'Invalid companion'); continue; }
        if (Object.keys(companion).sort().join(',') !== 'action,reason') fail(id, 'Invalid companion fields');
        if (!expected.allowed_companion_actions.includes(companion.action)) fail(id, `Forbidden companion ${companion.action}`);
        if (!nonempty(companion.reason)) fail(id, 'Companion needs concrete reason');
        if (seen.has(companion.action)) fail(id, 'Duplicate companion action');
        seen.add(companion.action);
      }
    }
    if (result.disposition_handling !== expected.disposition_handling) fail(id, `Expected workflow handling ${expected.disposition_handling}`);
    if (['MILESTONE_CANDIDATE', 'BRANCH_OR_DIRECTION_CHANGE'].includes(result.primary_classification)) {
      const h = result.candidate_history;
      if (!h || typeof h !== 'object' || Array.isArray(h)) fail(id, 'Candidate needs history recommendation');
      else {
        if (Object.keys(h).sort().join(',') !== 'branch_action,branch_reason,parents,semantic_relations') fail(id, 'Invalid history fields');
        if (h.branch_action !== expected.candidate_branch_action) fail(id, 'Unjustified branch action');
        if (!nonempty(h.branch_reason)) fail(id, 'Branch needs explanation');
        const known = new Set([input.context.previous_milestone?.id, ...(input.context.history ?? []).map(h => h.id)].filter(Boolean));
        if (!strings(h.parents) || !h.parents.length || h.parents.some(p => !known.has(p))) fail(id, 'Parents must reference supplied prior milestones');
        if (!Array.isArray(h.semantic_relations)) fail(id, 'Relations must be an array');
        else for (const relation of h.semantic_relations) {
          if (!relation || Object.keys(relation).sort().join(',') !== 'reason,target,type' || !['supersedes','disproves','reverts_to','related_to'].includes(relation.type) || !known.has(relation.target) || !nonempty(relation.reason)) fail(id, 'Invalid semantic relation');
        }
      }
    } else if (result.candidate_history !== null) fail(id, 'Non-candidate cannot propose history relationships');
    const reasoning = `${result.rationale ?? ''} ${result.main_agent_note ?? ''}`;
    if (expected.disposition_handling === 'reconsider') {
      for (const prior of input.context.prior_dispositions) if (!reasoning.includes(prior.id)) fail(id, `Name reconsidered disposition ${prior.id}`);
    }
    if (expected.disposition_handling === 'aggregate_new_claim') {
      for (const packet of input.packet.contributing_packet_ids) if (!reasoning.includes(packet)) fail(id, `Name contributing packet ${packet}`);
    }
    outcomes.push({ id, classification: result.primary_classification, structural_pass: errors.length === before });
  }
  return { passed: errors.length === 0, evaluated: outcomes.length, errors, outcomes,
    limitation: 'Mechanical checks do not prove truthful rationale, correct source interpretation, complete companion effects or read-only behavior. Independently review actual responses and invocation provenance.' };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) { process.stderr.write('Usage: node tests/evaluate-curator.mjs <actual-response.json>\n'); process.exitCode = 2; }
  else {
    try {
      const cases = JSON.parse(readFileSync(new URL('./fixtures/curator/cases.json', import.meta.url), 'utf8'));
      const result = evaluateResponses(cases, JSON.parse(readFileSync(process.argv[2], 'utf8')));
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      process.exitCode = result.passed ? 0 : 1;
    } catch (error) { process.stderr.write(`Evaluation failed: ${error.message}\n`); process.exitCode = 2; }
  }
}
