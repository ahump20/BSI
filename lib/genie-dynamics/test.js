/**
 * Genie Dynamics v2 — test suite
 * Run: node --experimental-vm-modules lib/genie-dynamics/test.js
 */

import { DynamicsPredictor } from './dynamics-predictor.js';
import { encode } from './state-tokenizer.js';

let passed = 0, failed = 0;
function assert(condition, msg) {
  if (condition) { passed++; }
  else { failed++; console.error(`  FAIL: ${msg}`); }
}

function makeToken(type, action, health, region) {
  return encode({ type, action, health, region });
}

// ── 1. Basic order-1 still works ──────────────────────────

console.log('1. Order-1 basics');
{
  const p = new DynamicsPredictor({ tau: 1e12 }); // huge tau = no decay
  const a = makeToken(1, 1, 2, 0); // ANALYST/READING/NOMINAL/R0
  const b = makeToken(1, 2, 2, 0); // ANALYST/WRITING/NOMINAL/R0

  for (let i = 0; i < 10; i++) p.observe(a, b);

  const preds = p.predict(a);
  assert(preds.length > 0, 'should have predictions');
  assert(preds[0].token === b, 'top prediction should be b');
  assert(preds[0].probability > 0.5, 'probability should dominate');
  assert(preds[0].observations > 0, 'should have observations');
}

// ── 2. Order-2 kicks in after threshold ───────────────────

console.log('2. Order-2 transitions');
{
  const p = new DynamicsPredictor({ tau: 1e12, order2Threshold: 3 });
  const a = makeToken(1, 0, 2, 0);
  const b = makeToken(1, 1, 2, 0);
  const c = makeToken(1, 2, 2, 0);
  const d = makeToken(1, 3, 2, 0); // different outcome when context is a->b

  // Train: sequence a->b->c (agent1), repeated enough
  for (let i = 0; i < 5; i++) {
    p.observe(a, b, 'agent1');
    p.observe(b, c, 'agent1');
  }

  // Also train b->d without order-2 context (no agentId)
  for (let i = 0; i < 5; i++) {
    p.observe(b, d);
  }

  // Order-2 predict: with prevToken=a, currentToken=b should prefer c
  const o2preds = p.predict(b, null, a);
  assert(o2preds !== null && o2preds.length > 0, 'order-2 should return predictions');
  const topToken = o2preds[0].token;
  assert(topToken === c, `order-2 top should be c(${c}), got ${topToken}`);
}

// ── 3. Order-2 falls back when below threshold ────────────

console.log('3. Order-2 fallback');
{
  const p = new DynamicsPredictor({ tau: 1e12, order2Threshold: 10 });
  const a = makeToken(2, 0, 2, 0);
  const b = makeToken(2, 1, 2, 0);
  const c = makeToken(2, 2, 2, 0);

  // Only 2 order-2 observations (below threshold of 10)
  p.observe(a, b, 'x');
  p.observe(b, c, 'x');
  p.observe(a, b, 'x');
  p.observe(b, c, 'x');

  // Should fall back to order-1
  const preds = p.predict(b, null, a);
  assert(preds.length > 0, 'should fall back to order-1');
}

// ── 4. Exponential decay ──────────────────────────────────

console.log('4. Exponential decay');
{
  const p = new DynamicsPredictor({ tau: 100 }); // 100ms decay for testing
  const a = makeToken(3, 0, 2, 0);
  const b = makeToken(3, 1, 2, 0);

  // Observe at a known time
  const origNow = p._now;
  let fakeTime = 1000;
  p._now = () => fakeTime;

  p.observe(a, b);

  // Advance time by 500ms (~5 tau) — count should decay significantly
  fakeTime = 1500;
  const preds = p.predict(a);
  const bPred = preds.find(pr => pr.token === b);
  // With 500ms elapsed and tau=100, decay factor = e^(-5) ≈ 0.0067
  // So observations should be near 0
  assert(!bPred || bPred.observations < 0.01, `stale count should decay, got ${bPred?.observations}`);

  p._now = origNow;
}

