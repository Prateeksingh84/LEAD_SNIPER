const assert = require('node:assert/strict');

function isHighValueLead(profile) {
  return Number(profile.followers) > 100 || Number(profile.public_repos) > 50;
}

function starKey(star) {
  return `${star?.user?.login || star?.login || ''}|${star?.starred_at || ''}`;
}

function calculateBackoffMs(attempt, baseMs = 1000, capMs = 30000) {
  return Math.min(capMs, baseMs * 2 ** Math.max(0, attempt - 1));
}

const sample = {
  login: 'octocat',
  name: 'monalisa octocat',
  company: 'GitHub',
  bio: 'Design and build all the things. Interested in Open Source and AI.',
  public_repos: 52,
  followers: 120,
};

assert.equal(isHighValueLead(sample), true, 'sample qualifies through both thresholds');
assert.equal(isHighValueLead({ followers: 101, public_repos: 0 }), true);
assert.equal(isHighValueLead({ followers: 100, public_repos: 50 }), false);
assert.equal(isHighValueLead({ followers: 0, public_repos: 51 }), true);
assert.equal(starKey({ user: { login: 'octocat' }, starred_at: '2026-09-10T00:00:00Z' }), 'octocat|2026-09-10T00:00:00Z');
assert.equal(calculateBackoffMs(1), 1000);
assert.equal(calculateBackoffMs(2), 2000);
assert.equal(calculateBackoffMs(10), 30000);

console.log('Assignment 1 core tests: PASS (6 assertions)');
