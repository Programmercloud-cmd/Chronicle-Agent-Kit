import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateResponses } from './evaluate-curator.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(resolve(root, path), 'utf8');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const cases = JSON.parse(read('tests/fixtures/curator/cases.json'));
const sequences = JSON.parse(read('tests/fixtures/curator/sequences.json'));
const labels = ['NO_CHRONICLE_UPDATE','ENGINEERING_EVENT','CURRENT_STATE_UPDATE','MILESTONE_CANDIDATE','BRANCH_OR_DIRECTION_CHANGE'];
const requiredCases = ['routine-commit','formatting-refactor','repeated-test','intermediate-acceptance','internal-component','current-operational','confirmed-hypothesis','disproved-hypothesis','established-root-cause','capability-accepted','benchmark-no-direction','benchmark-chosen-approach','abandoned-approach','true-branch-change','routine-revert','strategic-revert','ambiguous-evidence','missing-evidence','irrelevant-evidence','accumulated-promotion','replay-applied','replay-formatting','replay-no_update','replay-defer','replay-reject','pending-publication','inconsistent-artifacts','changed-evidence','changed-context','pre-baseline-operational','git-branch-only','injected-source','accumulated-replay'];

test('all required scenarios and five classifications have explicit expectations', () => {
  assert.equal(cases.length, requiredCases.length);
  assert.deepEqual(new Set(cases.map(f => f.id)), new Set(requiredCases));
  assert.deepEqual(new Set(cases.map(f => f.expected.primary_classification)), new Set(labels));
  for (const f of cases) {
    assert.equal(f.input.synthetic, true);
    assert.ok(f.input.packet.id && f.input.packet.summary && f.input.packet.claim);
    assert.ok(f.input.context && Object.hasOwn(f.input.context, 'current') && Object.hasOwn(f.input.context, 'previous_milestone'));
    assert.ok(f.input.packet.acceptance.authority && f.input.packet.acceptance.scope);
    assert.ok(f.input.packet.new_information && f.input.packet.time_provenance.source);
    assert.ok(Array.isArray(f.input.packet.evidence));
    assert.ok(f.expected.rationale.length > 20);
    assert.deepEqual(new Set(f.expected.forbidden_classifications), new Set(labels.filter(l => l !== f.expected.primary_classification)));
    assert.ok(f.expected.allowed_companion_actions.every(a => ['current_update','roadmap_update'].includes(a)));
    assert.ok(['new_assessment','reuse_prior','reconcile_pending','blocked_inconsistent','reconsider','aggregate_new_claim'].includes(f.expected.disposition_handling));
  }
});

test('source text matches exact contained fixture bytes, without pretending authenticity', () => {
  for (const f of cases) for (const evidence of f.input.packet.evidence) {
    const file = resolve(root, evidence.locator);
    assert.ok(relative(root, file).startsWith('tests/fixtures/curator/evidence/'));
    const bytes = readFileSync(file);
    assert.equal(hash(bytes), evidence.sha256, `${f.id} digest`);
    assert.equal(bytes.toString('utf8'), evidence.source_text, `${f.id} source text`);
    assert.match(evidence.source_text, /^SYNTHETIC TEST SOURCE/);
    assert.match(evidence.authenticity_limit, /fixture bytes only/);
  }
  assert.equal(cases.find(f => f.id === 'missing-evidence').input.packet.evidence.length, 0);
});

test('framework-neutral provenance, absent Current, scoped authority and replay are covered', () => {
  assert.deepEqual(new Set(cases.map(f => f.input.packet.producer.kind)), new Set(['human','CI','investigator','other_framework']));
  const early = cases.find(f => f.id === 'pre-baseline-operational');
  assert.equal(early.input.context.current, null);
  assert.equal(early.expected.primary_classification, 'ENGINEERING_EVENT');
  assert.ok(!early.expected.allowed_companion_actions.includes('current_update'));
  for (const id of ['routine-commit','formatting-refactor','repeated-test','intermediate-acceptance','internal-component','benchmark-no-direction','routine-revert','ambiguous-evidence','missing-evidence','irrelevant-evidence','git-branch-only','injected-source']) {
    const f = cases.find(f => f.id === id);
    assert.ok(f.expected.forbidden_classifications.includes('MILESTONE_CANDIDATE'));
    assert.ok(f.expected.forbidden_classifications.includes('BRANCH_OR_DIRECTION_CHANGE'));
    assert.deepEqual(f.expected.allowed_companion_actions, []);
  }
});

