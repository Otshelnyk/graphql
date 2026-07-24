import { finiteNumber } from './number.js';

export function auditStats(upTransactions = [], downTransactions = []) {
  const sum = (items) => items.reduce((total, item) => total + finiteNumber(item?.amount), 0);
  const done = sum(upTransactions);
  const received = sum(downTransactions);
  return { done, received, ratio: received > 0 ? (done / received).toFixed(1) : '0.0' };
}

export function uniqueProjectCount(projects = []) {
  return new Set(projects.map((project) => project?.object?.name || project?.path).filter(Boolean)).size;
}

export function projectStatus(project) {
  return isPassed(project?.grade) ? 'PASS' : 'FAIL';
}

export function isPassed(grade) {
  return finiteNumber(grade, Number.NEGATIVE_INFINITY) >= 1;
}

export function projectTotals(projects = []) {
  return projects.reduce((totals, project) => {
    if (projectStatus(project) === 'PASS') totals.passed += 1;
    else totals.failed += 1;
    return totals;
  }, { total: uniqueProjectCount(projects), passed: 0, failed: 0 });
}

export function attachProjectXp(projects = [], xpPerProject = []) {
  const xpByPath = new Map(xpPerProject.map((item) => [item.path, finiteNumber(item.amount)]));
  return projects.map((project) => ({ ...project, amount: xpByPath.get(project.path) ?? null }));
}

export function normalizeProjects(projects = []) {
  const passedProjects = new Set();
  return projects
    .filter((project) => {
      if (!isPassed(project?.grade)) return true;
      const key = project?.object?.name || project?.path;
      if (!key || passedProjects.has(key)) return !key;
      passedProjects.add(key);
      return true;
    })
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

export function mapPiscineAttempts(results = []) {
  return results.map((result) => ({
    grade: result.grade,
    passed: isPassed(result.grade),
    date: result.createdAt,
  }));
}

export function aggregateProjectXp(transactions = []) {
  const grouped = new Map();
  for (const transaction of transactions) {
    const key = transaction.objectId;
    const project = grouped.get(key) ?? {
      name: transaction.object?.name || transaction.path?.split('/').pop() || `#${key}`,
      path: transaction.path,
      amount: 0,
    };
    project.amount += finiteNumber(transaction.amount);
    grouped.set(key, project);
  }
  return [...grouped.values()].sort((left, right) => right.amount - left.amount);
}
