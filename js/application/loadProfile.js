import { aggregateProjectXp, auditStats, mapPiscineAttempts, normalizeProjects } from '../domain/profileMetrics.js';

export async function loadProfile(repository) {
  const userInfo = await repository.userInfo();
  const [xpTransactions, totalXP, rawAudits, level, projects, piscines, xpPerProject] = await Promise.all([
    repository.xpTransactions(),
    repository.totalXp(),
    repository.audits(),
    repository.level(userInfo?.id),
    repository.projects(),
    repository.piscineResults(),
    repository.xpPerProject(),
  ]);
  return {
    userInfo,
    xpTransactions,
    totalXP,
    auditStats: auditStats(rawAudits.up, rawAudits.down),
    level,
    projects: normalizeProjects(projects),
    piscines: Object.fromEntries(Object.entries(piscines).map(([key, results]) => [key, results.length ? mapPiscineAttempts(results) : null])),
    xpPerProject: aggregateProjectXp(xpPerProject),
  };
}