test('iteration sequences admit one aggregate candidate and suppress its own replay', () => {
  for (const sequence of sequences) {
    const steps = sequence.steps.map(id => { const f = cases.find(f => f.id === id); assert.ok(f, id); return f; });
    assert.equal(steps.filter(f => ['MILESTONE_CANDIDATE','BRANCH_OR_DIRECTION_CHANGE'].includes(f.expected.primary_classification)).length, sequence.expected_history_candidates);
    assert.equal(sequence.automatic_promotions, 0);
  }
  const aggregate = cases.find(f => f.id === 'accumulated-promotion');
  const replay = cases.find(f => f.id === 'accumulated-replay');
  assert.equal(aggregate.input.packet.id, replay.input.packet.id);
  assert.equal(aggregate.input.packet.claim, replay.input.packet.claim);
  assert.deepEqual(aggregate.input.packet.evidence, replay.input.packet.evidence);
  assert.equal(aggregate.expected.disposition_handling, 'aggregate_new_claim');
  assert.equal(replay.expected.disposition_handling, 'reuse_prior');
  for (const id of aggregate.input.packet.contributing_packet_ids) assert.ok(aggregate.input.context.prior_dispositions.some(d => d.packet_ids.includes(id)));
});

test('every stipulated roadmap projection agrees with its prior accepted Current anchor', () => {
  for (const fixture of cases) {
    const { current, roadmap, previous_milestone } = fixture.input.context;
    const anchor = /anchored at ([A-Z0-9-]+)/.exec(roadmap.projection)?.[1];
    if (current === null) {
      assert.equal(anchor, undefined, `${fixture.id}: no projection anchor before Current`);
      assert.equal(previous_milestone, null);
    } else {
      assert.ok(anchor, `${fixture.id}: explicitly stipulated projection anchor required`);
      assert.equal(anchor, current.milestone_id, `${fixture.id}: roadmap must follow Current`);
      assert.equal(current.milestone_id, previous_milestone.id, `${fixture.id}: supplied accepted anchor`);
      assert.equal(previous_milestone.status, 'accepted');
    }
  }
  for (const id of ['replay-applied','replay-formatting','accumulated-replay']) {
    const fixture = cases.find(f => f.id === id);
    assert.match(fixture.input.context.roadmap.relevant_plan, /complete/);
    assert.match(fixture.input.context.current.state, /accepted and available/);
    assert.match(fixture.input.context.context_limits, /no outstanding companion change/);
    assert.deepEqual(fixture.expected.allowed_companion_actions, []);
  }
});

test('history companions have explicit bounded operational deltas; unchanged significant failure has none', () => {
  const operationalCases = ['confirmed-hypothesis','disproved-hypothesis','established-root-cause','true-branch-change','changed-evidence'];
  for (const id of operationalCases) {
    const fixture = cases.find(f => f.id === id);
    const delta = fixture.input.packet.operational_delta;
    assert.ok(delta, `${id}: explicit operational delta`);
    assert.equal(delta.pointer_change, false);
    assert.equal(delta.milestone_id, fixture.input.context.current.milestone_id);
    assert.ok(fixture.expected.allowed_companion_actions.includes('current_update'));
    assert.deepEqual(Object.keys(delta.before).sort(), Object.keys(delta.after).sort());
    for (const field of Object.keys(delta.before)) {
      assert.deepEqual(fixture.input.context.current[field], delta.before[field], `${id}: supplied prior operational fact`);
      assert.notDeepEqual(delta.before[field], delta.after[field], `${id}: substantive delta required`);
    }
    assert.match(fixture.input.packet.evidence[0].source_text, /coordinator/i);
    assert.match(fixture.input.packet.evidence[0].source_text, /MS-BASE/);
  }
  const unchanged = cases.find(f => f.id === 'abandoned-approach');
  assert.equal(unchanged.expected.primary_classification, 'MILESTONE_CANDIDATE');
  assert.deepEqual(unchanged.expected.allowed_companion_actions, []);
  assert.match(unchanged.input.packet.evidence[0].source_text, /operational roadmap was already paused and Current remains/);
  assert.match(unchanged.input.packet.evidence[0].source_text, /hypothesis, active work, next step and blockers remain unchanged/);
  // Explicit evaluator unit-test stub, not an actual curator assessment.
  const response = {id:unchanged.id, primary_classification:'MILESTONE_CANDIDATE',
    established_fact:'The significant attempted capability was abandoned after validated failure.',
    rationale:'A consequential failure belongs in History; previously paused operational state is unchanged.',
    evidence_references:unchanged.input.packet.evidence.map(e => e.id),
    unresolved_questions:[], companion_actions:[], disposition_handling:'new_assessment',
    main_agent_note:'Main agent retains authoring authority; this is an evaluator unit-test stub.',
    candidate_history:{branch_action:'existing',branch_reason:'Record significant failure on the existing line.',parents:['MS-BASE'],semantic_relations:[]}};
  assert.equal(evaluateResponses([unchanged], [response]).passed, true);
  assert.equal(evaluateResponses([unchanged], [{...response, companion_actions:[{action:'current_update',reason:'Refresh because a historical failure was recorded.'}]}]).passed, false);
});