// ── 5. Dirichlet smoothing ────────────────────────────────

console.log('5. Dirichlet smoothing');
{
  const p = new DynamicsPredictor({ tau: 1e12, smoothing: 1.0 });
  const a = makeToken(0, 0, 3, 0);
  const b = makeToken(0, 1, 3, 0);

  p.observe(a, b);

  const preds = p.predict(a);
  // With smoothing=1.0 and only 1 observation, probabilities should be more spread
  assert(preds.length > 1, 'smoothing should produce multiple predictions');
  const topProb = preds[0].probability;
  assert(topProb < 0.95, `smoothing should reduce top prob, got ${topProb}`);
}

// ── 6. Action-conditioned anomaly scoring ─────────────────

console.log('6. Action-conditioned anomaly');
{
  const p = new DynamicsPredictor({ tau: 1e12 });
  const a = makeToken(1, 0, 2, 0);
  const b = makeToken(1, 1, 2, 0);
  const c = makeToken(1, 4, 2, 5); // very different state

  for (let i = 0; i < 10; i++) p.observe(a, b);

  const normalScore = p.anomalyScore(a, b);
  const anomalyScore = p.anomalyScore(a, c);

  assert(normalScore < 0.5, `normal transition should have low anomaly, got ${normalScore}`);
  assert(anomalyScore > 0.5, `unusual transition should have high anomaly, got ${anomalyScore}`);
}

// ── 7. Null token safety ──────────────────────────────────

console.log('7. Null safety');
{
  const p = new DynamicsPredictor({ tau: 1e12 });
  const a = makeToken(1, 0, 2, 0);

  p.observe(null, a);
  p.observe(a, null);

  const preds = p.predict(a);
  const hasNull = preds.some(pr => pr.token == null);
  assert(!hasNull, 'predictions should not contain null tokens');
}

// ── 8. Serialization v2 round-trip ────────────────────────

console.log('8. Serialization v2');
{
  const p = new DynamicsPredictor({ tau: 1e12 });
  const a = makeToken(1, 0, 2, 0);
  const b = makeToken(1, 1, 2, 0);

  for (let i = 0; i < 5; i++) {
    p.observe(a, b, 'w1');
  }

  const json = p.serialize();
  const data = JSON.parse(json);
  assert(data.version === 2, 'should serialize as version 2');

  const p2 = DynamicsPredictor.deserialize(json);
  assert(p2.totalObservations === p.totalObservations, 'observations should match');

  const preds = p2.predict(a);
  assert(preds.length > 0, 'deserialized predictor should predict');
  assert(preds[0].token === b, 'deserialized predictions should match');
}

// ── 9. v1 deserialization backward compat ─────────────────

console.log('9. v1 backward compat');
{
  const v1 = JSON.stringify({
    version: 1,
    totalObservations: 10,
    transitions: {
      '9': { '2': { '17': 10 } }
    }
  });
  const p = DynamicsPredictor.deserialize(v1);
  assert(p.totalObservations === 10, 'should load v1 observations');
  assert(p.order2Transitions.size === 0, 'v1 should have no order-2 data');

  const preds = p.predict(9);
  assert(preds.length > 0, 'should predict from v1 data');
}

// ── 10. Merge ─────────────────────────────────────────────

console.log('10. Merge');
{
  const p1 = new DynamicsPredictor({ tau: 1e12 });
  const p2 = new DynamicsPredictor({ tau: 1e12 });
  const a = makeToken(1, 0, 2, 0);
  const b = makeToken(1, 1, 2, 0);

  for (let i = 0; i < 5; i++) p1.observe(a, b);
  for (let i = 0; i < 5; i++) p2.observe(a, b);

  p1.merge(p2);
  assert(p1.totalObservations === 10, 'merged observations should sum');
}

// ── Summary ───────────────────────────────────────────────

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
