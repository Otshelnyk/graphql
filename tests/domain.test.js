import test from 'node:test';
import assert from 'node:assert/strict';

import { formatXP } from '../js/domain/number.js';
import { attachProjectXp, auditStats, projectTotals, uniqueProjectCount } from '../js/domain/profileMetrics.js';
import { loadProfile } from '../js/application/loadProfile.js';

test('profile metrics tolerate incomplete API data', () => {
  assert.deepEqual(auditStats([{ amount: 10 }, { amount: 'bad' }], [{ amount: 4 }, { amount: null }]), { done: 10, received: 4, ratio: '2.5' });
  assert.equal(uniqueProjectCount([{ path: '/a' }, { path: '/a' }, { path: '/b' }]), 2);
  assert.deepEqual(projectTotals([{ grade: 1 }, { grade: 0 }, { grade: null }]), { total: 0, passed: 1, failed: 2 });
  assert.equal(attachProjectXp([{ path: '/a' }], [{ path: '/a', amount: 1024 }])[0].amount, 1024);
  assert.equal(formatXP('bad'), '0 B');
});

test('loadProfile preserves the profile view model while applying domain rules', async () => {
  const repository = {
    userInfo: async () => ({ id: 1, login: 'student' }),
    xpTransactions: async () => [], totalXp: async () => 12,
    audits: async () => ({ up: [{ amount: 6 }], down: [{ amount: 3 }] }),
    level: async () => 4,
    projects: async () => [{ path: '/project', grade: 1, createdAt: '2025-01-01' }, { path: '/project', grade: 1, createdAt: '2024-01-01' }],
    piscineResults: async () => ({ piscinego: [{ grade: 1, createdAt: '2025-01-01' }] }),
    xpPerProject: async () => [{ objectId: 10, path: '/project', amount: 12 }],
  };

  const profile = await loadProfile(repository);
  assert.equal(profile.auditStats.ratio, '2.0');
  assert.equal(profile.projects.length, 1);
  assert.equal(profile.piscines.piscinego[0].passed, true);
  assert.deepEqual(profile.xpPerProject, [{ name: 'project', path: '/project', amount: 12 }]);
});