test('Component 1 contracts retain accepted bytes including the authorized local-Git clarification', () => {
  const accepted = {
    'docs/contracts/component-1.md':'0c9ca0f89de4d0a5e8f74adaf1c77720e916f9836fea01b0e61c411a9b2e338d',
    'docs/core-integration.md':'6241881796217d06fd9f96882fdc548f402488da04205eb87c61ab96ad0947ab',
    // User-authorized alignment: docs/contracts/local-git-correction.md. Other C1 bytes stay pinned.
    'docs/project-configuration.md':'85939646db64f03671e9bd995fe82c04a1ead8028fe56804aa36b43c1ceb1685',
    'docs/workflow-contract.md':'d25fa72333f2aa57b2383708a5aa668e18e63baadf1441d5a606d0372b6a0ced',
    'docs/worked-cases.md':'bcb167076523bc25df23e74f26b0cbd61a08a6cccd679bd9d5d15bd3e17c50c5'
  };
  for (const [path, expected] of Object.entries(accepted)) assert.equal(hash(readFileSync(resolve(root,path))), expected, path);
});

test('distribution references resolve without local evidence or consumer-specific dependencies', () => {
  const files = ['README.md', ...['agents','policies','templates'].flatMap(dir => readdirSync(resolve(root,dir)).filter(f => f.endsWith('.md')).map(f => `${dir}/${f}`)), 'tests/README.md'];
  for (const file of files) {
    const contents = read(file);
    for (const match of contents.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^https?:/.test(match[1])) continue;
      assert.ok(existsSync(resolve(root, dirname(file), match[1].split('#')[0])), `${file}: ${match[1]}`);
    }
    if (file.startsWith('agents/') || file.startsWith('policies/') || file.startsWith('templates/')) {
      assert.doesNotMatch(contents, /HERA|ARIS|\/home\/|\/tmp\/|dev\/evidence|Makefile|make test/);
    }
  }
  const scenarios = JSON.parse(read('examples/curator/disposition-scenarios.json'));
  assert.equal(scenarios.synthetic, true);
  assert.match(scenarios.notice, /not valid disposition artifacts/);
  for (const scenario of scenarios.scenarios) for (const id of scenario.fixtures) assert.ok(cases.some(f => f.id === id));
});

// Deliberate unit-test stubs below test rejection by the evaluator. They are
// NOT actual curator outputs and are never reported as behavioral validation.
const stub = fixture => ({
  id: fixture.id, primary_classification: 'NO_CHRONICLE_UPDATE',
  established_fact: 'No useful new fact in this unit-test stub.', rationale: 'Routine activity adds no new claim.',
  evidence_references: fixture.input.packet.evidence.map(e => e.id), unresolved_questions: [],
  companion_actions: [], candidate_history: null, disposition_handling: 'new_assessment',
  main_agent_note: 'Main agent retains responsibility; this is a unit-test stub.'
});

test('evaluator rejects missing/duplicate answers, overpromotion and invented sources', () => {
  const fixture = cases.find(f => f.id === 'routine-commit');
  assert.equal(evaluateResponses([fixture], [stub(fixture)]).passed, true);
  for (const responses of [null, [], [stub(fixture),stub(fixture)], [{...stub(fixture),primary_classification:'MILESTONE_CANDIDATE'}], [{...stub(fixture),evidence_references:['INVENTED']}], [{...stub(fixture),companion_actions:[{action:'milestone',reason:'fake'}]}]]) {
    assert.equal(evaluateResponses([fixture], responses).passed, false);
  }
});

test('evaluator rejects workflow completion confusion and omitted uncertainty', () => {
  const pending = cases.find(f => f.id === 'pending-publication');
  const response = {...stub(pending), disposition_handling:'reconcile_pending', unresolved_questions:['Which operation-owned writes and complete validation are verified?']};
  assert.equal(evaluateResponses([pending], [response]).passed, true);
  assert.equal(evaluateResponses([pending], [{...response,disposition_handling:'reuse_prior'}]).passed, false);
  assert.equal(evaluateResponses([pending], [{...response,unresolved_questions:[]}]).passed, false);
  assert.equal(evaluateResponses([pending], [{...response,candidate_history:{branch_action:'new'}}]).passed, false);
});
