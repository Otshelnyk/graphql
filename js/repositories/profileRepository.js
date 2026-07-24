import { API } from '../config/api.js';
import { finiteNumber } from '../domain/number.js';

const PISCINES = [
  { key: 'piscinego', path: '/astanahub/piscinego' },
  { key: 'piscine-js', path: '/astanahub/module/piscine-js' },
  { key: 'piscine-ai', path: '/astanahub/module/piscine-ai' },
  { key: 'piscine-rust', path: '/astanahub/module/piscine-rust' },
];

export function createProfileRepository(query) {
  const eventFilter = `eventId: { _eq: ${API.mainEventId} }`;

  async function userInfo() {
    const data = await query(`{ user { id login attrs createdAt labels { labelName } } }`);
    return data.user?.[0] ?? null;
  }

  async function xpTransactions() {
    const data = await query(`
      { user { transactions(where: { type: { _eq: "xp" }, path: { _nlike: "%checkpoint-zero%" }, amount: { _gt: 0 }, ${eventFilter} }, order_by: { createdAt: asc }) { id amount createdAt path objectId } } }
    `);
    return data.user?.[0]?.transactions ?? [];
  }

  async function totalXp() {
    const data = await query(`
      { user { transactions_aggregate(where: { type: { _eq: "xp" }, amount: { _gt: 0 }, ${eventFilter} }) { aggregate { sum { amount } } } } }
    `);
    return finiteNumber(data.user?.[0]?.transactions_aggregate?.aggregate?.sum?.amount);
  }

  async function audits() {
    const [up, down] = await Promise.all([
      query('{ transaction(where: { type: { _eq: "up" } }) { amount } }'),
      query('{ transaction(where: { type: { _eq: "down" } }) { amount } }'),
    ]);
    return { up: up.transaction ?? [], down: down.transaction ?? [] };
  }

  async function level(userId) {
    const id = Number(userId);
    if (!Number.isInteger(id)) return 0;
    const data = await query(`
      query GetLevel($userId: Int!) { event_user(where: { userId: { _eq: $userId }, eventId: { _eq: ${API.mainEventId} } }, limit: 1) { level } }
    `, { userId: id });
    return finiteNumber(data.event_user?.[0]?.level);
  }

  async function projects() {
    const data = await query(`
      { result(order_by: { createdAt: desc }, where: { path: { _nilike: "%piscine-ai%" }, object: { type: { _eq: "project" } } }) { id grade createdAt path object { id name type } } }
    `);
    return data.result ?? [];
  }

  async function piscineResults() {
    const pairs = await Promise.all(PISCINES.map(async ({ key, path }) => {
      const data = await query(`
        query GetPiscine($path: String!) { result(where: { path: { _eq: $path } }, order_by: { createdAt: asc }) { grade createdAt } }
      `, { path });
      return [key, data.result ?? []];
    }));
    return Object.fromEntries(pairs);
  }

  async function xpPerProject() {
    const data = await query(`
      { transaction(where: { type: { _eq: "xp" }, amount: { _gt: 0 } }, order_by: { amount: desc }) { amount path objectId object { name type } } }
    `);
    return data.transaction ?? [];
  }

  return { userInfo, xpTransactions, totalXp, audits, level, projects, piscineResults, xpPerProject };
}
